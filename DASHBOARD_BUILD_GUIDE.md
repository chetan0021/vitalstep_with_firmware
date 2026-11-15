# Next.js Admin Dashboard - Build Guide

## STEP 1: Create Next.js Project

```bash
cd c:\Users\Appmaker\Documents\vitalstep_with_firmware-master
npx create-next-app@latest admin-dashboard --typescript --tailwind --app
cd admin-dashboard
```

When prompted:
- ESLint: Yes
- src/ directory: No
- App Router: Yes
- TypeScript: Yes

---

## STEP 2: Install Dependencies

```bash
npm install @supabase/supabase-js
npm install lucide-react  # for icons
npm install -D @types/node
```

---

## STEP 3: Create Environment File

Create `.env.local` in the admin-dashboard root:

```
NEXT_PUBLIC_SUPABASE_URL=https://oyqecdcpicvzwwvwaeka.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWVjZGNwaWN2end3dndhaWVrYSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MjkxNzgyODksImV4cCI6MTk0NDc1NDI4OX0.BOq0IzVVXsQhc8X_UMB-OxW5CtVfWvk9mf9wCY0kcjU
NEXT_PUBLIC_EDGE_FUNCTION_URL=https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/generate-device-id
```

**Note**: Get SERVICE_KEY from Supabase → Settings → API → Service Role Key

---

## STEP 4: Build Project Files

The dashboard will have:

1. **app/layout.tsx** - Main layout
2. **app/login/page.tsx** - Login page
3. **app/dashboard/page.tsx** - Main dashboard
4. **app/dashboard/generate/page.tsx** - Generate device page
5. **app/dashboard/devices/page.tsx** - Device inventory
6. **app/dashboard/audit/page.tsx** - Audit log
7. **lib/supabase.ts** - Supabase client
8. **components/...** - Reusable components

I'll create all these files now.

---

## STEP 5: Run Dashboard

```bash
npm run dev
```

Visit: http://localhost:3000

Login with:
- Email: admin@vitalstep.com
- Password: Admin123!@#

---

## STEP 6: Deploy to Vercel

```bash
git init
git add .
git commit -m "Initial dashboard commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vitalstep-admin-dashboard.git
git push -u origin main
```

Then on Vercel:
1. Import GitHub repo
2. Set environment variables
3. Deploy

---

Let me create all the dashboard files now!
