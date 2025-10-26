<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();
        $users = [];

        // Create admin user
        $users[] = [
            'full_name' => 'Admin User',
            'email' => 'admin@paypal.test',
            'mobile_number' => '+1234567890',
            'is_verified' => true,
            'password' => Hash::make('password123'),
            'balance' => 10000.00,
            'failed_login_attempts' => 0,
            'locked_until' => null,
            'created_at' => $now->copy()->subMonths(6),
            'updated_at' => $now,
        ];

        // Create regular users spread over the last 90 days
        $userNames = [
            'John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', 'Charlie Brown',
            'Diana Prince', 'Eve Anderson', 'Frank Miller', 'Grace Lee', 'Henry Taylor',
            'Ivy Chen', 'Jack Wilson', 'Kate Martinez', 'Leo Garcia', 'Mary Rodriguez',
            'Nathan Clark', 'Olivia Lopez', 'Paul Hill', 'Quinn Scott', 'Rachel Green',
            'Sam Adams', 'Tina Baker', 'Uma Patel', 'Victor Moore', 'Wendy White',
            'Xavier King', 'Yara Davis', 'Zack Martin', 'Anna Thompson', 'Ben Harris',
            'Chloe Walker', 'David Young', 'Emma Allen', 'Felix Wright', 'Gina Torres',
            'Hugo Bennett', 'Iris Foster', 'James Cooper', 'Kara Nelson', 'Luis Rivera',
            'Mia Brooks', 'Noah Gray', 'Oscar Hayes', 'Pam Murphy', 'Rex Kelly',
            'Sara Reed', 'Tony Cruz', 'Vera Stone', 'Wade Pierce', 'Zoe Barnes'
        ];

        foreach ($userNames as $index => $name) {
            $daysAgo = rand(1, 90); // Users registered over last 90 days
            $createdAt = $now->copy()->subDays($daysAgo);
            
            $users[] = [
                'full_name' => $name,
                'email' => strtolower(str_replace(' ', '.', $name)) . '@example.com',
                'mobile_number' => '+1' . rand(2000000000, 9999999999),
                'is_verified' => true,
                'password' => Hash::make('password123'),
                'balance' => rand(100, 5000) + (rand(0, 99) / 100), // Random balance between $100-$5000
                'locked_until' => $index < 3 ? $now->copy()->addDays(7) : null, // Lock first 3 users for 7 days
                'failed_login_attempts' => $index < 3 ? rand(3, 10) : rand(0, 2),
                'created_at' => $createdAt,
                'updated_at' => $createdAt->copy()->addDays(rand(0, $daysAgo)),
            ];
        }

        // Insert all users
        DB::table('users')->insert($users);

        $this->command->info('✅ Seeded ' . count($users) . ' users (1 admin + 50 regular users)');
    }
}
