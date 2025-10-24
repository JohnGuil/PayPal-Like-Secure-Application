# Role-Based Navigation Menu - Visual Comparison

This document shows exactly what menu items each role can see in the navigation sidebar.

## 🟣 Super Admin (Level 100)

### Sidebar Menu Items:
```
┌─ MAIN ─────────────────────────────┐
│ 🏠 Dashboard                        │
│ 💰 Transactions              [All]  │
│ 📋 Login Logs                 [All] │
└─────────────────────────────────────┘

┌─ MANAGEMENT ───────────────────────┐
│ 👥 Users                     [Full] │
│ 🛡️  Roles & Permissions      [Full] │
└─────────────────────────────────────┘

┌─ ADMINISTRATION ───────────────────┐
│ 📊 Admin Dashboard                  │
│ ⚙️  System Settings   [Super Admin] │
│ 📝 Audit Logs         [Super Admin] │
│ 📈 Reports            [Super Admin] │
└─────────────────────────────────────┘
```

### Total Menu Items: 10
### Full Access To:
- View/Create/Update/Delete Users
- View/Create/Update/Delete Roles
- Assign/Revoke Roles to Users
- Assign/Revoke Permissions to Roles
- View All Transactions
- Create Transactions
- View All Login Logs
- View/Update System Settings
- View Audit Logs
- Generate Reports
- Admin Dashboard Access

---

## 🔴 Admin (Level 80)

### Sidebar Menu Items:
```
┌─ MAIN ─────────────────────────────┐
│ 🏠 Dashboard                        │
│ 💰 Transactions              [All]  │
│ 📋 Login Logs                 [All] │
└─────────────────────────────────────┘

┌─ MANAGEMENT ───────────────────────┐
│ 👥 Users                     [Full] │
│ 🛡️  Roles & Permissions     [View]  │
└─────────────────────────────────────┘

┌─ ADMINISTRATION ───────────────────┐
│ 📊 Admin Dashboard                  │
└─────────────────────────────────────┘
```

### Total Menu Items: 7
### Full Access To:
- View/Create/Update/Delete Users
- View All Transactions
- Create Transactions
- View All Login Logs
- Admin Dashboard Access

### View-Only Access To:
- View Roles (cannot create/edit/delete)
- View Permissions (cannot assign/revoke)

### NO Access To:
- ❌ System Settings
- ❌ Audit Logs
- ❌ Reports Generation
- ❌ Role/Permission Management

---

## 🔵 Manager (Level 50)

### Sidebar Menu Items:
```
┌─ MAIN ─────────────────────────────┐
│ 🏠 Dashboard                        │
│ 💰 Transactions              [All]  │
│ 📋 Login Logs                 [All] │
└─────────────────────────────────────┘

┌─ MANAGEMENT ───────────────────────┐
│ 👥 Users                    [View]  │
└─────────────────────────────────────┘
```

### Total Menu Items: 4
### Full Access To:
- View All Transactions
- Create Transactions
- View All Login Logs

### View-Only Access To:
- View Users (cannot create/edit/delete)

### NO Access To:
- ❌ Roles & Permissions
- ❌ Administration Section
- ❌ System Settings
- ❌ Audit Logs
- ❌ Reports
- ❌ Admin Dashboard

---

## 🟢 User (Level 10)

### Sidebar Menu Items:
```
┌─ MAIN ─────────────────────────────┐
│ 🏠 Dashboard                        │
│ 💰 Transactions              [Own]  │
│ 📋 Login Logs                 [Own] │
└─────────────────────────────────────┘
```

### Total Menu Items: 3
### Access To:
- View Own Transactions
- Create Transactions
- View Own Login Logs
- Manage Own Account

### NO Access To:
- ❌ View Other Users' Data
- ❌ User Management
- ❌ Roles & Permissions
- ❌ View All Transactions
- ❌ View All Login Logs
- ❌ Administration Section
- ❌ System Settings
- ❌ Audit Logs
- ❌ Reports
- ❌ Admin Dashboard

---

## 📊 Feature Comparison Table

| Feature | Super Admin | Admin | Manager | User |
|---------|-------------|-------|---------|------|
| **Dashboard** | ✅ | ✅ | ✅ | ✅ |
| **View Own Transactions** | ✅ | ✅ | ✅ | ✅ |
| **View All Transactions** | ✅ | ✅ | ✅ | ❌ |
| **Create Transactions** | ✅ | ✅ | ✅ | ✅ |
| **View Own Login Logs** | ✅ | ✅ | ✅ | ✅ |
| **View All Login Logs** | ✅ | ✅ | ✅ | ❌ |
| **View Users** | ✅ | ✅ | ✅ | ❌ |
| **Create Users** | ✅ | ✅ | ❌ | ❌ |
| **Update Users** | ✅ | ✅ | ❌ | ❌ |
| **Delete Users** | ✅ | ✅ | ❌ | ❌ |
| **View Roles** | ✅ | ✅ | ❌ | ❌ |
| **Manage Roles** | ✅ | ❌ | ❌ | ❌ |
| **View Permissions** | ✅ | ✅ | ❌ | ❌ |
| **Manage Permissions** | ✅ | ❌ | ❌ | ❌ |
| **Assign Roles** | ✅ | ❌ | ❌ | ❌ |
| **Admin Dashboard** | ✅ | ✅ | ❌ | ❌ |
| **System Settings** | ✅ | ❌ | ❌ | ❌ |
| **Audit Logs** | ✅ | ❌ | ❌ | ❌ |
| **Generate Reports** | ✅ | ❌ | ❌ | ❌ |
| **Manage Own Account** | ✅ | ✅ | ✅ | ✅ |
| **Enable/Disable 2FA** | ✅ | ✅ | ✅ | ✅ |

---

## 🎨 Visual Role Hierarchy

```
                    ┌──────────────────┐
                    │  SUPER ADMIN     │
                    │  Level 100       │
                    │  Purple Badge    │
                    │  All Access      │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │     ADMIN        │
                    │    Level 80      │
                    │   Red Badge      │
                    │  Management +    │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │    MANAGER       │
                    │    Level 50      │
                    │   Blue Badge     │
                    │  View Access     │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │      USER        │
                    │    Level 10      │
                    │   Green Badge    │
                    │   Self Access    │
                    └──────────────────┘
```

---

## 🔐 Permission Categories by Role

### Transaction Permissions
| Permission | Super Admin | Admin | Manager | User |
|-----------|-------------|-------|---------|------|
| view-transactions | ✅ | ✅ | ✅ | ✅ |
| view-all-transactions | ✅ | ✅ | ✅ | ❌ |
| create-transactions | ✅ | ✅ | ✅ | ✅ |

### User Management Permissions
| Permission | Super Admin | Admin | Manager | User |
|-----------|-------------|-------|---------|------|
| view-users | ✅ | ✅ | ✅ | ❌ |
| create-users | ✅ | ✅ | ❌ | ❌ |
| update-users | ✅ | ✅ | ❌ | ❌ |
| delete-users | ✅ | ✅ | ❌ | ❌ |

### Role Management Permissions
| Permission | Super Admin | Admin | Manager | User |
|-----------|-------------|-------|---------|------|
| view-roles | ✅ | ✅ | ❌ | ❌ |
| create-roles | ✅ | ❌ | ❌ | ❌ |
| update-roles | ✅ | ❌ | ❌ | ❌ |
| delete-roles | ✅ | ❌ | ❌ | ❌ |
| assign-roles | ✅ | ❌ | ❌ | ❌ |
| revoke-roles | ✅ | ❌ | ❌ | ❌ |

### Permission Management
| Permission | Super Admin | Admin | Manager | User |
|-----------|-------------|-------|---------|------|
| view-permissions | ✅ | ✅ | ❌ | ❌ |
| assign-permissions | ✅ | ❌ | ❌ | ❌ |
| revoke-permissions | ✅ | ❌ | ❌ | ❌ |

### Logging & Monitoring
| Permission | Super Admin | Admin | Manager | User |
|-----------|-------------|-------|---------|------|
| view-login-logs | ✅ | ✅ | ✅ | ✅ |
| view-all-login-logs | ✅ | ✅ | ✅ | ❌ |

### System Administration (Super Admin Only)
| Permission | Super Admin | Admin | Manager | User |
|-----------|-------------|-------|---------|------|
| view-admin-dashboard | ✅ | ✅ | ❌ | ❌ |
| view-system-settings | ✅ | ❌ | ❌ | ❌ |
| update-system-settings | ✅ | ❌ | ❌ | ❌ |
| view-audit-logs | ✅ | ❌ | ❌ | ❌ |
| generate-reports | ✅ | ❌ | ❌ | ❌ |

### Account Management (All Roles)
| Permission | Super Admin | Admin | Manager | User |
|-----------|-------------|-------|---------|------|
| manage-own-account | ✅ | ✅ | ✅ | ✅ |
| enable-2fa | ✅ | ✅ | ✅ | ✅ |
| disable-2fa | ✅ | ✅ | ✅ | ✅ |

---

## 🧪 Testing Scenarios

### Scenario 1: Super Admin Testing
1. Login as `superadmin@paypal.test`
2. Check sidebar - should see all 10 menu items
3. Verify purple role badge (Level 100)
4. Click each menu item - all should be accessible
5. Check badges show "All" and "Full" access

### Scenario 2: Admin Testing
1. Login as `admin@paypal.test`
2. Check sidebar - should see 7 menu items
3. Verify red role badge (Level 80)
4. Try accessing `/settings` directly - should see "Access Denied"
5. Check Roles page - should see roles but no create/delete buttons

### Scenario 3: Manager Testing
1. Login as `manager@paypal.test`
2. Check sidebar - should see only 4 menu items
3. Verify blue role badge (Level 50)
4. Try accessing `/roles` directly - should see "Access Denied"
5. Users page should show users but no action buttons

### Scenario 4: User Testing
1. Login as `user@paypal.test`
2. Check sidebar - should see only 3 menu items
3. Verify green role badge (Level 10)
4. Try accessing `/users` directly - should see "Access Denied"
5. Transactions/Logs should only show own records

### Scenario 5: Cross-Role Navigation
1. Login as User
2. Manually navigate to `/admin` in browser
3. Should be redirected to "Access Denied" page
4. Logout and login as Super Admin
5. Navigate to `/admin` - should work

---

## 📱 Mobile View Behavior

All roles see the same mobile behavior:
- Sidebar collapses into hamburger menu
- Overlay appears when sidebar is open
- Menu items remain permission-filtered
- User dropdown still accessible
- Role badge remains visible

---

## 🎯 Quick Reference

### Test Accounts
```
🟣 Super Admin: superadmin@paypal.test / SuperAdmin123!
🔴 Admin:       admin@paypal.test       / Admin123!
🔵 Manager:     manager@paypal.test     / Manager123!
🟢 User:        user@paypal.test        / User123!
```

### Permission Hierarchy
```
Super Admin (23 permissions) > Admin (15 permissions) > Manager (6 permissions) > User (4 permissions)
```

### Menu Item Count by Role
- Super Admin: 10 items
- Admin: 7 items  
- Manager: 4 items
- User: 3 items

---

## 🔍 Troubleshooting

**Q: I can see a menu item but get "Access Denied" when clicking it**
- This means the frontend permission check passed but the backend denied access
- Contact administrator to verify your permissions are correctly synced

**Q: Menu items are missing**
- Clear browser cache and refresh
- Verify you're logged in with the correct account
- Check that backend API is returning user permissions correctly

**Q: Badge shows wrong access level (e.g., "View" but I can delete)**
- This is a frontend display issue only
- Backend still enforces correct permissions
- Report to administrator

**Q: Sidebar won't close on mobile**
- Try clicking the overlay (dark area outside sidebar)
- Try clicking the hamburger menu button again
- Refresh the page if issue persists
