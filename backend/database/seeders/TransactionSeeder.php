<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();
        $transactions = [];
        
        // Get all user IDs
        $userIds = DB::table('users')->pluck('id')->toArray();
        
        if (count($userIds) < 2) {
            $this->command->error('❌ Need at least 2 users to create transactions');
            return;
        }

        // Create transactions over the last 90 days with varying patterns
        $transactionCount = 0;
        
        // Generate transactions for each day in the last 90 days
        for ($day = 90; $day >= 0; $day--) {
            $date = $now->copy()->subDays($day);
            
            // More transactions on weekdays, fewer on weekends
            $isWeekend = $date->isWeekend();
            $baseTransactions = $isWeekend ? rand(5, 15) : rand(15, 40);
            
            // More recent days have more transactions (growth pattern)
            $growthFactor = 1 + (90 - $day) / 180; // Up to 50% growth
            $dailyTransactions = (int)($baseTransactions * $growthFactor);
            
            for ($i = 0; $i < $dailyTransactions; $i++) {
                // Random hour throughout the day (with peak hours)
                $hour = $this->getRandomHourWithPeaks();
                $timestamp = $date->copy()->setHour($hour)->setMinute(rand(0, 59))->setSecond(rand(0, 59));
                
                // Select random sender and receiver
                $senderId = $userIds[array_rand($userIds)];
                $receiverId = $userIds[array_rand($userIds)];
                
                // Make sure sender and receiver are different
                while ($receiverId === $senderId) {
                    $receiverId = $userIds[array_rand($userIds)];
                }
                
                // Random transaction type with realistic distribution
                $typeRand = rand(1, 100);
                if ($typeRand <= 70) {
                    $type = 'payment'; // 70% payments
                } elseif ($typeRand <= 90) {
                    $type = 'transfer'; // 20% transfers
                } else {
                    $type = 'refund'; // 10% refunds
                }
                
                // Random amount based on type
                if ($type === 'refund') {
                    $amount = rand(10, 500) + (rand(0, 99) / 100);
                } elseif ($type === 'transfer') {
                    $amount = rand(50, 2000) + (rand(0, 99) / 100);
                } else {
                    $amount = rand(5, 1000) + (rand(0, 99) / 100);
                }
                
                // Calculate fee (2.9% + $0.30 for payments, $0.50 for transfers, $0 for refunds)
                if ($type === 'payment') {
                    $fee = round($amount * 0.029 + 0.30, 2);
                } elseif ($type === 'transfer') {
                    $fee = 0.50;
                } else {
                    $fee = 0.00;
                }
                
                // Status distribution: 92% completed, 5% pending, 3% failed
                $statusRand = rand(1, 100);
                if ($statusRand <= 92) {
                    $status = 'completed';
                } elseif ($statusRand <= 97) {
                    $status = 'pending';
                } else {
                    $status = 'failed';
                }
                
                $transactions[] = [
                    'sender_id' => $senderId,
                    'recipient_id' => $receiverId,
                    'amount' => $amount,
                    'fee' => $fee,
                    'currency' => 'USD',
                    'type' => $type,
                    'status' => $status,
                    'description' => $this->getRandomDescription($type),
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ];
                
                $transactionCount++;
                
                // Insert in batches to avoid memory issues
                if (count($transactions) >= 1000) {
                    DB::table('transactions')->insert($transactions);
                    $transactions = [];
                }
            }
        }
        
        // Insert remaining transactions
        if (!empty($transactions)) {
            DB::table('transactions')->insert($transactions);
        }
        
        $this->command->info('✅ Seeded ' . $transactionCount . ' transactions over 90 days');
        
        // Show summary
        $completed = DB::table('transactions')->where('status', 'completed')->count();
        $pending = DB::table('transactions')->where('status', 'pending')->count();
        $failed = DB::table('transactions')->where('status', 'failed')->count();
        $totalVolume = DB::table('transactions')->where('status', 'completed')->sum('amount');
        $totalRevenue = DB::table('transactions')->where('status', 'completed')->sum('fee');
        
        $this->command->info("   📊 Completed: $completed | Pending: $pending | Failed: $failed");
        $this->command->info("   💰 Total Volume: $" . number_format($totalVolume, 2));
        $this->command->info("   💵 Total Revenue: $" . number_format($totalRevenue, 2));
    }
    
    /**
     * Get random hour with realistic peak patterns
     */
    private function getRandomHourWithPeaks(): int
    {
        // Peak hours: 9am-12pm (morning), 2pm-5pm (afternoon), 7pm-9pm (evening)
        $rand = rand(1, 100);
        
        if ($rand <= 25) {
            // Morning peak (9-12)
            return rand(9, 12);
        } elseif ($rand <= 50) {
            // Afternoon peak (14-17)
            return rand(14, 17);
        } elseif ($rand <= 65) {
            // Evening peak (19-21)
            return rand(19, 21);
        } else {
            // Off-peak hours
            $offPeakHours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 13, 18, 22, 23];
            return $offPeakHours[array_rand($offPeakHours)];
        }
    }
    
    /**
     * Get random transaction description
     */
    private function getRandomDescription(string $type): string
    {
        $descriptions = [
            'payment' => [
                'Online purchase',
                'Service payment',
                'Invoice payment',
                'Product purchase',
                'Subscription payment',
                'Digital goods',
                'Food delivery',
                'Shopping',
                'Entertainment',
                'Utilities payment',
            ],
            'transfer' => [
                'Money transfer',
                'Funds transfer',
                'Account transfer',
                'Peer-to-peer transfer',
                'Family transfer',
                'Friend transfer',
                'Split payment',
                'Shared expenses',
            ],
            'refund' => [
                'Order refund',
                'Purchase refund',
                'Service refund',
                'Cancellation refund',
                'Return refund',
                'Dispute refund',
                'Partial refund',
            ],
        ];
        
        $typeDescriptions = $descriptions[$type] ?? ['Transaction'];
        return $typeDescriptions[array_rand($typeDescriptions)];
    }
}
