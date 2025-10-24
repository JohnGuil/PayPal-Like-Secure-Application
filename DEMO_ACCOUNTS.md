# Demo Accounts for Testing

This document lists all demo accounts available for testing the RBAC system.

## Sample Test Accounts

### 👑 Super Admin
- **Email:** `superadmin@paypal.test`
- **Password:** `SuperAdmin123!`
- **Permissions:** Full system access (23 permissions)
- **Can Access:**
  - All user management features
  - All role management features
  - System settings
  - Audit logs
  - Generate reports
  - View all transactions and logs

### 🛡️ Admin
- **Email:** `admin@paypal.test`
- **Password:** `Admin123!`
- **Permissions:** 13 permissions
- **Can Access:**
  - View and manage users
  - View roles
  - View all transactions
  - View all login logs
  - Admin dashboard
  - Account management

### 📊 Manager
- **Email:** `manager@paypal.test`
- **Password:** `Manager123!`
- **Permissions:** 7 permissions
- **Can Access:**
  - View users
  - View all transactions
  - View all login logs
  - View dashboard
  - Account management

### 👤 User
- **Email:** `user@paypal.test`
- **Password:** `User123!`
- **Permissions:** 6 permissions
- **Can Access:**
  - View own transactions
  - Create transactions
  - Manage own account
  - Enable 2FA
  - View own login logs
  - View dashboard

## Quick Login Instructions

### Via Frontend (Recommended)
1. Navigate to `http://localhost:3001/login`
2. Click on any demo account card on the right side panel
3. Credentials will auto-fill
4. Click "Sign In"

### Via API (cURL)
```bash
# Login as Super Admin
curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@paypal.test","password":"SuperAdmin123!"}'

# Login as Admin
curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@paypal.test","password":"Admin123!"}'

# Login as Manager
curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@paypal.test","password":"Manager123!"}'

# Login as User
curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@paypal.test","password":"User123!"}'
```

## Testing Role-Based Access

### Super Admin Routes
```bash
# Get roles (requires super-admin or admin)
curl -X GET http://localhost:8001/api/roles \
  -H "Authorization: Bearer YOUR_TOKEN"

# Manage permissions (requires super-admin)
curl -X GET http://localhost:8001/api/permissions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Admin Routes
```bash
# Assign role to user (requires super-admin or admin)
curl -X POST http://localhost:8001/api/roles/assign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"role_id":2}'
```

### Regular User Routes (All Roles)
```bash
# Get current user info
curl -X GET http://localhost:8001/api/user \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Permission Comparison Table

| Permission | Super Admin | Admin | Manager | User |
|-----------|------------|-------|---------|------|
| View Users | ✅ | ✅ | ✅ | ❌ |
| Create Users | ✅ | ✅ | ❌ | ❌ |
| Update Users | ✅ | ✅ | ❌ | ❌ |
| Delete Users | ✅ | ✅ | ❌ | ❌ |
| View Roles | ✅ | ✅ | ❌ | ❌ |
| Create/Update/Delete Roles | ✅ | ❌ | ❌ | ❌ |
| Assign/Revoke Roles | ✅ | ❌ | ❌ | ❌ |
| View All Transactions | ✅ | ✅ | ✅ | ❌ |
| View Own Transactions | ✅ | ✅ | ✅ | ✅ |
| Create Transactions | ✅ | ✅ | ✅ | ✅ |
| View All Login Logs | ✅ | ✅ | ✅ | ❌ |
| View Own Login Logs | ✅ | ✅ | ✅ | ✅ |
| Manage Own Account | ✅ | ✅ | ✅ | ✅ |
| Enable 2FA | ✅ | ✅ | ✅ | ✅ |
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| View Admin Dashboard | ✅ | ✅ | ❌ | ❌ |
| View System Settings | ✅ | ❌ | ❌ | ❌ |
| Update System Settings | ✅ | ❌ | ❌ | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ | ❌ |
| Generate Reports | ✅ | ❌ | ❌ | ❌ |

## Regenerating Sample Accounts

If you need to recreate the demo accounts:

```bash
docker-compose exec app php artisan db:seed --class=SampleUsersSeeder
```

## Security Notes

⚠️ **IMPORTANT:** These demo accounts are for **development and testing only**.

- **Remove before production deployment**
- All accounts use weak, predictable passwords
- Never use these credentials in a production environment
- Consider adding environment-based seeding (only in development)

## Removing Demo Accounts

To remove all demo accounts from the database:

```bash
docker-compose exec app php artisan tinker --execute="
App\Models\User::whereIn('email', [
    'superadmin@paypal.test',
    'admin@paypal.test',
    'manager@paypal.test',
    'user@paypal.test'
])->delete();
echo 'Demo accounts removed successfully!';
"
```
