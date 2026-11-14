# 🔧 Edge Function Debugging

The issue is that the test UI is sending a UUID instead of a proper JWT token.

## Quick Fix: Bypass Auth for Testing

Let me create a simpler version that works without authentication first.

---

## Step 1: Update Edge Function Code

Go to **Supabase** → **Edge Functions** → **generate-device-id**

Replace the entire function code with the fixed version from `generate-device-id-FIXED.ts`

**Key changes:**
- Better error logging
- Handles Bearer token properly
- Checks for admin status correctly
- Returns detailed error messages

---

## Step 2: Try Testing Again

In Supabase Test panel:

**HTTP Method:** POST

**Request Body:**
```json
{
  "test": true
}
```

**Headers:**
- Authorization: Leave empty for now

Click **Send Request**

---

## Expected Result if No Auth:

Should show error about missing auth, which is OK.

---

## Step 3: Proper Test via Supabase CLI

Use this method instead (more reliable):

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Test the function
supabase functions invoke generate-device-id \
  --project-id oyqecdcpicvzwwvwaeka \
  --auth-type user
```

---

## Alternative: Simple Test Without Auth

For now, let's simplify and skip the full auth check. Replace function with this simpler version:

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

    // For testing: skip auth check, just generate ID
    const { data: lastDevices } = await supabase
      .from('device_inventory')
      .select('device_code')
      .order('created_at', { ascending: false })
      .limit(1)

    let nextNumber = 1001
    if (lastDevices && lastDevices.length > 0) {
      const lastCode = lastDevices[0].device_code
      const numberPart = parseInt(lastCode.split('-')[1])
      nextNumber = numberPart + 1
    }

    const device_code = `VS-${String(nextNumber).padStart(6, '0')}`
    const secretBytes = crypto.getRandomValues(new Uint8Array(32))
    const device_secret = Array.from(secretBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Insert device
    const { data: deviceRecord, error: insertError } = await supabase
      .from('device_inventory')
      .insert([{
        device_code,
        device_secret,
        created_by: '00000000-0000-0000-0000-000000000000', // placeholder
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

    return new Response(
      JSON.stringify({
        ok: true,
        device_code,
        device_secret,
        created_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
```

This version:
- ✅ Generates device ID
- ✅ Stores in database
- ✅ Returns the ID and secret
- ❌ Skips admin auth (for testing only)

---

## Next Steps

**Option 1: Use Simplified Version (Recommended)**
- Replace function with simpler version above
- Test via Supabase panel
- Should return: `"ok": true` with device code

**Option 2: Use CLI**
- Install Supabase CLI
- Use proper auth testing

Tell me which you prefer and I'll proceed! ✅
