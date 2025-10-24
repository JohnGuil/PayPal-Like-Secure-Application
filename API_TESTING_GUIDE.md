# API Testing Guide

This guide shows you how to manually test all API endpoints.

## Prerequisites

- Application is running: `docker compose up`
- Backend is accessible at: `http://localhost:8001`
- Frontend is accessible at: `http://localhost:3001`

## Method 1: Using the Test Script (Automated)

Run the automated test script:

```bash
# Make the script executable
chmod +x test-api.sh

# Run the tests
./test-api.sh
```

This will test all endpoints automatically and show you the results.

---

## Method 2: Using cURL (Manual Testing)

### 1. Register a New User

```bash
curl -X POST http://localhost:8001/api/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "mobile_number": "+1234567890",
    "password": "SecurePass123!",
    "password_confirmation": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "message": "Registration successful! Please login.",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### 2. Login

```bash
curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "message": "Login successful!",
  "token": "1|abcdefghijklmnopqrstuvwxyz...",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "two_factor_enabled": false
  }
}
```

**Save the token** for subsequent requests!

---

### 3. Get User Information (Protected Route)

Replace `YOUR_TOKEN` with the token from login:

```bash
curl -X GET http://localhost:8001/api/user \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "mobile_number": "+1234567890",
    "two_factor_enabled": false,
    "last_login_at": "2025-10-21T10:30:00.000000Z",
    "last_login_ip": "172.18.0.1"
  },
  "recent_logins": []
}
```

---

### 4. Setup 2FA (Protected Route)

```bash
curl -X POST http://localhost:8001/api/2fa/setup \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "secret": "ABCDEFGHIJKLMNOP",
  "qr_code": "base64_encoded_svg_data...",
  "message": "Scan the QR code with your authenticator app and verify the code."
}
```

---

### 5. Verify 2FA Code (Protected Route)

After scanning QR code, get the 6-digit code from your authenticator app:

```bash
curl -X POST http://localhost:8001/api/2fa/verify \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "code": "123456"
  }'
```

**Expected Response:**
```json
{
  "message": "2FA has been successfully enabled!",
  "two_factor_enabled": true
}
```

---

### 6. Disable 2FA (Protected Route)

```bash
curl -X POST http://localhost:8001/api/2fa/disable \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "message": "2FA has been successfully disabled!",
  "two_factor_enabled": false
}
```

---

### 7. Logout (Protected Route)

```bash
curl -X POST http://localhost:8001/api/logout \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "message": "Logout successful!"
}
```

---

### 8. Login with 2FA (When 2FA is Enabled)

**Step 1: Login with credentials**
```bash
curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**
```json
{
  "requires_2fa": true,
  "user_id": 1,
  "message": "Please enter your 2FA code."
}
```

**Step 2: Verify 2FA code**
```bash
curl -X POST http://localhost:8001/api/2fa/verify-login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "user_id": 1,
    "code": "123456"
  }'
```

**Response:**
```json
{
  "message": "2FA verification successful!",
  "token": "2|xyz123...",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "two_factor_enabled": true
  }
}
```

---

## Method 3: Using Postman or Insomnia

1. **Download** [Postman](https://www.postman.com/downloads/) or [Insomnia](https://insomnia.rest/download)
2. **Import** the following collection:
   - Create new request
   - Set method (POST/GET)
   - Set URL: `http://localhost:8001/api/[endpoint]`
   - Add headers:
     - `Content-Type: application/json`
     - `Accept: application/json`
     - `Authorization: Bearer YOUR_TOKEN` (for protected routes)
   - Add request body (JSON)

---

## Method 4: Using the Frontend (Complete E2E Test)

1. **Open browser**: http://localhost:3001
2. **Register**: Create a new account
3. **Login**: Sign in with credentials
4. **Dashboard**: View your account info
5. **Enable 2FA**: Click "Enable 2FA" and scan QR code
6. **Logout**: Click logout button
7. **Login with 2FA**: Login again and enter 2FA code

---

## Quick Health Check

Test if backend is running:

```bash
# Simple ping test
curl http://localhost:8001/api

# Or check with browser
open http://localhost:8001/api
```

---

## Common Issues

### Issue 1: Connection Refused
**Problem**: `curl: (7) Failed to connect to localhost port 8001`

**Solution**:
```bash
# Check if containers are running
docker ps

# Restart containers
docker compose down
docker compose up
```

### Issue 2: 401 Unauthorized
**Problem**: Protected routes return 401

**Solution**: Make sure you're including the Bearer token:
```bash
-H "Authorization: Bearer YOUR_ACTUAL_TOKEN"
```

### Issue 3: 500 Internal Server Error
**Problem**: Server error responses

**Solution**:
```bash
# Check backend logs
docker compose logs app

# Check database is running
docker compose logs db
```

### Issue 4: CORS Errors
**Problem**: CORS policy errors when testing from different origin

**Solution**: Already configured in `backend/config/cors.php`
- Allowed origins: localhost:3000, localhost:3001
- If testing from different port, add it to the config

---

## API Endpoint Summary

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| POST | `/api/register` | ❌ | Register new user |
| POST | `/api/login` | ❌ | Login user |
| POST | `/api/2fa/verify-login` | ❌ | Verify 2FA during login |
| GET | `/api/user` | ✅ | Get user info |
| POST | `/api/logout` | ✅ | Logout user |
| POST | `/api/2fa/setup` | ✅ | Setup 2FA |
| POST | `/api/2fa/verify` | ✅ | Verify and enable 2FA |
| POST | `/api/2fa/disable` | ✅ | Disable 2FA |

---

## Expected HTTP Status Codes

- `200` - Success (GET, POST operations)
- `201` - Created (Registration)
- `400` - Bad Request (Validation errors)
- `401` - Unauthorized (Invalid/missing token)
- `422` - Unprocessable Entity (Validation failed)
- `500` - Server Error (Check logs)

---

**Happy Testing! 🧪**
