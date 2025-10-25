<?php

namespace App\Services;

use App\Models\User;
use App\Models\LoginLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;
use App\Mail\AccountLocked;
use App\Mail\SuspiciousActivity;

class SecurityService
{
    /**
     * Maximum failed login attempts before lockout
     */
    const MAX_FAILED_ATTEMPTS = 5;

    /**
     * Lockout duration in minutes
     */
    const LOCKOUT_DURATION = 15;

    /**
     * Check if account is locked
     */
    public function isAccountLocked(User $user): bool
    {
        if (!$user->locked_until) {
            return false;
        }

        // Check if lock has expired
        if (Carbon::now()->greaterThan($user->locked_until)) {
            $this->unlockAccount($user);
            return false;
        }

        return true;
    }

    /**
     * Record failed login attempt
     */
    public function recordFailedLogin(User $user, string $reason = 'Invalid credentials'): void
    {
        $user->increment('failed_login_attempts');
        $user->last_failed_login = now();
        $user->save();

        // Check if should lock account
        if ($user->failed_login_attempts >= self::MAX_FAILED_ATTEMPTS) {
            $this->lockAccount($user);
        }
    }

    /**
     * Lock account after too many failed attempts
     */
    public function lockAccount(User $user): void
    {
        $user->locked_until = now()->addMinutes(self::LOCKOUT_DURATION);
        $user->save();

        // Send email notification
        try {
            Mail::to($user->email)->queue(new AccountLocked($user, self::LOCKOUT_DURATION));
        } catch (\Exception $e) {
            \Log::error('Failed to send account locked email: ' . $e->getMessage());
        }
    }

    /**
     * Unlock account
     */
    public function unlockAccount(User $user): void
    {
        $user->failed_login_attempts = 0;
        $user->locked_until = null;
        $user->last_failed_login = null;
        $user->save();
    }

    /**
     * Reset failed attempts on successful login
     */
    public function resetFailedAttempts(User $user): void
    {
        if ($user->failed_login_attempts > 0) {
            $user->failed_login_attempts = 0;
            $user->last_failed_login = null;
            $user->save();
        }
    }

    /**
     * Detect suspicious login activity
     */
    public function detectSuspiciousActivity(User $user, string $ipAddress, string $userAgent): array
    {
        $suspicious = [];

        // Check for new IP address
        $previousLogins = LoginLog::where('user_id', $user->id)
            ->where('is_successful', true)
            ->where('created_at', '>', now()->subDays(30))
            ->get();

        $knownIps = $previousLogins->pluck('ip_address')->unique();

        if ($knownIps->isNotEmpty() && !$knownIps->contains($ipAddress)) {
            $suspicious[] = [
                'type' => 'new_ip',
                'message' => 'Login from new IP address',
                'ip' => $ipAddress,
            ];
        }

        // Check for rapid login attempts
        $recentAttempts = LoginLog::where('user_id', $user->id)
            ->where('created_at', '>', now()->subMinutes(5))
            ->count();

        if ($recentAttempts > 3) {
            $suspicious[] = [
                'type' => 'rapid_attempts',
                'message' => 'Multiple login attempts in short time',
                'count' => $recentAttempts,
            ];
        }

        // Check for different browsers
        $knownUserAgents = $previousLogins->pluck('user_agent')->unique();
        
        if ($knownUserAgents->isNotEmpty() && !$knownUserAgents->contains($userAgent)) {
            $suspicious[] = [
                'type' => 'new_device',
                'message' => 'Login from new device/browser',
                'user_agent' => $userAgent,
            ];
        }

        // Send notification if suspicious activity detected
        if (!empty($suspicious) && $previousLogins->count() > 0) {
            try {
                Mail::to($user->email)->queue(new SuspiciousActivity($user, $suspicious, $ipAddress));
            } catch (\Exception $e) {
                \Log::error('Failed to send suspicious activity email: ' . $e->getMessage());
            }
        }

        return $suspicious;
    }

    /**
     * Get security statistics
     */
    public function getSecurityStats(Carbon $startDate = null, Carbon $endDate = null): array
    {
        $startDate = $startDate ?? now()->subDays(30);
        $endDate = $endDate ?? now();

        // Failed login attempts
        $failedLogins = LoginLog::where('is_successful', false)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        // Unique users with failed logins
        $usersWithFailedLogins = LoginLog::where('is_successful', false)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->distinct('user_id')
            ->count('user_id');

        // Currently locked accounts
        $lockedAccounts = User::whereNotNull('locked_until')
            ->where('locked_until', '>', now())
            ->count();

        // Total lockouts in period
        $totalLockouts = LoginLog::where('failure_reason', 'like', '%locked%')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        return [
            'failed_logins' => $failedLogins,
            'users_with_failed_logins' => $usersWithFailedLogins,
            'locked_accounts' => $lockedAccounts,
            'total_lockouts' => $totalLockouts,
        ];
    }
}
