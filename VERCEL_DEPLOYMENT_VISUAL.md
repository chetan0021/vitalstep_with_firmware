# Vercel Deployment - Visual Step-by-Step

## =��� Pre-Deployment Checklist

- [ ] GitHub account created (https://github.com/signup)
- [ ] Vercel account created (https://vercel.com/signup)
- [ ] Admin dashboard code ready (in admin-dashboard folder)
- [ ] All 9 files created G��
- [ ] .env.local configured G��

---

## =��� STEP 1: Create GitHub Repository

### 1.1 Go to GitHub New Repo
```
https://github.com/new
```

### 1.2 Fill in details

```
Repository name:          vitalstep-admin-dashboard
Description:              VitalStep Admin Manufacturing Dashboard
Visibility:               G�� Public  G�� Private (your choice)

DO NOT check:
G�� Add a README file
G�� Add .gitignore
G�� Choose a license
```

### 1.3 Click "Create repository"

You'll see this screen:

```
Quick setup G�� if you've done this kind of thing before
G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��
HTTPS    SSH    GitHub CLI

Copy the https URL:
https://github.com/YOUR_USERNAME/vitalstep-admin-dashboard.git
```

**Copy this URL!** You'll need it in Step 3.

---

## =��� STEP 2: Push Code to GitHub

### 2.1 Open Terminal

```bash
cd c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\admin-dashboard
```

### 2.2 Run These Commands

```bash
# Initialize git
git init

# Configure
git config user.email "admin@vitalstep.com"
git config user.name "VitalStep Admin"

# Add files
git add .

# Commit
git commit -m "Initial VitalStep Admin Dashboard"

# Set main branch
git branch -M main

# Add remote (PASTE your GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/vitalstep-admin-dashboard.git

# Push
git push -u origin main
```

### 2.3 Verify on GitHub

Go to your repo:
```
https://github.com/YOUR_USERNAME/vitalstep-admin-dashboard
```

You should see G�� all your files!

---

## =��� STEP 3: Deploy to Vercel

### 3.1 Go to Vercel

```
https://vercel.com/new
```

### 3.2 Sign In with GitHub

```
"Continue with GitHub"
G��
Authorize Vercel
```

### 3.3 Select Your Repository

You should see:
```
G�� vitalstep-admin-dashboard    [Select]
```

Click **Select**

### 3.4 Configure Project

Screen shows:

```
G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��
G�� Create a new project                    G��
G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��
G�� Project Name: vitalstep-admin-dashboardG��
G�� Framework Preset: Next.js G��           G��
G�� Root Directory: . G��                   G��
G��                                        G��
G�� Environment Variables (IMPORTANT!) G��n+�  G��
G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��
```

### 3.5 ADD ENVIRONMENT VARIABLES

**Click "Environment Variables"**

Add ALL 4:

```
G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��
G�� Name: NEXT_PUBLIC_SUPABASE_URL                  G��
G�� Value: https://oyqecdcpicvzwwvwaeka.supabase.coG��
G�� [Add]                                            G��
G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��

G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��
G�� Name: NEXT_PUBLIC_SUPABASE_ANON_KEY             G��
G�� Value: sb_publishable_5ovuyYHtObqNMcjEFrNo6Q... G��
G�� [Add]                                            G��
G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��

G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��
G�� Name: NEXT_PUBLIC_SUPABASE_SERVICE_KEY          G��
G�� Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... G��
G�� [Add]                                            G��
G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��

G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��
G�� Name: NEXT_PUBLIC_EDGE_FUNCTION_URL             G��
G�� Value: https://oyqecdcpicvzwwvwaeka.supabase... G��
G�� [Add]                                            G��
G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��
```

### 3.6 Click Deploy

```
[Deploy Button]
     G��
   Building...
     G��
  G�� Build Successful
     G��
[Visit] [View Git]
```

Wait 2-3 minutes for build to complete.

---

## =��� STEP 4: Your Live Dashboard!

### 4.1 Click "Visit"

You'll see your deployed dashboard at:

```
https://vitalstep-admin-dashboard.vercel.app
```

### 4.2 Login

```
Email:    admin@vitalstep.com
Password: Admin123!@#
```

### 4.3 Test All Features

- G�� Dashboard loads
- G�� Can login
- G�� Can generate device
- G�� Can view inventory
- G�� Can view audit log
- G�� Can logout

---

## =��� Deployment Summary

```
G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��
G��         VITALSTEP ADMIN DASHBOARD            G��
G��                                              G��
G�� G�� GitHub Repo: vitalstep-admin-dashboard   G��
G�� G�� Vercel Deployment: Live                  G��
G�� G�� URL: https://vitalstep-admin-dashboard... G��
G�� G�� Environment Variables: Configured        G��
G�� G�� Database: Supabase (Connected)           G��
G�� G�� Authentication: Working                  G��
G�� G�� Edge Function: Deployed                  G��
G��                                              G��
G�� Status: =��� PRODUCTION READY                 G��
G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��
```

---

## =��� Copy-Paste Environment Variables

If you need to add them again:

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://oyqecdcpicvzwwvwaeka.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: sb_publishable_**REDACTED_USE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ENV_VAR**

Name: NEXT_PUBLIC_SUPABASE_SERVICE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWVjZGNwaWN2end3dndhaWVrYSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MjkxNzgyODksImV4cCI6MTk0NDc1NDI4OX0.BOq0IzVVXsQhc8X_UMB-OxW5CtVfWvk9mf9wCY0kcjU

Name: NEXT_PUBLIC_EDGE_FUNCTION_URL
Value: https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/generate-device-id
```

---

## G�� Verification Checklist

After Deployment:

- [ ] GitHub repo created
- [ ] Code pushed to GitHub
- [ ] Vercel project connected
- [ ] Environment variables added (all 4)
- [ ] Build successful
- [ ] Dashboard loads
- [ ] Can login with admin credentials
- [ ] Can generate device in production
- [ ] Device appears in inventory
- [ ] Edge Function works
- [ ] Audit log shows activity

---

## =��� Congratulations!

Your VitalStep Admin Dashboard is now **LIVE in production!** =���

**Share this URL with your team:**
```
https://vitalstep-admin-dashboard.vercel.app
```

**Credentials:**
```
Email: admin@vitalstep.com
Password: Admin123!@#
```

---

## =��P Support

If you encounter issues:

1. Check Vercel logs: Project Settings G�� Logs
2. Check Supabase logs: Functions G�� generate-device-id G�� Executions
3. Verify environment variables match exactly
4. Check browser console: F12 G�� Console

---

**=��� You're all set! Enjoy your production dashboard!**
