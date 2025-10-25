<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\LoginLog;
use App\Services\AuditLogService;
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

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

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

        // Log the login
        LoginLog::create([
            'user_id' => $user->id,
            'ip_address' => $currentIp,
            'user_agent' => $request->userAgent() ?? 'Unknown',
        ]);

        // Check for suspicious login (new IP address)
        if ($previousIp && $previousIp !== $currentIp) {
            try {
                Mail::to($user->email)->send(new SecurityAlert(
                    $user,
                    'New Login Detected',
                    'We detected a login to your account from a new IP address.',
                    [
                        'ip_address' => $currentIp,
                        'user_agent' => $request->userAgent() ?? 'Unknown',
                        'location' => 'Unknown', // Could integrate IP geolocation service
                        'time' => now()->format('F j, Y \a\t g:i A'),
                        'previous_ip' => $previousIp,
                    ]
                ));
            } catch (\Exception $e) {
                Log::error('Failed to send security alert email: ' . $e->getMessage());
            }
        }

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

        // Create token
        $token = $user->createToken('auth-token')->plainTextToken;

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
