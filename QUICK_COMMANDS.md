# Quick Copy-Paste Commands

## 1. Create Next.js Project

```bash
cd c:\Users\Appmaker\Documents\vitalstep_with_firmware-master
npx create-next-app@latest admin-dashboard --typescript --tailwind --app
cd admin-dashboard
npm install @supabase/supabase-js lucide-react
```

---

## 2. Create Directory Structure

```bash
# Create directories
mkdir lib
mkdir -p app\login
mkdir -p app\dashboard\generate
mkdir -p app\dashboard\devices
mkdir -p app\dashboard\audit
mkdir components
```

---

## 3. Environment File

Create `.env.local` in root with this exact content:

```
NEXT_PUBLIC_SUPABASE_URL=https://oyqecdcpicvzwwvwaeka.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWVjZGNwaWN2end3dndhaWVrYSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MjkxNzgyODksImV4cCI6MTk0NDc1NDI4OX0.BOq0IzVVXsQhc8X_UMB-OxW5CtVfWvk9mf9wCY0kcjU
NEXT_PUBLIC_EDGE_FUNCTION_URL=https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/generate-device-id
```

---

## 4. Update globals.css

Replace entire content of `app/globals.css` with:

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

## 5. Test Locally

```bash
npm run dev
```

Then visit: http://localhost:3000

---

## 6. Git Commands

```bash
git init
git add .
git commit -m "Initial VitalStep Admin Dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vitalstep-admin-dashboard.git
git push -u origin main
```

**Replace `YOUR_USERNAME` with your GitHub username**

---

## 7. Vercel Environment Variables

Add these in Vercel Project Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL = https://oyqecdcpicvzwwvwaeka.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi

NEXT_PUBLIC_SUPABASE_SERVICE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWVjZGNwaWN2end3dndhaWVrYSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MjkxNzgyODksImV4cCI6MTk0NDc1NDI4OX0.BOq0IzVVXsQhc8X_UMB-OxW5CtVfWvk9mf9wCY0kcjU

NEXT_PUBLIC_EDGE_FUNCTION_URL = https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/generate-device-id
```

---

## 8. Vercel Deploy Steps

1. Go to https://vercel.com/new
2. Click "Continue with GitHub"
3. Select: vitalstep-admin-dashboard
4. Click "Import"
5. Add environment variables (from step 7)
6. Click "Deploy"
7. Wait for green checkmark
8. Get live URL

---

## 9. Test Login Credentials

```
Email: admin@vitalstep.com
Password: Admin123!@#
```

---

## 10. Dashboard URLs

Once deployed:

```
Live Dashboard: https://vitalstep-admin-dashboard.vercel.app
(or your custom domain)

Local Testing: http://localhost:3000
```

---

## 11. File Mapping for Copy-Paste

Source files to destination:

```
FROM: c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\dashboard-lib-supabase.ts
TO:   admin-dashboard\lib\supabase.ts

FROM: c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\dashboard-app-layout.tsx
TO:   admin-dashboard\app\layout.tsx

FROM: c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\dashboard-app-login-page.tsx
TO:   admin-dashboard\app\login\page.tsx

FROM: c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\dashboard-app-dashboard-layout.tsx
TO:   admin-dashboard\app\dashboard\layout.tsx

FROM: c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\dashboard-app-dashboard-page.tsx
TO:   admin-dashboard\app\dashboard\page.tsx

FROM: c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\dashboard-app-dashboard-generate-page.tsx
TO:   admin-dashboard\app\dashboard\generate\page.tsx

FROM: c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\dashboard-app-dashboard-devices-page.tsx
TO:   admin-dashboard\app\dashboard\devices\page.tsx

FROM: c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\dashboard-app-dashboard-audit-page.tsx
TO:   admin-dashboard\app\dashboard\audit\page.tsx

FROM: c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\dashboard-components-sidebar.tsx
TO:   admin-dashboard\components\Sidebar.tsx
```

---

## Quick Summary

1. ✅ Run all commands from Step 1-6
2. ✅ Copy all files from Step 11
3. ✅ Test with Step 5
4. ✅ Push to GitHub with Step 6
5. ✅ Deploy to Vercel with Step 8
6. ✅ Login with Step 9
7. ✅ Share production URL!

---

## Troubleshooting

**Module not found?**
```bash
npm install
```

**Build fails?**
```bash
npm run build
```

**Need to reinstall everything?**
```bash
rm -r node_modules package-lock.json
npm install
```

---

Done! 🚀
