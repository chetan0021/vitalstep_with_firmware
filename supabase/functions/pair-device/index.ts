import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Only POST allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: "No auth header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.split(" ")[1];
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !userData || !userData.user) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const body = await req.json();
    const deviceCode = body.device_code;
    const deviceName = body.device_name;

    if (!deviceCode || !deviceName) {
      return new Response(JSON.stringify({ ok: false, error: "Missing device_code or device_name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get device from inventory
    const { data: devices, error: deviceError } = await supabase
      .from("device_inventory")
      .select("id, paired_user_id")
      .eq("device_code", deviceCode);

    if (deviceError || !devices || devices.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: "Device not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const device = devices[0];

    if (device.paired_user_id && device.paired_user_id !== userId) {
      return new Response(JSON.stringify({ ok: false, error: "Device already paired to another user" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update device as paired
    const now = new Date().toISOString();
    
    const { error: updateError } = await supabase
      .from("device_inventory")
      .update({
        paired_user_id: userId,
        paired_at: now,
        status: "paired",
      })
      .eq("id", device.id);

    if (updateError) {
      return new Response(JSON.stringify({ ok: false, error: "Failed to update device" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert into device_pairings table
    await supabase.from("device_pairings").insert({
      user_id: userId,
      device_code: deviceCode,
      device_name: deviceName,
      paired_at: now,
      is_active: true,
    });

    // Also sync to devices table for measurements FK and queries
    await supabase.from("devices").upsert({
      user_id: userId,
      device_code: deviceCode,
      device_name: deviceName,
      is_active: true,
    }, { onConflict: "device_code" });

    // Log to audit
    await supabase.from("device_audit").insert({
      admin_id: userId,
      action: "paired",
      device_code: deviceCode,
      details: `Paired device ${deviceCode} to user ${userId}`,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        paired: true,
        device_id: device.id,
        message: "Device paired successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Pairing error:", error);
    return new Response(JSON.stringify({ ok: false, error: "Pairing failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
