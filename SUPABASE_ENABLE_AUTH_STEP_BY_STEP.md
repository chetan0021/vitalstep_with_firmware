# 🔐 Enable Email/Password Authentication in Supabase (Step-by-Step)

## You are HERE ✓
Screenshot shows: Supabase → Authentication → Users

---

## Step 1: Enable Email Provider

### 1.1 Go to Authentication Providers
1. **Left sidebar** → Look for "**CONFIGURATION**" section
2. Click on **"Sign In / Providers"**
3. You should see a list of available providers (Email, Google, GitHub, Discord, etc.)

---

## Step 2: Enable Email Provider

### 2.1 Find and Enable Email
1. In the providers list, find **"Email"**
2. Click the **toggle switch** next to "Email" → it should turn **GREEN** (enabled)
3. If you see a settings icon, click it

### 2.2 Email Provider Settings
You should see options:
- ✅ **Enable email provider** - toggle ON
- ✅ **Confirm email** - toggle ON
- ⏸️ **Auto-confirm new users** - toggle ON (for testing, easier)

**Screenshot reference for Email provider location:**

In Supabase dashboard:
```
Left Sidebar (CONFIGURATION section):
├── Policies
├── Sign In / Providers              ← CLICK HERE
│   └── Email                        ← Find this
│       └── Toggle ON (green)
├── Passkeys
├── OAuth Server
├── Sessions
└── ...
```

---

## Step 3: Configure URL Settings

### 3.1 Go to URL Configuration
1. **Left sidebar** → Still in CONFIGURATION section
2. Scroll down and find **"URL Configuration"**
3. Click it

### 3.2 Add Redirect URLs
1. Click **"+ Add URL"** (or similar button)
2. Add these URLs:
   - `com.vitalstep://auth-callback`
   - `http://localhost:3000/auth-callback` (optional, for web testing)
3. Save/Apply

---

## Step 4: Test Email Authentication

### 4.1 Create a Test User
1. Go back to **Authentication** → **Users** (main tab)
2. Click **"+ Add user"** button (top right, green button)
3. Enter:
   - **Email**: `test@vitalstep.com`
   - **Password**: `Test123!@#` (must have uppercase, number, special char)
4. Click **"Create user"**
5. You should see the user appear in the list with status **"Confirmed"** ✓

---

## Step 5: Verify It Works

### 5.1 Check User Created
1. In the Users table, you should see:
   - Email: `test@vitalstep.com`
   - Status: **Confirmed** (green checkmark)
   - User ID: (some UUID)

### 5.2 Create a Second Test User (Optional)
1. Repeat step 4.1 with different email:
   - Email: `user2@vitalstep.com`
   - Password: `Test456!@#`

This way you can test device pairing with different users.

---

## Common Issues While Enabling

### Issue: Can't find "Sign In / Providers"
**Solution**: 
- Look in left sidebar under **CONFIGURATION** section
- Scroll down if needed
- If you don't see it, try clicking the main **Authentication** tab at top

### Issue: Email toggle is already ON but gray
**Solution**:
- Click the toggle anyway (sometimes UI is confusing)
- Refresh page: F5
- Try again

### Issue: "Auto-confirm" option not showing
**Solution**:
- It's optional for testing
- Leave it OFF if not visible
- Users will get confirmation email instead

### Issue: Can't create test user - "Invalid password"
**Solution**:
- Password must have:
  - At least 8 characters
  - At least 1 UPPERCASE letter (A-Z)
  - At least 1 number (0-9)
  - At least 1 special character (!@#$%^&*)
- Example: `Test123!@#` ✓
- Bad examples: `test123`, `PASSWORD`, `Test123` ✗

---

## Screenshot Guide

### Where to Find "Sign In / Providers"
```
Supabase Dashboard
│
├── Left Sidebar
│   ├── Build section (top)
│   ├── Database
│   ├── Authentication ← Click here
│   │
│   └── Under Authentication sidebar, find:
│       ├── MANAGE
│       │   └── Users
│       │
│       └── CONFIGURATION
│           ├── Policies
│           ├── Sign In / Providers  ← THIS ONE
│           ├── Passkeys
│           └── ...
```

### Email Provider Toggle Location
```
Authentication → Sign In / Providers
│
├── Email  ← Find this row
│   ├── Toggle switch (currently OFF - should be gray/white)
│   ├── Settings icon (gear)
│   └── Status: Disabled
│
├── Google
├── GitHub
└── ...
```

---

## Verification Checklist

After enabling, you should see:

- [ ] **Sign In / Providers** page shows **Email** provider
- [ ] Email provider toggle is **GREEN** (enabled)
- [ ] Can see Email provider **settings**
- [ ] "Confirm email" is **enabled**
- [ ] Test user `test@vitalstep.com` is **Confirmed** in Users list
- [ ] User ID shows (UUID)
- [ ] User shows in Users count (top right: "Total: 1 users")

---

## Next Steps After Enabling

Once Email authentication is enabled:

1. ✅ Create test user: `test@vitalstep.com` / `Test123!@#`
2. ✅ Continue with database table setup (SQL script)
3. ✅ Deploy Edge Function (device-sync)
4. ✅ Test Flutter app login with credentials

---

## If You Get Stuck

If you can't find the Email provider option:

**Try this**: 
1. Click **"Authentication"** in left sidebar
2. At the top of the main panel, you should see tabs:
   - Users (currently selected)
   - Providers ← Click this tab instead
3. You should see provider list there

**Or**:
1. Click **"Providers"** tab at top
2. Find **Email** in the list
3. Click on Email row
4. Enable it

---

## Email Authentication is Now ENABLED ✓

After you:
1. Enable Email provider
2. Create test user
3. Save settings

You're ready for the next step: **Create Database Tables**

Follow: `SUPABASE_SETUP_GUIDE.md` → **Step 3: Create Database Tables**

---

## 📞 Quick Reference

**Location**: Supabase → Authentication → Providers → Email
**Toggle**: Must be GREEN/ON
**Test User**: test@vitalstep.com / Test123!@#
**Status**: Should show "Confirmed" in Users list

✅ **Done when**: 
- Email provider is enabled (green toggle)
- Test user appears in Users table
- User status shows "Confirmed"
