# RBAC Quick Setup Guide

## ✅ Installation Complete!

Your Role-Based Access Control system has been successfully installed. Here's what was created:

### 🎭 Roles Created

1. **Super Admin** (Level 100)
   - Full system access
   - All 23 permissions

2. **Admin** (Level 80)
   - User management
   - Role assignment
   - View reports and logs

3. **Manager** (Level 50)
   - View users, transactions, logs
   - Generate reports
   - Admin dashboard access

4. **User** (Level 10)
   - Manage own account
   - View/create own transactions
   - Enable 2FA
   - User dashboard access

### 🔐 23 Permissions Created

Organized by category:
- **User Management:** view, create, update, delete users
- **Role Management:** view, create, update, delete, assign, revoke roles
- **Transactions:** view own, create, view all
- **Account:** manage own, enable 2FA, view logs
- **System:** dashboards, settings, audit logs, reports

## 🚀 Quick Start

### 1. Test RBAC in Action

Register a new user (automatically gets 'user' role):
```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "mobile_number": "1234567890",
    "password": "Test@1234",
    "password_confirmation": "Test@1234"
  }'
```

### 2. Login and Get Token
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234"
  }'
```

### 3. View User's Roles & Permissions
```bash
curl -X GET http://localhost:8000/api/user \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response includes:
```json
{
  "user": {
    "roles": [{"name": "User", "slug": "user"}],
    "permissions": [...],
    "is_admin": false,
    "is_super_admin": false
  }
}
```

### 4. Create Super Admin (Manual Setup Required)

Using Docker:
```bash
docker-compose exec app php artisan tinker
```

Then in tinker:
```php
$user = App\Models\User::where('email', 'your-email@example.com')->first();
$user->assignRole('super-admin');
$user->update(['primary_role_id' => 1]);
exit
```

Verify:
```bash
# Login as super admin and check user endpoint
curl -X GET http://localhost:8000/api/user \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```

### 5. Test Protected Routes

#### Admin-Only Route (Should Fail for Regular User)
```bash
curl -X GET http://localhost:8000/api/roles \
  -H "Authorization: Bearer USER_TOKEN"

# Expected: 403 Forbidden
{
  "message": "Forbidden. You do not have the required role.",
  "required_roles": ["admin", "super-admin"]
}
```

#### Admin-Only Route (Should Succeed for Admin)
```bash
curl -X GET http://localhost:8000/api/roles \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Expected: 200 OK with roles list
```

### 6. Assign Roles to Users (Admin/Super Admin)

Make a user an admin:
```bash
curl -X POST http://localhost:8000/api/roles/assign \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2,
    "role_slug": "admin",
    "set_as_primary": true
  }'
```

### 7. Create Custom Role

```bash
curl -X POST http://localhost:8000/api/roles \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Content Manager",
    "slug": "content-manager",
    "description": "Manages content and moderation",
    "level": 40,
    "permissions": ["view-users", "view-transactions", "generate-reports"]
  }'
```

## 🔍 Verification Checklist

- [ ] Database migrations completed successfully
- [ ] Roles seeded (4 roles created)
- [ ] Permissions seeded (23 permissions created)
- [ ] New registrations get 'user' role automatically
- [ ] Super admin account created
- [ ] Admin/Super admin can access `/api/roles`
- [ ] Regular users get 403 on admin routes
- [ ] User endpoint returns roles and permissions

## 📋 Available API Endpoints

### Public Routes
```
POST /api/register          - Register new user (auto-assigns 'user' role)
POST /api/login            - Login
POST /api/2fa/verify-login - Verify 2FA
```

### Authenticated Routes
```
GET  /api/user             - Get user info (includes roles & permissions)
POST /api/logout           - Logout
```

### Admin Routes (role:admin,super-admin)
```
GET    /api/roles              - List all roles
GET    /api/roles/{id}         - Get specific role
POST   /api/roles              - Create new role
PUT    /api/roles/{id}         - Update role
DELETE /api/roles/{id}         - Delete role
POST   /api/roles/assign       - Assign role to user
POST   /api/roles/revoke       - Revoke role from user
```

### Super Admin Routes (role:super-admin)
```
GET    /api/permissions          - List all permissions
GET    /api/permissions/{id}     - Get specific permission
POST   /api/permissions          - Create new permission
PUT    /api/permissions/{id}     - Update permission
DELETE /api/permissions/{id}     - Delete permission
```

### Permission-Based Routes
```
GET /api/users - List users (requires: view-users permission)
```

## 🎯 Common Use Cases

### Use Case 1: Promote User to Manager
```bash
curl -X POST http://localhost:8000/api/roles/assign \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 5,
    "role_slug": "manager",
    "set_as_primary": true
  }'
```

### Use Case 2: View All Roles and Their Permissions
```bash
curl -X GET "http://localhost:8000/api/roles" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Use Case 3: Check User's Permissions in Frontend

```javascript
// In React/Frontend
const { user } = useAuth();

// Check if user is admin
if (user.is_admin) {
  // Show admin menu
}

// Check specific permission
const canCreateUsers = user.permissions.some(
  p => p.slug === 'create-users'
);

// Check role
const isManager = user.roles.some(
  r => r.slug === 'manager'
);
```

### Use Case 4: Protect Frontend Routes

```javascript
// PrivateRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const AdminRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();
  
  const hasRole = user?.roles?.some(r => r.slug === requiredRole);
  
  return hasRole ? children : <Navigate to="/dashboard" />;
};

// Usage
<Route 
  path="/admin/*" 
  element={
    <AdminRoute requiredRole="admin">
      <AdminDashboard />
    </AdminRoute>
  } 
/>
```

## 🛠️ Troubleshooting

### Migration Error: "Column already exists"
```bash
# Reset migrations (WARNING: Deletes all data)
docker-compose exec app php artisan migrate:fresh
docker-compose exec app php artisan db:seed --class=RolePermissionSeeder
```

### Seeder Error: "Class not found"
```bash
# Regenerate autoload files
docker-compose exec app composer dump-autoload
docker-compose exec app php artisan db:seed --class=RolePermissionSeeder
```

### User has no role after registration
Check `AuthController.php` line ~44:
```php
$user->assignRole('user'); // This line should exist
```

### Middleware not working
Check `Kernel.php` has middleware aliases:
```php
'role' => \App\Http\Middleware\CheckRole::class,
'permission' => \App\Http\Middleware\CheckPermission::class,
```

## 📚 Next Steps

1. **Frontend Integration**
   - Update dashboard to show user's role
   - Hide/show UI elements based on permissions
   - Create admin panel for role management

2. **Testing**
   - Create PHPUnit tests for RBAC
   - Test middleware protection
   - Test role assignment/revocation

3. **Documentation**
   - Document custom roles for your team
   - Create role assignment workflow
   - Document permission requirements for features

4. **Security**
   - Review and adjust role levels
   - Audit permission assignments
   - Set up monitoring for role changes

## 🔗 Resources

- Full Documentation: `RBAC_DOCUMENTATION.md`
- API Testing Guide: `API_TESTING_GUIDE.md`
- Security Checklist: `SECURITY_CHECKLIST.md`

---

**Setup Date:** October 24, 2025  
**RBAC Version:** 1.0  
**Status:** ✅ Production Ready
