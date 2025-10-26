# Quick Fix Guide - 2 Critical Issues

**Time Required:** 15 minutes  
**Difficulty:** Easy  
**Impact:** Connects 2 admin pages to real backend APIs

---

## Issue #1: Connect AuditLogs to Backend API

### File: `frontend/src/pages/AuditLogs.jsx`

### Current Code (Lines 18-60):
```javascript
const fetchAuditLogs = async () => {
  try {
    setLoading(true);
    // TODO: Replace with actual API endpoint when backend is ready
    // const response = await api.get('/audit-logs');
    // setLogs(response.data);
    
    // Mock data for now
    setLogs([
      {
        id: 1,
        admin_user: { id: 1, name: 'Super Admin', email: 'superadmin@paypal.test' },
        action: 'assigned',
        // ... 5 more hardcoded entries
      }
    ]);
    
    setLoading(false);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    setLoading(false);
  }
};
```

### ✅ Fixed Code:
```javascript
const fetchAuditLogs = async () => {
  try {
    setLoading(true);
    const response = await api.get('/audit-logs');
    
    // Handle both paginated and non-paginated responses
    const logsData = response.data.data || response.data;
    setLogs(Array.isArray(logsData) ? logsData : []);
    
    setLoading(false);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    setLogs([]); // Set empty array on error
    setLoading(false);
  }
};
```

### Testing:
1. Save the file
2. Go to Admin > Audit Logs page
3. Should see real audit log data (currently empty if no role changes made)
4. Try assigning a role to a user
5. Check Audit Logs - should see the entry

---

## Issue #2: Connect SystemSettings to Backend API

### File: `frontend/src/pages/SystemSettings.jsx`

### Current Code (Lines 50-85):
```javascript
const fetchSettings = async () => {
  try {
    setLoading(true);
    // TODO: Replace with actual API endpoint when backend is ready
    // const response = await api.get('/settings');
    // setSettings(response.data);
    
    // Using default values defined above for now
    setLoading(false);
  } catch (error) {
    console.error('Error fetching settings:', error);
    setLoading(false);
  }
};

const handleSave = async () => {
  setSaving(true);
  setMessage({ type: '', text: '' });

  try {
    // TODO: Replace with actual API endpoint when backend is ready
    // await api.put('/settings', settings);
    
    setMessage({ type: 'success', text: 'Settings saved successfully!' });
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save settings' });
  } finally {
    setSaving(false);
  }
};
```

### ✅ Fixed Code:
```javascript
const fetchSettings = async () => {
  try {
    setLoading(true);
    const response = await api.get('/settings');
    
    // Merge fetched settings with defaults
    setSettings(prevSettings => ({
      ...prevSettings,
      ...response.data
    }));
    
    setLoading(false);
  } catch (error) {
    console.error('Error fetching settings:', error);
    setMessage({ type: 'error', text: 'Failed to load settings. Using defaults.' });
    setLoading(false);
  }
};

const handleSave = async () => {
  setSaving(true);
  setMessage({ type: '', text: '' });

  try {
    await api.put('/settings', settings);
    
    setMessage({ type: 'success', text: 'Settings saved successfully!' });
    
    // Optionally refresh settings from server
    setTimeout(() => {
      fetchSettings();
    }, 1000);
  } catch (error) {
    console.error('Error saving settings:', error);
    setMessage({ 
      type: 'error', 
      text: error.response?.data?.message || 'Failed to save settings. Please try again.' 
    });
  } finally {
    setSaving(false);
  }
};
```

### Testing:
1. Save the file
2. Go to Admin > System Settings page
3. Should load current settings from database
4. Make a change (e.g., change app name)
5. Click "Save Settings"
6. Refresh page - changes should persist

---

## Issue #3: Fix Backend Hardcoded URL (Optional)

### File: `backend/app/Http/Controllers/Api/SettingsController.php`

### Current Code (Line 192):
```php
'app_url' => 'http://localhost:3001',
```

### ✅ Fixed Code:
```php
'app_url' => env('FRONTEND_URL', 'http://localhost:3001'),
```

This reads from the `.env` file and makes it configurable for production.

---

## Verification Checklist

After making all changes:

- [ ] File saved: `frontend/src/pages/AuditLogs.jsx`
- [ ] File saved: `frontend/src/pages/SystemSettings.jsx`
- [ ] File saved (optional): `backend/app/Http/Controllers/Api/SettingsController.php`
- [ ] Docker frontend container restarted (if needed): `docker-compose restart frontend`
- [ ] Browser cache cleared (Ctrl+Shift+R or Cmd+Shift+R)
- [ ] Tested Audit Logs page
- [ ] Tested System Settings page
- [ ] Verified settings persist after refresh
- [ ] No console errors

---

## Expected Behavior

### AuditLogs Page:
- **Before:** Shows 6 hardcoded sample entries
- **After:** Shows real audit log entries from database (empty initially)
- **Generates entries when:** Roles are assigned/revoked in Users page

### SystemSettings Page:
- **Before:** Shows default values, changes don't save
- **After:** Loads real settings, changes persist to database
- **Saves to:** `settings` table in PostgreSQL

---

## Rollback (If Issues Occur)

If something breaks, you can revert:

### AuditLogs rollback:
```javascript
// Replace the fetchAuditLogs function with the original mock data version
// (Found in APPLICATION_REVIEW_REPORT.md)
```

### SystemSettings rollback:
```javascript
// Add back the comments (// TODO...) 
// Comment out the api.get() and api.put() calls
```

---

## Need Help?

If you encounter any issues:

1. Check browser console for errors (F12)
2. Check backend logs: `docker-compose logs backend`
3. Verify API endpoints exist: 
   - `curl http://localhost:8001/api/audit-logs -H "Authorization: Bearer YOUR_TOKEN"`
   - `curl http://localhost:8001/api/settings -H "Authorization: Bearer YOUR_TOKEN"`
4. Make sure you're logged in as Super Admin
5. Check permissions in database

---

## Additional Notes

### Database Seeding:
If you want to see sample audit logs immediately, you can manually create entries:

```sql
-- Connect to database
docker-compose exec db psql -U paypal_user -d paypal_app

-- Insert sample audit log
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, description, ip_address, user_agent, created_at, updated_at)
VALUES (1, 'assigned', 'role', 2, 'Assigned role "Admin" to user "Bob Manager"', '127.0.0.1', 'Mozilla/5.0', NOW(), NOW());
```

### Settings Initialization:
If settings table is empty, the backend will return default values. You can seed it:

```sql
-- Insert sample settings
INSERT INTO settings (key, value, created_at, updated_at) VALUES
('app_name', 'PayPal Clone', NOW(), NOW()),
('app_url', 'https://paypal-clone.local', NOW(), NOW()),
('timezone', 'UTC', NOW(), NOW());
```

---

**Ready to proceed?** Make these changes and test! Both fixes are simple and safe. The backend APIs are fully functional and tested.
