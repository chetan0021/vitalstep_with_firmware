# Complete Dashboard Setup Instructions

## Files Created

All dashboard files have been created and are ready to be used. Here's the complete file structure:

```
admin-dashboard/
Gö£GöÇGöÇ app/
Göé   Gö£GöÇGöÇ layout.tsx              GåÆ dashboard-app-layout.tsx
Göé   Gö£GöÇGöÇ login/
Göé   Göé   GööGöÇGöÇ page.tsx            GåÆ dashboard-app-login-page.tsx
Göé   Gö£GöÇGöÇ dashboard/
Göé   Göé   Gö£GöÇGöÇ layout.tsx          GåÆ dashboard-app-dashboard-layout.tsx
Göé   Göé   Gö£GöÇGöÇ page.tsx            GåÆ dashboard-app-dashboard-page.tsx
Göé   Göé   Gö£GöÇGöÇ generate/
Göé   Göé   Göé   GööGöÇGöÇ page.tsx        GåÆ dashboard-app-dashboard-generate-page.tsx
Göé   Göé   Gö£GöÇGöÇ devices/
Göé   Göé   Göé   GööGöÇGöÇ page.tsx        GåÆ dashboard-app-dashboard-devices-page.tsx
Göé   Göé   GööGöÇGöÇ audit/
Göé   Göé       GööGöÇGöÇ page.tsx        GåÆ dashboard-app-dashboard-audit-page.tsx
Gö£GöÇGöÇ components/
Göé   GööGöÇGöÇ Sidebar.tsx             GåÆ dashboard-components-sidebar.tsx
Gö£GöÇGöÇ lib/
Göé   GööGöÇGöÇ supabase.ts             GåÆ dashboard-lib-supabase.ts
Gö£GöÇGöÇ .env.local                  GåÆ (create with env variables)
GööGöÇGöÇ package.json                GåÆ (created with dependencies)
```

---

## STEP 1: Create Next.js Project

**Run in terminal:**

```bash
cd c:\Users\Appmaker\Documents\vitalstep_with_firmware-master
npx create-next-app@latest admin-dashboard --typescript --tailwind --app
```

**When prompted, select:**
- Would you like to use TypeScript? GåÆ Yes
- Would you like to use ESLint? GåÆ Yes
- Would you like to use Tailwind CSS? GåÆ Yes
- Would you like to use `src/` directory? GåÆ No
- Would you like to use App Router? GåÆ Yes
- Would you like to customize the default import alias? GåÆ No

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
Dashboard Files Location                  GåÆ Next.js Project Location
dashboard-lib-supabase.ts                 GåÆ lib/supabase.ts
dashboard-app-layout.tsx                  GåÆ app/layout.tsx
dashboard-app-login-page.tsx              GåÆ app/login/page.tsx
dashboard-app-dashboard-layout.tsx        GåÆ app/dashboard/layout.tsx
dashboard-app-dashboard-page.tsx          GåÆ app/dashboard/page.tsx
dashboard-app-dashboard-generate-page.tsx GåÆ app/dashboard/generate/page.tsx
dashboard-app-dashboard-devices-page.tsx  GåÆ app/dashboard/devices/page.tsx
dashboard-app-dashboard-audit-page.tsx    GåÆ app/dashboard/audit/page.tsx
dashboard-components-sidebar.tsx          GåÆ components/Sidebar.tsx
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

### =ƒÅá Dashboard Home
- View device statistics
- See total devices, manufactured, paired
- Recent devices list

### =ƒöº Generate Device
- Create new device IDs
- Download SD card files (devicecode.txt + devicesecret.txt)
- Copy device code and secret to clipboard

### =ƒôï Device Inventory
- View all devices in a table
- Filter by status (Manufactured, Paired, In Field, Retired)
- Search by device code

### =ƒôè Audit Log
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

Add these in Vercel Project Settings GåÆ Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://oyqecdcpicvzwwvwaeka.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi |
| `NEXT_PUBLIC_SUPABASE_SERVICE_KEY` | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |
| `NEXT_PUBLIC_EDGE_FUNCTION_URL` | https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/generate-device-id |

---

## Troubleshooting

### Issue: "Module not found"
GåÆ Run `npm install`

### Issue: "Supabase connection error"
GåÆ Check .env.local variables

### Issue: "Cannot generate device"
GåÆ Check Edge Function is deployed and admin user exists

### Issue: "Login fails"
GåÆ Check admin user credentials in Supabase Auth

---

## Next Steps

1. G£à Run locally to test
2. G£à Push to GitHub
3. G£à Deploy to Vercel
4. G£à Test in production
5. G£à Share dashboard URL with team

---

Your dashboard is now ready! =ƒÜÇ
