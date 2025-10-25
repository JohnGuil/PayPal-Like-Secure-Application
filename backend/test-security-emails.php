#!/usr/bin/env php
<?php

/*
|--------------------------------------------------------------------------
| Test Security Emails
|--------------------------------------------------------------------------
| This script tests all 3 new security email types by creating sample
| emails and displaying their content.
*/

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Mail\SecurityAlert;
use App\Mail\PasswordResetEmail;
use App\Mail\TwoFactorCode;
use Illuminate\Support\Facades\Mail;

echo "\n🧪 Testing Phase 4.3 Security Emails\n";
echo "====================================\n\n";

// Get a test user
$user = User::where('email', 'superadmin@paypal.test')->first();

if (!$user) {
    echo "❌ Error: Test user not found\n";
    exit(1);
}

echo "📧 Test User: {$user->full_name} ({$user->email})\n\n";

// Test 1: Security Alert
echo "1️⃣ Testing Security Alert Email...\n";
try {
    Mail::to($user->email)->send(new SecurityAlert(
        $user,
        'Suspicious Login Attempt',
        'We detected a login attempt from an unusual location.',
        [
            'ip_address' => '203.0.113.45',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'location' => 'Tokyo, Japan',
            'time' => now()->format('F j, Y \a\t g:i A'),
            'action_taken' => 'Login blocked for verification'
        ]
    ));
    echo "   ✅ Security Alert queued successfully\n\n";
} catch (\Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n\n";
}

// Test 2: Password Reset
echo "2️⃣ Testing Password Reset Email...\n";
try {
    $resetToken = bin2hex(random_bytes(32));
    $resetUrl = config('app.frontend_url') . '/reset-password?token=' . $resetToken;
    
    Mail::to($user->email)->send(new PasswordResetEmail(
        $user,
        $resetToken,
        $resetUrl
    ));
    echo "   ✅ Password Reset email queued successfully\n";
    echo "   🔑 Reset Token: " . substr($resetToken, 0, 16) . "...\n\n";
} catch (\Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n\n";
}

// Test 3: Two-Factor Code
echo "3️⃣ Testing Two-Factor Code Email...\n";
try {
    $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    
    Mail::to($user->email)->send(new TwoFactorCode(
        $user,
        $code
    ));
    echo "   ✅ 2FA Code email queued successfully\n";
    echo "   🔐 2FA Code: {$code}\n\n";
} catch (\Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n\n";
}

// Check queue
$jobCount = \Illuminate\Support\Facades\DB::table('jobs')->count();
echo "📊 Summary:\n";
echo "   Jobs in queue: {$jobCount}\n";
echo "\n✅ All security emails tested!\n";
echo "\n💡 Next steps:\n";
echo "   1. Run: docker exec paypal_backend php artisan queue:work --stop-when-empty\n";
echo "   2. Check logs: docker exec paypal_backend tail -n 100 /var/www/storage/logs/laravel.log | grep 'Subject:'\n\n";
