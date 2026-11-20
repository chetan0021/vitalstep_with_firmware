// admin-dashboard-nextjs/app/api/admin/audit/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('device_audit')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300)

    if (error) throw error

    return NextResponse.json({ success: true, logs: data ?? [] })
  } catch (error: any) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { admin_id, action, device_code, details } = body

    const { data, error } = await supabaseAdmin
      .from('device_audit')
      .insert([{
        admin_id: admin_id || '09c41189-b0c7-4dc0-b9f9-153162041dfa',
        action: action || 'manual_entry',
        device_code: device_code || 'VS-SYSTEM',
        details: details || 'Admin action logged from console',
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, entry: data })
  } catch (error: any) {
    console.error('Error creating audit entry:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
