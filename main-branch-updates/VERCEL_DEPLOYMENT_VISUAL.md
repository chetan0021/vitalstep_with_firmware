# Vercel Deployment - Visual Step-by-Step

## =ƒôï Pre-Deployment Checklist

- [ ] GitHub account created (https://github.com/signup)
- [ ] Vercel account created (https://vercel.com/signup)
- [ ] Admin dashboard code ready (in admin-dashboard folder)
- [ ] All 9 files created G£à
- [ ] .env.local configured G£à

---

## =ƒö¦ STEP 1: Create GitHub Repository

### 1.1 Go to GitHub New Repo
```
https://github.com/new
```

### 1.2 Fill in details

```
Repository name:          vitalstep-admin-dashboard
Description:              VitalStep Admin Manufacturing Dashboard
Visibility:               GÿÉ Public  Gÿæ Private (your choice)

DO NOT check:
GÿÉ Add a README file
GÿÉ Add .gitignore
GÿÉ Choose a license
```

### 1.3 Click "Create repository"

You'll see this screen:

```
Quick setup GÇö if you've done this kind of thing before
GöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöüGöü
HTTPS    SSH    GitHub CLI

Copy the https URL:
https://github.com/YOUR_USERNAME/vitalstep-admin-dashboard.git
```

**Copy this URL!** You'll need it in Step 3.

---

## =ƒö¦ STEP 2: Push Code to GitHub

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

You should see G£à all your files!

---

## =ƒƒá STEP 3: Deploy to Vercel

### 3.1 Go to Vercel

```
https://vercel.com/new
```

### 3.2 Sign In with GitHub

```
"Continue with GitHub"
Gåô
Authorize Vercel
```

### 3.3 Select Your Repository

You should see:
```
GÿÉ vitalstep-admin-dashboard    [Select]
```

Click **Select**

### 3.4 Configure Project

Screen shows:

```
GöîGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÉ
Göé Create a new project                    Göé
Gö£GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöñ
Göé Project Name: vitalstep-admin-dashboardGöé
Göé Framework Preset: Next.js G£à           Göé
Göé Root Directory: . G£à                   Göé
Göé                                        Göé
Göé Environment Variables (IMPORTANT!) G¼çn+Å  Göé
GööGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÿ
```

### 3.5 ADD ENVIRONMENT VARIABLES

**Click "Environment Variables"**

Add ALL 4:

```
GöîGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÉ
Göé Name: NEXT_PUBLIC_SUPABASE_URL                  Göé
Göé Value: https://oyqecdcpicvzwwvwaeka.supabase.coGöé
Göé [Add]                                            Göé
GööGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÿ

GöîGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÉ
Göé Name: NEXT_PUBLIC_SUPABASE_ANON_KEY             Göé
Göé Value: sb_publishable_5ovuyYHtObqNMcjEFrNo6Q... Göé
Göé [Add]                                            Göé
GööGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÿ

GöîGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÉ
Göé Name: NEXT_PUBLIC_SUPABASE_SERVICE_KEY          Göé
Göé Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... Göé
Göé [Add]                                            Göé
GööGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÿ

GöîGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÉ
Göé Name: NEXT_PUBLIC_EDGE_FUNCTION_URL             Göé
Göé Value: https://oyqecdcpicvzwwvwaeka.supabase... Göé
Göé [Add]                                            Göé
GööGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÿ
```

### 3.6 Click Deploy

```
[Deploy Button]
     Gåô
   Building...
     Gåô
  G£à Build Successful
     Gåô
[Visit] [View Git]
```

Wait 2-3 minutes for build to complete.

---

## =ƒƒó STEP 4: Your Live Dashboard!

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

- G£à Dashboard loads
- G£à Can login
- G£à Can generate device
- G£à Can view inventory
- G£à Can view audit log
- G£à Can logout

---

## =ƒôè Deployment Summary

```
GöîGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÉ
Göé         VITALSTEP ADMIN DASHBOARD            Göé
Göé                                              Göé
Göé G£à GitHub Repo: vitalstep-admin-dashboard   Göé
Göé G£à Vercel Deployment: Live                  Göé
Göé G£à URL: https://vitalstep-admin-dashboard... Göé
Göé G£à Environment Variables: Configured        Göé
Göé G£à Database: Supabase (Connected)           Göé
Göé G£à Authentication: Working                  Göé
Göé G£à Edge Function: Deployed                  Göé
Göé                                              Göé
Göé Status: =ƒÜÇ PRODUCTION READY                 Göé
GööGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÿ
```

---

## =ƒöù Copy-Paste Environment Variables

If you need to add them again:

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://oyqecdcpicvzwwvwaeka.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi

Name: NEXT_PUBLIC_SUPABASE_SERVICE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWVjZGNwaWN2end3dndhaWVrYSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MjkxNzgyODksImV4cCI6MTk0NDc1NDI4OX0.BOq0IzVVXsQhc8X_UMB-OxW5CtVfWvk9mf9wCY0kcjU

Name: NEXT_PUBLIC_EDGE_FUNCTION_URL
Value: https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/generate-device-id
```

---

## G£à Verification Checklist

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

## =ƒÄë Congratulations!

Your VitalStep Admin Dashboard is now **LIVE in production!** =ƒÜÇ

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

## =ƒôP Support

If you encounter issues:

1. Check Vercel logs: Project Settings GåÆ Logs
2. Check Supabase logs: Functions GåÆ generate-device-id GåÆ Executions
3. Verify environment variables match exactly
4. Check browser console: F12 GåÆ Console

---

**=ƒÄè You're all set! Enjoy your production dashboard!**
