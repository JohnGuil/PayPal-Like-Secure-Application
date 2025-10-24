# Navigation Layout Implementation

## Overview
This document explains the new navigation layout system with role-based access control.

## Components Created

### 1. AppLayout.jsx
Main layout wrapper that includes:
- Sidebar navigation (collapsible)
- Header with user menu
- Main content area using React Router's `<Outlet />`

### 2. Sidebar.jsx
**Permission-Based Navigation Menu**

The sidebar dynamically shows/hides menu items based on the user's permissions and roles:

#### Navigation Sections

**Main Section** (visible to all authenticated users):
- **Dashboard** - Always visible
- **Transactions** - Visible if user has `view-transactions` or `view-all-transactions`
  - Badge: "All" if can view all transactions, "Own" if only own
- **Login Logs** - Visible if user has `view-login-logs` or `view-all-login-logs`
  - Badge: "All" if can view all logs, "Own" if only own

**Management Section** (Admin+):
- **Users** - Visible if user has `view-users`
  - Badge: "Full" if has create/delete permissions, "View" otherwise
- **Roles & Permissions** - Visible if user has `view-roles`
  - Badge: "Full" if has create/delete permissions, "View" otherwise

**Administration Section** (Super Admin / Admin):
- **Admin Dashboard** - Visible if user has `view-admin-dashboard`
- **System Settings** - Visible if user has `view-system-settings` (Super Admin only)
  - Badge: "Super Admin"
- **Audit Logs** - Visible if user has `view-audit-logs` (Super Admin only)
  - Badge: "Super Admin"
- **Reports** - Visible if user has `generate-reports` (Super Admin only)
  - Badge: "Super Admin"

#### Features:
- **Role Badge Display**: Shows primary role with level indicator
- **Permission Count**: Displays number of permissions user has
- **Color-Coded Roles**: Different gradient colors for each role level
  - Purple: Super Admin
  - Red: Admin
  - Blue: Manager
  - Green: User
- **Active Route Highlighting**: Current page is highlighted in blue
- **Mobile Responsive**: Collapsible with overlay on mobile devices
- **Help Section**: Quick access to documentation

### 3. Header.jsx
**Top Navigation Bar**

Features:
- **Menu Toggle**: Hamburger button to show/hide sidebar
- **App Logo**: "SecurePay" branding
- **Notifications**: Bell icon with red badge (placeholder)
- **User Dropdown Menu**:
  - User info (name, email, mobile)
  - Role badge with level
  - 2FA status indicator (enabled/disabled)
  - Permission count
  - Profile link
  - Enable/Disable 2FA links
  - Logout button

### 4. PermissionGate.jsx
**Utility Component for Conditional Rendering**

Usage:
```jsx
import PermissionGate from '../components/PermissionGate';

// Show content only if user has permission
<PermissionGate permission="create-users">
  <button>Create User</button>
</PermissionGate>

// Show content only if user has role
<PermissionGate role="admin">
  <div>Admin Only Content</div>
</PermissionGate>

// Show fallback if check fails
<PermissionGate permission="delete-users" fallback={<p>No access</p>}>
  <button>Delete User</button>
</PermissionGate>
```

## Role-Based Menu Visibility

### Super Admin (Level 100) Sees:
✅ Dashboard
✅ Transactions (All)
✅ Login Logs (All)
✅ Users (Full)
✅ Roles & Permissions (Full)
✅ Admin Dashboard
✅ System Settings
✅ Audit Logs
✅ Reports

### Admin (Level 80) Sees:
✅ Dashboard
✅ Transactions (All)
✅ Login Logs (All)
✅ Users (Full)
✅ Roles & Permissions (View)
✅ Admin Dashboard
❌ System Settings
❌ Audit Logs
❌ Reports

### Manager (Level 50) Sees:
✅ Dashboard
✅ Transactions (All)
✅ Login Logs (All)
✅ Users (View)
❌ Roles & Permissions
❌ Admin Dashboard
❌ System Settings
❌ Audit Logs
❌ Reports

### User (Level 10) Sees:
✅ Dashboard
✅ Transactions (Own)
✅ Login Logs (Own)
❌ Users
❌ Roles & Permissions
❌ Admin Dashboard
❌ System Settings
❌ Audit Logs
❌ Reports

## Testing the Navigation

### 1. Login with Different Roles
Use the demo accounts from the login page:

```
Super Admin: superadmin@paypal.test / SuperAdmin123!
Admin: admin@paypal.test / Admin123!
Manager: manager@paypal.test / Manager123!
User: user@paypal.test / User123!
```

### 2. Verify Menu Visibility
- Each role should see different menu items
- Badges should correctly indicate "All" vs "Own" access
- Super Admin sections should only appear for super admin

### 3. Test Access Control
- Try clicking on menu items
- Verify permission checks work on each page
- Try accessing URLs directly (e.g., /users, /roles)
- Should see "Access Denied" page if insufficient permissions

### 4. Check Responsive Behavior
- Resize browser window
- Verify sidebar collapses on mobile
- Check overlay appears on mobile when sidebar is open
- Test menu toggle button

## Implementation Notes

### App.jsx Changes
Routes now use nested routing with AppLayout:

```jsx
<Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/users" element={...} />
  <Route path="/roles" element={...} />
</Route>
```

This ensures:
- All protected routes share the same layout
- Sidebar and header persist across page navigation
- User authentication is checked once at layout level
- Permission checks happen at individual route level

### Permission Checking Pattern

The sidebar uses helper functions:

```javascript
const hasPermission = (permission) => {
  return user?.permissions?.some(p => p.slug === permission);
};

const hasRole = (roleSlug) => {
  return user?.roles?.some(r => r.slug === roleSlug);
};
```

### Badge Logic

Badges show access level:
- "All" - Can view all records
- "Own" - Can only view own records
- "Full" - Has full CRUD permissions
- "View" - Can only view, not modify
- "Super Admin" - Super admin exclusive feature

## Customization

### Adding New Menu Items

1. Add to `navigationItems` array in Sidebar.jsx:
```javascript
{
  name: 'New Feature',
  path: '/new-feature',
  icon: <svg>...</svg>,
  show: hasPermission('view-new-feature'),
  badge: 'Optional Badge',
}
```

2. Add route in App.jsx:
```jsx
<Route path="/new-feature" element={
  <ProtectedRoute requiredPermission="view-new-feature">
    <NewFeature />
  </ProtectedRoute>
} />
```

### Changing Colors

Role colors are defined in `getRoleBadgeColor()` function:
```javascript
const getRoleBadgeColor = (roleSlug) => {
  switch(roleSlug) {
    case 'super-admin': return 'from-purple-500 to-purple-700';
    case 'admin': return 'from-red-500 to-red-700';
    // Add custom colors here
  }
};
```

## Next Steps

1. **Create Missing Pages**: Transactions, Login Logs, Profile, Admin Dashboard, Settings, Audit Logs, Reports
2. **Add Backend APIs**: Ensure all menu items have corresponding API endpoints
3. **Implement Search**: Add search functionality in header
4. **Add Notifications**: Implement real notification system
5. **Mobile Optimization**: Further improve mobile experience
6. **Dark Mode**: Add dark mode toggle (optional)

## Known Issues

- Profile page not yet created (menu link exists but page doesn't)
- Some menu items lead to non-existent pages (need to create them)
- Notification system is placeholder only
- Search functionality not implemented

## Security Considerations

- All permission checks happen on both frontend (UI) and backend (API)
- Frontend permission checks are for UX only (hiding buttons)
- Backend API must always verify permissions before returning data
- Never trust frontend permission checks alone
- Always use middleware on backend routes
