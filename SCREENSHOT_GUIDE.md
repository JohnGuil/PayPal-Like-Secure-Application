# 📸 Screenshot Guide

This guide will help you capture and add professional screenshots to the README.

## 🎯 Screenshots Needed

### 1. Registration Page
**URL:** `http://localhost:3000/register`

**What to capture:**
- Full registration form
- Show all input fields (Full Name, Email, Mobile Number, Password, Confirm Password)
- Include the "Create Account" button
- Show the "Already have an account? Login" link

**Recommended window size:** 1920x1080 (full HD)

**Tips:**
- Don't fill in the form yet (show empty state)
- Ensure the PayPal-like branding is visible
- Include the complete form in one screenshot

---

### 2. Login Page
**URL:** `http://localhost:3000/login`

**What to capture:**
- Login form with email and password fields
- "Remember Me" checkbox
- "Forgot Password?" link
- "Login" button
- Demo account cards (if visible)
- "Don't have an account? Register" link

**Recommended window size:** 1920x1080

**Tips:**
- Show the clean login interface
- Include demo account cards if they're displayed
- Don't fill in credentials yet

---

### 3. Dashboard
**URL:** `http://localhost:3000/dashboard` (after logging in)

**What to capture:**
- User dashboard with navigation menu
- Account balance or overview section
- Recent transactions list (if any)
- Quick action buttons
- User profile section

**Recommended window size:** 1920x1080

**Tips:**
- Login with a demo account first (e.g., `user@paypal.test` / `User123!`)
- Capture the main dashboard view
- Include sidebar/navigation if present
- Show actual data or transactions if available

---

### 4. Two-Factor Authentication Setup
**URL:** `http://localhost:3000/profile` or Settings page

**What to capture:**
- QR code for 2FA setup
- Secret key (backup code)
- "Enable 2FA" button or toggle
- Instructions for scanning QR code

**Recommended window size:** 1920x1080

**Steps to get to this screen:**
1. Login with any demo account
2. Navigate to Profile or Settings
3. Find the 2FA/Security section
4. Click "Enable Two-Factor Authentication"
5. **Screenshot the QR code page**

**Tips:**
- The QR code should be clearly visible
- Include the backup secret key in the screenshot
- Don't submit the form yet - just capture the setup screen

---

### 5. Two-Factor Authentication Login
**URL:** `http://localhost:3000/login`

**What to capture:**
- 6-digit verification code input field
- "Verify" button
- Message indicating 2FA is required
- Optional: "Lost your device?" or backup code option

**Recommended window size:** 1920x1080

**Steps to get to this screen:**
1. First, enable 2FA on an account (see step 4 above)
2. Logout
3. Login again with the same account
4. You'll be redirected to the 2FA verification page
5. **Screenshot this verification page**

**Tips:**
- Don't enter the 6-digit code yet
- Show the empty/clean verification form
- Include any help text or backup options

---

## 📐 Screenshot Best Practices

### Window Size
- **Recommended:** 1920x1080 (Full HD)
- **Minimum:** 1280x720
- **Maximum:** 2560x1440

### Browser
- Use Chrome or Firefox in private/incognito mode
- Zoom level: 100%
- Hide browser extensions for clean screenshots

### Cropping
- Capture the full browser window OR
- Crop to show only the application content (remove browser UI)

### Tools

#### macOS
- **Full Screen:** `Cmd + Shift + 3`
- **Selected Area:** `Cmd + Shift + 4`
- **Window:** `Cmd + Shift + 4`, then `Space`, then click window

#### Windows
- **Snipping Tool** (Windows 10/11)
- **Snip & Sketch** (`Win + Shift + S`)

#### Cross-Platform
- **Firefox Developer Tools:** `Shift + F2`, then `screenshot --fullpage`
- **Chrome DevTools:** `Cmd/Ctrl + Shift + P`, type "screenshot"

---

## 📂 Saving Screenshots

### File Naming
Save screenshots with these exact names:

```
screenshots/
├── registration.png
├── login.png
├── dashboard.png
├── 2fa-setup.png
└── 2fa-login.png
```

### File Format
- **Preferred:** PNG (lossless, supports transparency)
- **Alternative:** JPG (if file size is too large)
- **Compression:** Optimize images to keep under 500KB each

### Image Optimization Tools
- **Online:** [TinyPNG](https://tinypng.com/)
- **macOS:** ImageOptim
- **Windows:** FileOptimizer
- **CLI:** `pngquant` or `optipng`

---

## ✅ Quick Checklist

Before taking screenshots:

- [ ] Docker containers are running (`docker compose ps`)
- [ ] Frontend is accessible at `http://localhost:3000`
- [ ] Backend API is running at `http://localhost:8000`
- [ ] Browser is in private/incognito mode (clean state)
- [ ] Browser zoom is at 100%
- [ ] Window size is 1920x1080 or similar

For each screenshot:

- [ ] Screenshot shows the correct page
- [ ] UI elements are clearly visible
- [ ] No personal information is visible (use demo accounts)
- [ ] Image is saved with the correct filename
- [ ] Image is in PNG format
- [ ] Image is optimized (under 500KB)

---

## 🚀 Adding Screenshots to GitHub

### Step 1: Verify Screenshots
```bash
# Navigate to project directory
cd PayPal-Like-Secure-Application

# List screenshots
ls -lh screenshots/

# Expected output:
# registration.png
# login.png
# dashboard.png
# 2fa-setup.png
# 2fa-login.png
```

### Step 2: Stage Screenshots
```bash
# Add all screenshots
git add screenshots/

# Or add individual files
git add screenshots/registration.png
git add screenshots/login.png
git add screenshots/dashboard.png
git add screenshots/2fa-setup.png
git add screenshots/2fa-login.png
```

### Step 3: Commit
```bash
git commit -m "docs: Add application screenshots

- Add registration page screenshot
- Add login page screenshot
- Add dashboard screenshot
- Add 2FA setup screenshot
- Add 2FA login verification screenshot"
```

### Step 4: Push to GitHub
```bash
git push origin main
```

### Step 5: Verify on GitHub
1. Go to your repository: `https://github.com/JohnGuil/PayPal-Like-Secure-Application`
2. Navigate to `screenshots/` directory
3. Click on each image to verify they uploaded correctly
4. Check the README.md to see images displayed

---

## 🎨 Optional: Enhanced Screenshots

### Add Annotations
Use tools like:
- **Snagit** (Windows/macOS) - Paid
- **Skitch** (macOS) - Free
- **Greenshot** (Windows) - Free
- **Annotate** (macOS) - Free

### Highlight Features
- Add arrows pointing to key features
- Add text labels explaining functionality
- Highlight security features (CSRF, validation, etc.)
- Circle important UI elements

### Create a Showcase Image
Combine multiple screenshots into one collage:
- Use tools like Figma, Canva, or Photoshop
- Create a grid layout showing all 5 screenshots
- Add captions under each screenshot

---

## 📊 Example Screenshot Workflow

```bash
# 1. Start the application
docker compose up -d

# 2. Wait for services to be ready
sleep 30

# 3. Open browser to localhost:3000

# 4. Take screenshots in this order:
#    a. Registration page
#    b. Login page
#    c. Dashboard (after logging in)
#    d. 2FA setup (in profile/settings)
#    e. 2FA login (logout and login again)

# 5. Save all screenshots to screenshots/ directory

# 6. Optimize images
# (Use TinyPNG or similar tool)

# 7. Add to git
git add screenshots/

# 8. Commit
git commit -m "docs: Add application screenshots"

# 9. Push
git push origin main

# 10. Verify on GitHub README
# Visit: https://github.com/JohnGuil/PayPal-Like-Secure-Application
```

---

## 🆘 Troubleshooting

### Screenshots too large (>1MB each)
**Solution:** Use image optimization tools:
```bash
# Using pngquant (install via brew/apt)
pngquant screenshots/*.png --ext .png --force

# Or use online tool: https://tinypng.com/
```

### Screenshots not showing in README
**Possible causes:**
1. Images not pushed to GitHub (`git push origin main`)
2. Incorrect file paths in README
3. File names don't match (case-sensitive on Linux/GitHub)
4. Images are in wrong directory

**Verify:**
```bash
# Check if files exist
ls screenshots/

# Check git status
git status

# Check if pushed
git log --oneline -5
```

### Can't access localhost:3000
**Solution:**
```bash
# Check if containers are running
docker compose ps

# If not running, start them
docker compose up -d

# Check logs
docker compose logs -f frontend
```

---

## 📝 Notes

- **Privacy:** Always use demo accounts for screenshots
- **Consistency:** Keep screenshot style consistent (same zoom, same window size)
- **Quality:** Use PNG format for better quality
- **Size:** Keep each image under 500KB for faster README loading
- **Alt Text:** The README already includes descriptive alt text for accessibility

---

**Need Help?** Check the main [README.md](README.md) for application setup instructions.
