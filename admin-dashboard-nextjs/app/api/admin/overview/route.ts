// admin-dashboard-nextjs/app/api/admin/overview/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [invRes, patRes, devRes, measRes, auditRes] = await Promise.all([
      supabaseAdmin.from('device_inventory').select('id, device_code, status, created_at'),
      supabaseAdmin.from('patients').select('id, user_id, name, email, phone, patient_code, dominant_hand, weight_kg, height_cm, hand_strength_lo, hand_strength_hi'),
      supabaseAdmin.from('devices').select('id, user_id, device_code, device_name, is_active'),
      supabaseAdmin.from('measurements').select('id, device_id, hand, posture, trial1, trial2, trial3, best, recorded_at, created_at').order('recorded_at', { ascending: false }).limit(20),
      supabaseAdmin.from('device_audit').select('*').order('created_at', { ascending: false }).limit(20),
    ])

    const inventoryData = invRes.data ?? []
    const patientsData = patRes.data ?? []
    const devicesData = devRes.data ?? []
    const measurementsData = measRes.data ?? []
    const auditsData = auditRes.data ?? []

    const totalInventory = inventoryData.length
    const manufacturedCount = inventoryData.filter(d => (d.status ?? '').toLowerCase() === 'manufactured').length
    const pairedInventoryCount = inventoryData.filter(d => (d.status ?? '').toLowerCase() === 'paired').length
    const totalPatients = patientsData.length
    const totalDevices = devicesData.length
    const totalMeasurements = measurementsData.length

    return NextResponse.json({
      success: true,
      stats: {
        inventory: totalInventory,
        manufactured: manufacturedCount,
        paired: pairedInventoryCount,
        patients: totalPatients,
        devices: totalDevices,
        measurements: totalMeasurements,
      },
      recentAudits: auditsData,
      recentMeasurements: measurementsData,
      patientsSummary: patientsData,
    })
  } catch (error: any) {
    console.error('Error fetching admin overview:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
