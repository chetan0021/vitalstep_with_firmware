import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";

// Types
interface DeviceSyncRequest {
  action: "sync" | "unpair" | "assessment_complete";
  pair_pin?: string;
  fw: string;
  hw: string;
  battery_pct: number;
  battery_v: number;
  charging: boolean;
  rssi: number;
  device_time: number;
  time_valid: boolean;
  uptime_ms: number;
  boot_id: string;
  pending: number;
  measurements?: Array<{
    client_id: string;
    assessment_id: number;
    hand: "L" | "R";
    posture: "sitting" | "standing";
    t1: number;
    t2: number;
    t3: number;
    best: number;
    recorded_at: number;
    time_valid: boolean;
    uptime_ms: number;
    boot_id: string;
    battery_pct: number;
    patient_code?: string;
  }>;
}

interface DeviceSyncResponse {
  ok: boolean;
  server_time?: number;
  device_id?: string;
  claimed?: boolean;
  owner?: { name: string; patient_code: string };
  specialist?: { name: string; email: string };
  target?: { lo: number; hi: number };
  queue?: Array<{
    id: number;
    hand: "L" | "R";
    posture: "sitting" | "standing";
    title: string;
  }>;
  history?: Array<{
    t: number;
    l: number;
    r: number;
  }>;
  accepted?: string[];
  rejected?: Array<{
    client_id: string;
    reason: string;
  }>;
  error?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-device-code, x-device-secret",
};

// Utility: Validate measurement trials are within range
function validateMeasurement(m: any): string | null {
  if (!["L", "R"].includes(m.hand)) return "invalid_hand";
  if (!["sitting", "standing"].includes(m.posture)) return "invalid_posture";
  if (m.t1 < 0.1 || m.t1 > 25.0) return "trial_1_out_of_range";
  if (m.t2 < 0.1 || m.t2 > 25.0) return "trial_2_out_of_range";
  if (m.t3 < 0.1 || m.t3 > 25.0) return "trial_3_out_of_range";

  const max_val = Math.max(m.t1, m.t2, m.t3);
  if (Math.abs(m.best - max_val) > 0.01) return "best_value_mismatch";

  return null;
}

// Utility: Calculate time_source and corrected timestamp
function computeTimeSource(
  measurement: any,
  serverTime: number,
  deviceTime: number
): { time_source: string; corrected_at?: number } {
  const timeDiff = serverTime - deviceTime;

  if (timeDiff >= -3 && timeDiff <= 3) {
    return { time_source: "device" };
  }

  if (measurement.time_valid) {
    const corrected = measurement.recorded_at + timeDiff;
    return { time_source: "corrected", corrected_at: corrected };
  }

  const estimated = serverTime - measurement.uptime_ms / 1000;
  return { time_source: "received", corrected_at: estimated };
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Extract auth headers
    const deviceCode = req.headers.get("x-device-code");
    const deviceSecret = req.headers.get("x-device-secret");
    const apiKey = req.headers.get("apikey");

    if (!deviceCode || !deviceSecret || !apiKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Missing authentication headers",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client (service role for Edge Function)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const body: DeviceSyncRequest = await req.json();

    // =========================================================================
    // STEP 1: LOOKUP & AUTHENTICATE DEVICE FROM device_inventory
    // =========================================================================
    console.log(`[DEVICE-SYNC] Looking up device_code: ${deviceCode}`);

    const { data: deviceInventory, error: deviceError } = await supabase
      .from("device_inventory")
      .select("*")
      .eq("device_code", deviceCode)
      .limit(1);

    if (deviceError) {
      console.error(`[DEVICE-SYNC] Database error:`, deviceError);
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Device lookup failed",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!deviceInventory || deviceInventory.length === 0) {
      console.log(`[DEVICE-SYNC] Device not found: ${deviceCode}`);
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Device not found or invalid code",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const device = deviceInventory[0];
    console.log(`[DEVICE-SYNC] Found device:`, { id: device.id, code: device.device_code });

    // Verify secret (simple string comparison for DEV, use bcrypt in production)
    if (device.device_secret !== deviceSecret) {
      console.log(`[DEVICE-SYNC] Secret mismatch for device: ${deviceCode}`);
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Invalid device secret",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // =========================================================================
    // STEP 2: HANDLE UNPAIR ACTION
    // =========================================================================
    if (body.action === "unpair") {
      if (!device.paired_user_id) {
        return new Response(
          JSON.stringify({
            ok: true,
            claimed: false,
            queue: [],
            history: [],
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Unpair: set paired_user_id to NULL
      const { error: unpairError } = await supabase
        .from("device_inventory")
        .update({
          paired_user_id: null,
          paired_at: null,
          status: "manufactured",
        })
        .eq("id", device.id);

      if (unpairError) {
        console.error("Unpair error:", unpairError);
        return new Response(
          JSON.stringify({ ok: false, error: "Failed to unpair device" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          ok: true,
          claimed: false,
          queue: [],
          history: [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // =========================================================================
    // STEP 3: HANDLE SYNC ACTION
    // =========================================================================
    const serverTime = Math.floor(Date.now() / 1000);
    const response: DeviceSyncResponse = {
      ok: true,
      server_time: serverTime,
      accepted: [],
      rejected: [],
    };

    const isClaimed = !!device.paired_user_id;
    response.claimed = isClaimed;
    response.device_id = device.id;

    // =========================================================================
    // STEP 4: VALIDATE & STORE MEASUREMENTS (only if claimed)
    // =========================================================================
    if (isClaimed && body.measurements && body.measurements.length > 0) {
      for (const m of body.measurements) {
        const validationError = validateMeasurement(m);

        if (validationError) {
          response.rejected?.push({
            client_id: m.client_id,
            reason: validationError,
          });
          continue;
        }

        // Compute time source
        const timeData = computeTimeSource(m, serverTime, body.device_time);

        // Get user_id from device.paired_user_id to satisfy foreign key constraint
        // We need to create a device record if one doesn't exist, OR use the paired_user_id
        
        // First, try to find or create a device record in devices table
        const { data: existingDevice } = await supabase
          .from("devices")
          .select("id")
          .eq("device_code", device.device_code)
          .single();

        let deviceRecordId = existingDevice?.id;

        if (!deviceRecordId) {
          // Create device record in devices table (if measurements table requires it)
          const { data: newDevice, error: deviceCreateError } = await supabase
            .from("devices")
            .insert({
              device_code: device.device_code,
              user_id: device.paired_user_id,
              is_active: true,
            })
            .select("id")
            .single();

          if (deviceCreateError || !newDevice) {
            console.error("Device creation error:", deviceCreateError);
            response.rejected?.push({
              client_id: m.client_id,
              reason: "device_creation_failed",
            });
            continue;
          }
          deviceRecordId = newDevice.id;
        }

        // Insert measurement with correct schema (matching actual database columns)
        const { error: insertError } = await supabase
          .from("measurements")
          .insert({
            device_id: deviceRecordId,
            hand: m.hand === "L" ? "Left" : "Right",  // Schema expects 'Left'/'Right'
            posture: m.posture === "sitting" ? "Sitting" : "Standing",  // Schema expects capitalized
            trial1: m.t1,  // Schema column name is trial1 (no underscore)
            trial2: m.t2,
            trial3: m.t3,
            best: m.best,  // Schema column name is best (not peak_reading)
            recorded_at: new Date(m.recorded_at * 1000).toISOString(),
          });

        if (insertError) {
          console.error("Insert measurement error:", insertError);
          console.error("Measurement data:", {
            device_id: deviceRecordId,
            user_id: device.paired_user_id,
            client_id: m.client_id,
            hand: m.hand,
            trial_1: m.t1,
          });
          response.rejected?.push({
            client_id: m.client_id,
            reason: "storage_error",
          });
        } else {
          response.accepted?.push(m.client_id);
          // If measurement belongs to an assessment_queue item, mark it completed in the database
          if (m.assessment_id && m.assessment_id > 0) {
            try {
              await supabase
                .from("assessment_queue")
                .update({
                  status: "Completed",
                  completed_at: new Date().toISOString(),
                })
                .eq("id", m.assessment_id);
            } catch (err) {
              console.warn("Could not update assessment_queue status:", err);
            }
          }
        }
      }
    }

    // =========================================================================
    // STEP 5: FETCH OWNER, SPECIALIST, TARGET RANGE (if claimed)
    // =========================================================================
    if (isClaimed && device.paired_user_id) {
      const { data: patient } = await supabase
        .from("patients")
        .select("id, name, patient_code, hand_strength_lo, hand_strength_hi")
        .eq("user_id", device.paired_user_id)
        .single();

      if (patient) {
        response.owner = {
          name: patient.name,
          patient_code: patient.patient_code,
        };
        response.target = {
          lo: patient.hand_strength_lo || 10,
          hi: patient.hand_strength_hi || 18,
        };

        // Fetch linked specialist (first one)
        const { data: access } = await supabase
          .from("specialist_access")
          .select("specialists(name, email)")
          .eq("patient_id", patient.id)
          .limit(1)
          .single();

        if (access?.specialists) {
          response.specialist = access.specialists as any;
        }
      }
    }

    // =========================================================================
    // STEP 6: FETCH ASSESSMENT QUEUE (max 6 items) (if claimed)
    // =========================================================================
    if (isClaimed && device.paired_user_id) {
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", device.paired_user_id)
        .single();

      if (patient) {
        const { data: queueItems } = await supabase
          .from("assessment_queue")
          .select("id, hand, posture")
          .eq("user_id", patient.id)  // Schema uses user_id not patient_id
          .eq("status", "Pending")     // Schema uses capitalized "Pending"
          .limit(6);

        if (queueItems && queueItems.length > 0) {
          response.queue = queueItems.map((q: any) => ({
            id: q.id,
            hand: q.hand === "Left" ? "L" : "R",
            posture: q.posture === "Sitting" ? "sitting" : "standing",
            title: `${q.hand} Hand - ${q.posture}`,
          }));
        }
      }
    }

    // =========================================================================
    // STEP 7: FETCH HISTORY (max 20 most recent) (if claimed)
    // =========================================================================
    if (isClaimed && device.paired_user_id) {
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", device.paired_user_id)
        .single();

      if (patient) {
        const { data: history } = await supabase
          .from("measurements")
          .select("recorded_at, hand, best")
          .eq("device_id", device.id)
          .order("recorded_at", { ascending: false })
          .limit(20);

        if (history && history.length > 0) {
          // Aggregate by date/hand
          const historyMap = new Map<string, { l: number; r: number }>();

          for (const h of history) {
            const date = new Date(h.recorded_at);
            const key = date.toISOString().split("T")[0]; // YYYY-MM-DD
            const val = historyMap.get(key) || { l: 0, r: 0 };

            // Schema stores hand as 'Left'/'Right', not 'L'/'R'
            if (h.hand === "Left") val.l = h.best;
            else if (h.hand === "Right") val.r = h.best;

            historyMap.set(key, val);
          }

          response.history = Array.from(historyMap.entries())
            .map(([date, vals]) => ({
              t: Math.floor(new Date(date).getTime() / 1000),
              l: vals.l,
              r: vals.r,
            }))
            .sort((a, b) => b.t - a.t)
            .slice(0, 20);
        }
      }
    }

    // =========================================================================
    // STEP 8: All operations complete - no device update needed
    // =========================================================================
    // Note: device_inventory.last_sync_at column doesn't exist in schema
    // Skipping device metadata update

    console.log(`[DEVICE-SYNC] Success:`, {
      device_code: deviceCode,
      accepted: response.accepted?.length || 0,
      rejected: response.rejected?.length || 0,
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[DEVICE-SYNC] Error:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
