// Supabase Edge Function: generate-device-id (FIXED VERSION)
// Location: supabase/functions/generate-device-id/index.ts

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing environment variables' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing Authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Extract token (remove "Bearer " prefix)
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader

    console.log('Token length:', token.length)
    console.log('Token preview:', token.substring(0, 50))

    // Verify user with token
    let user = null
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token)
      if (error) {
        console.error('Auth error:', error.message)
        throw error
      }
      user = authUser
    } catch (authError: any) {
      console.error('Failed to get user:', authError)
      return new Response(
        JSON.stringify({ ok: false, error: `Auth failed: ${authError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    if (!user) {
      return new Response(
        JSON.stringify({ ok: false, error: 'User not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    console.log('Authenticated user:', user.id, user.email)

    // Check if user is admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, email, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !admin) {
      console.error('Admin check failed:', adminError)
      return new Response(
        JSON.stringify({ ok: false, error: 'User is not an authorized admin' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    console.log('Admin verified:', admin.email)

    // Get the last device code to determine next number
    const { data: lastDevices, error: lastError } = await supabase
      .from('device_inventory')
      .select('device_code')
      .order('created_at', { ascending: false })
      .limit(1)

    if (lastError) {
      console.error('Database error:', lastError)
    }

    let nextNumber = 1001  // Start from VS-001001
    if (lastDevices && lastDevices.length > 0) {
      const lastCode = lastDevices[0].device_code
      const numberPart = parseInt(lastCode.split('-')[1])
      nextNumber = numberPart + 1
    }

    // Generate device_code
    const device_code = `VS-${String(nextNumber).padStart(6, '0')}`

    // Generate device_secret (SHA256 hex - 64 chars)
    const secretBytes = crypto.getRandomValues(new Uint8Array(32))
    const device_secret = Array.from(secretBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    console.log('Generated device_code:', device_code)

    // Insert into device_inventory
    const adminId = user.id // Use authenticated user ID from JWT
    console.log('Inserting with created_by:', adminId)
    
    const { data: deviceRecord, error: insertError } = await supabase
      .from('device_inventory')
      .insert([{
        device_code,
        device_secret,
        created_by: adminId,
        status: 'manufactured'
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ ok: false, error: insertError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Device inserted successfully')

    // Log to audit trail
    await supabase.from('device_audit').insert([{
      admin_id: user.id,
      action: 'generated',
      device_code,
      details: `Generated new device ID`
    }]).catch((e) => console.error('Audit log error:', e))

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
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
