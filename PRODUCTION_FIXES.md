# 🔧 Production Readiness Fixes

This document provides step-by-step instructions to apply the recommended fixes from the System Review Report.

---

## Priority 1: Security Configuration (5 minutes)

### Fix 1: Configure Token Expiration

**File:** `backend/config/sanctum.php`

**Change Line 46:**
```php
// BEFORE
'expiration' => null,

// AFTER
'expiration' => env('SANCTUM_TOKEN_EXPIRATION', 1440), // 24 hours
```

**Add to `.env`:**
```env
SANCTUM_TOKEN_EXPIRATION=1440  # 24 hours for web, 60 for API
```

**Why:** Prevents security risk from never-expiring tokens

---

### Fix 2: Production CORS Configuration

**File:** `backend/config/cors.php`

**Change Line 19:**
```php
// BEFORE
'allowed_origins' => ['http://localhost:3000', 'http://localhost:3001', ...],

// AFTER
'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000')),
```

**Add to production `.env`:**
```env
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Why:** Restricts API access to trusted domains only

---

## Priority 2: Admin Password Fix (2 minutes)

### Option A: Update UserSeeder (Recommended)

**File:** `backend/database/seeders/UserSeeder.php`

**Find the admin user creation block and either:**

1. **Remove it entirely** (SampleUsersSeeder handles admin):
```php
// DELETE OR COMMENT OUT the admin user creation
// User::create([
//     'full_name' => 'Admin User',
//     'email' => 'admin@paypal.test',
//     ...
// ]);
```

2. **OR change password to match SampleUsersSeeder:**
```php
User::create([
    'full_name' => 'Admin User',
    'email' => 'admin@paypal.test',
    'password' => bcrypt('Admin123!'), // Changed from 'password123'
    ...
]);
```

**Then run:**
```bash
docker exec paypal_backend php artisan migrate:fresh --seed
```

### Option B: Update Login.jsx (Quick Fix)

**File:** `frontend/src/pages/Login.jsx`

**Find the Admin demo account card:**
```jsx
// BEFORE
{ 
  role: 'Admin', 
  email: 'admin@paypal.test', 
  password: 'Admin123!',
  ...
}

// AFTER
{ 
  role: 'Admin', 
  email: 'admin@paypal.test', 
  password: 'password123',  // Changed to match actual DB
  ...
}
```

**Why:** Ensures demo accounts work correctly

---

## Priority 3: HTTP Status Codes (15 minutes)

### Fix Authentication Controller

**File:** `backend/app/Http/Controllers/AuthController.php`

**Update login method to return proper HTTP codes:**

```php
public function login(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'password' => 'required'
    ]);

    // Check for account lockout
    if ($this->hasTooManyLoginAttempts($request)) {
        return response()->json([
            'message' => 'Too many login attempts. Please try again later.',
        ], 429); // Changed from 200 to 429
    }

    // Attempt login
    if (!Auth::attempt($request->only('email', 'password'))) {
        $this->incrementLoginAttempts($request);
        
        $attemptsLeft = $this->retriesLeft($request);
        
        return response()->json([
            'message' => 'The provided credentials are incorrect.',
            'attempts_remaining' => $attemptsLeft,
        ], 401); // Changed from 200 to 401
    }

    // ... rest of successful login code
    return response()->json([
        'message' => 'Login successful!',
        'token' => $token,
        'user' => $user,
    ], 200);
}
```

**Update validation error responses:**
```php
// In FormRequest classes or validation rules
return response()->json([
    'message' => 'Validation failed',
    'errors' => $validator->errors(),
], 422); // Use 422 for validation errors
```

**Why:** RESTful best practices for clear error communication

---

## Priority 4: Environment Configuration

### Production `.env` Template

Create a production-ready `.env` file:

```env
# Application
APP_NAME="PayPal-Like Secure Application"
APP_ENV=production
APP_KEY=base64:YOUR_GENERATED_KEY_HERE
APP_DEBUG=false
APP_URL=https://yourdomain.com

# Database
DB_CONNECTION=pgsql
DB_HOST=your-db-host
DB_PORT=5432
DB_DATABASE=paypal_production
DB_USERNAME=your-db-user
DB_PASSWORD=your-secure-password

# Security
SANCTUM_TOKEN_EXPIRATION=1440
SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com
SESSION_SECURE_COOKIE=true
SESSION_LIFETIME=120
SESSION_DRIVER=database

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Mail (for password resets, 2FA)
MAIL_MAILER=smtp
MAIL_HOST=your-mail-host
MAIL_PORT=587
MAIL_USERNAME=your-mail-user
MAIL_PASSWORD=your-mail-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com

# Queue (for background jobs)
QUEUE_CONNECTION=database

# Cache
CACHE_DRIVER=redis
REDIS_HOST=your-redis-host
REDIS_PASSWORD=null
REDIS_PORT=6379

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=warning
```

---

## Quick Apply Script

Run this script to apply all fixes automatically:

```bash
#!/bin/bash

cd backend

echo "Applying security fixes..."

# Fix 1: Token expiration
sed -i.bak "s/'expiration' => null,/'expiration' => env('SANCTUM_TOKEN_EXPIRATION', 1440),/" config/sanctum.php

# Fix 2: CORS configuration
sed -i.bak "s/'allowed_origins' => \[.*\],/'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http:\/\/localhost:3000')),/" config/cors.php

# Fix 3: Add to .env
echo "" >> .env
echo "# Security Configuration" >> .env
echo "SANCTUM_TOKEN_EXPIRATION=1440" >> .env
echo "CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001" >> .env

echo "✓ Security fixes applied!"
echo ""
echo "Next steps:"
echo "1. Fix admin password (choose Option A or B above)"
echo "2. Update AuthController HTTP status codes"
echo "3. Test all changes"
echo "4. Update production .env with real values"
```

---

## Testing After Fixes

### 1. Test Token Expiration
```bash
# Login and save token
TOKEN=$(curl -s -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@paypal.test","password":"password123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Test immediate access (should work)
curl -X GET http://localhost:8001/api/user \
  -H "Authorization: Bearer $TOKEN"

# Wait 24+ hours and test again (should fail)
```

### 2. Test CORS Configuration
```bash
# Should allow configured origins
curl -X GET http://localhost:8001/api/user \
  -H "Origin: http://localhost:3000" \
  -H "Authorization: Bearer $TOKEN"

# Should block unknown origins (if CORS properly configured)
curl -X GET http://localhost:8001/api/user \
  -H "Origin: http://malicious-site.com" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Test Admin Login
```bash
# After fixing password
curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@paypal.test","password":"Admin123!"}'

# Should return 200 with token
```

### 4. Test HTTP Status Codes
```bash
# Invalid credentials should return 401
curl -v -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@paypal.test","password":"wrong"}' \
  2>&1 | grep "< HTTP"

# Should see: HTTP/1.1 401 Unauthorized
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Apply all 4 priority fixes above
- [ ] Update production `.env` with real values
- [ ] Set `APP_ENV=production` and `APP_DEBUG=false`
- [ ] Generate new `APP_KEY`: `php artisan key:generate`
- [ ] Run migrations on production database
- [ ] Configure SSL/TLS certificates
- [ ] Set up automated backups
- [ ] Configure monitoring and alerting
- [ ] Test all demo accounts
- [ ] Verify RBAC permissions work correctly
- [ ] Test transaction flow end-to-end
- [ ] Enable 2FA for admin accounts
- [ ] Review and update CORS origins
- [ ] Set up log rotation
- [ ] Configure rate limiting thresholds for production traffic
- [ ] Test password reset functionality
- [ ] Verify email sending works
- [ ] Set up Redis for caching (optional but recommended)
- [ ] Configure CDN for frontend assets
- [ ] Run security scan (OWASP ZAP or similar)
- [ ] Document admin procedures
- [ ] Create runbook for common issues

---

## Security Hardening (Additional)

### 1. Add Security Headers
```php
// In backend/app/Http/Middleware/SecurityHeaders.php
public function handle($request, Closure $next)
{
    $response = $next($request);
    
    $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
    $response->headers->set('X-Content-Type-Options', 'nosniff');
    $response->headers->set('X-XSS-Protection', '1; mode=block');
    $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    return $response;
}
```

### 2. Database Connection Security
```env
# Use SSL for database connections
DB_SSLMODE=require
```

### 3. Rate Limiting Adjustments
```php
// In backend/app/Http/Kernel.php
'throttle:login' => \Illuminate\Routing\Middleware\ThrottleRequests::class.':5,1', // 5 attempts per minute
'throttle:api' => \Illuminate\Routing\Middleware\ThrottleRequests::class.':60,1', // 60 requests per minute
```

### 4. Enable Query Logging (Monitor Mode)
```php
// In production, log slow queries
DB::listen(function ($query) {
    if ($query->time > 1000) { // Queries over 1 second
        Log::warning('Slow query detected', [
            'sql' => $query->sql,
            'time' => $query->time
        ]);
    }
});
```

---

## Support & Maintenance

### Log Locations
```
Backend Logs: backend/storage/logs/laravel.log
Docker Logs: docker logs paypal_backend
PostgreSQL Logs: docker logs paypal_db
```

### Common Commands
```bash
# Clear cache
docker exec paypal_backend php artisan cache:clear
docker exec paypal_backend php artisan config:clear
docker exec paypal_backend php artisan route:clear

# Check system status
docker ps
docker exec paypal_backend php artisan about

# Database backup
docker exec paypal_db pg_dump -U paypal_user paypal_db > backup.sql
```

---

**Last Updated:** 2025-01-26  
**Estimated Time to Apply:** 30 minutes  
**Risk Level:** Low (all changes are configuration-based)  
**Rollback:** Keep backups of original config files
