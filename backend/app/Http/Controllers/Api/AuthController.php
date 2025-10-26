<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\LoginLog;
use App\Services\AuditLogService;
use App\Services\SecurityService;
use App\Services\NotificationService;
use App\Mail\WelcomeEmail;
use App\Mail\SecurityAlert;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    protected $securityService;

    public function __construct(SecurityService $securityService)
    {
        $this->securityService = $securityService;
    }

    /**
     * Register a new user.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'mobile_number' => ['required', 'string', 'max:20'],
            'password' => ['required', 'confirmed', Password::min(8)
                ->mixedCase()
                ->numbers()
                ->symbols()],
        ], [
            'password.min' => 'Password must be at least 8 characters long.',
            'password.mixed_case' => 'Password must contain both uppercase and lowercase letters.',
            'password.numbers' => 'Password must contain at least one number.',
            'password.symbols' => 'Password must contain at least one special character.',
        ]);

        $user = User::create([
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'mobile_number' => $validated['mobile_number'],
            'password' => Hash::make($validated['password']),
            'is_verified' => false,
        ]);

        // Assign default 'User' role to new registrations
        $user->assignRole('User');

        // Log registration
        AuditLogService::log(
            'user_registered',
            'User',
            $user->id,
            "New user registered: {$user->email}",
            null,
            ['full_name' => $user->full_name, 'email' => $user->email],
            $request
        );

        // Send welcome email
        try {
            Mail::to($user->email)->send(new WelcomeEmail($user));
        } catch (\Exception $e) {
            // Log error but don't fail registration
            Log::error('Failed to send welcome email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Registration successful! Please login.',
            'user' => [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'email' => $user->email,
            ],
        ], 201);
    }

    /**
     * Login user and create token.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $request->email)->first();

        // Check if account is locked
        if ($user && $this->securityService->isAccountLocked($user)) {
            $lockTime = $user->locked_until->diffInMinutes(now());
            
            // Log failed attempt due to locked account
            LoginLog::create([
                'user_id' => $user->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent() ?? 'Unknown',
                'is_successful' => false,
                'failure_reason' => 'Account locked',
            ]);

            throw ValidationException::withMessages([
                'email' => ["Your account is locked due to multiple failed login attempts. Please try again in {$lockTime} minutes."],
            ]);
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            // Record failed login attempt
            if ($user) {
                $this->securityService->recordFailedLogin($user, 'Invalid credentials');
                
                // Log failed attempt
                LoginLog::create([
                    'user_id' => $user->id,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent() ?? 'Unknown',
                    'is_successful' => false,
                    'failure_reason' => 'Invalid credentials',
                ]);

                // Check if account is now locked
                if ($this->securityService->isAccountLocked($user)) {
                    $attemptsLeft = 0;
                } else {
                    $attemptsLeft = SecurityService::MAX_FAILED_ATTEMPTS - $user->failed_login_attempts;
                }

                $message = "The provided credentials are incorrect.";
                if ($attemptsLeft > 0 && $attemptsLeft <= 2) {
                    $message .= " You have {$attemptsLeft} attempt(s) remaining before your account is locked.";
                }

                throw ValidationException::withMessages([
                    'email' => [$message],
                ]);
            }

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Reset failed attempts on successful login
        $this->securityService->resetFailedAttempts($user);

        // Detect suspicious activity
        $suspicious = $this->securityService->detectSuspiciousActivity(
            $user,
            $request->ip(),
            $request->userAgent() ?? 'Unknown'
        );

        // Check if 2FA is enabled
        if ($user->two_factor_enabled) {
            // Return a special response indicating 2FA is required
            return response()->json([
                'requires_2fa' => true,
                'user_id' => $user->id,
                'message' => 'Please enter your 2FA code.',
            ], 200);
        }

        // Update last login information
        $previousIp = $user->last_login_ip;
        $currentIp = $request->ip();
        
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $currentIp,
        ]);

        // Log the successful login
        LoginLog::create([
            'user_id' => $user->id,
            'ip_address' => $currentIp,
            'user_agent' => $request->userAgent() ?? 'Unknown',
            'is_successful' => true,
        ]);

        // Audit log for login
        AuditLogService::log(
            'user_login',
            'User',
            $user->id,
            "User logged in: {$user->email}",
            null,
            null,
            $request
        );

        // Create login notification
        $notificationService = app(NotificationService::class);
        $notificationService->create(
            $user->id,
            'security',
            'New Login Detected',
            "A new login was detected from " . ($request->userAgent() ?? 'Unknown device'),
            [
                'ip_address' => $currentIp,
                'user_agent' => $request->userAgent(),
                'timestamp' => now()->toIso8601String(),
            ],
            '/dashboard',
            'shield-check',
            'medium'
        );

        // Create token
        $token = $user->createToken('auth-token')->plainTextToken;

        // Load roles and permissions for the user
        $user->load('roles.permissions', 'primaryRole');

        return response()->json([
            'message' => 'Login successful!',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'balance' => $user->balance,
                'currency' => $user->currency,
                'two_factor_enabled' => $user->two_factor_enabled,
                'roles' => $user->roles->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'slug' => $role->slug,
                        'level' => $role->level,
                    ];
                }),
                'primary_role' => $user->primaryRole ? [
                    'id' => $user->primaryRole->id,
                    'name' => $user->primaryRole->name,
                    'slug' => $user->primaryRole->slug,
                ] : null,
                'permissions' => $user->getAllPermissions()->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'slug' => $permission->slug,
                        'resource' => $permission->resource,
                        'action' => $permission->action,
                    ];
                }),
                'is_admin' => $user->isAdmin(),
                'is_super_admin' => $user->isSuperAdmin(),
            ],
        ], 200);
    }

    /**
     * Logout user (revoke token).
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        
        // Audit log for logout
        AuditLogService::log(
            'user_logout',
            'User',
            $user->id,
            "User logged out: {$user->email}",
            null,
            null,
            $request
        );

        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout successful!',
        ], 200);
    }

    /**
     * Get authenticated user information.
     */
    public function user(Request $request)
    {
        $user = $request->user();
        $user->load('roles.permissions', 'primaryRole');
        $recentLogins = $user->recentLoginLogs(5);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'mobile_number' => $user->mobile_number,
                'balance' => $user->balance,
                'currency' => $user->currency,
                'two_factor_enabled' => $user->two_factor_enabled,
                'last_login_at' => $user->last_login_at,
                'last_login_ip' => $user->last_login_ip,
                'roles' => $user->roles->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'slug' => $role->slug,
                    ];
                }),
                'primary_role' => $user->primaryRole ? [
                    'id' => $user->primaryRole->id,
                    'name' => $user->primaryRole->name,
                    'slug' => $user->primaryRole->slug,
                ] : null,
                'permissions' => $user->getAllPermissions()->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'slug' => $permission->slug,
                        'resource' => $permission->resource,
                        'action' => $permission->action,
                    ];
                }),
                'is_admin' => $user->isAdmin(),
                'is_super_admin' => $user->isSuperAdmin(),
            ],
            'recent_logins' => $recentLogins->map(function ($log) {
                return [
                    'ip_address' => $log->ip_address,
                    'user_agent' => $log->user_agent,
                    'created_at' => $log->created_at,
                ];
            }),
        ], 200);
    }
}
