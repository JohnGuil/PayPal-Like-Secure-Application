# Security Testing Guide
**PayPal-Like Secure Application**  
**Step-by-Step Verification Instructions for Reviewers**

---

## 📋 Overview

This guide provides detailed, step-by-step instructions for reviewers to verify each security requirement in the Security Checklist. Each test includes multiple verification methods using:

1. 🌐 **Browser DevTools** (Inspect Element, Network, Console, Application tabs)
2. 🗄️ **Database Inspection** (PostgreSQL queries)
3. 💻 **Code Review** (VS Code file locations)

---

## 🚀 Prerequisites

### Environment Setup
```bash
# 1. Start the application
docker compose up -d

# 2. Verify all services are running
docker compose ps

# Expected output:
# - paypal_backend (port 8000)
# - paypal_frontend (port 3000)
# - paypal_db (port 5432)

# 3. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/api
```

### Test Accounts
```
Regular User:
  Email: user@paypal.test
  Password: User123!
  2FA: Disabled by default

Admin User:
  Email: admin@paypal.test
  Password: Admin123!
  2FA: Can be enabled during testing
```

---

## 1️⃣ Authentication Security (20 points)

### 1.1 Password Hashing ✅ [5 points]

#### Test Method 1: Database Inspection
```bash
# Connect to database
docker exec -it paypal_db psql -U paypal_user -d paypal_app

# Query to check password hashing
SELECT id, email, LEFT(password, 10) as password_hash, LENGTH(password) as hash_length 
FROM users LIMIT 3;

# Expected output:
# - password_hash should start with "$2y$" (bcrypt identifier)
# - hash_length should be 60 characters
# - NO plaintext passwords visible
```

**Evidence Screenshot:** Take screenshot of query results

#### Test Method 2: Code Review in VS Code
```
File: backend/app/Models/User.php
Line: 63

Look for:
protected function casts(): array
{
    return [
        'password' => 'hashed',  // ← This ensures bcrypt hashing
    ];
}
```

**✅ Pass Criteria:**
- [ ] Passwords in database are hashed (start with $2y$)
- [ ] Password length is exactly 60 characters
- [ ] Code shows 'password' => 'hashed' cast
- [ ] No plaintext passwords found anywhere

---

### 1.2 CSRF Protection ✅ [5 points]

#### Test Method 1: Browser DevTools - Network Tab
```
1. Open http://localhost:3000/login
2. Open DevTools (F12) → Network tab
3. Filter: Fetch/XHR
4. Attempt login with user@paypal.test / User123!

5. Check requests:
   a) First request: GET /sanctum/csrf-cookie
      - Status: 204 No Content
      - Response Headers → Set-Cookie:
        * XSRF-TOKEN=... (see the encrypted token)
        * paypal_like_secure_app_session=...
   
   b) Second request: POST /api/login
      - Request Headers → Should include:
        * X-XSRF-TOKEN: [decrypted token value]
        * Cookie: XSRF-TOKEN=...; session=...
```

**Evidence Screenshots:**
- Screenshot 1: CSRF cookie request with 204 status
- Screenshot 2: Login request showing X-XSRF-TOKEN header

#### Test Method 2: Browser DevTools - Application Tab
```
1. After login attempt, go to DevTools → Application tab
2. Expand "Cookies" → http://localhost:3000
3. Verify cookies exist:
   - XSRF-TOKEN (HttpOnly: No, Secure: No [dev mode])
   - paypal_like_secure_app_session (HttpOnly: Yes)
```

**Evidence Screenshot:** Cookies panel showing both cookies

#### Test Method 3: Code Review
```
Frontend:
- File: frontend/src/services/authService.js
  Lines: 7-15 (getCsrfCookie method)
  
- File: frontend/src/services/api.js
  Lines: 12-20 (getCookie helper)
  Lines: 26-31 (XSRF-TOKEN header extraction)

Backend:
- File: backend/app/Http/Kernel.php
  Line: 38 (EnsureFrontendRequestsAreStateful middleware)
  
- File: backend/.env
  SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000
```

#### Test Method 4: Manual CSRF Test (Advanced)
```bash
# Test without CSRF token (should fail)
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"user@paypal.test","password":"User123!"}'

# Expected: Should work with bearer token but CSRF validates for stateful requests

# Test with CSRF token (should succeed)
# 1. Get CSRF cookie
curl -c cookies.txt http://localhost:8000/sanctum/csrf-cookie

# 2. Extract and use token
curl -X POST http://localhost:8000/api/login \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"email":"user@paypal.test","password":"User123!"}'
```

**✅ Pass Criteria:**
- [ ] CSRF cookie endpoint returns 204
- [ ] XSRF-TOKEN cookie is set
- [ ] X-XSRF-TOKEN header present in login request
- [ ] Code shows CSRF middleware enabled
- [ ] Login succeeds with CSRF protection

---

### 1.3 Rate Limiting ✅ [5 points]

#### Test Method 1: Browser Console - Manual Testing
```
1. Open http://localhost:3000/login
2. Open DevTools → Console tab
3. Attempt login with WRONG password 6+ times rapidly
4. Watch Network tab for responses

Expected after 5 attempts:
- Status: 429 Too Many Requests
- Response: "Too many login attempts. Please try again later."
```

**Evidence Screenshot:** 429 error response

#### Test Method 2: Command Line - Automated Testing
```bash
# Rapid fire login attempts
for i in {1..7}; do
  echo "Attempt $i:"
  curl -s -o /dev/null -w "Status: %{http_code}\n" \
    -X POST http://localhost:8000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"user@paypal.test","password":"wrong"}'
  sleep 1
done

# Expected output:
# Attempts 1-5: Status: 401 (Unauthorized)
# Attempts 6+: Status: 429 (Too Many Requests)
```

#### Test Method 3: Code Review
```
File: backend/routes/api.php
Lines: 26-28

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:login');  // ← Rate limiting middleware

File: backend/app/Http/Kernel.php
Line: 40

'api' => [
    \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
],
```

**✅ Pass Criteria:**
- [ ] First 5 login attempts return 401 (wrong password)
- [ ] 6th+ attempts return 429 (rate limited)
- [ ] Code shows 'throttle:login' middleware
- [ ] Rate limiting applies to /register and /2fa/verify-login too

---

### 1.4 Password Validation ✅ [5 points]

#### Test Method 1: Browser - Registration Form
```
1. Navigate to http://localhost:3000/register
2. Try these passwords and observe validation:

Test Case 1: Too short
  Password: "Test1!"
  Expected: "Password must be at least 8 characters long."

Test Case 2: No uppercase
  Password: "test123!"
  Expected: "Password must contain both uppercase and lowercase letters."

Test Case 3: No lowercase
  Password: "TEST123!"
  Expected: "Password must contain both uppercase and lowercase letters."

Test Case 4: No numbers
  Password: "TestTest!"
  Expected: "Password must contain at least one number."

Test Case 5: No symbols
  Password: "TestTest123"
  Expected: "Password must contain at least one special character."

Test Case 6: Valid password
  Password: "Test123!"
  Expected: ✅ Accepted
```

**Evidence Screenshots:** 
- Screenshot each validation error message
- Screenshot successful registration with valid password

#### Test Method 2: API Testing
```bash
# Test weak password via API
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "mobile_number": "1234567890",
    "password": "weak",
    "password_confirmation": "weak"
  }'

# Expected response:
{
  "message": "The password field must be at least 8 characters.",
  "errors": {
    "password": [
      "The password field must be at least 8 characters.",
      "The password field must contain at least one uppercase...",
      ...
    ]
  }
}
```

#### Test Method 3: Code Review
```
File: backend/app/Http/Controllers/Api/AuthController.php
Lines: 38-42

'password' => ['required', 'confirmed', Password::min(8)
    ->mixedCase()    // ← Requires upper AND lower case
    ->numbers()      // ← Requires at least one number
    ->symbols()],    // ← Requires at least one special character
```

**✅ Pass Criteria:**
- [ ] Minimum 8 characters enforced
- [ ] Mixed case (upper + lower) required
- [ ] At least one number required
- [ ] At least one special character required
- [ ] Clear error messages displayed
- [ ] Both frontend and backend validation present

---

## 2️⃣ Two-Factor Authentication (25 points)

### 2.1 2FA Setup ✅ [5 points]

#### Test Method 1: Browser - Full Setup Flow
```
1. Login as user@paypal.test / User123!
2. Navigate to Profile → Two-Factor Authentication
3. Click "Enable 2FA"
4. Observe:
   - QR code appears (SVG image)
   - Secret key displayed (Base32 format, e.g., JBSWY3DPEHPK...)
   - Can copy secret manually
5. Scan QR with authenticator app (Google Authenticator, Authy, etc.)
6. Enter 6-digit code
7. Verify 2FA is enabled
```

**Evidence Screenshots:**
- QR code display
- Secret key visible
- Confirmation message "2FA enabled successfully"

#### Test Method 2: Database Verification
```sql
-- Connect to database
docker exec -it paypal_db psql -U paypal_user -d paypal_app

-- Check 2FA secret storage
SELECT 
    id, 
    email, 
    two_factor_enabled, 
    LEFT(two_factor_secret, 20) as secret_encrypted,
    LENGTH(two_factor_secret) as secret_length
FROM users 
WHERE email = 'user@paypal.test';

-- Expected:
-- two_factor_enabled: true
-- secret_encrypted: eyJpdiI6... (encrypted, NOT plaintext)
-- secret_length: >100 (encrypted string is long)
```

**Evidence Screenshot:** Database query showing encrypted secret

#### Test Method 3: Code Review
```
File: backend/app/Http/Controllers/Api/TwoFactorController.php
Lines: 30-60 (setup method)

Key points:
- Line 34: $secret = $this->google2fa->generateSecretKey();
- Line 39: 'two_factor_secret' => encrypt($secret),  // ← Encryption
- Lines 42-53: QR code generation with BaconQrCode
```

**✅ Pass Criteria:**
- [ ] QR code displays correctly
- [ ] Secret key shown in Base32 format
- [ ] Secret can be manually entered
- [ ] Database stores encrypted secret
- [ ] 2FA status updates in database

---

### 2.2 TOTP Code Verification ✅ [5 points]

#### Test Method 1: Browser - Code Testing
```
1. Enable 2FA (if not already enabled)
2. Test valid code:
   - Get current 6-digit code from authenticator app
   - Enter code in verification field
   - Expected: "2FA enabled successfully!" ✅

3. Test invalid code:
   - Enter random 6-digit code (e.g., 123456)
   - Expected: "Invalid 2FA code" ❌

4. Test expired code:
   - Wait for code to expire (codes change every 30 seconds)
   - Enter old code
   - Expected: "Invalid 2FA code" ❌

5. Test code reuse:
   - Use a valid code to login
   - Try using the same code again immediately
   - Expected: Should fail (codes are time-based)
```

**Evidence Screenshots:**
- Valid code acceptance
- Invalid code rejection
- Error messages

#### Test Method 2: Code Review
```
File: backend/app/Http/Controllers/Api/TwoFactorController.php
Lines: 75-95 (verify method)

Key validation:
- Line 81: $secret = decrypt($user->two_factor_secret);
- Line 84: $valid = $this->google2fa->verifyKey($secret, $request->code);
- Time window: 30 seconds (Google2FA library default)
```

**✅ Pass Criteria:**
- [ ] Valid codes accepted
- [ ] Invalid codes rejected
- [ ] Expired codes rejected (30-second window)
- [ ] Clear error messages displayed
- [ ] Code verification uses Google2FA library

---

### 2.3 Login with 2FA ✅ [5 points]

#### Test Method 1: Browser - Login Flow
```
1. Logout if logged in
2. Navigate to http://localhost:3000/login
3. Enter credentials for 2FA-enabled account:
   Email: user@paypal.test
   Password: User123!
4. Click "Sign In"
5. Observe:
   - Redirected to 2FA verification page (NOT logged in yet)
   - Page shows "Enter your 6-digit authentication code"
   - User ID stored in session for 2FA verification
6. Enter code from authenticator app
7. Verify:
   - Successfully logged in after code verification
   - Dashboard accessible
```

**Evidence Screenshots:**
- 2FA verification page after password login
- Successful login after code entry

#### Test Method 2: Network Tab Analysis
```
1. Open DevTools → Network tab
2. Clear network log
3. Login with 2FA-enabled account

Request sequence:
1. POST /api/login
   Response: {
     "requires_2fa": true,
     "user_id": 4
   }
   
2. POST /api/2fa/verify-login
   Body: { "user_id": 4, "code": "123456" }
   Response: {
     "message": "2FA verification successful!",
     "token": "37|...",
     "user": {...}
   }
```

**Evidence Screenshot:** Network tab showing two-step authentication

#### Test Method 3: Code Review
```
File: backend/app/Http/Controllers/Api/AuthController.php
Lines: 140-148

// Check if user has 2FA enabled
if ($user->two_factor_enabled) {
    return response()->json([
        'requires_2fa' => true,
        'user_id' => $user->id,
        'message' => 'Please enter your 2FA code.',
    ], 200);
}

// Token only issued AFTER 2FA verification
```

**✅ Pass Criteria:**
- [ ] Password login returns requires_2fa flag
- [ ] User NOT logged in after password (no token yet)
- [ ] 2FA verification page displays
- [ ] Token issued only after code verification
- [ ] Full authentication requires both password AND code

---

### 2.4 Disable 2FA Protection ✅ [5 points]

#### Test Method 1: Browser - Disable Flow
```
1. Login with 2FA-enabled account
2. Navigate to Profile → Two-Factor Authentication
3. See "2FA is currently enabled" status
4. Click "Disable 2FA"
5. Attempt to disable without password:
   - Leave password field empty
   - Click "Disable"
   - Expected: "Password is required" error ❌

6. Attempt with wrong password:
   - Enter incorrect password
   - Click "Disable"
   - Expected: "The provided password is incorrect" ❌

7. Disable with correct password:
   - Enter correct password
   - Click "Disable"
   - Expected: "2FA has been successfully disabled!" ✅
   - Status changes to "2FA is currently disabled"
```

**Evidence Screenshots:**
- Password requirement error
- Wrong password error
- Successful disable confirmation
- 2FA status update

#### Test Method 2: Database Verification
```sql
-- Before disabling
SELECT id, email, two_factor_enabled, two_factor_secret 
FROM users WHERE email = 'user@paypal.test';
-- two_factor_enabled: true
-- two_factor_secret: encrypted value

-- After disabling
SELECT id, email, two_factor_enabled, two_factor_secret 
FROM users WHERE email = 'user@paypal.test';
-- two_factor_enabled: false
-- two_factor_secret: NULL
```

**Evidence Screenshots:** Before and after database states

#### Test Method 3: Code Review
```
File: backend/app/Http/Controllers/Api/TwoFactorController.php
Lines: 214-226 (disable method)

Key security:
- Line 216: $request->validate(['password' => ['required']]);
- Lines 221-224: Password verification with Hash::check()
- Line 229-232: Only then disable 2FA
```

**✅ Pass Criteria:**
- [ ] Password required to disable 2FA
- [ ] Wrong password rejected
- [ ] Correct password allows disable
- [ ] Database updates correctly
- [ ] 2FA secret cleared from database

---

### 2.5 Secret Storage ✅ [5 points]

#### Test Method 1: Database Inspection
```sql
-- Connect to database
docker exec -it paypal_db psql -U paypal_user -d paypal_app

-- Check secret storage format
SELECT 
    id,
    email,
    two_factor_enabled,
    two_factor_secret
FROM users 
WHERE two_factor_enabled = true
LIMIT 3;

-- Expected format:
-- two_factor_secret: 
--   eyJpdiI6IjBtRzJuM3RYZW5... (long encrypted string)
--   NOT a plaintext Base32 string like "JBSWY3DPEHPK..."
```

**Evidence Screenshot:** Database showing encrypted secrets

#### Test Method 2: Encryption Verification
```sql
-- Try to decrypt manually (should be impossible without APP_KEY)
-- The encrypted value format: {"iv":"...","value":"...","mac":"...","tag":""}

-- Check APP_KEY exists
docker exec paypal_backend cat /var/www/html/.env | grep APP_KEY
-- APP_KEY should be present (used for encryption)
```

#### Test Method 3: Code Review
```
Encryption (setup):
File: backend/app/Http/Controllers/Api/TwoFactorController.php
Line 39: 'two_factor_secret' => encrypt($secret),

Decryption (verify):
File: backend/app/Http/Controllers/Api/TwoFactorController.php
Line 81: $secret = decrypt($user->two_factor_secret);
Line 132: $secret = decrypt($user->two_factor_secret);

Encryption uses Laravel's encrypt() helper:
- Uses APP_KEY from .env
- AES-256-CBC encryption
- Authenticated with HMAC
```

**✅ Pass Criteria:**
- [ ] Secrets stored as encrypted JSON
- [ ] Not plaintext Base32 strings in database
- [ ] encrypt() function used in code
- [ ] decrypt() function used when needed
- [ ] APP_KEY exists in .env file

---

## 3️⃣ Session and Token Management (15 points)

### 3.1 Sanctum Implementation ✅ [4 points]

#### Test Method 1: Code Review
```
Composer dependency:
File: backend/composer.json
Search for: "laravel/sanctum"

Configuration:
File: backend/config/sanctum.php
Check: stateful domains, expiration settings

Model trait:
File: backend/app/Models/User.php
Line 13: use Laravel\Sanctum\HasApiTokens;
```

#### Test Method 2: Database - Token Storage
```sql
-- Check personal access tokens table
docker exec -it paypal_db psql -U paypal_user -d paypal_app

\d personal_access_tokens;

-- Check active tokens
SELECT id, tokenable_id, name, LEFT(token, 10) as token_hash, 
       created_at, last_used_at
FROM personal_access_tokens
WHERE tokenable_type = 'App\\Models\\User'
LIMIT 5;
```

**Evidence Screenshot:** Tokens table structure and data

#### Test Method 3: API Request with Token
```bash
# Login to get token
TOKEN=$(curl -s -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@paypal.test","password":"User123!"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Use token to access protected endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/user

# Expected: User data returned ✅
```

**✅ Pass Criteria:**
- [ ] laravel/sanctum in composer.json
- [ ] HasApiTokens trait in User model
- [ ] personal_access_tokens table exists
- [ ] Tokens work for authentication

---

### 3.2 Logout Functionality ✅ [4 points]

#### Test Method 1: Browser Testing
```
1. Login to application
2. Open DevTools → Application → Local Storage
3. Verify token exists in localStorage:
   - Key: auth_token
   - Value: [long token string]
4. Note any protected page (e.g., Dashboard URL)
5. Click "Logout" button
6. Verify:
   - Redirected to login page
   - localStorage.auth_token is cleared
7. Try accessing protected page directly (paste Dashboard URL)
8. Expected: Redirected back to login (token invalid)
```

**Evidence Screenshots:**
- localStorage before logout (token visible)
- localStorage after logout (token cleared)
- Redirect to login when accessing protected route

#### Test Method 2: API Testing
```bash
# 1. Login and save token
TOKEN=$(curl -s -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@paypal.test","password":"User123!"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. Verify token works
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/user
# Expected: User data ✅

# 3. Logout
curl -X POST http://localhost:8000/api/logout \
  -H "Authorization: Bearer $TOKEN"
# Expected: {"message":"Logout successful!"}

# 4. Try using same token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/user
# Expected: 401 Unauthorized ❌
```

#### Test Method 3: Database Verification
```sql
-- Check token count before logout
SELECT COUNT(*) FROM personal_access_tokens 
WHERE tokenable_id = 4;  -- user ID

-- After logout, token should be deleted
SELECT COUNT(*) FROM personal_access_tokens 
WHERE tokenable_id = 4;
-- Count should decrease by 1
```

#### Test Method 4: Code Review
```
File: backend/app/Http/Controllers/Api/AuthController.php
Line 284: $request->user()->currentAccessToken()->delete();

File: frontend/src/services/authService.js
Lines: 56-62 (logout method):
- Calls /api/logout endpoint
- Clears localStorage tokens
- Navigates to login page
```

**✅ Pass Criteria:**
- [ ] Logout button works
- [ ] Token deleted from database
- [ ] localStorage cleared
- [ ] Token no longer valid after logout
- [ ] Redirect to login page

---

### 3.3 Token Security ✅ [3 points]

#### Test Method 1: Browser Console Check
```
1. Open http://localhost:3000/login
2. Open DevTools → Console tab
3. Clear console
4. Login with valid credentials
5. Check console output

Expected: ✅
- NO console.log() of token visible
- NO token printed to console
- Token stored directly in localStorage only

Not Expected: ❌
- console.log("Token:", token)
- Token visible in console messages
```

**Evidence Screenshot:** Clean console (no token exposure)

#### Test Method 2: Network Tab Inspection
```
1. Open DevTools → Network tab
2. Login
3. Find POST /api/login request
4. Check Response tab:
   - Token IS visible here (this is OK, it's the response)
5. Check other requests:
   - Token sent in Authorization header (this is OK)
   - Token NOT in URL parameters
   - Token NOT in query strings
```

#### Test Method 3: Code Review
```
File: frontend/src/services/authService.js
Lines: 26-42 (login method)

Check for:
✅ localStorage.setItem('auth_token', token);
❌ NO console.log(token)
❌ NO alert(token)
❌ NO token in window object
```

**✅ Pass Criteria:**
- [ ] No console.log() of tokens in code
- [ ] Token not exposed in console
- [ ] Token stored only in localStorage
- [ ] Token transmitted securely (headers, not URL)

---

### 3.4 Token Expiration ✅ [4 points]

#### Test Method 1: Browser - Expired Token Test
```
1. Login to application
2. Get token from localStorage (DevTools → Application → Local Storage)
3. Open DevTools → Console
4. Manually expire the token (simulate):
   - Backend: Revoke token from database, OR
   - Frontend: Modify token to invalid value:
     localStorage.setItem('auth_token', 'invalid_token_123')
5. Try accessing protected page (e.g., Dashboard)
6. Expected:
   - Request returns 401 Unauthorized
   - Automatically redirected to login page
   - localStorage cleared
```

**Evidence Screenshot:** 
- 401 error in Network tab
- Automatic redirect to login

#### Test Method 2: Code Review - Error Interceptor
```
File: frontend/src/services/api.js
Lines: 37-47 (response interceptor)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';  // ← Auto redirect
    }
    return Promise.reject(error);
  }
);
```

**✅ Pass Criteria:**
- [ ] 401 errors trigger auto-logout
- [ ] localStorage cleared on 401
- [ ] Automatic redirect to login
- [ ] Response interceptor handles 401 globally

---

## 4️⃣ Input Validation (15 points)

### 4.1 Backend Validation ✅ [4 points]

#### Test Method 1: API Testing - Invalid Data
```bash
# Test 1: Missing required fields
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 422 Unprocessable Entity
# Response lists all validation errors

# Test 2: Invalid email format
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test",
    "email": "not-an-email",
    "mobile_number": "123",
    "password": "Test123!",
    "password_confirmation": "Test123!"
  }'

# Expected: Email validation error

# Test 3: Password mismatch
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test",
    "email": "test@test.com",
    "mobile_number": "123",
    "password": "Test123!",
    "password_confirmation": "Different123!"
  }'

# Expected: Password confirmation error
```

**Evidence Screenshots:** Validation error responses

#### Test Method 2: Code Review - Controllers
```
Check these files:
1. backend/app/Http/Controllers/Api/AuthController.php
   - Lines 35-42: register validation
   - Lines 68-70: login validation

2. backend/app/Http/Controllers/Api/TwoFactorController.php
   - Lines 216: disable 2FA validation
   
3. backend/app/Http/Controllers/Api/TransactionController.php
   - Validation in store() method

Pattern to look for:
$validated = $request->validate([...]);
```

**✅ Pass Criteria:**
- [ ] All endpoints use $request->validate()
- [ ] Invalid data returns 422 status
- [ ] Clear validation error messages
- [ ] Required fields enforced

---

### 4.2 Frontend Validation ✅ [4 points]

#### Test Method 1: Browser - Form Testing
```
Test Registration Form:
1. Go to http://localhost:3000/register
2. Try submitting empty form
   - All fields show "required" indicators

3. Try invalid email (e.g., "test")
   - Email field shows error styling
   - HTML5 validation message appears

4. Try mismatched passwords
   - Frontend shows error message

5. Check HTML attributes in DevTools:
   <input 
     type="email"     ← Type restriction
     required         ← Required field
     minlength="8"    ← Length validation
   />
```

**Evidence Screenshots:**
- Required field indicators
- Type validation (email, password)
- Error styling on fields

#### Test Method 2: Code Review
```
Files to check:
1. frontend/src/pages/Login.jsx
   - Lines 95-99: Email input with type="email", required
   - Lines 107-115: Password input with type="password", required

2. frontend/src/pages/Register.jsx
   - Form inputs with validation attributes
   - Error state handling

Look for:
- type="email"
- type="password"
- required attribute
- pattern attribute (if any)
- Error message displays
```

**✅ Pass Criteria:**
- [ ] Input type restrictions (email, password)
- [ ] Required attributes present
- [ ] Client-side validation works
- [ ] Error messages displayed clearly
- [ ] Form submission blocked if invalid

---

### 4.3 SQL Injection Prevention ✅ [4 points]

#### Test Method 1: Code Review - No Raw SQL
```bash
# Search for raw SQL queries
cd backend
grep -r "DB::raw" app/
grep -r "DB::select" app/
grep -r "DB::statement" app/
grep -r "->raw(" app/

# Expected: Should find NONE or very few (if any, they should be safe)
```

#### Test Method 2: Code Review - Eloquent ORM Usage
```
Check files:
1. backend/app/Http/Controllers/Api/AuthController.php
   - Line 51: User::create([...])  ← Eloquent
   - Line 73: User::where('email', $request->email)->first()  ← Eloquent

2. backend/app/Models/User.php
   - Eloquent model with $fillable protection

Pattern to verify:
✅ Model::where(...)
✅ Model::create(...)
✅ Model::find(...)
❌ NO: "SELECT * FROM users WHERE email = '" . $email . "'"
```

#### Test Method 3: Manual SQL Injection Test
```bash
# Try SQL injection in login
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@paypal.test OR 1=1--",
    "password": "anything"
  }'

# Expected: 401 Unauthorized (not SQL error)
# The injection attempt should be treated as literal string
```

**✅ Pass Criteria:**
- [ ] No raw SQL queries in code
- [ ] Eloquent ORM used throughout
- [ ] SQL injection attempts fail safely
- [ ] Parameterized queries via ORM
- [ ] $fillable protection on models

---

### 4.4 XSS Protection ✅ [3 points]

#### Test Method 1: Browser - Script Injection Test
```
Test in Registration Form:
1. Go to http://localhost:3000/register
2. Try to register with XSS in name:
   Full Name: <script>alert('XSS')</script>
   Email: xss@test.com
   Password: Test123!

3. After registration, check profile/dashboard where name displays

Expected:
- Script tag should be escaped/encoded
- Should display: &lt;script&gt;alert('XSS')&lt;/script&gt;
- NO alert popup appears ✅

Test in Login:
1. Try entering <img src=x onerror=alert('XSS')> in email field
2. Expected: Treated as literal text, no script execution
```

**Evidence Screenshot:** Script tags displayed as text (not executed)

#### Test Method 2: Database Check
```sql
-- Check if script is stored (it might be, but won't execute on display)
SELECT full_name FROM users 
WHERE email = 'xss@test.com';

-- Even if stored as <script>..., React won't execute it
```

#### Test Method 3: Code Review
```
React Auto-escaping:
File: frontend/src/pages/Dashboard.jsx (or any component)

Check for:
✅ {user.full_name}  ← Automatically escaped by React
✅ {user.email}      ← Safe
❌ dangerouslySetInnerHTML  ← Should NOT be used (or very rarely with sanitization)

Laravel Blade (if any):
✅ {{ $user->name }}  ← Escaped
❌ {!! $user->name !!}  ← Unescaped (should be avoided)
```

**✅ Pass Criteria:**
- [ ] React auto-escapes JSX expressions
- [ ] Script tags display as text
- [ ] No dangerouslySetInnerHTML without sanitization
- [ ] XSS attempts fail
- [ ] User input never executed as code

---

## 5️⃣ Secure Configuration (10 points)

### 5.1 Environment Variables ✅ [3 points]

#### Test Method 1: File System Check
```bash
# Check .env.example exists
ls -la backend/.env.example
ls -la frontend/.env.example

# View example files (should have NO real secrets)
cat backend/.env.example
cat frontend/.env.example

# Check actual .env files (should exist but not in git)
ls -la backend/.env
ls -la frontend/.env
```

**Evidence Screenshots:** 
- .env.example files exist
- .env files exist locally

#### Test Method 2: Code Usage Check
```
Backend:
File: backend/config/database.php
- Line 52: 'password' => env('DB_PASSWORD'),

File: backend/config/mail.php
- env('MAIL_PASSWORD')

Frontend:
File: frontend/src/services/api.js
- const API_URL = import.meta.env.VITE_API_URL
```

**✅ Pass Criteria:**
- [ ] .env.example files provided
- [ ] Real .env files exist (not in git)
- [ ] env() used for sensitive config
- [ ] No secrets in .example files

---

### 5.2 No Hard-coded Credentials ✅ [2 points]

#### Test Method 1: Code Search
```bash
# Search for common hardcoded patterns
cd /path/to/project

# Search for potential passwords
grep -r "password.*=.*['\"]" backend/ --include="*.php" | grep -v "env("

# Search for API keys
grep -r "api_key.*=.*['\"]" backend/ --include="*.php" | grep -v "env("

# Search for database credentials
grep -r "DB_PASSWORD.*=.*['\"]" backend/ --include="*.php"

# Expected: Should only find env() calls, not hardcoded values
```

**Evidence:** Screenshot of search results (should be empty or only env() calls)

#### Test Method 2: Manual Code Review
```
Check these sensitive areas:
1. backend/config/database.php
   ✅ Should use: env('DB_PASSWORD')
   ❌ Should NOT: 'password' => 'mysecretpass'

2. backend/config/mail.php
   ✅ env('MAIL_PASSWORD')
   ❌ 'password' => 'gmail_password_123'

3. Any API integrations
   ✅ env('STRIPE_SECRET')
   ❌ $api_key = 'sk_live_...'
```

**✅ Pass Criteria:**
- [ ] No hardcoded passwords
- [ ] No API keys in code
- [ ] env() used for all secrets
- [ ] Search results clean

---

### 5.3 Docker Secrets ✅ [3 points]

#### Test Method 1: Docker Compose Review
```
File: docker-compose.yml

Check for environment variables:
services:
  app:
    environment:
      - APP_KEY=${APP_KEY}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_HOST=db
  
  db:
    environment:
      - POSTGRES_PASSWORD=${DB_PASSWORD}

Pattern:
✅ ${VARIABLE_NAME}  ← From .env file
❌ POSTGRES_PASSWORD=hardcoded123  ← Bad
```

#### Test Method 2: Runtime Check
```bash
# Check environment variables in running container
docker exec paypal_backend env | grep -E "DB_PASSWORD|APP_KEY"

# Should show values from .env file
# DB_PASSWORD=your_secure_password
```

**Evidence Screenshot:** docker-compose.yml showing env vars

**✅ Pass Criteria:**
- [ ] Environment variables in docker-compose.yml
- [ ] No hardcoded secrets in docker-compose.yml
- [ ] Variables use ${VAR_NAME} syntax
- [ ] Values loaded from .env file

---

### 5.4 Git Security ✅ [2 points]

#### Test Method 1: Git Status Check
```bash
# Check if .env is tracked by git
git status

# Check .env files
ls -la backend/.env
ls -la frontend/.env

# Expected: Files exist locally but NOT in git status
```

#### Test Method 2: .gitignore Review
```bash
cat .gitignore

# Should contain:
.env
.env.local
.env.*.local
/backend/.env
/frontend/.env
```

#### Test Method 3: Git History Check
```bash
# Verify .env never committed
git log --all --full-history --oneline -- "*.env"

# Should return empty or only .env.example
```

**Evidence Screenshots:**
- .gitignore file content
- git status showing clean (no .env files)

**✅ Pass Criteria:**
- [ ] .env in .gitignore
- [ ] git status shows no .env files
- [ ] .env files never in git history
- [ ] Only .env.example tracked

---

## 6️⃣ Logging and Audit (10 points)

### 6.1 Login Tracking ✅ [4 points]

#### Test Method 1: Database Inspection
```sql
-- Connect to database
docker exec -it paypal_db psql -U paypal_user -d paypal_app

-- Check users table for login fields
\d users;
-- Look for: last_login_at, last_login_ip

-- Check LoginLog table
\d login_logs;
-- Should have: user_id, ip_address, user_agent, is_successful, failure_reason

-- View recent login logs
SELECT 
    ll.id,
    u.email,
    ll.ip_address,
    ll.user_agent,
    ll.is_successful,
    ll.failure_reason,
    ll.created_at
FROM login_logs ll
JOIN users u ON ll.user_id = u.id
ORDER BY ll.created_at DESC
LIMIT 10;
```

**Evidence Screenshots:**
- Table structure showing required fields
- Sample login log entries

#### Test Method 2: Browser - Login and Check
```
1. Logout if logged in
2. Note your IP address (whatismyip.com)
3. Note your browser info
4. Login with user@paypal.test / User123!
5. Go to Profile or Admin → Login Logs
6. Verify display shows:
   - Date/Time of login
   - IP address (should match yours)
   - Browser info (User Agent)
   - Success status
```

**Evidence Screenshot:** Login logs page showing tracked information

#### Test Method 3: Code Review
```
File: backend/app/Models/User.php
Lines: 23-36 - Check for last_login_at, last_login_ip fields

File: backend/app/Models/LoginLog.php
Lines: 16-22 - Check fillable fields

File: backend/app/Http/Controllers/Api/AuthController.php
Login method - Look for LoginLog::create([...])
```

**✅ Pass Criteria:**
- [ ] last_login_at field in users table
- [ ] last_login_ip field in users table
- [ ] login_logs table exists
- [ ] IP address recorded
- [ ] User agent recorded
- [ ] Timestamp recorded
- [ ] Logs visible in dashboard

---

### 6.2 Audit Trail ✅ [4 points]

#### Test Method 1: Database - Audit Logs Check
```sql
-- Check for audit_logs table
docker exec -it paypal_db psql -U paypal_user -d paypal_app

\d audit_logs;

-- View recent audit entries
SELECT 
    id,
    event_type,
    user_id,
    description,
    ip_address,
    created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 20;

-- Expected events:
-- - user_login
-- - user_logout
-- - 2fa_enabled
-- - 2fa_disabled
-- - user_created
-- - transaction_created
```

**Evidence Screenshot:** Audit logs table with various events

#### Test Method 2: Browser - Generate Audit Trail
```
Perform these actions and verify they're logged:
1. Login → Check for 'user_login' event
2. Enable 2FA → Check for '2fa_enabled' event
3. Disable 2FA → Check for '2fa_disabled' event
4. Logout → Check for 'user_logout' event

View logs at: Admin Dashboard → Audit Logs (if admin)
```

#### Test Method 3: Code Review - AuditLogService
```
File: backend/app/Services/AuditLogService.php
Check for log() method

Usage in controllers:
File: backend/app/Http/Controllers/Api/AuthController.php
- Look for: AuditLogService::log(...)
- Events: 'user_login', 'user_logout', etc.

File: backend/app/Http/Controllers/Api/TwoFactorController.php
- Events: '2fa_enabled', '2fa_disabled'
```

**✅ Pass Criteria:**
- [ ] audit_logs table exists
- [ ] User actions logged
- [ ] Logs include timestamp, user, IP
- [ ] Dashboard displays audit trail
- [ ] AuditLogService used in code

---

### 6.3 Security Events ✅ [2 points]

#### Test Method 1: Failed Login Test
```
1. Go to http://localhost:3000/login
2. Try logging in with wrong password 3 times:
   - Email: user@paypal.test
   - Password: WrongPassword123!
   
3. Check database:
```

```sql
SELECT 
    ll.id,
    u.email,
    ll.is_successful,
    ll.failure_reason,
    ll.created_at
FROM login_logs ll
JOIN users u ON ll.user_id = u.id
WHERE ll.is_successful = false
ORDER BY ll.created_at DESC
LIMIT 5;
```

**Expected:** Failed attempts logged with failure_reason

**Evidence Screenshot:** Failed login entries in database

#### Test Method 2: Account Lockout Test
```
1. Try logging in with wrong password 5+ times
2. Expected: Account locked message
3. Check database:

SELECT 
    id, 
    email, 
    failed_login_attempts, 
    locked_until
FROM users 
WHERE email = 'user@paypal.test';

-- failed_login_attempts should increment
-- locked_until should be set if threshold reached
```

#### Test Method 3: Code Review
```
File: backend/app/Http/Controllers/Api/AuthController.php
Lines: 100-116 - Account lockout logic
Lines: 118-141 - Failed login tracking

LoginLog::create([
    'user_id' => $user->id,
    'is_successful' => false,
    'failure_reason' => 'Invalid credentials',
]);
```

**✅ Pass Criteria:**
- [ ] Failed logins logged
- [ ] Failure reason recorded
- [ ] Multiple failed attempts tracked
- [ ] Account lockout mechanism (if implemented)

---

## 7️⃣ General Observations (5 points)

### 7.1 HTTPS Configuration ✅ [2 points]

#### Test Method 1: Current Environment Check
```bash
# Check if app is using HTTPS or HTTP
curl -I http://localhost:8000
curl -I http://localhost:3000

# In development: HTTP is acceptable
# Expected: Connection successful via HTTP
```

#### Test Method 2: Documentation Check
```
Files to review:
1. README.md - Should mention HTTPS for production
2. DEPLOYMENT.md - Should have SSL/TLS setup instructions
3. docker-compose.yml - May have commented HTTPS config

Look for production recommendations:
- SSL certificate setup
- HTTPS redirect configuration
- Secure cookie settings (SESSION_SECURE_COOKIE=true)
```

**Evidence:** Screenshot of documentation mentioning HTTPS

**✅ Pass Criteria:**
- [ ] HTTP acceptable for development
- [ ] Documentation mentions HTTPS for production
- [ ] Production deployment guide includes SSL/TLS
- [ ] Secure cookie configuration for production

---

### 7.2 Error Handling ✅ [2 points]

#### Test Method 1: API Error Testing
```bash
# Test 1: Invalid endpoint
curl http://localhost:8000/api/nonexistent

# Expected: Generic error message, NOT stack trace
# ✅ {"message": "Not Found"}
# ❌ PDOException in line 123 of DatabaseConnection.php

# Test 2: Database error (if possible to trigger)
# Should return generic message, not SQL error details

# Test 3: Validation error
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid"}'

# Expected: User-friendly validation messages
# ✅ {"message": "The email field must be a valid email address."}
# ❌ SQLSTATE[23000]: Integrity constraint violation
```

**Evidence Screenshot:** Error responses showing generic messages

#### Test Method 2: Browser Console
```
1. Open DevTools → Console
2. Trigger various errors:
   - Invalid form submission
   - Network failure (stop backend)
   - Unauthorized access

3. Check console for:
   ✅ User-friendly error messages
   ❌ NO stack traces
   ❌ NO database errors
   ❌ NO file paths
```

#### Test Method 3: Code Review
```
File: backend/app/Exceptions/Handler.php
- Custom error handling logic

Controllers - Check try-catch blocks:
File: backend/app/Http/Controllers/Api/AuthController.php

try {
    // ... code ...
} catch (\Exception $e) {
    return response()->json([
        'message' => 'An error occurred.'  // ← Generic
    ], 500);
}
```

**✅ Pass Criteria:**
- [ ] Generic error messages to client
- [ ] No stack traces exposed
- [ ] No database errors shown
- [ ] Try-catch blocks in controllers
- [ ] User-friendly error messages

---

### 7.3 Password Storage ✅ [1 point]

#### Test Method 1: Final Database Review
```sql
-- Connect to database
docker exec -it paypal_db psql -U paypal_user -d paypal_app

-- Review ALL user passwords
SELECT 
    id,
    email,
    LEFT(password, 10) as password_start,
    LENGTH(password) as password_length,
    password ~ '^\$2[ayb]\$.{56}$' as is_bcrypt
FROM users;

-- Expected:
-- password_start: $2y$12$... (bcrypt)
-- password_length: 60
-- is_bcrypt: true (for ALL users)
```

**Evidence Screenshot:** All passwords properly hashed

#### Test Method 2: Complete Code Review
```bash
# Search entire codebase for potential plaintext passwords
cd /path/to/project
grep -r "password.*=.*['\"][a-zA-Z0-9!@#]" backend/ frontend/ --include="*.php" --include="*.js"

# Exclude env() and config() calls
# Should find NOTHING hardcoded
```

**✅ Pass Criteria:**
- [ ] All passwords bcrypt hashed
- [ ] No plaintext passwords in database
- [ ] No hardcoded passwords in code
- [ ] Password length = 60 characters

---

## 📊 Summary Checklist

Print this page and use it as a quick reference:

### Authentication Security (20 pts)
- [ ] 1.1 Passwords hashed with bcrypt (5 pts)
- [ ] 1.2 CSRF protection implemented (5 pts)
- [ ] 1.3 Rate limiting on auth endpoints (5 pts)
- [ ] 1.4 Password complexity validation (5 pts)

### Two-Factor Authentication (25 pts)
- [ ] 2.1 2FA setup with QR code (5 pts)
- [ ] 2.2 TOTP code verification (5 pts)
- [ ] 2.3 Login requires 2FA reverification (5 pts)
- [ ] 2.4 Disable 2FA requires password (5 pts)
- [ ] 2.5 2FA secrets encrypted (5 pts)

### Session and Token Management (15 pts)
- [ ] 3.1 Laravel Sanctum implemented (4 pts)
- [ ] 3.2 Logout invalidates tokens (4 pts)
- [ ] 3.3 Tokens not visible in console (3 pts)
- [ ] 3.4 Token expiration handled (4 pts)

### Input Validation (15 pts)
- [ ] 4.1 Backend validation on all endpoints (4 pts)
- [ ] 4.2 Frontend form validation (4 pts)
- [ ] 4.3 SQL injection prevented (4 pts)
- [ ] 4.4 XSS protection (3 pts)

### Secure Configuration (10 pts)
- [ ] 5.1 Environment variables in .env (3 pts)
- [ ] 5.2 No hardcoded credentials (2 pts)
- [ ] 5.3 Docker environment variables (3 pts)
- [ ] 5.4 .env excluded from git (2 pts)

### Logging and Audit (10 pts)
- [ ] 6.1 Login tracking (IP, browser, time) (4 pts)
- [ ] 6.2 Audit trail for actions (4 pts)
- [ ] 6.3 Failed login attempts logged (2 pts)

### General Observations (5 pts)
- [ ] 7.1 HTTPS configuration documented (2 pts)
- [ ] 7.2 Error handling secure (2 pts)
- [ ] 7.3 No plaintext passwords (1 pt)

---

## 🎯 Recommendations for Reviewers

### Best Practices for Testing:

1. **Take Screenshots:** Document EVERY test with screenshots
2. **Save Database Queries:** Copy all SQL queries and results
3. **Record Network Traffic:** Export HAR files from DevTools
4. **Document File Paths:** Note exact line numbers in code
5. **Test Edge Cases:** Don't just test happy paths
6. **Verify Error Messages:** Check both success and failure scenarios
7. **Use Multiple Browsers:** Test in Chrome, Firefox, Safari
8. **Clear Cache:** Between tests to ensure fresh state

### Common Issues to Watch For:

⚠️ **CSRF Tokens:**
- Cookie domain mismatches
- SameSite cookie policy issues
- Missing XSRF-TOKEN header

⚠️ **2FA:**
- Time synchronization issues (server vs client)
- Secret key not properly encrypted
- Code reuse allowed (should fail)

⚠️ **Rate Limiting:**
- Too aggressive (blocks legitimate users)
- Too lenient (doesn't prevent brute force)
- Not applied to all auth endpoints

⚠️ **Token Management:**
- Tokens not deleted on logout
- Token expiration not handled
- Multiple tokens allowed per user (may be OK)

### Testing Timeline:

**Phase 1: Setup (15 min)**
- Start Docker containers
- Verify services running
- Create test accounts

**Phase 2: Authentication (45 min)**
- Password hashing verification
- CSRF protection testing
- Rate limiting tests
- Password validation

**Phase 3: 2FA (45 min)**
- Setup flow
- Code verification
- Login with 2FA
- Disable protection
- Secret storage

**Phase 4: Tokens & Session (30 min)**
- Sanctum verification
- Logout functionality
- Token security
- Expiration handling

**Phase 5: Validation (30 min)**
- Backend validation tests
- Frontend validation tests
- SQL injection attempts
- XSS testing

**Phase 6: Configuration (20 min)**
- Environment variables
- Git security
- Docker secrets
- Hardcoded credentials check

**Phase 7: Logging (30 min)**
- Login tracking
- Audit trail
- Security events
- Database inspection

**Phase 8: General (15 min)**
- HTTPS documentation
- Error handling
- Final password storage check

**Total Estimated Time: 4 hours**

---

## 📝 Evidence Collection Template

For each section, collect:

```
Section: [e.g., 1.2 CSRF Protection]
Test Method: [Browser DevTools / Database / Code]
Date/Time: [timestamp]
Tester: [name]

Steps Performed:
1. ...
2. ...
3. ...

Expected Result:
...

Actual Result:
...

Screenshots:
- [filename1.png]
- [filename2.png]

Database Queries:
```sql
...
```

Code References:
- File: ...
  Lines: ...
  
Pass/Fail: [✅ PASS / ❌ FAIL]
Notes: ...

---
```

---

## 🔒 Security Score Calculation

After completing all tests, calculate the final score:

| Category | Max Points | Earned | Evidence Complete? |
|----------|------------|--------|--------------------|
| Authentication Security | 20 | ___ | [ ] |
| Two-Factor Authentication | 25 | ___ | [ ] |
| Session and Token Management | 15 | ___ | [ ] |
| Input Validation | 15 | ___ | [ ] |
| Secure Configuration | 10 | ___ | [ ] |
| Logging and Audit | 10 | ___ | [ ] |
| General Observations | 5 | ___ | [ ] |
| **TOTAL** | **100** | **___** | **[ ]** |

### Final Grade:
- **90-100:** ✅ Excellent - Production ready
- **75-89:** ✅ Good - Minor improvements needed
- **60-74:** ⚠️ Acceptable - Some improvements needed
- **Below 60:** ❌ Needs significant security improvements

---

**End of Security Testing Guide**

*For questions or clarifications, contact the development team.*
