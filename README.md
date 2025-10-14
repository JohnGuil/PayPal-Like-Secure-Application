# PayPal-Like Secure Application

A full-stack web application demonstrating secure user authentication with two-factor authentication (2FA) using Laravel 12, React, PostgreSQL, and Docker.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Security Features](#security-features)
- [Testing the Application](#testing-the-application)
- [Security Review Checklist](#security-review-checklist)
- [Troubleshooting](#troubleshooting)
- [Contributors](#contributors)

## 🎯 Project Overview

This project implements a secure authentication system similar to PayPal, featuring:
- User registration and login
- Two-factor authentication (2FA) using TOTP
- Secure session management
- Login activity tracking
- Dashboard with account security information

### Project Objectives

**Developer Objective:** Build a secure, full-stack web application implementing secure login, user registration, and two-factor authentication.

**Reviewer Objective:** Evaluate the system's security implementation using a comprehensive checklist covering authentication, data protection, and session management.

## ✨ Features

### User Registration
- Full name, email, mobile number, and password fields
- Password strength validation (8+ characters, uppercase, lowercase, number, special character)
- Unique email validation
- BCrypt password hashing
- Input sanitization and validation

### User Login
- Email and password authentication
- CSRF protection
- Rate limiting (throttling)
- Automatic 2FA prompt if enabled
- Login activity logging

### Two-Factor Authentication (2FA)
- QR code generation for authenticator apps
- TOTP (Time-based One-Time Password) verification
- Enable/disable 2FA functionality
- Password re-authentication for disabling 2FA
- Support for Google Authenticator, Authy, Microsoft Authenticator

### User Dashboard
- Account information display
- 2FA status indicator
- Recent login activity
- Last login details (date, time, IP, browser)
- Security management options

### Security Features
- BCrypt password hashing
- Laravel Sanctum token-based authentication
- CSRF protection
- Rate limiting on authentication endpoints
- Secure session management
- Environment variable configuration
- Input validation (frontend & backend)
- SQL injection prevention
- XSS protection

## 🛠 Technology Stack

### Backend
- **Framework:** Laravel 12
- **Language:** PHP 8.3
- **Database:** PostgreSQL 15
- **Authentication:** Laravel Sanctum
- **2FA:** PragmaRX Google2FA
- **QR Code:** Bacon QR Code

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **Routing:** React Router
- **HTTP Client:** Axios

### DevOps
- **Containerization:** Docker & Docker Compose
- **Web Server:** PHP Built-in Server (Development)
- **Database:** PostgreSQL in Docker

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Docker Desktop** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Git** (for cloning the repository)
- **Authenticator App** (Google Authenticator, Authy, or Microsoft Authenticator)

### System Requirements
- **OS:** Windows 10/11, macOS, or Linux
- **RAM:** Minimum 4GB (8GB recommended)
- **Disk Space:** At least 2GB free

## 🚀 Installation & Setup

### Step 1: Clone the Repository

\`\`\`powershell
git clone <repository-url>
cd group_project
\`\`\`

### Step 2: Configure Environment Variables

#### Backend Configuration

1. Copy the example environment file:

\`\`\`powershell
Copy-Item backend\.env.example backend\.env
\`\`\`

2. The default `.env` file is already configured for Docker. If you need to change database credentials, update:

\`\`\`env
DB_DATABASE=paypal_app
DB_USERNAME=paypal_user
DB_PASSWORD=secret
\`\`\`

#### Frontend Configuration

The frontend is pre-configured to connect to `http://localhost:8000`. No additional configuration needed.

### Step 3: Build and Start Docker Containers

\`\`\`powershell
docker compose up --build
\`\`\`

This command will:
- Build the Laravel backend container
- Build the React frontend container
- Start the PostgreSQL database container
- Install dependencies for both backend and frontend
- Run database migrations
- Start the development servers

**Note:** The first build may take 5-10 minutes depending on your internet connection.

### Step 4: Verify Installation

Once all containers are running, you should see:

\`\`\`
✓ Database is ready
✓ Backend running on http://localhost:8000
✓ Frontend running on http://localhost:3000
\`\`\`

## 🎮 Running the Application

### Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api
- **Database:** localhost:5432

### Default Credentials

No default users are created. You need to register a new account.

### Stopping the Application

\`\`\`powershell
docker compose down
\`\`\`

### Restarting the Application

\`\`\`powershell
docker compose up
\`\`\`

### Viewing Logs

\`\`\`powershell
# All containers
docker compose logs -f

# Specific container
docker compose logs -f app        # Backend
docker compose logs -f frontend   # Frontend
docker compose logs -f db         # Database
\`\`\`

## 📁 Project Structure

\`\`\`
group_project/
├── backend/                    # Laravel Backend
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   └── Api/
│   │   │   │       ├── AuthController.php
│   │   │   │       └── TwoFactorController.php
│   │   │   └── Kernel.php
│   │   └── Models/
│   │       ├── User.php
│   │       └── LoginLog.php
│   ├── config/
│   │   ├── cors.php
│   │   └── sanctum.php
│   ├── database/
│   │   └── migrations/
│   │       ├── 2024_01_01_000000_create_users_table.php
│   │       ├── 2024_01_01_000001_create_login_logs_table.php
│   │       └── 2024_01_01_000002_create_personal_access_tokens_table.php
│   ├── routes/
│   │   ├── api.php
│   │   └── web.php
│   ├── .env.example
│   ├── composer.json
│   └── Dockerfile
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TwoFactorVerify.jsx
│   │   │   ├── TwoFactorSetup.jsx
│   │   │   └── TwoFactorDisable.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── authService.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
└── README.md
\`\`\`

## 🔌 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register a new user |
| POST | `/api/login` | Authenticate user |
| POST | `/api/2fa/verify-login` | Verify 2FA code during login |

### Protected Endpoints (Requires Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user` | Get authenticated user info |
| POST | `/api/logout` | Logout user |
| POST | `/api/2fa/setup` | Generate QR code for 2FA |
| POST | `/api/2fa/verify` | Verify and enable 2FA |
| POST | `/api/2fa/disable` | Disable 2FA |

### Request/Response Examples

#### Register User

**Request:**
\`\`\`json
POST /api/register
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "mobile_number": "+1234567890",
  "password": "SecurePass123!",
  "password_confirmation": "SecurePass123!"
}
\`\`\`

**Response:**
\`\`\`json
{
  "message": "Registration successful! Please login.",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com"
  }
}
\`\`\`

#### Login

**Request:**
\`\`\`json
POST /api/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
\`\`\`

**Response (No 2FA):**
\`\`\`json
{
  "message": "Login successful!",
  "token": "1|abcd1234...",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "two_factor_enabled": false
  }
}
\`\`\`

**Response (2FA Required):**
\`\`\`json
{
  "requires_2fa": true,
  "user_id": 1,
  "message": "Please enter your 2FA code."
}
\`\`\`

## 🔒 Security Features

### 1. Password Security
- **BCrypt Hashing:** All passwords hashed with bcrypt (12 rounds)
- **Password Complexity:** Minimum 8 characters, uppercase, lowercase, number, special character
- **Never Stored Plain:** Passwords never stored or logged in plaintext

### 2. Authentication
- **Laravel Sanctum:** Token-based authentication for SPA
- **CSRF Protection:** Enabled on all state-changing operations
- **Rate Limiting:** Login endpoints throttled to prevent brute force
- **Session Security:** Secure session management with database driver

### 3. Two-Factor Authentication
- **TOTP Standard:** Time-based One-Time Password (RFC 6238)
- **QR Code Setup:** Easy setup with authenticator apps
- **Secret Encryption:** 2FA secrets encrypted in database
- **Re-authentication:** Password required to disable 2FA

### 4. Input Validation
- **Frontend Validation:** Real-time form validation in React
- **Backend Validation:** Laravel validation rules on all inputs
- **Sanitization:** Automatic XSS protection
- **SQL Injection Prevention:** Eloquent ORM with parameterized queries

### 5. Data Protection
- **Environment Variables:** All credentials in `.env` file
- **No Hard-coded Secrets:** Database credentials never hard-coded
- **Secure Headers:** CORS properly configured
- **Token Security:** Tokens stored securely, not in console

### 6. Logging & Audit
- **Login Tracking:** IP address, user agent, timestamp logged
- **Recent Activity:** Last 5 logins displayed in dashboard
- **Security Events:** Authentication events logged

## 🧪 Testing the Application

### Manual Testing Steps

#### 1. User Registration
1. Navigate to http://localhost:3000
2. Click "create a new account"
3. Fill in the registration form:
   - Full Name: Test User
   - Email: test@example.com
   - Mobile: +1234567890
   - Password: SecurePass123!
   - Confirm Password: SecurePass123!
4. Click "Create Account"
5. Verify redirect to login page with success message

#### 2. User Login
1. On login page, enter:
   - Email: test@example.com
   - Password: SecurePass123!
2. Click "Sign In"
3. Verify redirect to dashboard

#### 3. Enable 2FA
1. From dashboard, click "Enable 2FA"
2. Click "Start Setup"
3. Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
4. Enter the 6-digit code from your app
5. Click "Verify and Enable 2FA"
6. Verify success message and redirect to dashboard

#### 4. Test 2FA Login
1. Click "Logout"
2. Login again with same credentials
3. Verify 2FA verification page appears
4. Enter 6-digit code from authenticator app
5. Click "Verify"
6. Verify successful login to dashboard

#### 5. Disable 2FA
1. From dashboard, click "Disable 2FA"
2. Enter your password
3. Click "Disable 2FA"
4. Verify redirect to dashboard with 2FA disabled

#### 6. Security Features
1. Check "Account Security" section on dashboard
2. Verify last login details are displayed
3. Verify recent login activity is shown
4. Check IP address and browser information

### Testing Security Features

#### Rate Limiting
Try logging in with wrong password 5+ times rapidly to trigger rate limiting.

#### CSRF Protection
All POST requests include CSRF tokens automatically via Sanctum.

#### Password Validation
Try registering with weak passwords to test validation:
- Less than 8 characters
- No uppercase letters
- No numbers
- No special characters

## 📋 Security Review Checklist

Use this checklist to evaluate the security implementation of the project.

### 1. Authentication Security

- [ ] Passwords are hashed with bcrypt
  - **Location:** `backend/app/Models/User.php` (line 53)
  - **Verification:** Check `password` cast to `hashed`

- [ ] Login form has CSRF protection
  - **Location:** Laravel Sanctum automatically handles CSRF
  - **Verification:** Check `config/sanctum.php` middleware

- [ ] Login endpoint has rate limiting
  - **Location:** `backend/app/Http/Kernel.php` (line 40)
  - **Verification:** Check throttle middleware in API group

- [ ] Password validation meets complexity requirements
  - **Location:** `backend/app/Http/Controllers/Api/AuthController.php` (line 24-27)
  - **Verification:** Check Password::min(8)->mixedCase()->numbers()->symbols()

### 2. Two-Factor Authentication

- [ ] 2FA setup works (QR code and TOTP code)
  - **Location:** `backend/app/Http/Controllers/Api/TwoFactorController.php` (setup method)
  - **Test:** Complete 2FA setup flow

- [ ] 2FA must be reverified after password login
  - **Location:** `backend/app/Http/Controllers/Api/AuthController.php` (login method, line 71-78)
  - **Test:** Login with 2FA enabled account

- [ ] Option to disable 2FA is protected by reauthentication
  - **Location:** `backend/app/Http/Controllers/Api/TwoFactorController.php` (disable method, line 160-165)
  - **Verification:** Password required to disable

### 3. Session and Token Management

- [ ] Sanctum used for tokens
  - **Location:** `backend/composer.json` and `config/sanctum.php`
  - **Verification:** Check Laravel Sanctum package

- [ ] Logout endpoint invalidates tokens
  - **Location:** `backend/app/Http/Controllers/Api/AuthController.php` (logout method, line 114)
  - **Verification:** currentAccessToken()->delete()

- [ ] Tokens not visible in frontend console
  - **Location:** `frontend/src/services/authService.js`
  - **Verification:** Tokens stored in localStorage, not logged

### 4. Input Validation

- [ ] Backend validates all form fields
  - **Location:** All controller methods with $request->validate()
  - **Verification:** Check validation rules in controllers

- [ ] Frontend provides form hints and restrictions
  - **Location:** All form components in `frontend/src/pages/`
  - **Verification:** Check input types, patterns, and error messages

- [ ] No SQL injection risk detected
  - **Location:** Eloquent ORM used throughout
  - **Verification:** No raw SQL queries

### 5. Secure Configuration

- [ ] Environment variables stored in .env file
  - **Location:** `backend/.env.example`
  - **Verification:** Check .env.example for structure

- [ ] No credentials hard-coded
  - **Location:** All files
  - **Verification:** Search codebase for hard-coded passwords

- [ ] Docker secrets or environment variables used for DB password
  - **Location:** `docker-compose.yml`
  - **Verification:** Check environment section

- [ ] .env file excluded from repository
  - **Location:** `.gitignore`
  - **Verification:** Ensure .env is in .gitignore

### 6. Logging and Audit

- [ ] Last login date, IP, and browser recorded
  - **Location:** `backend/app/Models/LoginLog.php` and AuthController
  - **Verification:** Check login_logs table and user updates

- [ ] Reviewer verified log entries exist
  - **Test:** Login and check dashboard for recent activity

### 7. General Observations

- [ ] HTTPS enforced in production mode
  - **Note:** Development uses HTTP; production should use HTTPS

- [ ] Sensitive errors not exposed to client
  - **Location:** All try-catch blocks
  - **Verification:** Check error handling in controllers

- [ ] Reviewer found no plaintext passwords
  - **Verification:** Search all files for password storage

### Final Verdict

**Circle one:** PASS / NEEDS IMPROVEMENT

**Reviewer Signature:** ___________________

**Date:** ___________________

**Comments:**
\`\`\`
_____________________________________________
_____________________________________________
_____________________________________________
\`\`\`

## 🐛 Troubleshooting

### Docker Issues

**Problem:** Containers fail to start
\`\`\`powershell
# Check container logs
docker compose logs

# Restart containers
docker compose down
docker compose up --build
\`\`\`

**Problem:** Port already in use
\`\`\`powershell
# Stop conflicting services or change ports in docker-compose.yml
# Check what's using the port
netstat -ano | findstr :8000
netstat -ano | findstr :3000
netstat -ano | findstr :5432
\`\`\`

### Database Issues

**Problem:** Migration errors
\`\`\`powershell
# Access backend container
docker exec -it paypal_backend sh

# Run migrations manually
php artisan migrate:fresh
\`\`\`

**Problem:** Database connection refused
- Wait for database health check to pass
- Verify database credentials in `.env`
- Check database container is running: `docker ps`

### Backend Issues

**Problem:** 500 Internal Server Error
\`\`\`powershell
# Check backend logs
docker compose logs app

# Generate application key
docker exec -it paypal_backend php artisan key:generate

# Clear cache
docker exec -it paypal_backend php artisan config:clear
docker exec -it paypal_backend php artisan cache:clear
\`\`\`

**Problem:** CORS errors
- Verify frontend URL in `backend/config/cors.php`
- Check `SANCTUM_STATEFUL_DOMAINS` in `.env`

### Frontend Issues

**Problem:** API connection refused
- Verify backend is running on port 8000
- Check `VITE_API_URL` environment variable
- Verify CORS configuration

**Problem:** White screen / Build errors
\`\`\`powershell
# Rebuild frontend
docker compose down
docker compose up --build frontend
\`\`\`

### 2FA Issues

**Problem:** Invalid verification code
- Ensure device time is synchronized
- Wait for next code (codes change every 30 seconds)
- Verify you scanned the correct QR code

**Problem:** QR code not displaying
- Check backend logs for errors
- Verify `bacon-qr-code` package is installed
- Try manual entry with the secret code

## � Screenshots

### Registration Page
![Registration](docs/screenshots/register.png)

### Login Page
![Login](docs/screenshots/login.png)

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### 2FA Setup
![2FA Setup](docs/screenshots/2fa-setup.png)

### 2FA Verification
![2FA Verify](docs/screenshots/2fa-verify.png)

## 🎓 Project Grading Criteria

### Developer Team (70 points)
- **Functionality and correctness** - 40 points
- **Security compliance** - 25 points
- **Code structure and documentation** - 15 points
- **Docker and deployment readiness** - 10 points
- **UI/UX and polish** - 10 points

### Reviewer Team (40 points)
- **Accuracy and completeness of security review** - 30 points
- **Clarity and documentation of findings** - 10 points

## 👥 Contributors

- **Developer Team:** [Your Names]
- **Reviewer Team:** [Reviewer Names]
- **Course:** IAS2 - Information Assurance and Security
- **Due Date:** October 24, 2025

## 📝 License

This project is created for educational purposes as part of the IAS2 course curriculum.

## 🔗 Resources

- [Laravel Documentation](https://laravel.com/docs/12.x)
- [React Documentation](https://react.dev)
- [Laravel Sanctum](https://laravel.com/docs/12.x/sanctum)
- [Google2FA Documentation](https://github.com/antonioribeiro/google2fa)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Docker Documentation](https://docs.docker.com)

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [Security Review Checklist](#security-review-checklist)
3. Contact your instructor or TA

---

**Built with ❤️ for IAS2 Course - October 2025**
