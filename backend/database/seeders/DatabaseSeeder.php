<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            // First, create roles and permissions
            RolePermissionSeeder::class,
            
            // Then create role-based demo accounts
            SampleUsersSeeder::class,
            
            // System settings
            SettingsSeeder::class,
            
            // Finally, seed test data (skip UserSeeder to avoid duplicates)
            TransactionSeeder::class,
            LoginLogSeeder::class,
        ]);
    }
}
