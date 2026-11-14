# Deploy Fixed Edge Function

## KEY CHANGES IN FIXED VERSION

**Problem**: Old version used SERVICE_ROLE_KEY for getUser(), which doesn't work properly
**Solution**: 
- Use ANON_KEY with getUser() to verify the JWT token
- Use SERVICE_ROLE_KEY only for database operations (bypasses RLS)
- This ensures proper JWT validation + RLS bypass for database writes

---

## DEPLOYMENT STEPS

### Step 1: Update Edge Function Code

1. Go to Supabase Dashboard → **Functions** → **generate-device-id**
2. Click **Code** tab
3. **DELETE all current code** 
4. **PASTE this entire code**:

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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Missing environment variables')
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing environment variables' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header')
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing Authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader

    console.log('Token length:', token.length)

    // Create client with ANON key to get user
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
    
    // Verify user with token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Auth error:', userError?.message || 'User not found')
      return new Response(
        JSON.stringify({ ok: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const userId = user.id
    const userEmail = user.email

    console.log('Authenticated user:', userId, userEmail)

    // Now use SERVICE_ROLE_KEY client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user is admin
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, email, is_active')
      .eq('id', userId)
      .eq('is_active', true)
      .single()

    if (adminError || !admin) {
      console.error('Admin check failed:', adminError?.message)
      return new Response(
        JSON.stringify({ ok: false, error: 'User is not an authorized admin' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    console.log('Admin verified:', admin.email)

    // Get the last device code to determine next number
    const { data: lastDevices, error: lastError } = await supabaseAdmin
      .from('device_inventory')
      .select('device_code')
      .order('created_at', { ascending: false })
      .limit(1)

    if (lastError) {
      console.error('Database query error:', lastError.message)
    }

    let nextNumber = 1001
    if (lastDevices && lastDevices.length > 0) {
      const lastCode = lastDevices[0].device_code
      const numberPart = parseInt(lastCode.split('-')[1])
      nextNumber = numberPart + 1
    }

    console.log('Next device number:', nextNumber)

    // Generate device_code
    const device_code = `VS-${String(nextNumber).padStart(6, '0')}`

    // Generate device_secret (SHA256 hex - 64 chars)
    const secretBytes = crypto.getRandomValues(new Uint8Array(32))
    const device_secret = Array.from(secretBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    console.log('Generated device_code:', device_code)
    console.log('Generated device_secret length:', device_secret.length)

    // Insert into device_inventory
    const { data: deviceRecord, error: insertError } = await supabaseAdmin
      .from('device_inventory')
      .insert([{
        device_code,
        device_secret,
        created_by: userId,
        status: 'manufactured'
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Insert error details:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details
      })
      return new Response(
        JSON.stringify({ ok: false, error: insertError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Device inserted successfully with ID:', deviceRecord.id)

    // Log to audit trail
    const { error: auditError } = await supabaseAdmin
      .from('device_audit')
      .insert([{
        admin_id: userId,
        action: 'generated',
        device_code,
        details: `Generated new device ID by ${userEmail}`
      }])

    if (auditError) {
      console.error('Audit log error:', auditError.message)
    } else {
      console.log('Audit log recorded')
    }

    return new Response(
      JSON.stringify({
        ok: true,
        device_code,
        device_secret,
        created_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error('Function error:', error.message || error)
    return new Response(
      JSON.stringify({ ok: false, error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
```

5. Click **Deploy**

---

### Step 2: Verify Environment Variables

1. Go to **Functions** → **generate-device-id** → **Settings**
2. Check that these environment variables are available:
   - `SUPABASE_URL` ✅
   - `SUPABASE_ANON_KEY` ✅
   - `SUPABASE_SERVICE_ROLE_KEY` ✅

They should all be pre-configured by Supabase.

---

### Step 3: Test the Function

Run the test script:

```powershell
powershell -ExecutionPolicy Bypass -File "c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\test_edge_function_fresh.ps1"
```

**Expected output:**
```
✅ Fresh token received
User ID: 09c41189-b0c7-4dc0-b9f9-153162041dfa
Token preview: eyJhbGciOiJFUzI1NiIsImtpZCI6IjVmOTA...

Step 2: Calling generate-device-id function...
✅ SUCCESS - Status: 200
Response:
ok           : True
device_code  : VS-001001
device_secret: 9e345bc38b7bc7186b72252c80a72f6635d35dc2c54991d74b5f38c17c5d7179
created_at   : 2026-11-13T10:30:45.123Z
```

---

## IF IT FAILS

### Check Edge Function Logs

1. Go to **Functions** → **generate-device-id**
2. Click **Executions** tab
3. Click the latest execution
4. Check the logs for error details

### Common Issues

**Error: "User is not an authorized admin"**
- Admin record doesn't exist in admins table
- Check SQL: `SELECT * FROM public.admins;`

**Error: "insert or update on table violates foreign key constraint"**
- The user UUID doesn't match between auth.users and device_inventory
- Drop and recreate device_inventory table

**Error: "Unauthorized"**
- JWT token is invalid or expired
- Get a fresh token and try again

---

Once this works, we'll build the Next.js dashboard!
