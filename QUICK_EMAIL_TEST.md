# 🚀 Quick Start - Gmail SMTP Testing

## **Option 1: Test via Command Line (Easiest)**

```bash
# After you've updated .env with your Gmail credentials
docker exec -it paypal_backend php artisan email:test your-email@gmail.com
```

**What this does:**
- Sends a Welcome email to your specified address
- Shows mail configuration
- Provides helpful error messages

---

## **Option 2: Test via API Endpoint**

```bash
# Get your auth token first
TOKEN=$(curl -s -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@paypal.test","password":"SuperAdmin123!"}' \
  | jq -r '.token')

# Send test email
curl -X POST http://localhost:8001/api/test-email \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

---

## **Before Testing - Complete These Steps:**

### ✅ Step 1: Enable 2-Step Verification
1. Visit: https://myaccount.google.com/security
2. Click "2-Step Verification"
3. Follow setup wizard

### ✅ Step 2: Generate App Password
1. Visit: https://myaccount.google.com/apppasswords
2. Select "Mail" → "Other (Custom name)"
3. Name it: "PayPal Secure App"
4. Copy the 16-character password

### ✅ Step 3: Update .env File
```env
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-char-app-password
MAIL_FROM_ADDRESS="your-email@gmail.com"
```

### ✅ Step 4: Clear Config Cache
```bash
docker exec -it paypal_backend php artisan config:clear
```

---

## **Full Setup Example:**

```bash
# 1. Edit .env file
nano backend/.env

# Update these lines:
MAIL_USERNAME=john.doe@gmail.com
MAIL_PASSWORD=abcdefghijklmnop
MAIL_FROM_ADDRESS="john.doe@gmail.com"

# 2. Clear config cache
docker exec -it paypal_backend php artisan config:clear

# 3. Send test email
docker exec -it paypal_backend php artisan email:test john.doe@gmail.com

# 4. Check result
# ✅ Success: "Test email sent successfully!"
# ❌ Error: Check the error message and troubleshooting guide
```

---

## **Troubleshooting Quick Fixes:**

### ❌ Error: "Invalid credentials"
```bash
# Make sure you're using App Password, not regular password
# Double-check MAIL_USERNAME and MAIL_PASSWORD in .env
docker exec -it paypal_backend php artisan config:clear
```

### ❌ Error: "Connection timeout"
```bash
# Check internet connection from Docker
docker exec -it paypal_backend ping smtp.gmail.com

# Try alternate port
# In .env: MAIL_PORT=465, MAIL_ENCRYPTION=ssl
docker exec -it paypal_backend php artisan config:clear
```

### ❌ Error: "Too many login attempts"
```bash
# Wait 15-30 minutes
# Check Google Account security settings
# Make sure 2-Step Verification is enabled
```

---

## **What Emails Will Be Sent?**

Your app has these email templates ready:

1. **Welcome Email** - New user registration
2. **Transaction Sent** - When you send money
3. **Transaction Received** - When you receive money
4. **Transaction Refunded** - Refund notification
5. **2FA Code** - Two-factor authentication
6. **Password Reset** - Forgotten password
7. **Security Alert** - Suspicious activity
8. **Account Locked** - Too many failed logins

---

## **Test All Email Types:**

```bash
# Test Welcome Email
docker exec -it paypal_backend php artisan email:test your@email.com

# To test other emails, trigger them through the app:
# - Create a transaction → sends Transaction Sent/Received emails
# - Enable 2FA → sends 2FA code email
# - Failed login 5 times → sends Account Locked email
```

---

## **Ready? Follow This Checklist:**

- [ ] Enable 2-Step Verification on Gmail
- [ ] Generate App Password
- [ ] Update backend/.env with credentials
- [ ] Run `docker exec -it paypal_backend php artisan config:clear`
- [ ] Run `docker exec -it paypal_backend php artisan email:test your@email.com`
- [ ] Check your inbox!

---

**Need help?** Check `GMAIL_SMTP_SETUP_GUIDE.md` for detailed instructions!
