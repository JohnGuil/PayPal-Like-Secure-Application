<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LoginLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();
        $loginLogs = [];
        
        // Get all user IDs
        $userIds = DB::table('users')->pluck('id')->toArray();
        
        if (empty($userIds)) {
            $this->command->error('❌ No users found to create login logs');
            return;
        }

        $logCount = 0;
        
        // Generate login logs for the last 30 days
        for ($day = 30; $day >= 0; $day--) {
            $date = $now->copy()->subDays($day);
            
            // More logins on weekdays
            $isWeekend = $date->isWeekend();
            $dailyLogins = $isWeekend ? rand(20, 50) : rand(50, 120);
            
            for ($i = 0; $i < $dailyLogins; $i++) {
                $userId = $userIds[array_rand($userIds)];
                
                // Random hour (peak hours: morning 8-10, lunch 12-14, evening 18-21)
                $hourRand = rand(1, 100);
                if ($hourRand <= 30) {
                    $hour = rand(8, 10); // Morning peak
                } elseif ($hourRand <= 50) {
                    $hour = rand(12, 14); // Lunch peak
                } elseif ($hourRand <= 70) {
                    $hour = rand(18, 21); // Evening peak
                } else {
                    $hour = rand(0, 23); // Random hour
                }
                
                $timestamp = $date->copy()->setHour($hour)->setMinute(rand(0, 59))->setSecond(rand(0, 59));
                
                // 95% successful, 5% failed
                $successful = rand(1, 100) <= 95;
                
                $loginLogs[] = [
                    'user_id' => $userId,
                    'ip_address' => $this->getRandomIpAddress(),
                    'user_agent' => $this->getRandomUserAgent(),
                    'successful' => $successful,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ];
                
                $logCount++;
                
                // Insert in smaller batches to avoid SQL query size limits (50 at a time)
                if (count($loginLogs) >= 50) {
                    DB::table('login_logs')->insert($loginLogs);
                    $loginLogs = [];
                }
            }
        }
        
        // Insert remaining logs
        if (!empty($loginLogs)) {
            DB::table('login_logs')->insert($loginLogs);
        }
        
        // Add some suspicious activity (failed logins in last 24 hours)
        $suspicious = [];
        $suspiciousUserIds = array_slice($userIds, 0, min(5, count($userIds))); // First 5 users
        
        foreach ($suspiciousUserIds as $userId) {
            $failedAttempts = rand(3, 8);
            
            for ($j = 0; $j < $failedAttempts; $j++) {
                $timestamp = $now->copy()->subHours(rand(1, 24));
                
                $suspicious[] = [
                    'user_id' => $userId,
                    'ip_address' => $this->getRandomIpAddress(),
                    'user_agent' => $this->getRandomUserAgent(),
                    'successful' => false,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ];
            }
        }
        
        if (!empty($suspicious)) {
            DB::table('login_logs')->insert($suspicious);
            $logCount += count($suspicious);
        }
        
        $this->command->info('✅ Seeded ' . $logCount . ' login logs over 30 days');
        
        // Show summary
        $successful = DB::table('login_logs')->where('successful', true)->count();
        $failed = DB::table('login_logs')->where('successful', false)->count();
        $last24h = DB::table('login_logs')
            ->where('successful', false)
            ->where('created_at', '>=', $now->copy()->subHours(24))
            ->count();
        
        $this->command->info("   ✅ Successful: $successful | ❌ Failed: $failed");
        $this->command->info("   ⚠️  Failed logins (last 24h): $last24h");
    }
    
    /**
     * Get random IP address
     */
    private function getRandomIpAddress(): string
    {
        return rand(1, 255) . '.' . rand(0, 255) . '.' . rand(0, 255) . '.' . rand(1, 255);
    }
    
    /**
     * Get random user agent
     */
    private function getRandomUserAgent(): string
    {
        $userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
        ];
        
        return $userAgents[array_rand($userAgents)];
    }
}
