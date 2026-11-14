# Complete Dashboard Setup Instructions

## Files Created

All dashboard files have been created and are ready to be used. Here's the complete file structure:

```
admin-dashboard/
├── app/
│   ├── layout.tsx              → dashboard-app-layout.tsx
│   ├── login/
│   │   └── page.tsx            → dashboard-app-login-page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx          → dashboard-app-dashboard-layout.tsx
│   │   ├── page.tsx            → dashboard-app-dashboard-page.tsx
│   │   ├── generate/
│   │   │   └── page.tsx        → dashboard-app-dashboard-generate-page.tsx
│   │   ├── devices/
│   │   │   └── page.tsx        → dashboard-app-dashboard-devices-page.tsx
│   │   └── audit/
│   │       └── page.tsx        → dashboard-app-dashboard-audit-page.tsx
├── components/
│   └── Sidebar.tsx             → dashboard-components-sidebar.tsx
├── lib/
│   └── supabase.ts             → dashboard-lib-supabase.ts
├── .env.local                  → (create with env variables)
└── package.json                → (created with dependencies)
```

---

## STEP 1: Create Next.js Project

**Run in terminal:**

```bash
cd c:\Users\Appmaker\Documents\vitalstep_with_firmware-master
npx create-next-app@latest admin-dashboard --typescript --tailwind --app
```

**When prompted, select:**
- Would you like to use TypeScript? → Yes
- Would you like to use ESLint? → Yes
- Would you like to use Tailwind CSS? → Yes
- Would you like to use `src/` directory? → No
- Would you like to use App Router? → Yes
- Would you like to customize the default import alias? → No

---

## STEP 2: Install Dependencies

```bash
cd admin-dashboard
npm install @supabase/supabase-js lucide-react
```

---

## STEP 3: Copy All Dashboard Files

Copy the files from the project folder into the appropriate locations:

```
Dashboard Files Location                  → Next.js Project Location
dashboard-lib-supabase.ts                 → lib/supabase.ts
dashboard-app-layout.tsx                  → app/layout.tsx
dashboard-app-login-page.tsx              → app/login/page.tsx
dashboard-app-dashboard-layout.tsx        → app/dashboard/layout.tsx
dashboard-app-dashboard-page.tsx          → app/dashboard/page.tsx
dashboard-app-dashboard-generate-page.tsx → app/dashboard/generate/page.tsx
dashboard-app-dashboard-devices-page.tsx  → app/dashboard/devices/page.tsx
dashboard-app-dashboard-audit-page.tsx    → app/dashboard/audit/page.tsx
dashboard-components-sidebar.tsx          → components/Sidebar.tsx
```

---

## STEP 4: Create Environment File

Create `.env.local` in the admin-dashboard root:

```
NEXT_PUBLIC_SUPABASE_URL=https://oyqecdcpicvzwwvwaeka.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWVjZGNwaWN2end3dndhaWVrYSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MjkxNzgyODksImV4cCI6MTk0NDc1NDI4OX0.BOq0IzVVXsQhc8X_UMB-OxW5CtVfWvk9mf9wCY0kcjU
NEXT_PUBLIC_EDGE_FUNCTION_URL=https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/generate-device-id
```

---

## STEP 5: Update globals.css

Update `app/globals.css` with proper Tailwind setup:

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

## STEP 6: Run Development Server

```bash
npm run dev
```

Open browser: **http://localhost:3000**

---

## STEP 7: Login

**Email:** admin@vitalstep.com  
**Password:** Admin123!@#

---

## Dashboard Features

### 🏠 Dashboard Home
- View device statistics
- See total devices, manufactured, paired
- Recent devices list

### 🔧 Generate Device
- Create new device IDs
- Download SD card files (devicecode.txt + devicesecret.txt)
- Copy device code and secret to clipboard

### 📋 Device Inventory
- View all devices in a table
- Filter by status (Manufactured, Paired, In Field, Retired)
- Search by device code

### 📊 Audit Log
- View all admin actions
- See timestamps and device codes
- Track device generation events

---

## STEP 8: Deploy to GitHub

```bash
git init
git add .
git commit -m "Initial admin dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vitalstep-admin-dashboard.git
git push -u origin main
```

---

## STEP 9: Deploy to Vercel

1. Go to **vercel.com**
2. Click **New Project**
3. Select your GitHub repo
4. Set Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   NEXT_PUBLIC_SUPABASE_SERVICE_KEY
   NEXT_PUBLIC_EDGE_FUNCTION_URL
   ```
5. Click **Deploy**

---

## Vercel Environment Variables

Add these in Vercel Project Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://oyqecdcpicvzwwvwaeka.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi |
| `NEXT_PUBLIC_SUPABASE_SERVICE_KEY` | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |
| `NEXT_PUBLIC_EDGE_FUNCTION_URL` | https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/generate-device-id |

---

## Troubleshooting

### Issue: "Module not found"
→ Run `npm install`

### Issue: "Supabase connection error"
→ Check .env.local variables

### Issue: "Cannot generate device"
→ Check Edge Function is deployed and admin user exists

### Issue: "Login fails"
→ Check admin user credentials in Supabase Auth

---

## Next Steps

1. ✅ Run locally to test
2. ✅ Push to GitHub
3. ✅ Deploy to Vercel
4. ✅ Test in production
5. ✅ Share dashboard URL with team

---

Your dashboard is now ready! 🚀
