# 🚀 Quick Start: Testing Role-Based Navigation

## Step 1: Start the Application

```bash
# Make sure you're in the project root
cd /Users/johnkellyguillermo/IAS2/group-project/PayPal-Like-Secure-Application

# Start Docker containers
docker-compose up
```

Wait for:
- ✅ Backend: http://localhost:8001
- ✅ Frontend: http://localhost:3001
- ✅ Database: PostgreSQL on port 5433

---

## Step 2: Open the Application

Open your browser and go to: **http://localhost:3001**

You should see the login page with the demo accounts panel on the right side.

---

## Step 3: Test Each Role

### 🟣 Test 1: Super Admin (Full Access)

**Login:**
- Click the **"Super Admin"** button in the demo panel
- Or manually enter:
  - Email: `superadmin@paypal.test`
  - Password: `SuperAdmin123!`

**What You Should See:**

✅ **Sidebar Menu (10 items):**
```
MAIN
  🏠 Dashboard
  💰 Transactions [All]
  📋 Login Logs [All]

MANAGEMENT
  👥 Users [Full]
  🛡️  Roles & Permissions [Full]

ADMINISTRATION
  📊 Admin Dashboard
  ⚙️  System Settings [Super Admin]
  📝 Audit Logs [Super Admin]
  📈 Reports [Super Admin]
```

✅ **Role Badge:** Purple badge showing "Super Admin" and "Level 100"

✅ **Test Navigation:**
1. Click "Users" → Should show user management page
2. Click "Roles & Permissions" → Should show roles page with full edit access
3. All menu items should be accessible

---

### 🔴 Test 2: Admin (Management Access)

**Login:**
- Logout (click user icon in header → Logout)
- Click **"Admin"** button in demo panel
- Or use: `admin@paypal.test` / `Admin123!`

**What You Should See:**

✅ **Sidebar Menu (7 items):**
```
MAIN
  🏠 Dashboard
  💰 Transactions [All]
  📋 Login Logs [All]

MANAGEMENT
  👥 Users [Full]
  🛡️  Roles & Permissions [View]

ADMINISTRATION
  📊 Admin Dashboard
```

✅ **Role Badge:** Red badge showing "Admin" and "Level 80"

✅ **Test Access Control:**
1. Click "Roles & Permissions" → Should see roles but no delete buttons
2. Try manually going to: `http://localhost:3001/settings`
3. ✅ Should see "Access Denied" page

✅ **Verify Missing Items:**
- ❌ No "System Settings" in menu
- ❌ No "Audit Logs" in menu
- ❌ No "Reports" in menu

---

### 🔵 Test 3: Manager (View All Access)

**Login:**
- Logout
- Click **"Manager"** button in demo panel
- Or use: `manager@paypal.test` / `Manager123!`

**What You Should See:**

✅ **Sidebar Menu (4 items):**
```
MAIN
  🏠 Dashboard
  💰 Transactions [All]
  📋 Login Logs [All]

MANAGEMENT
  👥 Users [View]
```

✅ **Role Badge:** Blue badge showing "Manager" and "Level 50"

✅ **Test Access Control:**
1. Click "Users" → Should see user list but no create/delete buttons
2. Try going to: `http://localhost:3001/roles`
3. ✅ Should see "Access Denied" page

✅ **Verify Missing Items:**
- ❌ No "Roles & Permissions" in menu
- ❌ No "Administration" section

---

### 🟢 Test 4: User (Self Access Only)

**Login:**
- Logout
- Click **"User"** button in demo panel
- Or use: `user@paypal.test` / `User123!`

**What You Should See:**

✅ **Sidebar Menu (3 items only):**
```
MAIN
  🏠 Dashboard
  💰 Transactions [Own]
  📋 Login Logs [Own]
```

✅ **Role Badge:** Green badge showing "User" and "Level 10"

✅ **Test Access Control:**
1. Try going to: `http://localhost:3001/users`
2. ✅ Should see "Access Denied" page
3. Try: `http://localhost:3001/admin`
4. ✅ Should also be denied

✅ **Verify Missing Items:**
- ❌ No "Users" in menu
- ❌ No "Roles & Permissions"
- ❌ No "Management" section
- ❌ No "Administration" section

---

## Step 4: Test User Dropdown

**For any role:**

1. Click your user avatar/name in the top-right corner
2. ✅ Should see dropdown with:
   - Your full name and email
   - Role badge with level
   - 2FA status (enabled/disabled)
   - Permission count
   - "My Profile" link
   - "Enable 2FA" or "Disable 2FA" link
   - "Logout" button

3. Try clicking "Enable 2FA" (if not already enabled)
4. ✅ Should navigate to 2FA setup page

---

## Step 5: Test Mobile Responsiveness

1. Resize your browser window to mobile size (< 768px width)
   - Or press F12 → Toggle device toolbar → Select mobile device

2. ✅ Sidebar should disappear
3. ✅ Hamburger menu button (☰) should appear in header
4. Click the hamburger button
5. ✅ Sidebar should slide in from left
6. ✅ Dark overlay should appear
7. Click the overlay (dark area)
8. ✅ Sidebar should close

---

## Step 6: Test Badge Indicators

### Permission Badges on Menu Items:

**Super Admin should see:**
- Transactions **[All]** ← Can view all transactions
- Login Logs **[All]** ← Can view all logs
- Users **[Full]** ← Full CRUD access
- Roles & Permissions **[Full]** ← Full management

**Manager should see:**
- Transactions **[All]** ← Can view all transactions
- Login Logs **[All]** ← Can view all logs
- Users **[View]** ← View-only access

**User should see:**
- Transactions **[Own]** ← Can only see own transactions
- Login Logs **[Own]** ← Can only see own logs

---

## ✅ Success Checklist

After testing all 4 roles, verify:

- [ ] Super Admin sees 10 menu items
- [ ] Admin sees 7 menu items (no System Settings, Audit Logs, Reports)
- [ ] Manager sees 4 menu items (no Roles, no Administration section)
- [ ] User sees 3 menu items (only Dashboard, Transactions, Login Logs)
- [ ] Role badges show correct colors (Purple/Red/Blue/Green)
- [ ] Role badges show correct levels (100/80/50/10)
- [ ] Permission counts display correctly
- [ ] Access control works (restricted URLs show "Access Denied")
- [ ] Badges show correct access levels ("All" vs "Own", "Full" vs "View")
- [ ] User dropdown shows all info correctly
- [ ] Sidebar collapses on mobile
- [ ] All currently created pages are accessible (Dashboard, Users, Roles)

---

## 🐛 Troubleshooting

### Issue: Menu items not showing correctly
**Solution:**
```bash
# Clear browser cache: Ctrl+Shift+R or Cmd+Shift+R
# Or try incognito mode
```

### Issue: "Access Denied" on pages that should be accessible
**Solution:**
1. Logout and login again
2. Check backend is running: `curl http://localhost:8001/api/user`
3. Verify token is valid: Check browser console for 401 errors

### Issue: Sidebar stuck open/closed
**Solution:**
1. Refresh the page
2. Try clicking the hamburger button multiple times
3. Check browser console for JavaScript errors

### Issue: No demo accounts panel on login page
**Solution:**
1. Verify you're on http://localhost:3001/login
2. Clear browser cache
3. Check that `SampleUsersSeeder` was run in backend

### Issue: 404 errors when clicking menu items
**Solution:**
- This is expected! Not all pages are created yet.
- Current working pages: Dashboard, Users, Roles, 2FA pages
- Coming soon: Transactions, Login Logs, Profile, Admin Dashboard, Settings, Audit Logs, Reports

---

## 📸 Screenshots to Verify

Take screenshots to document your testing:

1. **Super Admin Sidebar** - Should show all 10 menu items
2. **Admin Sidebar** - Should show 7 items
3. **Manager Sidebar** - Should show 4 items
4. **User Sidebar** - Should show 3 items
5. **User Dropdown** - Showing role badge and 2FA status
6. **Access Denied Page** - When accessing restricted URL
7. **Mobile View** - Sidebar collapsed with hamburger menu

---

## 🎯 What to Test Next

After verifying the navigation works correctly:

1. **Test Users Page:**
   - Login as Admin or Super Admin
   - Click "Users" in sidebar
   - Try creating a new user
   - Try editing a user
   - Try deleting a user (not yourself!)

2. **Test Roles Page:**
   - Login as Super Admin
   - Click "Roles & Permissions"
   - View role cards
   - Click "Edit" on a role
   - See permission checkboxes grouped by resource

3. **Test Access Control:**
   - Login as each role
   - Try accessing different URLs directly
   - Verify appropriate access is granted/denied

---

## 📞 Need Help?

If something doesn't work as described:

1. Check browser console (F12 → Console tab) for errors
2. Check backend logs: `docker-compose logs backend`
3. Verify database has demo accounts: 
   ```bash
   docker-compose exec backend php artisan tinker
   >>> \App\Models\User::count()  // Should return 4 or more
   ```
4. Review documentation:
   - `NAVIGATION_COMPLETE.md` - Overview
   - `NAVIGATION_LAYOUT_GUIDE.md` - Technical details
   - `ROLE_NAVIGATION_COMPARISON.md` - Visual comparison

---

## 🎉 You're All Set!

If all tests pass, you now have:
✅ Working role-based navigation system
✅ Permission-based menu visibility
✅ Access control enforcement
✅ Beautiful, responsive UI
✅ Four different user experiences based on role

**Next:** Create the remaining pages (Transactions, Login Logs, Profile, etc.)

Happy testing! 🚀
