# =ƒÜÇ VitalStep Admin Dashboard - Complete Next.js Build

## Full Codebase Structure

I'll provide all the code files you need. Create a folder structure like this:

```
vitalstep-admin-dashboard/
Gö£GöÇGöÇ app/
Göé   Gö£GöÇGöÇ layout.tsx
Göé   Gö£GöÇGöÇ page.tsx
Göé   Gö£GöÇGöÇ login/
Göé   Göé   GööGöÇGöÇ page.tsx
Göé   Gö£GöÇGöÇ dashboard/
Göé   Göé   Gö£GöÇGöÇ layout.tsx
Göé   Göé   Gö£GöÇGöÇ page.tsx
Göé   Göé   Gö£GöÇGöÇ devices/
Göé   Göé   Göé   GööGöÇGöÇ page.tsx
Göé   Göé   GööGöÇGöÇ audit/
Göé   Göé       GööGöÇGöÇ page.tsx
Göé   GööGöÇGöÇ api/
Göé       GööGöÇGöÇ auth/
Göé           Gö£GöÇGöÇ [...nextauth]/
Göé           Göé   GööGöÇGöÇ route.ts
Göé           GööGöÇGöÇ logout/
Göé               GööGöÇGöÇ route.ts
Gö£GöÇGöÇ lib/
Göé   Gö£GöÇGöÇ supabase.ts
Göé   Gö£GöÇGöÇ auth.ts
Göé   GööGöÇGöÇ utils.ts
Gö£GöÇGöÇ components/
Göé   Gö£GöÇGöÇ Header.tsx
Göé   Gö£GöÇGöÇ Sidebar.tsx
Göé   Gö£GöÇGöÇ DeviceCard.tsx
Göé   Gö£GöÇGöÇ DeviceImage.tsx
Göé   GööGöÇGöÇ LoadingSpinner.tsx
Gö£GöÇGöÇ public/
Göé   GööGöÇGöÇ device.jpg
Gö£GöÇGöÇ .env.local
Gö£GöÇGöÇ package.json
Gö£GöÇGöÇ tsconfig.json
Gö£GöÇGöÇ next.config.js
Gö£GöÇGöÇ tailwind.config.ts
GööGöÇGöÇ postcss.config.js
```

---

## Step 1: Setup Project

```bash
# Create Next.js app
npx create-next-app@latest vitalstep-admin-dashboard \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir

cd vitalstep-admin-dashboard

# Install dependencies
npm install @supabase/supabase-js zustand next-auth jose

# Start dev server
npm run dev
```

---

## Step 2: Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://oyqecdcpicvzwwvwaeka.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi
SUPABASE_SERVICE_KEY=your_service_role_key_here

NEXTAUTH_SECRET=generate_with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

Get `SUPABASE_SERVICE_KEY` from:
Supabase GåÆ Settings GåÆ API GåÆ Service Role Secret Key

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

## Step 3: Code Files

I'll provide complete code for each file. Copy-paste them into your project.

Files ready to be created:
1. G£à lib/supabase.ts - Supabase client
2. G£à lib/auth.ts - Authentication helper
3. G£à lib/utils.ts - Utility functions
4. G£à components/Header.tsx
5. G£à components/Sidebar.tsx
6. G£à components/DeviceImage.tsx
7. G£à components/LoadingSpinner.tsx
8. G£à components/DeviceCard.tsx
9. G£à app/layout.tsx
10. G£à app/page.tsx (login redirect)
11. G£à app/login/page.tsx (login form)
12. G£à app/dashboard/layout.tsx
13. G£à app/dashboard/page.tsx (main dashboard)
14. G£à app/dashboard/devices/page.tsx (device inventory)
15. G£à app/dashboard/audit/page.tsx (audit log)
16. G£à app/api/auth/[...nextauth]/route.ts
17. G£à app/api/auth/logout/route.ts
18. G£à next.config.js
19. G£à tailwind.config.ts
20. G£à Device image handling

---

## Ready?

Confirm you want me to:
1. G£à Create all code files (I'll provide complete code to copy-paste)
2. G£à Test locally
3. G£à Push to GitHub
4. G£à Deploy to Vercel with environment variables

Reply: "Ready - create all files"

Then I'll give you the complete codebase! =ƒÜÇ
