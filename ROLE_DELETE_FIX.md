# Fix: 500 Error When Deleting Roles

**Issue:** Internal Server Error (500) when attempting to delete roles  
**Affected Page:** Roles & Permissions  
**Error Location:** `RoleController.php` line 210  
**Status:** ✅ FIXED

---

## Root Cause

When attempting to delete a role, the `RoleController` calls `$role->users()->count()` to check if the role has assigned users before allowing deletion.

However, the `Role` model (which extends Spatie's `SpatieRole`) didn't have an explicit `users()` relationship method that specifies the `User` model class. This caused Spatie's polymorphic relationship to receive `NULL` as the model class parameter, resulting in a fatal error.

### Error Stack Trace
```
Call to a member function users() on null
at /var/www/app/Http/Controllers/Api/RoleController.php:210
```

The error occurred in this code:
```php
// Check if role has users
if ($role->users()->count() > 0) {
    return response()->json([
        'message' => 'Cannot delete role with assigned users.',
    ], 422);
}
```

---

## Solution

Added an explicit `users()` relationship method to the `Role` model that properly configures the polymorphic relationship with the `User` model.

### Code Changes

**File:** `backend/app/Models/Role.php`

**Added Method (Lines 61-73):**
```php
/**
 * Get all users assigned to this role.
 * Override Spatie's users() to explicitly specify the User model.
 */
public function users()
{
    return $this->morphedByMany(
        User::class,
        'model',
        'model_has_roles',
        'role_id',
        'model_id'
    );
}
```

### How It Works

The `morphedByMany` relationship defines a polymorphic many-to-many relationship:

- **`User::class`**: The model class we're relating to
- **`'model'`**: The name of the polymorphic relationship
- **`'model_has_roles'`**: The pivot table name (from Spatie Permission)
- **`'role_id'`**: Foreign key in pivot table pointing to roles
- **`'model_id'`**: Foreign key in pivot table pointing to users

This creates a proper relationship that allows us to:
- `$role->users()` - Get query builder for users with this role
- `$role->users()->count()` - Count users with this role
- `$role->users` - Get collection of users with this role

---

## Testing

### Test Case 1: Delete Role Without Users
1. Create a new custom role (e.g., "Test Role")
2. Don't assign it to any users
3. Click delete on the role
4. **Expected:** ✅ Role deleted successfully

### Test Case 2: Delete Role With Users
1. Try to delete "Data Analyst" role (if users are assigned)
2. **Expected:** ✅ Error message: "Cannot delete role with assigned users. Please reassign users first."
3. **Expected:** ✅ Shows user count

### Test Case 3: Delete System Role
1. Try to delete "Admin", "Super Admin", or "User" role
2. **Expected:** ✅ Error: "Cannot delete system role."

---

## Backend Validation Logic

The `RoleController::destroy()` method has three layers of protection:

### Layer 1: System Role Protection (Line 203)
```php
if (in_array($role->slug, ['super-admin', 'admin', 'user'])) {
    return response()->json([
        'message' => 'Cannot delete system role.',
    ], 403);
}
```

### Layer 2: Users Assignment Check (Line 210) - NOW FIXED
```php
if ($role->users()->count() > 0) {
    return response()->json([
        'message' => 'Cannot delete role with assigned users. Please reassign users first.',
        'users_count' => $role->users()->count(),
    ], 422);
}
```

### Layer 3: Delete and Audit Log (Line 218)
```php
$role->delete();

AuditLogService::log(
    'role_deleted',
    'Role',
    $role->id,
    'Role deleted: ' . $roleData['name'],
    $roleData,
    null,
    request()
);
```

---

## Database Structure

The relationship uses Spatie's permission tables:

### `model_has_roles` Table
```
+----------+------------+------------+
| role_id  | model_type | model_id   |
+----------+------------+------------+
| 1        | App\Models\User | 1    |
| 2        | App\Models\User | 2    |
| 5        | App\Models\User | 3    |
+----------+------------+------------+
```

- **role_id**: ID from `roles` table
- **model_type**: Always `'App\Models\User'` for user-role assignments
- **model_id**: ID from `users` table

---

## Why This Fix Was Needed

Spatie's Permission package uses polymorphic relationships to allow roles to be assigned to different model types (not just `User`). The default `users()` method tries to automatically determine the model class, but in this case it was returning `NULL`.

By explicitly defining the relationship in our `Role` model, we:
1. **Override** Spatie's default behavior
2. **Specify** that we want to relate to the `User` model
3. **Ensure** the relationship always works correctly

---

## Impact

✅ **Fixed:** 500 Internal Server Error when deleting roles  
✅ **Improved:** Error handling now works as designed  
✅ **Protected:** System roles cannot be deleted  
✅ **Validated:** Roles with assigned users cannot be deleted  
✅ **Maintained:** Audit logging for all role deletions  

---

## Files Modified

1. **backend/app/Models/Role.php**
   - Added `users()` relationship method
   - Explicitly defines polymorphic relationship with User model

---

## Related Issues

This fix resolves:
- ✅ 500 error when clicking delete on any role
- ✅ Unable to delete custom roles like "Data Analyst"
- ✅ Error message not displaying for role deletion failures
- ✅ Frontend showing generic "Failed to delete role" message

The frontend already had error display implemented (from previous fix), so once the backend returns proper error messages, they will be displayed correctly.

---

## Prevention

To prevent similar issues in the future:

1. **Always test** delete operations in development
2. **Check Laravel logs** (`storage/logs/laravel.log`) for detailed errors
3. **Verify relationships** when extending third-party models
4. **Add explicit relationships** when Spatie's defaults aren't sufficient
5. **Use relationship methods** like `users()` instead of direct database queries

---

**Related Documentation:**
- [USERS_ROLES_IMPROVEMENTS.md](./USERS_ROLES_IMPROVEMENTS.md) - Users & Roles page improvements
- [ROLE_MANAGEMENT_FIXES.md](./ROLE_MANAGEMENT_FIXES.md) - Role management fixes
