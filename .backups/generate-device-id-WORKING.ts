// Supabase Edge Function: generate-device-id (WORKING VERSION)
// This version handles both UI testing and external calls

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
      console.error('Missing env vars')
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing environment variables' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Try to get auth from multiple places
    let authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
    
    console.log('Auth header received:', authHeader ? 'yes' : 'no')
    console.log('All headers:', Array.from(req.headers.entries()))

    if (!authHeader) {
      console.error('No authorization header found')
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing Authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Extract token
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader

    console.log('Token received, length:', token.length)

    // Use ANON key client for auth verification
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError) {
      console.error('Auth error:', userError.message)
      return new Response(
        JSON.stringify({ ok: false, error: 'Auth failed: ' + userError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    if (!user) {
      console.error('User not found in token')
      return new Response(
        JSON.stringify({ ok: false, error: 'User not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const userId = user.id
    console.log('Authenticated user:', userId, user.email)

    // Use SERVICE_ROLE for database ops (bypass RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Check admin
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, email, is_active')
      .eq('id', userId)
      .eq('is_active', true)
      .single()

    if (adminError || !admin) {
      console.error('Admin check failed:', adminError?.message)
      return new Response(
        JSON.stringify({ ok: false, error: 'Not an authorized admin' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    console.log('Admin verified:', admin.email)

    // Get last device
    const { data: lastDevices, error: queryError } = await supabaseAdmin
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

    // Generate secret
    const secretBytes = crypto.getRandomValues(new Uint8Array(32))
    const device_secret = Array.from(secretBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    console.log('Generated:', device_code)

    // Insert device
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
      console.error('Insert error:', insertError.message)
      return new Response(
        JSON.stringify({ ok: false, error: insertError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Device inserted:', deviceRecord.id)

    // Audit log
    await supabaseAdmin
      .from('device_audit')
      .insert([{
        admin_id: userId,
        action: 'generated',
        device_code,
        details: `Generated new device`
      }])
      .catch(e => console.error('Audit error:', e))

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
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ ok: false, error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
