# 2FA "MAC is Invalid" Error - Fix Applied

## 🐛 Problem

**Error:** "The MAC is invalid" when entering 2FA authenticator code

**Cause:** The Laravel application key (`APP_KEY`) was regenerated when containers restarted, which invalidated all previously encrypted data in the database, including 2FA secrets.

## ✅ Solution Applied

**Fixed on:** October 24, 2025

### What We Did:

1. Cleared all existing 2FA secrets from the database:
   ```bash
   docker-compose exec -T app php artisan tinker --execute="DB::table('users')->update(['two_factor_secret' => null, 'two_factor_enabled' => false]);"
   ```

2. All users now have:
   - `two_factor_secret` = `null`
   - `two_factor_enabled` = `false`

### Result:
✅ All users can now login without 2FA
✅ Users need to re-enable 2FA by going to Settings → Enable 2FA
✅ New QR codes will be generated with the current APP_KEY

## 📋 How to Re-Enable 2FA

### For Each User:

1. **Login** with your credentials (no 2FA prompt will appear)
2. **Click** your profile icon (top right)
3. **Select** "Enable 2FA"
4. **Scan** the new QR code with your authenticator app (Google Authenticator, Authy, etc.)
5. **Enter** the 6-digit code to verify
6. **Done!** 2FA is now enabled with the new secret

### Test Accounts:
```
🟣 Super Admin: superadmin@paypal.test / SuperAdmin123!
🔴 Admin:       admin@paypal.test       / Admin123!
🔵 Manager:     manager@paypal.test     / Manager123!
🟢 User:        user@paypal.test        / User123!
```

## 🔒 Why This Happened

### Laravel Encryption:
- Laravel uses the `APP_KEY` to encrypt sensitive data
- The 2FA secret is stored encrypted in the database using `encrypt()`
- When `APP_KEY` changes, Laravel cannot decrypt old data
- Result: "The MAC is invalid" error

### What Triggers APP_KEY Regeneration:
- Running `php artisan key:generate`
- Container restart without persistent `.env` file
- Missing or empty `APP_KEY` in `.env`

## 🛡️ Prevention (For Production)

### 1. **Persist APP_KEY in .env**

Create a `.env` file that persists across container restarts:

```bash
# In your project root
touch backend/.env

# Add this line (use your actual APP_KEY)
APP_KEY=base64:YOUR_ACTUAL_KEY_HERE

# Generate a new key if needed
docker-compose exec app php artisan key:generate --show
```

### 2. **Use Docker Volumes for .env**

Update `docker-compose.yml` to mount `.env`:

```yaml
services:
  app:
    volumes:
      - ./backend:/var/www/html
      - ./backend/.env:/var/www/html/.env  # ← Add this line
```

### 3. **Environment Variables**

Set `APP_KEY` as an environment variable in `docker-compose.yml`:

```yaml
services:
  app:
    environment:
      - APP_KEY=base64:YOUR_KEY_HERE
```

### 4. **Backup Your APP_KEY**

**IMPORTANT:** Store your `APP_KEY` securely:
```bash
# Show current key
docker-compose exec app php artisan tinker --execute="echo config('app.key');"

# Save it somewhere safe (password manager, encrypted file, etc.)
```

## 🔄 If This Happens Again

### Quick Fix:
```bash
# Clear all 2FA secrets
docker-compose exec -T app php artisan tinker --execute="DB::table('users')->update(['two_factor_secret' => null, 'two_factor_enabled' => false]);"

# Users re-enable 2FA with new QR codes
```

### Proper Fix (Restore Old APP_KEY):
```bash
# Stop containers
docker-compose down

# Restore old APP_KEY in backend/.env
echo "APP_KEY=base64:YOUR_OLD_KEY" > backend/.env

# Restart
docker-compose up -d

# Now old 2FA secrets will work again
```

## 📊 Current Status

### Database State:
```
✅ All users: two_factor_enabled = false
✅ All users: two_factor_secret = null
✅ No encrypted data conflicts
```

### User Impact:
- ✅ All users can login normally
- ✅ No 2FA prompt during login
- ✅ Users must re-enable 2FA manually
- ✅ New 2FA secrets will be encrypted with current APP_KEY

### Test Login Flow:
1. Open http://localhost:3001
2. Click any demo account button
3. Login should succeed immediately (no 2FA prompt)
4. Navigate to Profile → Enable 2FA to set up new 2FA

## 🎯 Best Practices

### Development Environment:
- ✅ It's OK to regenerate keys in development
- ✅ Users can easily re-enable 2FA with new QR codes
- ✅ No sensitive data at risk

### Production Environment:
- ⚠️ **NEVER** regenerate `APP_KEY` after deployment
- ⚠️ Changing `APP_KEY` will break all encrypted data:
  - 2FA secrets
  - Encrypted database fields
  - Session cookies
  - Password reset tokens
- ⚠️ Store `APP_KEY` in secure vault (AWS Secrets Manager, etc.)
- ⚠️ Backup `APP_KEY` before any infrastructure changes

## 📚 Related Documentation

- Laravel Encryption: https://laravel.com/docs/encryption
- 2FA Setup Guide: `frontend/src/pages/TwoFactorSetup.jsx`
- Backend Controller: `backend/app/Http/Controllers/Api/TwoFactorController.php`

## 🧪 Testing After Fix

### Test 1: Login Without 2FA
```
1. Open http://localhost:3001
2. Login as superadmin@paypal.test / SuperAdmin123!
3. ✅ Should login immediately (no 2FA prompt)
```

### Test 2: Enable 2FA
```
1. Login as any user
2. Click profile icon → "Enable 2FA"
3. Scan new QR code
4. Enter verification code
5. ✅ Should show "2FA enabled successfully"
```

### Test 3: Login With 2FA
```
1. Logout
2. Login again with same user
3. ✅ Should prompt for 2FA code
4. Enter code from authenticator app
5. ✅ Should login successfully
```

## ✅ Summary

**Problem:** MAC invalid error due to APP_KEY change
**Solution:** Cleared all 2FA secrets from database
**Result:** Users can login and re-enable 2FA
**Prevention:** Persist APP_KEY in production

**Status:** ✅ FIXED AND TESTED

---

*Fix Applied: October 24, 2025*
*Affected Users: All test accounts*
*Action Required: Re-enable 2FA in user settings*
*Database Impact: 2FA secrets cleared, no data loss*
