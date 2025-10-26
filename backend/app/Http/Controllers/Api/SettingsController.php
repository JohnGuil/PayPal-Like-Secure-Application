<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SettingsController extends Controller
{
    /**
     * Get all settings
     */
    public function index(Request $request)
    {
        // Check permission
        if (!$request->user()->hasPermission('view-system-settings')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $settings = Setting::all()->pluck('value', 'key');

        // Convert boolean strings to actual booleans
        $booleanKeys = [
            'maintenance_mode',
            'password_require_uppercase',
            'password_require_lowercase',
            'password_require_numbers',
            'password_require_special',
            'enforce_2fa',
            'notify_new_user',
            'notify_large_transaction',
            'notify_failed_login'
        ];

        foreach ($booleanKeys as $key) {
            if (isset($settings[$key])) {
                $settings[$key] = filter_var($settings[$key], FILTER_VALIDATE_BOOLEAN);
            }
        }

        // Convert numeric strings to actual numbers
        $numericKeys = [
            'session_timeout',
            'password_min_length',
            'max_login_attempts',
            'lockout_duration',
            'smtp_port',
            'large_transaction_amount',
            'api_rate_limit',
            'api_rate_limit_window',
            'api_timeout'
        ];

        foreach ($numericKeys as $key) {
            if (isset($settings[$key])) {
                $settings[$key] = is_numeric($settings[$key]) ? (float) $settings[$key] : $settings[$key];
            }
        }

        return response()->json($settings);
    }

    /**
     * Update settings
     */
    public function update(Request $request)
    {
        // Check permission
        if (!$request->user()->hasPermission('update-system-settings')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            // Application settings
            'app_name' => 'sometimes|string|max:255',
            'app_url' => 'sometimes|url|max:255',
            'timezone' => 'sometimes|string|max:50',
            'maintenance_mode' => 'sometimes|boolean',

            // Security settings
            'session_timeout' => 'sometimes|integer|min:5|max:120',
            'password_min_length' => 'sometimes|integer|min:6|max:32',
            'password_require_uppercase' => 'sometimes|boolean',
            'password_require_lowercase' => 'sometimes|boolean',
            'password_require_numbers' => 'sometimes|boolean',
            'password_require_special' => 'sometimes|boolean',
            'enforce_2fa' => 'sometimes|boolean',
            'max_login_attempts' => 'sometimes|integer|min:3|max:10',
            'lockout_duration' => 'sometimes|integer|min:5|max:60',

            // Email settings
            'smtp_host' => 'sometimes|string|max:255',
            'smtp_port' => 'sometimes|integer|min:1|max:65535',
            'smtp_username' => 'sometimes|string|max:255',
            'smtp_password' => 'sometimes|string|max:255',
            'smtp_encryption' => 'sometimes|in:tls,ssl,none',
            'from_email' => 'sometimes|email|max:255',
            'from_name' => 'sometimes|string|max:255',

            // Notification settings
            'notify_new_user' => 'sometimes|boolean',
            'notify_large_transaction' => 'sometimes|boolean',
            'large_transaction_amount' => 'sometimes|numeric|min:0',
            'notify_failed_login' => 'sometimes|boolean',

            // API settings
            'api_rate_limit' => 'sometimes|integer|min:10|max:1000',
            'api_rate_limit_window' => 'sometimes|integer|min:1|max:3600',
            'api_timeout' => 'sometimes|integer|min:5|max:120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $changedSettings = [];
        $oldValues = [];
        $newValues = [];

        // Update each setting and track changes
        foreach ($request->all() as $key => $value) {
            $existingSetting = Setting::where('key', $key)->first();
            
            // Track old value for audit
            if ($existingSetting) {
                $oldValues[$key] = $existingSetting->value;
            }

            // Determine type
            $type = 'string';
            if (is_bool($value)) {
                $type = 'boolean';
                $value = $value ? 'true' : 'false';
            } elseif (is_numeric($value) && !is_string($value)) {
                $type = is_int($value) ? 'integer' : 'float';
                $value = (string) $value;
            }

            Setting::updateOrCreate(
                ['key' => $key],
                [
                    'value' => $value,
                    'type' => $type,
                    'updated_by' => $request->user()->id
                ]
            );

            $newValues[$key] = $value;
            $changedSettings[] = $key;
        }

        // Clear settings cache
        Setting::clearCache();

        // Log the changes
        if (!empty($changedSettings)) {
            AuditLogService::log(
                'settings_updated',
                'Setting',
                null,
                'Updated system settings: ' . implode(', ', $changedSettings),
                $oldValues,
                $newValues,
                $request
            );
        }

        return response()->json([
            'message' => 'Settings updated successfully',
            'updated_count' => count($changedSettings)
        ]);
    }

    /**
     * Get a specific setting
     */
    public function show(Request $request, $key)
    {
        // Check permission
        if (!$request->user()->hasPermission('view-system-settings')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $setting = Setting::where('key', $key)->first();

        if (!$setting) {
            return response()->json([
                'message' => 'Setting not found'
            ], 404);
        }

        return response()->json([
            'key' => $setting->key,
            'value' => $setting->value
        ]);
    }

    /**
     * Reset settings to defaults
     */
    public function reset(Request $request)
    {
        // Check permission (only super admin)
        if (!$request->user()->hasRole('super-admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Delete all settings (will use default values)
        Setting::truncate();

        // Seed default settings
        $this->seedDefaultSettings();

        return response()->json([
            'message' => 'Settings reset to defaults successfully'
        ]);
    }

    /**
     * Seed default settings
     */
    private function seedDefaultSettings()
    {
        $defaults = [
            // Application
            'app_name' => 'PayPal Clone',
            'app_url' => 'http://localhost:3001',
            'timezone' => 'UTC',
            'maintenance_mode' => '0',

            // Security
            'session_timeout' => '30',
            'password_min_length' => '8',
            'password_require_uppercase' => '1',
            'password_require_lowercase' => '1',
            'password_require_numbers' => '1',
            'password_require_special' => '1',
            'enforce_2fa' => '0',
            'max_login_attempts' => '5',
            'lockout_duration' => '15',

            // Email
            'smtp_host' => 'smtp.mailtrap.io',
            'smtp_port' => '587',
            'smtp_encryption' => 'tls',
            'from_email' => 'noreply@paypal-clone.local',
            'from_name' => 'PayPal Clone',

            // Notifications
            'notify_new_user' => '1',
            'notify_large_transaction' => '1',
            'large_transaction_amount' => '1000',
            'notify_failed_login' => '1',

            // API
            'api_rate_limit' => '100',
            'api_rate_limit_window' => '60',
            'api_timeout' => '30',
        ];

        foreach ($defaults as $key => $value) {
            Setting::create([
                'key' => $key,
                'value' => $value
            ]);
        }
    }
}
