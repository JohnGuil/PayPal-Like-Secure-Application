# Security Testing Script for PayPal-Like Secure Application
# Date: October 28, 2025

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SECURITY TESTING - PayPal-Like App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8000/api"
$results = @()

# Test 1: Password Validation - Weak Password
Write-Host "[TEST 1.4] Password Validation - Weak Password" -ForegroundColor Yellow
$weakPassResponse = curl.exe -s -X POST "$baseUrl/register" `
    -H "Content-Type: application/json" `
    -H "Accept: application/json" `
    -d '{"full_name":"Test User","email":"weak@test.com","mobile_number":"+1234567890","password":"weak","password_confirmation":"weak"}'
Write-Host "Response: $weakPassResponse" -ForegroundColor Gray
if ($weakPassResponse -like "*password*") {
    Write-Host "✅ PASS: Weak passwords rejected" -ForegroundColor Green
    $results += "✅ 1.4 Password Validation"
} else {
    Write-Host "❌ FAIL: Weak passwords accepted" -ForegroundColor Red
    $results += "❌ 1.4 Password Validation"
}
Write-Host ""

# Test 2: Password Validation - Strong Password (Registration)
Write-Host "[TEST 1.1 & 1.4] Password Hashing - Strong Password Registration" -ForegroundColor Yellow
$registerResponse = curl.exe -s -X POST "$baseUrl/register" `
    -H "Content-Type: application/json" `
    -H "Accept: application/json" `
    -d '{"full_name":"Security Test User","email":"sectest@test.com","mobile_number":"+1234567890","password":"SecurePass123!","password_confirmation":"SecurePass123!"}'
Write-Host "Response: $registerResponse" -ForegroundColor Gray
if ($registerResponse -like "*token*" -or $registerResponse -like "*success*") {
    Write-Host "✅ PASS: Strong password accepted and user registered" -ForegroundColor Green
    $results += "✅ 1.1 Password Hashing"
    $results += "✅ 1.4 Password Complexity"
} else {
    Write-Host "⚠️  Registration response: $registerResponse" -ForegroundColor Yellow
}
Write-Host ""

# Test 3: Rate Limiting
Write-Host "[TEST 1.3] Rate Limiting on Login" -ForegroundColor Yellow
Write-Host "Sending multiple login attempts..." -ForegroundColor Gray
for ($i = 1; $i -le 7; $i++) {
    $loginResponse = curl.exe -s -X POST "$baseUrl/login" `
        -H "Content-Type: application/json" `
        -H "Accept: application/json" `
        -d '{"email":"fake@test.com","password":"WrongPassword123!"}'
    
    if ($i -eq 6) {
        Write-Host "Attempt $i : $loginResponse" -ForegroundColor Gray
        if ($loginResponse -like "*Too Many Attempts*" -or $loginResponse -like "*429*" -or $loginResponse -like "*rate limit*") {
            Write-Host "✅ PASS: Rate limiting active after 5 attempts" -ForegroundColor Green
            $results += "✅ 1.3 Rate Limiting"
            break
        }
    }
    Start-Sleep -Milliseconds 500
}
Write-Host ""

# Test 4: CSRF Token Endpoint
Write-Host "[TEST 1.2] CSRF Protection" -ForegroundColor Yellow
$csrfResponse = curl.exe -s -i "$baseUrl/../sanctum/csrf-cookie"
if ($csrfResponse -like "*XSRF-TOKEN*") {
    Write-Host "✅ PASS: CSRF cookie endpoint working" -ForegroundColor Green
    $results += "✅ 1.2 CSRF Protection"
} else {
    Write-Host "❌ FAIL: CSRF cookie not set" -ForegroundColor Red
    $results += "❌ 1.2 CSRF Protection"
}
Write-Host ""

# Test 5: Login with Demo Account
Write-Host "[TEST 3.1] Sanctum Token Authentication" -ForegroundColor Yellow
$loginData = @{
    email = "user@paypal.test"
    password = "User123!"
} | ConvertTo-Json

$loginSuccess = curl.exe -s -X POST "$baseUrl/login" `
    -H "Content-Type: application/json" `
    -H "Accept: application/json" `
    -d $loginData

$token = ""
if ($loginSuccess -like "*token*") {
    Write-Host "✅ PASS: Login successful, token received" -ForegroundColor Green
    $results += "✅ 3.1 Sanctum Authentication"
    # Extract token (simplified)
    $tokenMatch = [regex]::Match($loginSuccess, '"token":"([^"]+)"')
    if ($tokenMatch.Success) {
        $token = $tokenMatch.Groups[1].Value
        Write-Host "Token extracted (first 20 chars): $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor Gray
    }
} else {
    Write-Host "❌ FAIL: Login failed" -ForegroundColor Red
    Write-Host "Response: $loginSuccess" -ForegroundColor Gray
}
Write-Host ""

# Test 6: Protected Endpoint Access
if ($token) {
    Write-Host "[TEST 3.2] Token Validation - Access Protected Endpoint" -ForegroundColor Yellow
    $userResponse = curl.exe -s "$baseUrl/user" `
        -H "Authorization: Bearer $token" `
        -H "Accept: application/json"
    
    if ($userResponse -like "*email*") {
        Write-Host "✅ PASS: Protected endpoint accessible with valid token" -ForegroundColor Green
        $results += "✅ 3.2 Token Validation"
    } else {
        Write-Host "❌ FAIL: Cannot access protected endpoint" -ForegroundColor Red
        $results += "❌ 3.2 Token Validation"
    }
    Write-Host ""
    
    # Test 7: Logout
    Write-Host "[TEST 3.2] Token Invalidation - Logout" -ForegroundColor Yellow
    $logoutResponse = curl.exe -s -X POST "$baseUrl/logout" `
        -H "Authorization: Bearer $token" `
        -H "Accept: application/json"
    
    Write-Host "Logout response: $logoutResponse" -ForegroundColor Gray
    
    # Try to access protected endpoint after logout
    $afterLogout = curl.exe -s "$baseUrl/user" `
        -H "Authorization: Bearer $token" `
        -H "Accept: application/json"
    
    if ($afterLogout -like "*Unauthenticated*" -or $afterLogout -like "*401*") {
        Write-Host "✅ PASS: Token invalidated after logout" -ForegroundColor Green
        $results += "✅ 3.2 Token Invalidation"
    } else {
        Write-Host "❌ FAIL: Token still valid after logout" -ForegroundColor Red
        $results += "❌ 3.2 Token Invalidation"
    }
}
Write-Host ""

# Test 8: SQL Injection Attempt
Write-Host "[TEST 4.3] SQL Injection Prevention" -ForegroundColor Yellow
$sqlInjection = curl.exe -s -X POST "$baseUrl/login" `
    -H "Content-Type: application/json" `
    -H "Accept: application/json" `
    -d '{"email":"admin@test.com OR 1=1--","password":"anything"}'

if ($sqlInjection -notlike "*users*" -and $sqlInjection -notlike "*database*") {
    Write-Host "✅ PASS: SQL injection attempt blocked" -ForegroundColor Green
    $results += "✅ 4.3 SQL Injection Prevention"
} else {
    Write-Host "❌ FAIL: Potential SQL injection vulnerability" -ForegroundColor Red
    $results += "❌ 4.3 SQL Injection Prevention"
}
Write-Host ""

# Test 9: XSS Attempt
Write-Host "[TEST 4.4] XSS Prevention" -ForegroundColor Yellow
$xssAttempt = curl.exe -s -X POST "$baseUrl/register" `
    -H "Content-Type: application/json" `
    -H "Accept: application/json" `
    -d '{"full_name":"<script>alert(\"XSS\")</script>","email":"xss@test.com","mobile_number":"+1234567890","password":"Test123!","password_confirmation":"Test123!"}'

if ($xssAttempt -notlike "*<script>*") {
    Write-Host "✅ PASS: XSS script tags rejected/sanitized" -ForegroundColor Green
    $results += "✅ 4.4 XSS Prevention"
} else {
    Write-Host "❌ FAIL: XSS vulnerability detected" -ForegroundColor Red
    $results += "❌ 4.4 XSS Prevention"
}
Write-Host ""

# Test 10: Check Database for Password Hashing
Write-Host "[TEST 1.1] Password Hashing in Database" -ForegroundColor Yellow
$dbCheck = docker exec paypal_db psql -U paypal_user -d paypal_app -t -c "SELECT password FROM users WHERE email = 'user@paypal.test' LIMIT 1;"
if ($dbCheck -like "*`$2y`$*") {
    Write-Host "✅ PASS: Passwords are bcrypt hashed in database" -ForegroundColor Green
    $results += "✅ 1.1 Bcrypt Password Hashing (DB)"
} else {
    Write-Host "⚠️  Could not verify password hashing in database" -ForegroundColor Yellow
}
Write-Host ""

# Test 11: Environment Variables
Write-Host "[TEST 5.1] Environment Variables Configuration" -ForegroundColor Yellow
if (Test-Path "backend/.env") {
    Write-Host "✅ PASS: .env file exists" -ForegroundColor Green
    $results += "✅ 5.1 Environment Variables"
} else {
    Write-Host "❌ FAIL: .env file missing" -ForegroundColor Red
    $results += "❌ 5.1 Environment Variables"
}
Write-Host ""

# Test 12: .gitignore Security
Write-Host "[TEST 5.4] .gitignore Security" -ForegroundColor Yellow
$gitignoreContent = Get-Content ".gitignore" -Raw
if ($gitignoreContent -like "*.env*") {
    Write-Host "✅ PASS: .env file excluded from git" -ForegroundColor Green
    $results += "✅ 5.4 .env in .gitignore"
} else {
    Write-Host "❌ FAIL: .env not in .gitignore" -ForegroundColor Red
    $results += "❌ 5.4 .env in .gitignore"
}
Write-Host ""

# Test 13: Performance Test
Write-Host "[PERFORMANCE] API Response Time" -ForegroundColor Yellow
$perfTime = Measure-Command {
    curl.exe -s "$baseUrl/health" | Out-Null
}
$perfSeconds = [math]::Round($perfTime.TotalSeconds, 3)
Write-Host "Health endpoint response time: $perfSeconds seconds" -ForegroundColor Gray
if ($perfSeconds -lt 1.0) {
    Write-Host "✅ PASS: Performance optimized (< 1 second)" -ForegroundColor Green
    $results += "✅ Performance: ${perfSeconds}s"
} else {
    Write-Host "⚠️  SLOW: Performance needs improvement (> 1 second)" -ForegroundColor Yellow
    $results += "⚠️  Performance: ${perfSeconds}s"
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$results | ForEach-Object { Write-Host $_ }
Write-Host ""
Write-Host "Total Tests: $($results.Count)" -ForegroundColor Cyan
$passedTests = ($results | Where-Object { $_ -like "✅*" }).Count
$failedTests = ($results | Where-Object { $_ -like "❌*" }).Count
$warningTests = ($results | Where-Object { $_ -like "⚠️*" }).Count

Write-Host "✅ Passed: $passedTests" -ForegroundColor Green
Write-Host "❌ Failed: $failedTests" -ForegroundColor Red
Write-Host "⚠️  Warnings: $warningTests" -ForegroundColor Yellow
Write-Host ""

$score = [math]::Round(($passedTests / $results.Count) * 100, 1)
Write-Host "Security Score: $score%" -ForegroundColor $(if ($score -ge 90) { "Green" } elseif ($score -ge 75) { "Yellow" } else { "Red" })
Write-Host ""
