<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Seeds default roles and permissions following industry standards:
     * - Super Admin: Full system access
     * - Admin: Administrative access
     * - Manager: Management level access
     * - User: Standard user access
     */
    public function run(): void
    {
        // Create Permissions
        $permissions = [
            // User Management
            ['name' => 'View Users', 'slug' => 'view-users', 'resource' => 'users', 'action' => 'read', 'description' => 'View user list and details'],
            ['name' => 'Create Users', 'slug' => 'create-users', 'resource' => 'users', 'action' => 'create', 'description' => 'Create new users'],
            ['name' => 'Update Users', 'slug' => 'update-users', 'resource' => 'users', 'action' => 'update', 'description' => 'Update user information'],
            ['name' => 'Delete Users', 'slug' => 'delete-users', 'resource' => 'users', 'action' => 'delete', 'description' => 'Delete users'],
            
            // Role Management
            ['name' => 'View Roles', 'slug' => 'view-roles', 'resource' => 'roles', 'action' => 'read', 'description' => 'View roles and permissions'],
            ['name' => 'Create Roles', 'slug' => 'create-roles', 'resource' => 'roles', 'action' => 'create', 'description' => 'Create new roles'],
            ['name' => 'Update Roles', 'slug' => 'update-roles', 'resource' => 'roles', 'action' => 'update', 'description' => 'Update role permissions'],
            ['name' => 'Delete Roles', 'slug' => 'delete-roles', 'resource' => 'roles', 'action' => 'delete', 'description' => 'Delete roles'],
            
            // Permission Management
            ['name' => 'Assign Roles', 'slug' => 'assign-roles', 'resource' => 'roles', 'action' => 'assign', 'description' => 'Assign roles to users'],
            ['name' => 'Revoke Roles', 'slug' => 'revoke-roles', 'resource' => 'roles', 'action' => 'revoke', 'description' => 'Revoke roles from users'],
            
            // Transaction Management (for PayPal-like features)
            ['name' => 'View Transactions', 'slug' => 'view-transactions', 'resource' => 'transactions', 'action' => 'read', 'description' => 'View transaction history'],
            ['name' => 'Create Transactions', 'slug' => 'create-transactions', 'resource' => 'transactions', 'action' => 'create', 'description' => 'Create transactions'],
            ['name' => 'View All Transactions', 'slug' => 'view-all-transactions', 'resource' => 'transactions', 'action' => 'read-all', 'description' => 'View all users transactions'],
            
            // Account Management
            ['name' => 'Manage Own Account', 'slug' => 'manage-own-account', 'resource' => 'account', 'action' => 'manage', 'description' => 'Manage own account settings'],
            ['name' => 'Enable 2FA', 'slug' => 'enable-2fa', 'resource' => 'account', 'action' => 'enable-2fa', 'description' => 'Enable two-factor authentication'],
            ['name' => 'View Login Logs', 'slug' => 'view-login-logs', 'resource' => 'logs', 'action' => 'read', 'description' => 'View login activity'],
            ['name' => 'View All Login Logs', 'slug' => 'view-all-login-logs', 'resource' => 'logs', 'action' => 'read-all', 'description' => 'View all users login logs'],
            
            // System Management
            ['name' => 'View Dashboard', 'slug' => 'view-dashboard', 'resource' => 'dashboard', 'action' => 'read', 'description' => 'Access dashboard'],
            ['name' => 'View Admin Dashboard', 'slug' => 'view-admin-dashboard', 'resource' => 'dashboard', 'action' => 'admin', 'description' => 'Access admin dashboard'],
            ['name' => 'View System Settings', 'slug' => 'view-system-settings', 'resource' => 'settings', 'action' => 'read', 'description' => 'View system settings'],
            ['name' => 'Update System Settings', 'slug' => 'update-system-settings', 'resource' => 'settings', 'action' => 'update', 'description' => 'Modify system settings'],
            
            // Audit & Reports
            ['name' => 'View Audit Logs', 'slug' => 'view-audit-logs', 'resource' => 'audit', 'action' => 'read', 'description' => 'View security audit logs'],
            ['name' => 'Generate Reports', 'slug' => 'generate-reports', 'resource' => 'reports', 'action' => 'create', 'description' => 'Generate system reports'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['slug' => $permission['slug'], 'guard_name' => 'web'],
                array_merge($permission, ['guard_name' => 'web'])
            );
        }

        // Create Roles with hierarchical levels
        $superAdmin = Role::firstOrCreate(
            ['slug' => 'super-admin', 'guard_name' => 'web'],
            [
                'name' => 'Super Admin',
                'description' => 'Full system access with all permissions',
                'level' => 100,
                'is_active' => true,
                'guard_name' => 'web',
            ]
        );

        $admin = Role::firstOrCreate(
            ['slug' => 'admin', 'guard_name' => 'web'],
            [
                'name' => 'Admin',
                'description' => 'Administrative access to manage users and settings',
                'level' => 80,
                'is_active' => true,
                'guard_name' => 'web',
            ]
        );

        $manager = Role::firstOrCreate(
            ['slug' => 'manager', 'guard_name' => 'web'],
            [
                'name' => 'Manager',
                'description' => 'Management level access to view reports and transactions',
                'level' => 50,
                'is_active' => true,
                'guard_name' => 'web',
            ]
        );

        $user = Role::firstOrCreate(
            ['slug' => 'user', 'guard_name' => 'web'],
            [
                'name' => 'User',
                'description' => 'Standard user with basic permissions',
                'level' => 10,
                'is_active' => true,
                'guard_name' => 'web',
            ]
        );

        // Assign all permissions to Super Admin
        $superAdmin->syncPermissions(Permission::all());

        // Admin permissions (user management and basic admin tasks, NO system settings or audit logs)
        $adminPermissions = Permission::whereIn('slug', [
            'view-users',
            'create-users',
            'update-users',
            'delete-users',
            'view-roles',
            'assign-roles',
            'revoke-roles',
            'view-all-transactions',
            'view-all-login-logs',
            'view-admin-dashboard',
            // Removed: 'view-system-settings' - Super Admin only
            // Removed: 'view-audit-logs' - Super Admin only
            'generate-reports',
        ])->get();
        $admin->syncPermissions($adminPermissions);

        // Manager permissions (read-only access to reports and data)
        $managerPermissions = Permission::whereIn('slug', [
            'view-users',
            'view-roles',
            'view-all-transactions',
            'view-all-login-logs',
            'view-admin-dashboard',
            'generate-reports',
        ])->get();
        $manager->syncPermissions($managerPermissions);

        // User permissions (basic access)
        $userPermissions = Permission::whereIn('slug', [
            'manage-own-account',
            'enable-2fa',
            'view-login-logs',
            'view-transactions',
            'create-transactions',
            'view-dashboard',
        ])->get();
        $user->syncPermissions($userPermissions);

        $this->command->info('✅ Roles and Permissions seeded successfully!');
        $this->command->info('📊 Created ' . Permission::count() . ' permissions');
        $this->command->info('👥 Created 4 roles: Super Admin, Admin, Manager, User');
    }
}
