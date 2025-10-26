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
            
            // Finally, seed test data
            UserSeeder::class,
            TransactionSeeder::class,
            LoginLogSeeder::class,
        ]);
    }
}
