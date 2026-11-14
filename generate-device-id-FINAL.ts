// Supabase Edge Function: generate-device-id (FINAL WORKING VERSION)
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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Missing environment variables')
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing environment variables' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header')
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

    let nextNumber = 1001  // Start from VS-001001
    if (lastDevices && lastDevices.length > 0) {
      const lastCode = lastDevices[0].device_code  // e.g., "VS-001001"
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

    // Insert into device_inventory using SERVICE_ROLE bypass RLS
    const { data: deviceRecord, error: insertError } = await supabaseAdmin
      .from('device_inventory')
      .insert([{
        device_code,
        device_secret,
        created_by: userId,  // Use the authenticated user's ID
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
