# VitalStep Admin Dashboard - Setup Guide

## 1. Create Admin User in Supabase

Since you need to create the first admin user, follow these steps:

### Option A: Using Supabase Dashboard (Easiest)

1. Go to [Supabase Console](https://supabase.com/dashboard)
2. Select your project: **oyqecdcpicvzwwwaeka**
3. Navigate to **Authentication** → **Users**
4. Click **"Invite User"**
5. Enter:
   - **Email**: `admin@vitalstep.com` (or your preferred email)
   - Click **Send Invite**
6. Check your email for the invitation link
7. Click the link to set your password
8. Once confirmed, your account is ready to use

### Option B: Using this setup script

```bash
node setup-admin.js
```

Then follow the prompts to create your admin account.

---

## 2. Login to Admin Dashboard

1. Open `http://localhost:3000/login`
2. Enter your admin credentials:
   - **Email**: `admin@vitalstep.com`
   - **Password**: (the one you set)
3. Click **Sign In**

---

## 3. What's Next?

Once logged in, you'll have access to:

- **📊 Dashboard**: Overview and quick stats
- **🔨 Generate**: Create new device codes
- **📦 Inventory**: View all generated devices
- **📋 Audit**: Track all device operations

---

## Troubleshooting

### "Login failed - user not found"
- Make sure you created the user in Supabase Auth
- Double-check the email address spelling
- Ensure email confirmation is enabled

### "Invalid password"
- Reset your password in Supabase → Authentication → Users
- Click the user, then "Reset Password"

### "Connection refused"
- Make sure the dev server is running: `npm run dev`
- Check that port 3000 is not blocked
- Verify Supabase credentials in `.env.local`

---

## Security Notes

🔒 This dashboard uses:
- Supabase Auth for secure authentication
- Email/password authentication
- Session tokens stored securely
- Only authenticated users can access device management

Never share your admin credentials!
