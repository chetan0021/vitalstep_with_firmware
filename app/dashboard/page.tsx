'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    inventory: 0, manufactured: 0, paired: 0,
    patients: 0, devices: 0, measurements: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [inv, mfg, prd, pat, dev, meas] = await Promise.all([
        supabase.from('device_inventory').select('id', { count: 'exact', head: true }),
        supabase.from('device_inventory').select('id', { count: 'exact', head: true }).eq('status', 'manufactured'),
        supabase.from('device_inventory').select('id', { count: 'exact', head: true }).eq('status', 'paired'),
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('devices').select('id', { count: 'exact', head: true }),
        supabase.from('measurements').select('id', { count: 'exact', head: true }),
      ])
      setStats({
        inventory:    inv.count ?? 0,
        manufactured: mfg.count ?? 0,
        paired:       prd.count ?? 0,
        patients:     pat.count ?? 0,
        devices:      dev.count ?? 0,
        measurements: meas.count ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  const v = (n: number) => loading ? '…' : String(n)

  const statCards = [
    { label: 'Devices Created',  value: v(stats.inventory),    emoji: '🏭', bg: '#eff6ff', color: '#1d4ed8' },
    { label: 'Manufactured',     value: v(stats.manufactured), emoji: '📦', bg: '#ecfdf5', color: '#065f46' },
    { label: 'Paired / In Field',value: v(stats.paired),       emoji: '📱', bg: '#f5f3ff', color: '#5b21b6' },
    { label: 'Patients',         value: v(stats.patients),     emoji: '👤', bg: '#fff7ed', color: '#9a3412' },
    { label: 'Active Devices',   value: v(stats.devices),      emoji: '⚡', bg: '#fdf4ff', color: '#7e22ce' },
    { label: 'Measurements',     value: v(stats.measurements), emoji: '📊', bg: '#f0fdf4', color: '#14532d' },
  ]

  const quickLinks = [
    { label: 'Generate Device Code', desc: 'Create new activation codes for manufacturing', emoji: '⚡', href: '/dashboard/generate', bg: '#eff6ff', color: '#3b82f6' },
    { label: 'Device Inventory',     desc: 'View all manufactured & paired devices',        emoji: '📦', href: '/dashboard/devices',  bg: '#ecfdf5', color: '#10b981' },
    { label: 'Audit Log',            desc: 'Track all admin actions',                        emoji: '📋', href: '/dashboard/audit',    bg: '#f5f3ff', color: '#8b5cf6' },
  ]

  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#64748b', marginTop: '4px', fontSize: '15px' }}>VitalStep Admin — live data from Supabase.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {statCards.map(c => (
          <div key={c.label} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ width: '40px', height: '40px', background: c.bg, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}>{c.emoji}</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.value}</div>
            <div style={{ color: '#64748b', fontSize: '13px', marginTop: '5px', fontWeight: 500 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '18px' }}>
        {/* Quick Actions */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {quickLinks.map(q => (
              <a key={q.href} href={q.href} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '10px', background: q.bg, border: `1px solid ${q.color}22` }}>
                  <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.07)' }}>{q.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{q.label}</div>
                    <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>{q.desc}</div>
                  </div>
                  <div style={{ color: q.color, fontWeight: 700, fontSize: '18px' }}>→</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Status */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>System Status</h2>
          {['Supabase DB', 'Auth Service', 'API', 'Admin Console'].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{s}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, background: '#ecfdf5', padding: '2px 9px', borderRadius: '20px' }}>Online</span>
            </div>
          ))}
          <div style={{ marginTop: '16px', background: '#eff6ff', borderRadius: '9px', padding: '12px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8' }}>✓ Connected</div>
            <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '2px' }}>oyqecdcpicvzwwvwaeka</div>
          </div>
        </div>
      </div>
    </div>
  )
}
