# ✅ Supabase Setup Guide for VitalStep

## Current Status
- ✅ Flutter app has Supabase credentials configured
- ❌ Supabase backend NOT YET SET UP (authentication, tables, functions)

---

## Step 1: Access Your Supabase Project

1. Go to: **https://app.supabase.com**
2. Sign in with your account
3. Select project: **oyqecdcpicvzwwvwaeka** (you'll see it in your dashboard)
4. You're now in the Supabase admin panel

---

## Step 2: Enable Authentication (Email/Password)

### 2.1 Go to Authentication Settings
1. Left sidebar → **Authentication** → **Providers**
2. Scroll down and find **Email** provider
3. Click the **Email** toggle → Turn it **ON** (green)
4. Save settings

### 2.2 Configure Email Provider
1. Still in Authentication → **Email**
2. Enable:
   - ✅ **Enable email provider**
   - ✅ **Confirm email** (required)
   - ✅ **Auto-confirm new users** (or handle via email)
3. For testing: Enable "Auto-confirm" so users can login immediately without email verification

### 2.3 Set Redirect URLs
1. Go to **Authentication** → **URL Configuration**
2. Add allowed redirect URLs:
   - `com.vitalstep://auth-callback` (for mobile app)
   - `http://localhost:3000/auth-callback` (for local testing if needed)
3. Save

---

## Step 3: Create Database Tables

### 3.1 Go to SQL Editor
1. Left sidebar → **SQL Editor**
2. Click **+ New Query**
3. Paste the following SQL and run it:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text,
  profile_picture_url text,
  role text DEFAULT 'user', -- 'user', 'doctor', 'admin'
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Devices table (paired VitalStep devices)
CREATE TABLE IF NOT EXISTS public.devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_code text UNIQUE NOT NULL,     -- e.g., "VS-12345"
  device_secret text NOT NULL,          -- paired secret (from device)
  name text DEFAULT 'VitalStep Device',
  paired boolean DEFAULT false,
  online boolean DEFAULT false,
  battery_pct integer DEFAULT 0,
  last_sync timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(device_code, device_secret)
);

-- Measurements table (test results)
CREATE TABLE IF NOT EXISTS public.measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  hand text NOT NULL,     -- 'L' or 'R'
  posture text,           -- 'standing', 'sitting'
  trial_1 numeric(5,2),   -- kg
  trial_2 numeric(5,2),
  trial_3 numeric(5,2),
  peak_reading numeric(5,2),
  average_reading numeric(5,2),
  recorded_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  INDEX idx_device_id (device_id),
  INDEX idx_user_id (user_id),
  INDEX idx_recorded_at (recorded_at)
);

-- Insights table (AI-generated analysis)
CREATE TABLE IF NOT EXISTS public.insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  severity integer DEFAULT 0,     -- 0=low, 1=medium, 2=high
  weaker_hand text,               -- 'L' or 'R'
  asymmetry numeric(5,2),         -- percentage
  trend text DEFAULT 'stable',    -- 'improving', 'declining', 'stable'
  title text,
  subtitle text,
  body text,
  tip_1 text,
  tip_2 text,
  generated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  INDEX idx_device_id (device_id),
  INDEX idx_user_id (user_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read/write their own profile
CREATE POLICY "Users can read own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

-- RLS Policy: Users can read/write their own devices
CREATE POLICY "Users can read own devices" 
  ON public.devices FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert devices" 
  ON public.devices FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can read/write their own measurements
CREATE POLICY "Users can read own measurements" 
  ON public.measurements FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert measurements" 
  ON public.measurements FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can read their own insights
CREATE POLICY "Users can read own insights" 
  ON public.insights FOR SELECT 
  USING (auth.uid() = user_id);

-- Grant public insert for device-sync function (needs relaxed RLS temporarily)
CREATE POLICY "Public: Insert measurements via device-sync" 
  ON public.measurements FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Public: Insert insights via device-sync" 
  ON public.insights FOR INSERT 
  WITH CHECK (true);
```

### 3.2 Run the SQL
1. Click the **Play** button (run query)
2. You should see: `Tables created successfully`
3. Check left sidebar under **Tables** - you should see:
   - `users`
   - `devices`
   - `measurements`
   - `insights`

---

## Step 4: Create Edge Function for Device Sync

The device sends test results to this Edge Function, which stores them in Supabase.

### 4.1 Create the Function
1. Left sidebar → **Edge Functions**
2. Click **+ Create a new function**
3. Name: `device-sync`
4. Runtime: **TypeScript**
5. Click **Create function**

### 4.2 Paste the Function Code

Replace the entire content with:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action, device_code, device_secret, user_id, device_name, measurements, insights } = body

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    let result = { ok: true, message: '' }

    if (action === 'pair') {
      // Device pairing endpoint
      const { data: device, error: pairError } = await supabase
        .from('devices')
        .insert([{
          device_code,
          device_secret,
          user_id,
          name: device_name,
          paired: true,
          online: true,
          last_sync: new Date().toISOString(),
        }])
        .select()
        .single()

      if (pairError) {
        return new Response(
          JSON.stringify({ ok: false, error: pairError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      result = { ok: true, device_id: device.id }

    } else if (action === 'sync') {
      // Sync measurements endpoint (device sends offline results)
      const { data: device } = await supabase
        .from('devices')
        .select('id, user_id')
        .eq('device_code', device_code)
        .eq('device_secret', device_secret)
        .single()

      if (!device) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Device not paired' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      // Insert measurements
      if (measurements && measurements.length > 0) {
        const mData = measurements.map((m: any) => ({
          device_id: device.id,
          user_id: device.user_id,
          hand: m.hand,
          posture: m.posture,
          trial_1: m.trial_1,
          trial_2: m.trial_2,
          trial_3: m.trial_3,
          peak_reading: m.peak_reading,
          average_reading: m.average_reading,
          recorded_at: m.recorded_at,
        }))
        await supabase.from('measurements').insert(mData)
      }

      // Insert insights if available
      if (insights && insights.length > 0) {
        const iData = insights.map((i: any) => ({
          device_id: device.id,
          user_id: device.user_id,
          severity: i.severity,
          weaker_hand: i.weaker_hand,
          asymmetry: i.asymmetry,
          trend: i.trend,
          title: i.title,
          subtitle: i.subtitle,
          body: i.body,
          tip_1: i.tip_1,
          tip_2: i.tip_2,
        }))
        await supabase.from('insights').insert(iData)
      }

      // Update device last_sync
      await supabase
        .from('devices')
        .update({ online: true, last_sync: new Date().toISOString() })
        .eq('id', device.id)

      result = { ok: true, accepted: measurements?.length || 0, rejected: 0 }
    }

    return new Response(
      JSON.stringify(result),
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

### 4.3 Deploy the Function
1. Click **Deploy**
2. Wait ~2 minutes for deployment
3. You should see: `Function deployed successfully`

---

## Step 5: Get Your Supabase Keys

You already have them in the app, but verify they're correct:

1. Go to **Settings** → **API**
2. Find:
   - **Project URL**: `https://oyqecdcpicvzwwvwaeka.supabase.co` ✓
   - **Anon Key (public)**: `sb_publishable_...` ✓
3. These are already in `supabase_service.dart` ✓

---

## Step 6: Test Authentication in Supabase

### 6.1 Create a Test User
1. Go to **Authentication** → **Users**
2. Click **+ Add user**
3. Email: `test@vitalstep.com`
4. Password: `Test123!@#`
5. Click **Create user**
6. Status should show: **Confirmed** ✓

### 6.2 Verify in Database
1. Go to **SQL Editor** → **+ New Query**
2. Run:
   ```sql
   SELECT id, email FROM public.users;
   ```
3. You should see your test user ✓

---

## Step 7: Flutter App Setup

Now the app can authenticate:

### 7.1 Dependencies Already Installed
The `pubspec.yaml` has:
```yaml
supabase_flutter: ^2.4.0    ✓
provider: ^6.0.0            ✓
http: ^1.1.0                ✓
```

### 7.2 Run the App

**On your development machine:**

```bash
cd VitalStep_Mobile_App
flutter pub get                  # Download dependencies
flutter run                       # Run on connected phone/emulator
```

**First time setup:**
1. Device will show login screen
2. Tap **Sign Up**
3. Email: `test@vitalstep.com`
4. Password: `Test123!@#`
5. Confirm password (same)
6. Check **I agree to Terms**
7. Tap **Create Account**
8. Should redirect to login
9. Enter same credentials
10. Tap **Sign In**
11. You're logged in! ✓

---

## Step 8: Test Device Pairing

### 8.1 Device Running (already flashed with fixed.ino)
1. Device boots → shows BLE pairing screen
2. Device waits for app to connect

### 8.2 App Pairing
1. App logged in → Home screen
2. Tap **Add Device** / **Pair Device**
3. App scans for BLE
4. Select `PalmPressure` (your device)
5. App sends device code + secret
6. Device confirmed on cloud ✓

### 8.3 Run a Test
1. App → **Start Test**
2. Device runs measurement cycle
3. Results appear in app ✓
4. Tap **Sync** → uploads to Supabase ✓

---

## ✅ Checklist Before Testing

- [ ] Supabase Authentication enabled (Email/Password)
- [ ] Redirect URLs configured (com.vitalstep://auth-callback)
- [ ] Database tables created (users, devices, measurements, insights)
- [ ] RLS policies enabled
- [ ] Edge Function `device-sync` deployed
- [ ] Test user created: test@vitalstep.com / Test123!@#
- [ ] Flutter app dependencies installed (`flutter pub get`)
- [ ] Device firmware flashed with calibrated HX711 factor ✓
- [ ] Phone connected for testing

---

## 🚀 Ready to Test!

**Next Steps:**
1. Follow steps 1-5 above to set up Supabase
2. Create test user (step 6)
3. Run Flutter app on phone
4. Sign up / Sign in
5. Pair device
6. Run measurement test
7. Watch data sync to cloud ✓

---

## 📞 Troubleshooting

**"Authentication failed"**
→ Check email/password match test user (test@vitalstep.com / Test123!@#)
→ Make sure Email provider is enabled

**"Device pairing failed"**
→ Check device is powered on and showing BLE screen
→ Check app has Bluetooth permission
→ Make sure Edge Function is deployed

**"Measurements not syncing"**
→ Check Wi-Fi is connected on device
→ Check Edge Function logs in Supabase
→ Verify device_code and device_secret match

**"Empty tables"**
→ Check RLS policies are correct
→ Try disabling RLS temporarily for testing (`ALTER TABLE ... DISABLE ROW LEVEL SECURITY`)

---

## 📊 Final Architecture

```
Phone (Flutter App)
    ↓ (HTTPS + WebSocket)
Supabase Cloud
    ├── Authentication (Email/Password) ✓
    ├── Realtime DB (users, devices, measurements) ✓
    ├── Edge Functions (device-sync) ✓
    └── BLE Pairing ↔ Device (ESP32)

Device (ESP32-3248S035)
    ├── Load Cell (HX711) - 13.746 factor ✓
    ├── SD Card (offline queue) ✓
    ├── Wi-Fi (cloud sync) ✓
    └── BLE (app pairing) ✓
```

Everything is connected and ready! 🎉
