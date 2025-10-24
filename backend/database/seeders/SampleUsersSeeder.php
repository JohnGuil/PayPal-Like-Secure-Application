<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class SampleUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Super Admin
        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@paypal.test'],
            [
                'full_name' => 'Super Administrator',
                'mobile_number' => '+1234567890',
                'password' => bcrypt('SuperAdmin123!'),
                'two_factor_enabled' => false
            ]
        );
        $superAdmin->assignRole('super-admin');
        $superAdmin->update(['primary_role_id' => 1]);
        $this->command->info('✅ Super Admin created: superadmin@paypal.test');

        // Create Admin
        $admin = User::firstOrCreate(
            ['email' => 'admin@paypal.test'],
            [
                'full_name' => 'System Administrator',
                'mobile_number' => '+1234567891',
                'password' => bcrypt('Admin123!'),
                'two_factor_enabled' => false
            ]
        );
        $admin->assignRole('admin');
        $admin->update(['primary_role_id' => 2]);
        $this->command->info('✅ Admin created: admin@paypal.test');

        // Create Manager
        $manager = User::firstOrCreate(
            ['email' => 'manager@paypal.test'],
            [
                'full_name' => 'Account Manager',
                'mobile_number' => '+1234567892',
                'password' => bcrypt('Manager123!'),
                'two_factor_enabled' => false
            ]
        );
        $manager->assignRole('manager');
        $manager->update(['primary_role_id' => 3]);
        $this->command->info('✅ Manager created: manager@paypal.test');

        // Create Regular User
        $user = User::firstOrCreate(
            ['email' => 'user@paypal.test'],
            [
                'full_name' => 'Regular User',
                'mobile_number' => '+1234567893',
                'password' => bcrypt('User123!'),
                'two_factor_enabled' => false
            ]
        );
        $user->assignRole('user');
        $user->update(['primary_role_id' => 4]);
        $this->command->info('✅ User created: user@paypal.test');

        $this->command->info("\n" . str_repeat('=', 50));
        $this->command->info('📋 Sample Accounts Summary:');
        $this->command->info(str_repeat('=', 50));
        $this->command->info('🔑 Super Admin: superadmin@paypal.test / SuperAdmin123!');
        $this->command->info('🔑 Admin:       admin@paypal.test / Admin123!');
        $this->command->info('🔑 Manager:     manager@paypal.test / Manager123!');
        $this->command->info('🔑 User:        user@paypal.test / User123!');
        $this->command->info(str_repeat('=', 50) . "\n");
    }
}
