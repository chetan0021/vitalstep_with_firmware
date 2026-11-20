// admin-dashboard-nextjs/app/api/admin/overview/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [invRes, mfgRes, prdRes, patRes, devRes, measRes, auditRes] = await Promise.all([
      supabaseAdmin.from('device_inventory').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('device_inventory').select('id', { count: 'exact', head: true }).eq('status', 'manufactured'),
      supabaseAdmin.from('device_inventory').select('id', { count: 'exact', head: true }).eq('status', 'paired'),
      supabaseAdmin.from('patients').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('devices').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('measurements').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('device_audit').select('*').order('created_at', { ascending: false }).limit(10),
    ])

    // Also get recent measurements for the dashboard preview
    const { data: recentMeasurements } = await supabaseAdmin
      .from('measurements')
      .select('id, hand, posture, trial1, trial2, trial3, best, recorded_at, device_id')
      .order('recorded_at', { ascending: false })
      .limit(6)

    // Get patients summary
    const { data: patientsList } = await supabaseAdmin
      .from('patients')
      .select('id, user_id, name, email, patient_code, dominant_hand, weight_kg, height_cm, hand_strength_lo, hand_strength_hi')
      .limit(10)

    return NextResponse.json({
      success: true,
      stats: {
        inventory: invRes.count ?? 0,
        manufactured: mfgRes.count ?? 0,
        paired: prdRes.count ?? 0,
        patients: patRes.count ?? 0,
        devices: devRes.count ?? 0,
        measurements: measRes.count ?? 0,
      },
      recentAudits: auditRes.data ?? [],
      recentMeasurements: recentMeasurements ?? [],
      patientsSummary: patientsList ?? [],
    })
  } catch (error: any) {
    console.error('Error fetching admin overview:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
