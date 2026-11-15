# Complete Vercel Deployment Guide

## PART 1: Build & Push to GitHub

### Step 1: Create Next.js Project

Open Terminal and run:

```bash
cd c:\Users\Appmaker\Documents\vitalstep_with_firmware-master
npx create-next-app@latest admin-dashboard --typescript --tailwind --app
```

When prompted:
- TypeScript? → Yes
- ESLint? → Yes
- Tailwind? → Yes
- src/ directory? → No
- App Router? → Yes
- Import alias? → No

```bash
cd admin-dashboard
```

---

### Step 2: Install Dependencies

```bash
npm install @supabase/supabase-js lucide-react
```

---

### Step 3: Copy Dashboard Files

Copy these files from the project root folder to the admin-dashboard:

**Library File:**
```
FROM: c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\dashboard-lib-supabase.ts
TO:   admin-dashboard\lib\supabase.ts
```

**Layout File:**
```
FROM: c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\dashboard-app-layout.tsx
TO:   admin-dashboard\app\layout.tsx
```

**Login Page:**
```
FROM: c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\dashboard-app-login-page.tsx
TO:   admin-dashboard\app\login\page.tsx
```

**Dashboard Layout:**
```
FROM: c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\dashboard-app-dashboard-layout.tsx
TO:   admin-dashboard\app\dashboard\layout.tsx
```

**Dashboard Home Page:**
```
FROM: c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\dashboard-app-dashboard-page.tsx
TO:   admin-dashboard\app\dashboard\page.tsx
```

**Generate Page:**
```
FROM: c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\dashboard-app-dashboard-generate-page.tsx
TO:   admin-dashboard\app\dashboard\generate\page.tsx
```

**Devices Page:**
```
FROM: c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\dashboard-app-dashboard-devices-page.tsx
TO:   admin-dashboard\app\dashboard\devices\page.tsx
```

**Audit Page:**
```
FROM: c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\dashboard-app-dashboard-audit-page.tsx
TO:   admin-dashboard\app\dashboard\audit\page.tsx
```

**Sidebar Component:**
```
FROM: c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\dashboard-components-sidebar.tsx
TO:   admin-dashboard\components\Sidebar.tsx
```

---

### Step 4: Create .env.local

In the admin-dashboard root, create `.env.local`:

**File: admin-dashboard/.env.local**

```
NEXT_PUBLIC_SUPABASE_URL=https://oyqecdcpicvzwwvwaeka.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWVjZGNwaWN2end3dndhaWVrYSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MjkxNzgyODksImV4cCI6MTk0NDc1NDI4OX0.BOq0IzVVXsQhc8X_UMB-OxW5CtVfWvk9mf9wCY0kcjU
NEXT_PUBLIC_EDGE_FUNCTION_URL=https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/generate-device-id
```

**IMPORTANT**: Never commit this file. Add to .gitignore (should already be there)

---

### Step 5: Update globals.css

**File: admin-dashboard/app/globals.css**

Replace all content with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  background-color: #f9fafb;
}
```

---

### Step 6: Test Locally

```bash
npm run dev
```

Visit: **http://localhost:3000**

Login:
- Email: `admin@vitalstep.com`
- Password: `Admin123!@#`

Test the dashboard:
- ✅ Can you login?
- ✅ Can you navigate to Dashboard?
- ✅ Can you generate a device?
- ✅ Can you view devices?

---

### Step 7: Initialize Git & Push to GitHub

```bash
git init
git add .
git commit -m "Initial VitalStep Admin Dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vitalstep-admin-dashboard.git
git push -u origin main
```

**Replace `YOUR_USERNAME`** with your GitHub username

**Go to your GitHub repo**: https://github.com/YOUR_USERNAME/vitalstep-admin-dashboard

Verify all files are there ✅

---

## PART 2: Deploy to Vercel

### Step 1: Create Vercel Account

Go to: https://vercel.com/signup

Sign up with GitHub

---

### Step 2: Import Project

1. Go to: https://vercel.com/new
2. Click **"Continue with GitHub"**
3. Select your GitHub repo: **vitalstep-admin-dashboard**
4. Click **"Import"**

---

### Step 3: Configure Project

In the Vercel import screen:

**Project Name:** `vitalstep-admin-dashboard` (or your choice)

**Framework Preset:** Select **"Next.js"** (should auto-detect)

**Root Directory:** Select `.` (root - should be default)

---

### Step 4: Add Environment Variables

Before clicking "Deploy", scroll to "Environment Variables"

**Add these variables** (copy-paste ready):

**Variable 1:**
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://oyqecdcpicvzwwvwaeka.supabase.co`
- Click "Add"

**Variable 2:**
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi`
- Click "Add"

**Variable 3:**
- Name: `NEXT_PUBLIC_SUPABASE_SERVICE_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWVjZGNwaWN2end3dndhaWVrYSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MjkxNzgyODksImV4cCI6MTk0NDc1NDI4OX0.BOq0IzVVXsQhc8X_UMB-OxW5CtVfWvk9mf9wCY0kcjU`
- Click "Add"

**Variable 4:**
- Name: `NEXT_PUBLIC_EDGE_FUNCTION_URL`
- Value: `https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/generate-device-id`
- Click "Add"

---

### Step 5: Deploy

Click **"Deploy"**

Vercel will:
1. Build your Next.js app
2. Deploy to edge network
3. Give you a live URL

Wait for green checkmark ✅

---

### Step 6: Get Your Live URL

After deployment completes:

You'll see: **"Congratulations! Your site is live"**

Your dashboard is now at: **https://vitalstep-admin-dashboard.vercel.app** (or your custom domain)

---

## PART 3: Post-Deployment

### Test Production

1. Go to your live URL
2. Login with credentials:
   - Email: `admin@vitalstep.com`
   - Password: `Admin123!@#`
3. Test all features

### Share with Team

Send the URL: `https://your-deployment.vercel.app`

---

## Environment Variables Summary

```
NEXT_PUBLIC_SUPABASE_URL=https://oyqecdcpicvzwwvwaeka.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi

NEXT_PUBLIC_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWVjZGNwaWN2end3dndhaWVrYSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MjkxNzgyODksImV4cCI6MTk0NDc1NDI4OX0.BOq0IzVVXsQhc8X_UMB-OxW5CtVfWvk9mf9wCY0kcjU

NEXT_PUBLIC_EDGE_FUNCTION_URL=https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/generate-device-id
```

---

## Files in Root Directory

When deploying, Vercel automatically detects:

- ✅ `package.json` - Dependencies
- ✅ `next.config.js` - Next.js config
- ✅ `tsconfig.json` - TypeScript config
- ✅ `.env.local` - Local env (NOT deployed, use Vercel UI for production)
- ✅ `app/` - Your application code
- ✅ `components/` - Reusable components
- ✅ `lib/` - Utilities

**Don't need to select any specific file** - Vercel auto-detects Next.js projects!

---

## Troubleshooting

### "Build failed"
→ Check that all dependencies are in package.json
→ Run `npm run build` locally to debug

### "Environment variables not working"
→ Check you added them in Vercel Project Settings → Environment Variables
→ Redeploy after adding variables

### "Dashboard shows blank page"
→ Check browser console for errors (F12)
→ Verify Supabase URL and keys are correct

### "Login not working"
→ Check admin user exists in Supabase
→ Verify credentials: admin@vitalstep.com / Admin123!@#

---

## Custom Domain (Optional)

To use a custom domain:

1. In Vercel, go to Project Settings → Domains
2. Add your domain
3. Follow DNS setup instructions
4. Takes 5-10 minutes to propagate

---

You're all set! 🚀

Your production dashboard is live!
