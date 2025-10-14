# Quick Start Guide

This guide will help you get the PayPal-like secure application running in under 10 minutes.

## Prerequisites

Make sure you have:
- Docker Desktop installed and running
- At least 4GB RAM available
- Ports 3001, 8001, and 5433 available

## Installation Steps

### 1. Navigate to Project Directory

\`\`\`powershell
cd c:\Users\jk121\IAS2\group_project
\`\`\`

### 2. Copy Environment File

\`\`\`powershell
Copy-Item backend\.env.example backend\.env
\`\`\`

### 3. Start Application

\`\`\`powershell
docker compose up --build
\`\`\`

**Wait 5-10 minutes** for the first build. You should see:
- ✓ Database is ready
- ✓ Backend running on http://localhost:8001
- ✓ Frontend running on http://localhost:3001

### 4. Access Application

Open your browser and go to: **http://localhost:3001**

## First Time Usage

### Create Your Account
1. Click "create a new account"
2. Fill in your details:
   - Full Name: Your Name
   - Email: your.email@example.com
   - Mobile: +1234567890
   - Password: SecurePass123!
   - Confirm Password: SecurePass123!
3. Click "Create Account"

### Login
1. Enter your email and password
2. Click "Sign In"
3. You'll be redirected to the dashboard

### Enable 2FA (Optional but Recommended)
1. From dashboard, click "Enable 2FA"
2. Click "Start Setup"
3. Download an authenticator app if you don't have one:
   - Google Authenticator (iOS/Android)
   - Microsoft Authenticator (iOS/Android)
   - Authy (iOS/Android/Desktop)
4. Scan the QR code with your authenticator app
5. Enter the 6-digit code from your app
6. Click "Verify and Enable 2FA"

### Test 2FA Login
1. Click "Logout"
2. Login again with your credentials
3. Enter the 6-digit code when prompted
4. Access your dashboard

## Common Commands

### Stop Application
\`\`\`powershell
docker compose down
\`\`\`

### Restart Application
\`\`\`powershell
docker compose up
\`\`\`

### View Logs
\`\`\`powershell
# All services
docker compose logs -f

# Specific service
docker compose logs -f app        # Backend
docker compose logs -f frontend   # Frontend
\`\`\`

### Reset Database
\`\`\`powershell
docker compose down
docker volume rm group_project_postgres_data
docker compose up --build
\`\`\`

## Troubleshooting

### Port Already in Use
If you see "port already in use" errors:

1. Check what's using the ports:
\`\`\`powershell
netstat -ano | findstr :8001
netstat -ano | findstr :3001
netstat -ano | findstr :5433
\`\`\`

2. Stop the conflicting service or change ports in `docker-compose.yml`

### Database Connection Failed
1. Wait 30 seconds for database to initialize
2. Check database is running:
\`\`\`powershell
docker ps
\`\`\`

### Backend 500 Error
\`\`\`powershell
# Access backend container
docker exec -it paypal_backend sh

# Generate application key
php artisan key:generate

# Clear cache
php artisan config:clear
php artisan cache:clear
\`\`\`

### Frontend Won't Load
1. Check frontend is running:
\`\`\`powershell
docker compose logs frontend
\`\`\`

2. Rebuild frontend:
\`\`\`powershell
docker compose down
docker compose up --build frontend
\`\`\`

## Need More Help?

See the full [README.md](README.md) for detailed documentation, API endpoints, and security information.

## Project Features Checklist

Test these features to verify everything works:

- [ ] User registration with password validation
- [ ] User login with credentials
- [ ] Dashboard displays user information
- [ ] Enable 2FA with QR code
- [ ] Login with 2FA verification
- [ ] Disable 2FA with password confirmation
- [ ] View recent login activity
- [ ] Logout functionality

## Security Testing

Review the [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md) to evaluate:
- Password hashing (bcrypt)
- CSRF protection
- Rate limiting
- 2FA implementation
- Token management
- Input validation
- Secure configuration

---

**You're all set! 🚀**

For detailed documentation, see [README.md](README.md)
