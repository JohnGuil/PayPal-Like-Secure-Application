<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\LoginLog;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

class TwoFactorController extends Controller
{
    protected $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    /**
     * Setup 2FA - Generate QR code and secret.
     */
    public function setup(Request $request)
    {
        $user = $request->user();

        // Generate a new secret key
        $secret = $this->google2fa->generateSecretKey();

        // Save the secret (not enabled yet)
        $user->update([
            'two_factor_secret' => encrypt($secret),
        ]);

        // Generate QR Code URL
        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );

        // Generate QR Code as SVG
        $renderer = new ImageRenderer(
            new RendererStyle(200),
            new SvgImageBackEnd()
        );
        $writer = new Writer($renderer);
        $qrCodeSvg = $writer->writeString($qrCodeUrl);

        return response()->json([
            'secret' => $secret,
            'qr_code' => base64_encode($qrCodeSvg),
            'message' => 'Scan the QR code with your authenticator app and verify the code.',
        ], 200);
    }

    /**
     * Verify and enable 2FA.
     */
    public function verify(Request $request)
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = $request->user();

        if (!$user->two_factor_secret) {
            return response()->json([
                'message' => 'Please setup 2FA first.',
            ], 400);
        }

        $secret = decrypt($user->two_factor_secret);

        // Verify the code
        $valid = $this->google2fa->verifyKey($secret, $request->code);

        if (!$valid) {
            throw ValidationException::withMessages([
                'code' => ['The verification code is invalid.'],
            ]);
        }

        // Enable 2FA
        $user->update([
            'two_factor_enabled' => true,
        ]);

        // Audit log for 2FA enable
        AuditLogService::log(
            '2fa_enabled',
            'User',
            $user->id,
            "User enabled 2FA: {$user->email}",
            ['two_factor_enabled' => false],
            ['two_factor_enabled' => true],
            $request
        );

        return response()->json([
            'message' => '2FA has been successfully enabled!',
            'two_factor_enabled' => true,
        ], 200);
    }

    /**
     * Verify 2FA code during login.
     */
    public function verifyLogin(Request $request)
    {
        $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = User::findOrFail($request->user_id);

        if (!$user->two_factor_enabled || !$user->two_factor_secret) {
            return response()->json([
                'message' => '2FA is not enabled for this account.',
            ], 400);
        }

        $secret = decrypt($user->two_factor_secret);

        // Verify the code
        $valid = $this->google2fa->verifyKey($secret, $request->code);

        if (!$valid) {
            throw ValidationException::withMessages([
                'code' => ['The verification code is invalid.'],
            ]);
        }

        // Update last login information
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        // Log the login
        LoginLog::create([
            'user_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent() ?? 'Unknown',
        ]);

        // Audit log for 2FA login
        AuditLogService::log(
            'user_login_2fa',
            'User',
            $user->id,
            "User logged in with 2FA: {$user->email}",
            null,
            null,
            $request
        );

        // Create token
        $token = $user->createToken('auth-token')->plainTextToken;

        // Load roles and permissions for the user
        $user->load('roles.permissions', 'primaryRole');

        return response()->json([
            'message' => '2FA verification successful!',
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
     * Disable 2FA.
     */
    public function disable(Request $request)
    {
        $request->validate([
            'password' => ['required'],
        ]);

        $user = $request->user();

        // Verify password for security
        if (!Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['The provided password is incorrect.'],
            ]);
        }

        // Disable 2FA
        $user->update([
            'two_factor_secret' => null,
            'two_factor_enabled' => false,
        ]);

        // Audit log for 2FA disable
        AuditLogService::log(
            '2fa_disabled',
            'User',
            $user->id,
            "User disabled 2FA: {$user->email}",
            ['two_factor_enabled' => true],
            ['two_factor_enabled' => false],
            $request
        );

        return response()->json([
            'message' => '2FA has been successfully disabled!',
            'two_factor_enabled' => false,
        ], 200);
    }
}
