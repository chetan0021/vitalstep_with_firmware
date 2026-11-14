# 🚀 GitHub Push & Vercel Deployment Guide

## STEP 1: Stop Dev Server

If still running, press **CTRL+C** in the terminal to stop the dev server.

---

## STEP 2: Push to GitHub

### Option A: Using GitHub Desktop (Easiest)

1. **Open GitHub Desktop**
2. **File** → **Add Local Repository**
3. Select: `C:\Users\Appmaker\Documents\vitalstep_with_firmware-master\admin-dashboard`
4. Click **Create a Local Git Repository**
5. In the left panel, you'll see all files
6. **Bottom left**: Type commit message:
   ```
   Initial VitalStep Admin Dashboard - Production Ready
   ```
7. Click **Commit to main**
8. **Publish Repository** (top right)
9. **Name**: `vitalstep-admin-dashboard`
10. **Keep private** (optional)
11. Click **Publish Repository**
12. Done! ✅

### Option B: Using Terminal (Command Line)

Open **new Terminal** in the admin-dashboard folder:

```bash
cd c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\admin-dashboard

# Initialize git
git init

# Configure git
git config user.email "admin@vitalstep.com"
git config user.name "VitalStep Admin"

# Add all files
git add .

# Commit
git commit -m "Initial VitalStep Admin Dashboard - Production Ready"

# Create GitHub repo first (see Step 3)

# Then push:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vitalstep-admin-dashboard.git
git push -u origin main
```

---

## STEP 3: Create GitHub Repository

1. Go to: https://github.com/new
2. **Repository name**: `vitalstep-admin-dashboard`
3. **Description**: `VitalStep Admin Manufacturing Dashboard`
4. **Visibility**: Public or Private (your choice)
5. **DO NOT** initialize with README
6. Click **Create repository**
7. Copy the commands shown and run in terminal

---

## STEP 4: Verify Files on GitHub

Go to: `https://github.com/YOUR_USERNAME/vitalstep-admin-dashboard`

You should see:
```
✅ admin-dashboard/
   ├── lib/
   │   └── supabase.ts
   ├── app/
   │   ├── layout.tsx
   │   ├── login/
   │   ├── dashboard/
   │   ├── globals.css
   ├── components/
   │   └── Sidebar.tsx
   ├── .env.local (hidden by git)
   ├── package.json
   ├── tsconfig.json
   └── README.md
```

---

## STEP 5: Deploy to Vercel

### Step 5.1: Go to Vercel

1. Go to: https://vercel.com/new
2. **Sign up with GitHub** (if not already logged in)
3. Authorize Vercel to access your GitHub

### Step 5.2: Import Project

1. You should see your repo: `vitalstep-admin-dashboard`
2. Click **Select**
3. Click **Import**

### Step 5.3: Configure Project

**Project Name**: `vitalstep-admin-dashboard` (or your choice)

**Framework Preset**: Should auto-detect **Next.js** ✅

**Root Directory**: `.` (root) ✅

### Step 5.4: Add Environment Variables

**CRITICAL**: Before deploying, add ALL 4 variables:

Click **Environment Variables** and add:

**Variable 1:**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://oyqecdcpicvzwwvwaeka.supabase.co
```
Click **Add**

**Variable 2:**
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi
```
Click **Add**

**Variable 3:**
```
Name: NEXT_PUBLIC_SUPABASE_SERVICE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWVjZGNwaWN2end3dndhaWVrYSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MjkxNzgyODksImV4cCI6MTk0NDc1NDI4OX0.BOq0IzVVXsQhc8X_UMB-OxW5CtVfWvk9mf9wCY0kcjU
```
Click **Add**

**Variable 4:**
```
Name: NEXT_PUBLIC_EDGE_FUNCTION_URL
Value: https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/generate-device-id
```
Click **Add**

### Step 5.5: Deploy

1. Click **Deploy**
2. Wait for build to complete (2-3 minutes)
3. See green checkmark ✅
4. Click **Visit** to see your live dashboard!

---

## ✅ Your Live URL

After deployment, you'll get a URL like:

```
https://vitalstep-admin-dashboard.vercel.app
```

**Or with custom domain:**

```
https://dashboard.vitalstep.com
```

---

## 🧪 Test Production

1. Open your Vercel URL
2. Login with:
   - Email: `admin@vitalstep.com`
   - Password: `Admin123!@#`
3. Test all features:
   - ✅ Generate device
   - ✅ View inventory
   - ✅ View audit log
   - ✅ Logout

---

## 📋 Environment Variables Checklist

| Variable | Status | Value |
|----------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ☐ Added | https://oyqecdcpicvzwwvwaeka.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ☐ Added | sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi |
| `NEXT_PUBLIC_SUPABASE_SERVICE_KEY` | ☐ Added | eyJhbGci... |
| `NEXT_PUBLIC_EDGE_FUNCTION_URL` | ☐ Added | https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/generate-device-id |

---

## 🆘 Troubleshooting

### "Build failed"
→ Check that all files were pushed to GitHub  
→ Verify environment variables are correct

### "Can't login in production"
→ Check admin user exists in Supabase  
→ Verify credentials: admin@vitalstep.com / Admin123!@#

### "Generate device fails"
→ Check NEXT_PUBLIC_EDGE_FUNCTION_URL is correct  
→ Check Supabase Edge Function is deployed

### "Environment variables not working"
→ Make sure you added them in Vercel (not just locally)  
→ Redeploy after adding variables

---

## 🎉 Success Indicators

✅ GitHub repo has all files  
✅ Vercel shows "Build successful"  
✅ Dashboard loads at https://vitalstep-admin-dashboard.vercel.app  
✅ Can login with admin credentials  
✅ Can generate devices  
✅ Can view device inventory  

---

## 📞 Next Steps After Deployment

1. **Share URL with team**
   - Send: https://vitalstep-admin-dashboard.vercel.app
   - Credentials: admin@vitalstep.com / Admin123!@#

2. **Add more admins** (optional)
   - Create in Supabase Auth
   - Add to admins table

3. **Monitor** (optional)
   - Check Vercel Analytics
   - Monitor Supabase usage

4. **Custom domain** (optional)
   - Add domain in Vercel settings
   - Configure DNS

---

**All done! Your dashboard is now live in production! 🚀**
