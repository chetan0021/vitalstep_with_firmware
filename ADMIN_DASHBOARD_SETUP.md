# 🏭 Admin Manufacturing Dashboard - Complete Setup Guide

## PART 1: Supabase Backend Setup

### Step 1.1: Create Admin Tables in Supabase

Go to **SQL Editor** in Supabase and run this SQL:

```sql
-- Admin users table
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  role text DEFAULT 'device_manager',
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

-- Device inventory (track all manufactured devices)
CREATE TABLE IF NOT EXISTS public.device_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_code text UNIQUE NOT NULL,           -- VS-001001, VS-001002, etc.
  device_secret text UNIQUE NOT NULL,         -- SHA256 hex (64 chars)
  status text DEFAULT 'manufactured',         -- 'manufactured', 'in_field', 'paired', 'retired'
  paired_user_id uuid,                        -- user who paired it
  paired_at timestamp,
  notes text,
  created_at timestamp DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id)
);

-- Audit log
CREATE TABLE IF NOT EXISTS public.device_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,                       -- 'generated', 'paired', 'retired'
  device_code text NOT NULL,
  details text,
  created_at timestamp DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_audit ENABLE ROW LEVEL SECURITY;

-- Admin can see own profile
CREATE POLICY "admins_read_own" ON public.admins
  FOR SELECT USING (auth.uid() = id);

-- Anyone can read device inventory (for app pairing verification)
CREATE POLICY "device_inventory_public_read" ON public.device_inventory
  FOR SELECT USING (true);

-- Only admins can insert devices
CREATE POLICY "admins_insert_devices" ON public.device_inventory
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_active = true)
  );

-- Only admins can update devices
CREATE POLICY "admins_update_devices" ON public.device_inventory
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_active = true)
  );

-- Audit log (admins can insert)
CREATE POLICY "admins_audit_insert" ON public.device_audit
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_active = true)
  );
```

---

### Step 1.2: Create Edge Function to Generate Device IDs

Go to **Edge Functions** → **+ Create a new function** → Name: `generate-device-id`

Paste this code:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get auth token
    const authorization = req.headers.get('authorization')
    if (!authorization) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Check if user is admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !admin) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Not an authorized admin' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Get the last device code to determine next number
    const { data: lastDevices } = await supabase
      .from('device_inventory')
      .select('device_code')
      .order('created_at', { ascending: false })
      .limit(1)

    let nextNumber = 1001  // Start from VS-001001
    if (lastDevices && lastDevices.length > 0) {
      const lastCode = lastDevices[0].device_code  // e.g., "VS-92026"
      const numberPart = parseInt(lastCode.split('-')[1])
      nextNumber = numberPart + 1
    }

    // Generate device_code
    const device_code = `VS-${String(nextNumber).padStart(6, '0')}`

    // Generate device_secret (SHA256 hex - 64 chars)
    const secretBytes = new Uint8Array(32)  // 32 bytes = 64 hex chars
    crypto.getRandomValues(secretBytes)
    const device_secret = Array.from(secretBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Insert into device_inventory
    const { data: deviceRecord, error: insertError } = await supabase
      .from('device_inventory')
      .insert([{
        device_code,
        device_secret,
        created_by: user.id,
        status: 'manufactured'
      }])
      .select()
      .single()

    if (insertError) {
      return new Response(
        JSON.stringify({ ok: false, error: insertError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Log to audit trail
    await supabase.from('device_audit').insert([{
      admin_id: user.id,
      action: 'generated',
      device_code,
      details: `Generated new device ID`
    }])

    return new Response(
      JSON.stringify({
        ok: true,
        device_code,
        device_secret,
        created_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
```

**After pasting, click Deploy**

---

### Step 1.3: Create Admin User in Supabase

1. Go to **Authentication** → **Users**
2. **+ Add user**
3. Email: `admin@vitalstep.com`
4. Password: `Admin123!@#` (strong password)
5. Click **Create**
6. Note the User ID (you'll need it)

---

### Step 1.4: Add Admin to admins Table

Go to **SQL Editor** → **+ New Query** → Run this (replace USER_ID with actual UUID from step 1.3):

```sql
INSERT INTO public.admins (id, email, name, role, is_active)
VALUES (
  'PASTE_USER_ID_HERE',
  'admin@vitalstep.com',
  'Manufacturing Admin',
  'device_manager',
  true
);
```

---

## PART 2: Frontend Dashboard (Next.js)

### Step 2.1: Create Next.js Project

```bash
npx create-next-app@latest admin-dashboard --typescript --tailwind --app
cd admin-dashboard
npm install @supabase/supabase-js next-auth
```

---

### Step 2.2: Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://oyqecdcpicvzwwvwaeka.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_5ovuyYHtObqNMcjEFrNo6Q_Bo4dDFQi
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=your_service_key_here
```

Get SERVICE_KEY from Supabase → Settings → API → Service Role Key (keep secret!)

---

### Step 2.3: Ready for Dashboard Code

The dashboard is ready to be built. Confirm:

1. ✅ All SQL tables created?
2. ✅ Edge Function deployed?
3. ✅ Admin user created?

Then I'll create:
- Login page
- Dashboard (Generate ID button)
- Download SD files (devicecode.txt + devicesecret.txt)
- Device inventory table
- Deployment to Vercel

Confirm when ready! 🚀
