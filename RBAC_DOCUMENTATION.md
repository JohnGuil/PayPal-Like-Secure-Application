# Role-Based Access Control (RBAC) Implementation

## 📋 Overview

This application implements a comprehensive **Role-Based Access Control (RBAC)** system following industry standards (NIST RBAC model) with hierarchical roles and granular permissions.

## 🏗️ Architecture

### Core Components

1. **Roles** - Define user responsibilities and access levels
2. **Permissions** - Define specific actions users can perform
3. **Users** - Can have multiple roles
4. **Role Hierarchy** - Levels from 1-100 (higher = more privileges)

### Database Schema

```
users
├── id
├── primary_role_id (FK to roles)
└── ... (other user fields)

roles
├── id
├── name (e.g., "Admin")
├── slug (e.g., "admin")
├── description
├── level (hierarchy: 1-100)
└── is_active

permissions
├── id
├── name (e.g., "View Users")
├── slug (e.g., "view-users")
├── resource (e.g., "users")
├── action (e.g., "read")
└── description

role_user (Many-to-Many)
├── user_id
├── role_id
├── assigned_at
└── assigned_by

permission_role (Many-to-Many)
├── role_id
└── permission_id

role_permission_audit (Audit Trail)
├── user_id
├── action (assigned/revoked/created/deleted)
├── entity_type (role/permission)
└── metadata
```

## 🎭 Default Roles

| Role | Level | Description | Default Permissions |
|------|-------|-------------|---------------------|
| **Super Admin** | 100 | Full system access | All permissions |
| **Admin** | 80 | Administrative access | User management, reports, settings |
| **Manager** | 50 | Management level | View reports, transactions, users |
| **User** | 10 | Standard user | Own account, transactions, dashboard |

## 🔐 Permissions Structure

Permissions follow the pattern: `{action}-{resource}`

### Categories

#### User Management
- `view-users` - View user list and details
- `create-users` - Create new users
- `update-users` - Update user information
- `delete-users` - Delete users

#### Role Management
- `view-roles` - View roles and permissions
- `create-roles` - Create new roles
- `update-roles` - Update role permissions
- `delete-roles` - Delete roles
- `assign-roles` - Assign roles to users
- `revoke-roles` - Revoke roles from users

#### Transaction Management
- `view-transactions` - View own transactions
- `create-transactions` - Create transactions
- `view-all-transactions` - View all users' transactions

#### Account Management
- `manage-own-account` - Manage own account settings
- `enable-2fa` - Enable two-factor authentication
- `view-login-logs` - View own login history
- `view-all-login-logs` - View all users' login logs

#### System Management
- `view-dashboard` - Access user dashboard
- `view-admin-dashboard` - Access admin dashboard
- `view-system-settings` - View system settings
- `update-system-settings` - Modify system settings

#### Audit & Reports
- `view-audit-logs` - View security audit logs
- `generate-reports` - Generate system reports

## 🚀 Setup Instructions

### 1. Run Migrations

```bash
cd backend
php artisan migrate
```

This creates:
- `roles` table
- `permissions` table
- `role_user` pivot table
- `permission_role` pivot table
- `role_permission_audit` table
- Adds `primary_role_id` to `users` table

### 2. Seed Roles and Permissions

```bash
php artisan db:seed --class=RolePermissionSeeder
```

This creates:
- 4 default roles (Super Admin, Admin, Manager, User)
- 23 permissions across all categories
- Default role-permission mappings

### 3. Assign Super Admin Role (Optional)

```bash
php artisan tinker
```

```php
$user = App\Models\User::where('email', 'admin@example.com')->first();
$user->assignRole('super-admin');
$user->update(['primary_role_id' => 1]); // Super Admin role ID
```

## 💻 Usage Examples

### In Controllers

```php
use App\Models\User;

// Check if user has a specific role
if ($user->hasRole('admin')) {
    // Admin logic
}

// Check multiple roles (any)
if ($user->hasAnyRole(['admin', 'manager'])) {
    // Logic for admins or managers
}

// Check if user has a specific permission
if ($user->hasPermission('create-users')) {
    // Allow user creation
}

// Check multiple permissions (all required)
if ($user->hasAllPermissions(['view-users', 'update-users'])) {
    // Logic requiring both permissions
}

// Assign role to user
$user->assignRole('manager', auth()->id());

// Remove role from user
$user->removeRole('manager');

// Get all user permissions
$permissions = $user->getAllPermissions();
```

### Using Middleware

```php
// Protect routes by role
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    // Admin-only routes
});

// Protect by multiple roles (user needs ANY of these roles)
Route::middleware(['auth:sanctum', 'role:admin,manager'])->group(function () {
    // Routes for admins or managers
});

// Protect by permission
Route::middleware(['auth:sanctum', 'permission:create-users'])->group(function () {
    // Routes requiring create-users permission
});

// Combine middleware
Route::middleware(['auth:sanctum', 'role:admin', 'permission:delete-users'])->delete('/users/{id}', ...);
```

### In Blade/Frontend (API Response)

The user endpoint now returns role and permission data:

```json
{
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "roles": [
      {
        "id": 1,
        "name": "Admin",
        "slug": "admin"
      }
    ],
    "primary_role": {
      "id": 1,
      "name": "Admin",
      "slug": "admin"
    },
    "permissions": [
      {
        "id": 1,
        "name": "View Users",
        "slug": "view-users",
        "resource": "users",
        "action": "read"
      }
    ],
    "is_admin": true,
    "is_super_admin": false
  }
}
```

## 🔌 API Endpoints

### Role Management (Admin/Super Admin)

```
GET    /api/roles              - List all roles
GET    /api/roles/{id}         - Get specific role
POST   /api/roles              - Create new role
PUT    /api/roles/{id}         - Update role
DELETE /api/roles/{id}         - Delete role
POST   /api/roles/assign       - Assign role to user
POST   /api/roles/revoke       - Revoke role from user
```

### Permission Management (Super Admin Only)

```
GET    /api/permissions          - List all permissions
GET    /api/permissions/{id}     - Get specific permission
POST   /api/permissions          - Create new permission
PUT    /api/permissions/{id}     - Update permission
DELETE /api/permissions/{id}     - Delete permission
```

### Example API Requests

#### Create a Role

```bash
POST /api/roles
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Moderator",
  "slug": "moderator",
  "description": "Content moderation role",
  "level": 30,
  "permissions": ["view-users", "view-transactions"]
}
```

#### Assign Role to User

```bash
POST /api/roles/assign
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": 5,
  "role_slug": "manager",
  "set_as_primary": true
}
```

#### Get User Permissions

```bash
GET /api/user
Authorization: Bearer {token}

Response includes:
- roles: Array of user's roles
- permissions: Array of all permissions through roles
- is_admin: Boolean
- is_super_admin: Boolean
```

## 🛡️ Security Features

### 1. Protected System Roles
- Cannot delete: `super-admin`, `admin`, `user`
- Cannot modify `super-admin` role
- Prevents accidental system lockout

### 2. Validation Checks
- Cannot remove user's last role
- Cannot delete role with assigned users
- Cannot delete permission assigned to roles
- Role level hierarchy (1-100, max 99 for custom roles)

### 3. Audit Trail
- Tracks who assigned/revoked roles
- Records timestamp of role changes
- Stores IP and user agent for security events

### 4. Hierarchical Access
- Role levels prevent privilege escalation
- Admins can't modify super-admin roles
- Permission inheritance through roles

## 🎯 Best Practices

### 1. Role Assignment
- Always assign at least one role to users
- Set primary role for main user responsibility
- Use role hierarchy appropriately

### 2. Permission Design
- Follow naming convention: `{action}-{resource}`
- Keep permissions granular and specific
- Group by resource (users, transactions, etc.)

### 3. Middleware Usage
- Use `role` middleware for broad access control
- Use `permission` middleware for specific actions
- Combine middleware when needed

### 4. Custom Roles
- Create roles between levels 11-99
- Don't override system roles
- Document custom role purposes

## 🔧 Extending RBAC

### Add New Permission

```php
use App\Models\Permission;

Permission::create([
    'name' => 'Export Data',
    'slug' => 'export-data',
    'description' => 'Export system data',
    'resource' => 'data',
    'action' => 'export',
]);
```

### Create Custom Role

```php
use App\Models\Role;

$role = Role::create([
    'name' => 'Content Manager',
    'slug' => 'content-manager',
    'description' => 'Manages content',
    'level' => 40,
]);

// Assign permissions
$role->givePermissionTo(['view-users', 'create-transactions']);
```

### Assign Multiple Roles

```php
$user->syncRoles(['manager', 'moderator'], auth()->id());
```

## 📊 Testing RBAC

### Test Role Assignment

```bash
php artisan tinker

$user = App\Models\User::find(1);
$user->assignRole('admin');
$user->hasRole('admin'); // true
$user->hasPermission('view-users'); // true (through admin role)
```

### Test Middleware

```bash
# As regular user (should fail)
curl -X GET http://localhost:8000/api/roles \
  -H "Authorization: Bearer {user_token}"
# Response: 403 Forbidden

# As admin (should succeed)
curl -X GET http://localhost:8000/api/roles \
  -H "Authorization: Bearer {admin_token}"
# Response: 200 OK with roles list
```

## 🚨 Troubleshooting

### Issue: "Cannot delete role with assigned users"
**Solution:** Reassign users to different role first

```php
$users = $role->users;
foreach ($users as $user) {
    $user->removeRole($role);
    $user->assignRole('user'); // Assign default role
}
$role->delete();
```

### Issue: Middleware not working
**Solution:** Ensure middleware is registered in `Kernel.php`

```php
protected $middlewareAliases = [
    'role' => \App\Http\Middleware\CheckRole::class,
    'permission' => \App\Http\Middleware\CheckPermission::class,
];
```

### Issue: User has no default role
**Solution:** Update registration to assign default role

```php
$user->assignRole('user');
```

## 📚 Industry Standards Compliance

This RBAC implementation follows:

✅ **NIST RBAC Standard** - Core, Hierarchical, and Constrained RBAC  
✅ **Principle of Least Privilege** - Users get minimum required permissions  
✅ **Separation of Duties** - Role-based task separation  
✅ **Audit Trail** - Complete logging of permission changes  
✅ **Role Hierarchy** - Level-based access control  
✅ **Many-to-Many** - Users can have multiple roles  

## 🔒 Security Considerations

1. **Always use HTTPS** in production
2. **Rate limit** role/permission endpoints
3. **Log all RBAC changes** for audit
4. **Regular permission reviews** - Remove unused permissions
5. **Principle of least privilege** - Start with minimal permissions
6. **Role separation** - Don't mix conflicting responsibilities

## 📈 Future Enhancements

- [ ] Dynamic permission generation
- [ ] Role templates for quick setup
- [ ] Permission groups/categories
- [ ] Time-based role assignment
- [ ] Conditional permissions (context-aware)
- [ ] Role approval workflow
- [ ] Advanced audit dashboard

---

**Implementation Date:** October 24, 2025  
**Version:** 1.0  
**Standard:** NIST RBAC Compliant
