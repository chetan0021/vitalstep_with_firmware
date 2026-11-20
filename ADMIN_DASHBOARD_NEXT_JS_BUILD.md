# =��� VitalStep Admin Dashboard - Complete Next.js Build

## Full Codebase Structure

I'll provide all the code files you need. Create a folder structure like this:

```
vitalstep-admin-dashboard/
G��G��G�� app/
G��   G��G��G�� layout.tsx
G��   G��G��G�� page.tsx
G��   G��G��G�� login/
G��   G��   G��G��G�� page.tsx
G��   G��G��G�� dashboard/
G��   G��   G��G��G�� layout.tsx
G��   G��   G��G��G�� page.tsx
G��   G��   G��G��G�� devices/
G��   G��   G��   G��G��G�� page.tsx
G��   G��   G��G��G�� audit/
G��   G��       G��G��G�� page.tsx
G��   G��G��G�� api/
G��       G��G��G�� auth/
G��           G��G��G�� [...nextauth]/
G��           G��   G��G��G�� route.ts
G��           G��G��G�� logout/
G��               G��G��G�� route.ts
G��G��G�� lib/
G��   G��G��G�� supabase.ts
G��   G��G��G�� auth.ts
G��   G��G��G�� utils.ts
G��G��G�� components/
G��   G��G��G�� Header.tsx
G��   G��G��G�� Sidebar.tsx
G��   G��G��G�� DeviceCard.tsx
G��   G��G��G�� DeviceImage.tsx
G��   G��G��G�� LoadingSpinner.tsx
G��G��G�� public/
G��   G��G��G�� device.jpg
G��G��G�� .env.local
G��G��G�� package.json
G��G��G�� tsconfig.json
G��G��G�� next.config.js
G��G��G�� tailwind.config.ts
G��G��G�� postcss.config.js
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
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_**REDACTED_USE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ENV_VAR**
SUPABASE_SERVICE_KEY=your_service_role_key_here

NEXTAUTH_SECRET=generate_with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

Get `SUPABASE_SERVICE_KEY` from:
Supabase G�� Settings G�� API G�� Service Role Secret Key

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

## Step 3: Code Files

I'll provide complete code for each file. Copy-paste them into your project.

Files ready to be created:
1. G�� lib/supabase.ts - Supabase client
2. G�� lib/auth.ts - Authentication helper
3. G�� lib/utils.ts - Utility functions
4. G�� components/Header.tsx
5. G�� components/Sidebar.tsx
6. G�� components/DeviceImage.tsx
7. G�� components/LoadingSpinner.tsx
8. G�� components/DeviceCard.tsx
9. G�� app/layout.tsx
10. G�� app/page.tsx (login redirect)
11. G�� app/login/page.tsx (login form)
12. G�� app/dashboard/layout.tsx
13. G�� app/dashboard/page.tsx (main dashboard)
14. G�� app/dashboard/devices/page.tsx (device inventory)
15. G�� app/dashboard/audit/page.tsx (audit log)
16. G�� app/api/auth/[...nextauth]/route.ts
17. G�� app/api/auth/logout/route.ts
18. G�� next.config.js
19. G�� tailwind.config.ts
20. G�� Device image handling

---

## Ready?

Confirm you want me to:
1. G�� Create all code files (I'll provide complete code to copy-paste)
2. G�� Test locally
3. G�� Push to GitHub
4. G�� Deploy to Vercel with environment variables

Reply: "Ready - create all files"

Then I'll give you the complete codebase! =���
