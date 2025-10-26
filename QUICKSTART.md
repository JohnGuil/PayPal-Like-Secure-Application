# Quick Start Guide ��

Get the PayPal-like secure application running in **5 minutes**!

## Prerequisites ✅

- ✅ Docker Desktop installed and running
- ✅ At least 4GB RAM available  
- ✅ Ports 3001, 8001, and 5433 available

## Installation Steps

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/JohnGuil/PayPal-Like-Secure-Application.git
cd PayPal-Like-Secure-Application
```

### 2️⃣ Copy Environment File

```bash
# macOS/Linux
cp backend/.env.example backend/.env

# Windows PowerShell
Copy-Item backend\.env.example backend\.env
```

**Note:** Default settings work out of the box! No configuration needed for local development.

### 3️⃣ Start Application

```bash
docker compose up --build
```

**⏱️ Wait 3-5 minutes** for the first build. You should see:
- ✓ Database is ready
- ✓ Backend running on http://localhost:8001
- ✓ Frontend running on http://localhost:3001

### 4️⃣ Access Application

Open your browser: **http://localhost:3001**

---

## First Time Usage 🎯

### Login with Demo Accounts

Click any demo account card on the login page to auto-fill credentials:

#### 👑 Super Admin
- **Email:** `superadmin@paypal.test`
- **Password:** `SuperAdmin123!`
- **Access:** Full system access

#### 🛡️ Admin  
- **Email:** `admin@paypal.test`
- **Password:** `Admin123!`
- **Access:** User & role management

#### 📊 Manager
- **Email:** `manager@paypal.test`
- **Password:** `Manager123!`
- **Access:** View users, transactions, logs

#### 👤 User
- **Email:** `user@paypal.test`
- **Password:** `User123!`
- **Access:** Own transactions & profile

---

## What You Can Do 🎮

### As Super Admin
1. **Manage Users** - View, edit, delete users
2. **Manage Roles** - Create, edit, delete roles and permissions
3. **View Reports** - Generate transaction and activity reports
4. **System Settings** - Configure application settings
5. **Audit Logs** - Track all system activities

### As Admin
1. **User Management** - View and edit users
2. **Assign Roles** - Assign roles to users
3. **View Transactions** - Monitor all transactions
4. **Login Logs** - View user login activities

### As Manager
1. **View Dashboard** - System overview
2. **View Users** - Browse user list
3. **View Transactions** - Monitor transactions
4. **View Reports** - Access reports

### As User
1. **Send Money** - Transfer funds to other users
2. **View Transactions** - See your transaction history
3. **Request Refunds** - Request refunds on transactions
4. **Enable 2FA** - Secure your account with 2FA
5. **Update Profile** - Change password, update info

---

## Quick Actions 💨

### Create a Transaction
1. Login as any user
2. Navigate to **Transactions** page
3. Click "New Transaction"
4. Enter recipient email and amount
5. Add description (optional)
6. Click "Send Money"

### Enable Two-Factor Authentication (2FA)
1. Go to **Profile** page
2. Click "Enable 2FA"
3. Scan QR code with Google Authenticator/Authy
4. Enter verification code
5. Save backup codes!

### Create a New Role (Super Admin only)
1. Navigate to **Roles** page
2. Click "Create New Role"
3. Enter role name and description
4. Select permissions
5. Click "Create Role"

### Assign Role to User (Admin)
1. Go to **Users** page
2. Click on a user
3. Click "Edit"
4. Select role from dropdown
5. Click "Save"

---

## Verify Everything is Working ✔️

### Test Authentication
```bash
# Register a new user
curl -X POST http://localhost:8001/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "mobile_number": "+1234567890",
    "password": "Test123!",
    "password_confirmation": "Test123!"
  }'

# Login
curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

### Test Transaction
1. Login as `user@paypal.test`
2. Send $10 to `admin@paypal.test`
3. Check transaction appears in history
4. Login as `admin@paypal.test`
5. Verify received transaction

### Test Email (Optional)
1. Update `.env` with Gmail SMTP:
   ```env
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your-app-password
   ```
2. Restart containers: `docker compose restart`
3. Create a new transaction
4. Check email for notification

---

## Stopping the Application ⏹️

```bash
# Stop containers
docker compose down

# Stop and remove volumes (resets database)
docker compose down -v
```

## Restarting the Application 🔄

```bash
# Quick restart (keeps data)
docker compose up

# Full rebuild (if you made changes)
docker compose up --build

# Reset everything (fresh start)
docker compose down -v && docker compose up --build
```

---

## Troubleshooting 🔧

### Port Already in Use
```bash
# macOS/Linux
lsof -i :3001
lsof -i :8001
kill -9 <PID>

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Docker Issues
```bash
# Rebuild everything
docker compose down -v
docker compose up --build

# Clear Docker cache
docker system prune -a
```

### Can't Access Frontend
1. Check Docker containers are running: `docker ps`
2. Check frontend logs: `docker logs paypal_frontend`
3. Try http://localhost:3001 in incognito mode

### API Errors
1. Check backend logs: `docker logs paypal_backend`
2. Check database is running: `docker ps | grep postgres`
3. Clear Laravel cache:
   ```bash
   docker exec -it paypal_backend php artisan config:clear
   docker exec -it paypal_backend php artisan cache:clear
   ```

---

## Next Steps 📚

Now that you're up and running:

1. **Read the README** - [README.md](README.md) for complete documentation
2. **Test the API** - [API_TESTING_GUIDE.md](API_TESTING_GUIDE.md)
3. **Review Security** - [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)
4. **Deploy to Production** - [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Quick Reference

| Resource | URL |
|----------|-----|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:8001 |
| Database | localhost:5433 |
| API Docs | http://localhost:8001/api/documentation |

| Action | Command |
|--------|---------|
| Start | `docker compose up` |
| Stop | `docker compose down` |
| Rebuild | `docker compose up --build` |
| Reset | `docker compose down -v && docker compose up --build` |
| Logs | `docker logs paypal_backend` or `paypal_frontend` |

---

**That's it! You're ready to explore the application! 🎉**

Need help? Open an issue on [GitHub](https://github.com/JohnGuil/PayPal-Like-Secure-Application/issues)
