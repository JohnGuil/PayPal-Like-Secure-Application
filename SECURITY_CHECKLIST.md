# Security Review Checklist
**PayPal-Like Secure Application**

**Project Group:** _________________  
**Reviewer Team:** _________________  
**Review Date:** _________________

---

## Instructions

This checklist must be completed by the reviewer team to evaluate the security implementation of the project. For each item:
1. Check the box if the requirement is met
2. Note the location/evidence in the "Evidence" column
3. Add any comments or concerns in the "Notes" section

---

## 1. Authentication Security (20 points)

### 1.1 Password Hashing
- [ ] **Passwords are hashed with bcrypt**
  - **Evidence:** `backend/app/Models/User.php` - password cast to 'hashed'
  - **Test:** Check database to verify passwords are not plaintext
  - **Notes:** _______________________________________________

### 1.2 CSRF Protection
- [ ] **Login form has CSRF protection**
  - **Evidence:** Laravel Sanctum CSRF middleware enabled
  - **Location:** `backend/config/sanctum.php`
  - **Notes:** _______________________________________________

### 1.3 Rate Limiting
- [ ] **Login endpoint has rate limiting**
  - **Evidence:** Throttle middleware applied to API routes
  - **Location:** `backend/app/Http/Kernel.php` line 40
  - **Test:** Attempt multiple failed logins to trigger throttling
  - **Notes:** _______________________________________________

### 1.4 Password Validation
- [ ] **Password validation meets complexity requirements**
  - **Evidence:** Password::min(8)->mixedCase()->numbers()->symbols()
  - **Location:** `backend/app/Http/Controllers/Api/AuthController.php` line 24-27
  - **Test:** Try registering with weak passwords
  - **Notes:** _______________________________________________

**Authentication Security Score:** _____ / 20

---

## 2. Two-Factor Authentication (25 points)

### 2.1 2FA Setup
- [ ] **2FA setup works correctly**
  - **Test:** Complete full 2FA setup flow
  - **Verify:** QR code displays correctly
  - **Verify:** Secret key can be entered manually
  - **Notes:** _______________________________________________

### 2.2 TOTP Code Verification
- [ ] **TOTP code verification works**
  - **Test:** Enter code from authenticator app
  - **Verify:** Only valid codes are accepted
  - **Verify:** Codes expire after 30 seconds
  - **Notes:** _______________________________________________

### 2.3 Login with 2FA
- [ ] **2FA must be reverified after password login**
  - **Evidence:** Login flow checks two_factor_enabled flag
  - **Location:** `backend/app/Http/Controllers/Api/AuthController.php` lines 71-78
  - **Test:** Login with 2FA-enabled account
  - **Notes:** _______________________________________________

### 2.4 Disable 2FA Protection
- [ ] **Option to disable 2FA is protected by reauthentication**
  - **Evidence:** Password verification required to disable
  - **Location:** `backend/app/Http/Controllers/Api/TwoFactorController.php` lines 160-165
  - **Test:** Try disabling 2FA without password
  - **Notes:** _______________________________________________

### 2.5 Secret Storage
- [ ] **2FA secrets are encrypted in database**
  - **Evidence:** encrypt() and decrypt() used for secret storage
  - **Location:** `TwoFactorController.php` - setup and verify methods
  - **Notes:** _______________________________________________

**Two-Factor Authentication Score:** _____ / 25

---

## 3. Session and Token Management (15 points)

### 3.1 Sanctum Implementation
- [ ] **Sanctum or Passport used for tokens**
  - **Evidence:** Laravel Sanctum package in composer.json
  - **Location:** `backend/config/sanctum.php`
  - **Notes:** _______________________________________________

### 3.2 Logout Functionality
- [ ] **Logout endpoint invalidates tokens**
  - **Evidence:** currentAccessToken()->delete() called
  - **Location:** `backend/app/Http/Controllers/Api/AuthController.php` line 114
  - **Test:** Logout and try accessing protected endpoint
  - **Notes:** _______________________________________________

### 3.3 Token Security
- [ ] **Tokens not visible in frontend console**
  - **Evidence:** Tokens stored in localStorage, not console.log
  - **Location:** `frontend/src/services/authService.js`
  - **Test:** Check browser console during login
  - **Notes:** _______________________________________________

### 3.4 Token Expiration
- [ ] **Proper token expiration handling**
  - **Evidence:** 401 interceptor in axios
  - **Location:** `frontend/src/services/api.js` lines 26-36
  - **Notes:** _______________________________________________

**Session and Token Management Score:** _____ / 15

---

## 4. Input Validation (15 points)

### 4.1 Backend Validation
- [ ] **Backend validates all form fields**
  - **Evidence:** $request->validate() used in all endpoints
  - **Location:** All controller methods
  - **Test:** Send invalid data to API endpoints
  - **Notes:** _______________________________________________

### 4.2 Frontend Validation
- [ ] **Frontend provides form hints and restrictions**
  - **Evidence:** Input types, patterns, required attributes
  - **Location:** `frontend/src/pages/` - all form components
  - **Test:** Try submitting invalid data
  - **Notes:** _______________________________________________

### 4.3 SQL Injection Prevention
- [ ] **No SQL injection risk detected**
  - **Evidence:** Eloquent ORM used exclusively
  - **Verification:** No raw SQL queries found
  - **Notes:** _______________________________________________

### 4.4 XSS Protection
- [ ] **Input sanitization prevents XSS**
  - **Evidence:** React auto-escapes output
  - **Evidence:** Laravel validation sanitizes input
  - **Test:** Try injecting script tags
  - **Notes:** _______________________________________________

**Input Validation Score:** _____ / 15

---

## 5. Secure Configuration (10 points)

### 5.1 Environment Variables
- [ ] **Environment variables stored in .env file**
  - **Evidence:** .env.example provided
  - **Location:** `backend/.env.example`
  - **Notes:** _______________________________________________

### 5.2 No Hard-coded Credentials
- [ ] **No credentials hard-coded**
  - **Verification:** Code review completed
  - **Test:** Search for hard-coded passwords/keys
  - **Notes:** _______________________________________________

### 5.3 Docker Secrets
- [ ] **Docker environment variables used for DB password**
  - **Evidence:** Environment section in docker-compose.yml
  - **Location:** `docker-compose.yml` lines 24-32
  - **Notes:** _______________________________________________

### 5.4 Git Security
- [ ] **.env file excluded from repository**
  - **Evidence:** .gitignore includes .env
  - **Test:** Check git status
  - **Notes:** _______________________________________________

**Secure Configuration Score:** _____ / 10

---

## 6. Logging and Audit (10 points)

### 6.1 Login Tracking
- [ ] **Last login date, IP, and browser recorded**
  - **Evidence:** LoginLog model and last_login_at field
  - **Location:** `backend/app/Models/LoginLog.php`
  - **Test:** Login and check dashboard
  - **Notes:** _______________________________________________

### 6.2 Audit Trail
- [ ] **Reviewer verified log entries exist**
  - **Test:** Perform login and check login_logs table
  - **Verification:** Recent activity displayed on dashboard
  - **Notes:** _______________________________________________

### 6.3 Security Events
- [ ] **Failed login attempts logged (if applicable)**
  - **Notes:** _______________________________________________

**Logging and Audit Score:** _____ / 10

---

## 7. General Observations (5 points)

### 7.1 HTTPS Configuration
- [ ] **HTTPS enforced in production mode**
  - **Notes:** Development uses HTTP (acceptable)
  - **Production recommendation:** Use HTTPS with SSL/TLS
  - **Notes:** _______________________________________________

### 7.2 Error Handling
- [ ] **Sensitive errors not exposed to client**
  - **Evidence:** Generic error messages in responses
  - **Location:** All controller try-catch blocks
  - **Notes:** _______________________________________________

### 7.3 Password Storage
- [ ] **Reviewer found no plaintext passwords**
  - **Verification:** Database and code review completed
  - **Notes:** _______________________________________________

**General Observations Score:** _____ / 5

---

## Summary

### Scoring Summary

| Category | Points Earned | Total Points |
|----------|---------------|--------------|
| Authentication Security | _____ | 20 |
| Two-Factor Authentication | _____ | 25 |
| Session and Token Management | _____ | 15 |
| Input Validation | _____ | 15 |
| Secure Configuration | _____ | 10 |
| Logging and Audit | _____ | 10 |
| General Observations | _____ | 5 |
| **TOTAL** | **_____** | **100** |

### Pass Criteria
- **90-100:** Excellent security implementation
- **75-89:** Good security implementation  
- **60-74:** Acceptable with improvements needed
- **Below 60:** Needs significant security improvements

### Final Verdict

**Circle one:**  ✅ PASS  /  ⚠️ NEEDS IMPROVEMENT

### Critical Issues Found
(List any security vulnerabilities or critical issues that must be fixed)

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Recommendations
(List suggestions for improvement)

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Strengths
(List what the project does well)

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

## Reviewer Information

**Reviewer 1 Name:** _________________  
**Reviewer 1 Signature:** _________________  
**Date:** _________________

**Reviewer 2 Name:** _________________  
**Reviewer 2 Signature:** _________________  
**Date:** _________________

---

## Acknowledgment

**Developer Team Lead:** _________________  
**Signature:** _________________  
**Date:** _________________

**Comments/Response to Review:**
_______________________________________________
_______________________________________________
_______________________________________________

---

**End of Security Review Checklist**
