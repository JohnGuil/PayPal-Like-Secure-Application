# 📧 Gmail SMTP Setup Guide

## **Step-by-Step Instructions**

### **Step 1: Enable 2-Step Verification on Your Gmail Account**

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Under "How you sign in to Google", click **2-Step Verification**
4. Follow the prompts to enable 2-Step Verification
   - You'll need your phone for verification
   - Choose SMS or Google Authenticator app

**⚠️ Important:** You MUST enable 2-Step Verification before you can create App Passwords.

---

### **Step 2: Generate an App Password**

1. Go back to **Security** settings: https://myaccount.google.com/security
2. Under "How you sign in to Google", click **2-Step Verification**
3. Scroll down and click **App passwords** (at the bottom)
4. You may need to sign in again
5. In the "App passwords" page:
   - Click **Select app** → Choose "Mail"
   - Click **Select device** → Choose "Other (Custom name)"
   - Type: "PayPal Secure App" or any name you prefer
   - Click **Generate**
6. Google will show you a 16-character password (e.g., `abcd efgh ijkl mnop`)
7. **COPY THIS PASSWORD** - you won't be able to see it again!

---

### **Step 3: Update Your .env File**

Open `backend/.env` and update these values:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-actual-email@gmail.com
MAIL_PASSWORD=abcd efgh ijkl mnop
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="your-actual-email@gmail.com"
MAIL_FROM_NAME="PayPal Secure App"
```

**Replace:**
- `your-actual-email@gmail.com` with your Gmail address
- `abcd efgh ijkl mnop` with the 16-character App Password (include spaces or remove them, both work)

**Example:**
```env
MAIL_USERNAME=john.doe@gmail.com
MAIL_PASSWORD=abcdefghijklmnop
MAIL_FROM_ADDRESS="john.doe@gmail.com"
MAIL_FROM_NAME="PayPal Secure App"
```

---

### **Step 4: Clear Laravel Config Cache**

Run this command in your terminal:

```bash
docker exec -it paypal_backend php artisan config:clear
```

This ensures Laravel loads your new email settings.

---

### **Step 5: Test Email Sending**

I'll create a test command for you. After completing Step 3, let me know and I'll help you send a test email!

---

## **🔧 Troubleshooting**

### **Problem: "Invalid credentials" or "Authentication failed"**

**Solutions:**
1. Make sure 2-Step Verification is enabled
2. Use App Password, NOT your regular Gmail password
3. Copy the App Password exactly (spaces don't matter)
4. Make sure `MAIL_USERNAME` is your full Gmail address

### **Problem: "Less secure app access" error**

**Solution:**
- Google discontinued "Less secure apps" in 2022
- You MUST use App Passwords (requires 2-Step Verification)
- Regular passwords don't work anymore

### **Problem: Emails not sending**

**Check:**
1. Run `docker exec -it paypal_backend php artisan config:clear`
2. Check `backend/storage/logs/laravel.log` for errors
3. Verify SMTP settings are correct
4. Make sure Docker container can reach smtp.gmail.com

### **Problem: "Could not resolve host: smtp.gmail.com"**

**Solution:**
- Your Docker container needs internet access
- Check Docker network settings
- Try: `docker exec -it paypal_backend ping smtp.gmail.com`

---

## **📊 Gmail Limitations**

- **Daily limit:** 500 emails per day (rolling 24 hours)
- **Burst limit:** ~100 emails per hour
- **Recipient limit:** 500 recipients per message
- **Attachment limit:** 25 MB

If you exceed limits, Gmail will temporarily block sending (usually 1-24 hours).

---

## **🔐 Security Best Practices**

1. ✅ **NEVER commit .env to Git** (already in .gitignore)
2. ✅ Use different App Passwords for different apps
3. ✅ Revoke App Passwords you're not using
4. ✅ Monitor your Google Account activity regularly
5. ✅ Use environment variables in production

---

## **Alternative Port Configurations**

If port 587 doesn't work, try:

### **Option 1: Port 465 (SSL)**
```env
MAIL_PORT=465
MAIL_ENCRYPTION=ssl
```

### **Option 2: Port 587 (TLS) - Recommended**
```env
MAIL_PORT=587
MAIL_ENCRYPTION=tls
```

---

## **Next Steps After Setup**

Once you've completed Steps 1-4, let me know and I'll help you:

1. ✅ Send a test email
2. ✅ Test the Welcome email
3. ✅ Test transaction notification emails
4. ✅ Test 2FA code emails
5. ✅ Verify email templates look good

---

## **Quick Reference**

| Setting | Value |
|---------|-------|
| SMTP Host | smtp.gmail.com |
| Port | 587 (TLS) or 465 (SSL) |
| Encryption | tls or ssl |
| Username | Your full Gmail address |
| Password | 16-character App Password |

---

**Ready to proceed?** Complete Steps 1-3 above, then let me know when you're ready to test! 🚀
