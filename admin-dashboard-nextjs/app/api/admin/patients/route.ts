// admin-dashboard-nextjs/app/api/admin/patients/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Fetch all patients
    const { data: patients, error: pErr } = await supabaseAdmin
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })

    if (pErr) throw pErr

    // 2. Fetch specialist linkages
    const { data: accessLinks } = await supabaseAdmin
      .from('specialist_access')
      .select('id, patient_id, specialist_id, access_level, linked_at, specialists(id, name, email, phone, clinic_name)')

    // 3. Fetch device pairings and devices
    const { data: pairings } = await supabaseAdmin
      .from('device_pairings')
      .select('*')

    const { data: devices } = await supabaseAdmin
      .from('devices')
      .select('*')

    // 4. Fetch measurements
    const { data: measurements } = await supabaseAdmin
      .from('measurements')
      .select('*')
      .order('recorded_at', { ascending: false })

    // Build enriched patient objects
    const enrichedPatients = (patients ?? []).map((pat) => {
      // Find linked specialists
      const linkedSpecialists = (accessLinks ?? [])
        .filter((link) => link.patient_id === pat.id)
        .map((link) => ({
          linkId: link.id,
          accessLevel: link.access_level,
          linkedAt: link.linked_at,
          specialist: link.specialists as any,
        }))

      // Find paired devices for this patient (by user_id)
      const userDevices = (devices ?? []).filter((d) => d.user_id === pat.user_id)
      const userPairings = (pairings ?? []).filter((p) => p.user_id === pat.user_id)

      // Combine device info
      const allDeviceCodes = Array.from(new Set([
        ...userDevices.map(d => d.device_code),
        ...userPairings.map(p => p.device_code)
      ])).filter(Boolean)

      const userDeviceIds = userDevices.map(d => d.id)

      // Find measurements associated with user's devices (or all measurements if prototype)
      const userMeasurements = (measurements ?? []).filter(
        (m) => userDeviceIds.includes(m.device_id)
      )

      // Compute stats
      const bestScore = userMeasurements.length > 0
        ? Math.max(...userMeasurements.map(m => m.best ?? 0))
        : 0

      const latestTest = userMeasurements.length > 0
        ? userMeasurements[0].recorded_at
        : null

      return {
        id: pat.id,
        userId: pat.user_id,
        name: pat.name,
        email: pat.email,
        phone: pat.phone,
        patientCode: pat.patient_code,
        dob: pat.date_of_birth,
        gender: pat.gender,
        dominantHand: pat.dominant_hand,
        weightKg: pat.weight_kg,
        heightCm: pat.height_cm,
        palmLengthMm: pat.palm_length_mm,
        palmWidthMm: pat.palm_width_mm,
        knuckleLengthMm: pat.knuckle_length_mm,
        handStrengthLo: pat.hand_strength_lo,
        handStrengthHi: pat.hand_strength_hi,
        city: pat.city,
        country: pat.country,
        address: pat.address,
        pincode: pat.pincode,
        createdAt: pat.created_at,
        linkedSpecialists,
        devices: allDeviceCodes,
        devicesCount: allDeviceCodes.length,
        measurementsCount: userMeasurements.length,
        bestMeasurement: bestScore,
        latestMeasurementAt: latestTest,
        recentMeasurements: userMeasurements.slice(0, 5),
      }
    })

    return NextResponse.json({
      success: true,
      patients: enrichedPatients,
      totalCount: enrichedPatients.length,
      allMeasurements: measurements ?? [],
    })
  } catch (error: any) {
    console.error('Error fetching admin patients:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
