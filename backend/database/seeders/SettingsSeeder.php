<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // Application Settings
            ['key' => 'app_name', 'value' => 'PayPal Clone', 'type' => 'string', 'description' => 'Application name'],
            ['key' => 'app_url', 'value' => 'http://localhost:3001', 'type' => 'string', 'description' => 'Application URL'],
            ['key' => 'timezone', 'value' => 'UTC', 'type' => 'string', 'description' => 'Default timezone'],
            ['key' => 'maintenance_mode', 'value' => 'false', 'type' => 'boolean', 'description' => 'Enable maintenance mode'],

            // Security Settings
            ['key' => 'session_timeout', 'value' => '30', 'type' => 'integer', 'description' => 'Session timeout in minutes'],
            ['key' => 'password_min_length', 'value' => '8', 'type' => 'integer', 'description' => 'Minimum password length'],
            ['key' => 'password_require_uppercase', 'value' => 'true', 'type' => 'boolean', 'description' => 'Require uppercase letters'],
            ['key' => 'password_require_lowercase', 'value' => 'true', 'type' => 'boolean', 'description' => 'Require lowercase letters'],
            ['key' => 'password_require_numbers', 'value' => 'true', 'type' => 'boolean', 'description' => 'Require numbers'],
            ['key' => 'password_require_special', 'value' => 'true', 'type' => 'boolean', 'description' => 'Require special characters'],
            ['key' => 'enforce_2fa', 'value' => 'false', 'type' => 'boolean', 'description' => 'Force all users to enable 2FA'],
            ['key' => 'max_login_attempts', 'value' => '5', 'type' => 'integer', 'description' => 'Maximum failed login attempts'],
            ['key' => 'lockout_duration', 'value' => '15', 'type' => 'integer', 'description' => 'Account lockout duration in minutes'],

            // Email Settings
            ['key' => 'smtp_host', 'value' => 'smtp.mailtrap.io', 'type' => 'string', 'description' => 'SMTP host server'],
            ['key' => 'smtp_port', 'value' => '587', 'type' => 'integer', 'description' => 'SMTP port number'],
            ['key' => 'smtp_username', 'value' => '', 'type' => 'string', 'description' => 'SMTP username'],
            ['key' => 'smtp_password', 'value' => '', 'type' => 'string', 'description' => 'SMTP password'],
            ['key' => 'smtp_encryption', 'value' => 'tls', 'type' => 'string', 'description' => 'SMTP encryption (tls/ssl/none)'],
            ['key' => 'from_email', 'value' => 'noreply@paypal-clone.local', 'type' => 'string', 'description' => 'From email address'],
            ['key' => 'from_name', 'value' => 'PayPal Clone', 'type' => 'string', 'description' => 'From name'],

            // Notification Settings
            ['key' => 'notify_new_user', 'value' => 'true', 'type' => 'boolean', 'description' => 'Notify on new user registration'],
            ['key' => 'notify_large_transaction', 'value' => 'true', 'type' => 'boolean', 'description' => 'Notify on large transactions'],
            ['key' => 'large_transaction_amount', 'value' => '1000', 'type' => 'integer', 'description' => 'Large transaction threshold'],
            ['key' => 'notify_failed_login', 'value' => 'true', 'type' => 'boolean', 'description' => 'Notify on failed login attempts'],

            // API Settings
            ['key' => 'api_rate_limit', 'value' => '100', 'type' => 'integer', 'description' => 'API rate limit per window'],
            ['key' => 'api_rate_limit_window', 'value' => '60', 'type' => 'integer', 'description' => 'Rate limit window in seconds'],
            ['key' => 'api_timeout', 'value' => '30', 'type' => 'integer', 'description' => 'API timeout in seconds'],
        ];

        foreach ($settings as $setting) {
            DB::table('settings')->updateOrInsert(
                ['key' => $setting['key']],
                [
                    'value' => $setting['value'],
                    'type' => $setting['type'],
                    'description' => $setting['description'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
