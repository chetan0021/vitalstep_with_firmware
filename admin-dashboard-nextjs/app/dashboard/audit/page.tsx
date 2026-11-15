'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AuditEntry {
  id: string
  admin_id: string
  action: string
  device_code: string
  details: string | null
  created_at: string
}

const actionStyle: Record<string, { bg: string; color: string }> = {
  create:  { bg: '#ecfdf5', color: '#065f46' },
  delete:  { bg: '#fef2f2', color: '#991b1b' },
  update:  { bg: '#eff6ff', color: '#1d4ed8' },
  disable: { bg: '#fff7ed', color: '#9a3412' },
}

function fmt(ts: string) {
  const d = new Date(ts)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [filtered, setFiltered] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  const load = async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('device_audit')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) setError(error.message)
    else { setLogs(data ?? []); setFiltered(data ?? []) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let r = [...logs]
    if (search) r = r.filter(l => l.device_code.toLowerCase().includes(search.toLowerCase()) || (l.details ?? '').toLowerCase().includes(search.toLowerCase()))
    if (actionFilter !== 'all') r = r.filter(l => l.action === actionFilter)
    setFiltered(r)
  }, [search, actionFilter, logs])

  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Audit Log</h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '15px' }}>All entries from <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>device_audit</code></p>
        </div>
        <button onClick={load} style={{ padding: '9px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
          🔄 Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {[
          { label: 'Total Events', value: logs.length, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Create', value: logs.filter(l => l.action === 'create').length, color: '#10b981', bg: '#ecfdf5' },
          { label: 'Delete', value: logs.filter(l => l.action === 'delete').length, color: '#ef4444', bg: '#fef2f2' },
          { label: 'Other', value: logs.filter(l => !['create','delete'].includes(l.action)).length, color: '#f59e0b', bg: '#fffbeb' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}22`, borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 900, color: s.color }}>{loading ? '…' : s.value}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '12px 16px', marginBottom: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search device code or details..." style={{ flex: 1, minWidth: '180px', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '13px', outline: 'none', color: '#374151' }} />
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '13px', color: '#374151', background: '#fff', outline: 'none' }}>
          <option value="all">All Actions</option>
          <option value="create">Create</option>
          <option value="delete">Delete</option>
          <option value="update">Update</option>
          <option value="disable">Disable</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '140px 90px 1fr 180px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', padding: '11px 20px', gap: '14px' }}>
          {['Device Code', 'Action', 'Details', 'Timestamp'].map(h => (
            <div key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
          ))}
        </div>

        {error && <div style={{ padding: '16px 20px', color: '#dc2626', background: '#fef2f2', fontSize: '13px' }}>⚠️ {error}</div>}

        {loading && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
            <div style={{ fontSize: '14px' }}>Loading audit log…</div>
          </div>
        )}

        {!loading && !error && filtered.map((l, i) => {
          const as = actionStyle[l.action] ?? { bg: '#f1f5f9', color: '#475569' }
          return (
            <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '140px 90px 1fr 180px', padding: '12px 20px', gap: '14px', borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center' }}>
              <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#1e293b', fontSize: '13px', background: '#f8fafc', padding: '3px 7px', borderRadius: '5px', display: 'inline-block' }}>{l.device_code}</div>
              <div>
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: as.bg, color: as.color, textTransform: 'capitalize' }}>{l.action}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.details ?? '—'}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{fmt(l.created_at)}</div>
            </div>
          )
        })}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '44px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>No audit entries yet</div>
            <div style={{ color: '#64748b', fontSize: '14px' }}>Actions from this dashboard are logged here automatically.</div>
          </div>
        )}
      </div>
    </div>
  )
}
