'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface DeviceInv {
  id: string
  device_code: string
  device_secret: string
  status: string
  paired_user_id: string | null
  paired_at: string | null
  notes: string | null
  created_at: string
  created_by: string
}

const statusStyle: Record<string, { bg: string; color: string; dot: string }> = {
  manufactured: { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
  paired:       { bg: '#ecfdf5', color: '#065f46', dot: '#10b981' },
  disabled:     { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444' },
}

function Badge({ status }: { status: string }) {
  const s = statusStyle[status] ?? { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: s.bg, color: s.color }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot, display: 'inline-block', flexShrink: 0 }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function fmt(ts: string | null) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceInv[]>([])
  const [filtered, setFiltered] = useState<DeviceInv[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('device_inventory')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else { setDevices(data ?? []); setFiltered(data ?? []) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let r = [...devices]
    if (search) r = r.filter(d => d.device_code.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter !== 'all') r = r.filter(d => d.status === statusFilter)
    setFiltered(r)
  }, [search, statusFilter, devices])

  const total = devices.length
  const manufactured = devices.filter(d => d.status === 'manufactured').length
  const paired = devices.filter(d => d.status === 'paired').length

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Device Inventory</h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '15px' }}>All entries in <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>device_inventory</code></p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={load} style={{ padding: '9px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151' }}>🔄 Refresh</button>
          <a href="/dashboard/generate" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', color: '#fff', borderRadius: '9px', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>
            ⚡ Generate New
          </a>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {[
          { label: 'Total Created', value: total,        color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'Manufactured',  value: manufactured, color: '#10b981', bg: '#ecfdf5', border: '#bbf7d0' },
          { label: 'Paired',        value: paired,       color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: s.color }}>{loading ? '…' : s.value}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '12px 16px', marginBottom: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search device code..." style={{ flex: 1, minWidth: '180px', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '13px', outline: 'none', color: '#374151' }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '13px', color: '#374151', background: '#fff', outline: 'none' }}>
          <option value="all">All Statuses</option>
          <option value="manufactured">Manufactured</option>
          <option value="paired">Paired</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {/* Head */}
        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 120px 110px 110px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', padding: '11px 20px', gap: '14px' }}>
          {['Device Code', 'Secret (truncated)', 'Status', 'Created', 'Paired At'].map(h => (
            <div key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
          ))}
        </div>

        {/* Error */}
        {error && <div style={{ padding: '16px 20px', color: '#dc2626', background: '#fef2f2', fontSize: '13px' }}>⚠️ {error}</div>}

        {/* Loading */}
        {loading && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
            <div style={{ fontSize: '14px' }}>Loading from Supabase…</div>
          </div>
        )}

        {/* Rows */}
        {!loading && !error && filtered.map((d, i) => (
          <div key={d.id} style={{
            display: 'grid', gridTemplateColumns: '150px 1fr 120px 110px 110px',
            padding: '13px 20px', gap: '14px',
            borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none',
            alignItems: 'center',
          }}>
            <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#1e293b', fontSize: '14px', letterSpacing: '1px', background: '#f8fafc', padding: '4px 8px', borderRadius: '5px', display: 'inline-block' }}>
              {d.device_code}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.device_secret?.substring(0, 32)}…
            </div>
            <div><Badge status={d.status} /></div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>{fmt(d.created_at)}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>{fmt(d.paired_at)}</div>
          </div>
        ))}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '44px', marginBottom: '12px' }}>📦</div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
              {devices.length === 0 ? 'No devices in Supabase yet' : 'No results match'}
            </div>
            <div style={{ color: '#64748b', fontSize: '14px' }}>
              {devices.length === 0 ? 'Generate a device code to populate this table.' : 'Clear your search or filter.'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
