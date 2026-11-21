'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, Search, RefreshCw, Filter, Clock } from 'lucide-react'

interface AuditEntry {
  id: string
  admin_id: string
  action: string
  device_code: string
  details: string | null
  created_at: string
}

const actionBadges: Record<string, { bg: string; text: string; border: string }> = {
  create:    { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  generated: { bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    border: 'border-cyan-500/30' },
  delete:    { bg: 'bg-rose-500/15',    text: 'text-rose-400',    border: 'border-rose-500/30' },
  update:    { bg: 'bg-sky-500/15',     text: 'text-sky-400',     border: 'border-sky-500/30' },
  disable:   { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30' },
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
    try {
      const res = await fetch('/api/admin/audit', { cache: 'no-store' })
      const json = await res.json()
      if (json.success) {
        setLogs(json.logs ?? [])
        setFiltered(json.logs ?? [])
      } else {
        setError(json.error || 'Failed to load audit logs')
      }
    } catch (e: any) {
      setError(e.message || 'Error fetching audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let r = [...logs]
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(l => 
        (l.device_code || '').toLowerCase().includes(q) || 
        (l.details ?? '').toLowerCase().includes(q) ||
        (l.action || '').toLowerCase().includes(q)
      )
    }
    if (actionFilter !== 'all') r = r.filter(l => l.action === actionFilter)
    setFiltered(r)
  }, [search, actionFilter, logs])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25 shadow-sm shadow-rose-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              Security & Provisioning Audit Log
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Audit Stream
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Tamper-evident logs of manufacturing codes, device provisioning, and system events
          </p>
        </div>

        <button 
          onClick={load} 
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.1] transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Counter Glass Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', val: logs.length, c: '#06B6D4', glow: 'rgba(6,182,212,0.25)', badge: 'All Records' },
          { label: 'Generation / Create', val: logs.filter(l => ['create', 'generated'].includes(l.action)).length, c: '#10B981', glow: 'rgba(16,185,129,0.25)', badge: 'Provisioned' },
          { label: 'Modifications', val: logs.filter(l => ['update', 'delete'].includes(l.action)).length, c: '#EC4899', glow: 'rgba(236,72,153,0.25)', badge: 'State Changes' },
          { label: 'Other Activity', val: logs.filter(l => !['create', 'generated', 'update', 'delete'].includes(l.action)).length, c: '#F59E0B', glow: 'rgba(245,158,11,0.25)', badge: 'Operations' },
        ].map((s) => (
          <div
            key={s.label}
            className="relative rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
            style={{
              background: 'linear-gradient(150deg, rgba(14, 22, 34, 0.8) 0%, rgba(8, 12, 20, 0.95) 100%)',
              border: `1px solid ${s.c}35`,
              boxShadow: `0 8px 24px -6px ${s.glow}`,
              backdropFilter: 'blur(20px)',
              padding: '24px 28px',
            }}
          >
            <div
              className="absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl opacity-30"
              style={{ background: s.c }}
            />
            <span
              className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-3"
              style={{ background: `${s.c}15`, color: s.c, border: `1px solid ${s.c}30` }}
            >
              {s.badge}
            </span>
            <div className="text-3xl font-extrabold tracking-tight text-white mb-1 font-mono">
              {loading ? '…' : s.val}
            </div>
            <div className="text-xs text-slate-400 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div
        className="rounded-2xl flex flex-col sm:flex-row gap-3"
        style={{
          background: 'rgba(14, 20, 30, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(16px)',
          padding: '16px 20px',
        }}
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search device code, details, action..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs text-slate-200 outline-none transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl text-xs text-slate-200 outline-none cursor-pointer"
            style={{
              background: '#0B111A',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <option value="all">All Actions</option>
            <option value="generated">Generated</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>
        </div>
      </div>

      {/* Main Glass Table with Horizontal Scroll Protection */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(150deg, rgba(12, 18, 28, 0.8) 0%, rgba(7, 10, 16, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {error && (
          <div className="p-4 text-xs text-rose-400 bg-rose-500/10 border-b border-rose-500/20">
            ⚠️ {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <div
              className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider"
              style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '16px 24px',
              }}
            >
              <span className="col-span-3">Device Code</span>
              <span className="col-span-2">Action</span>
              <span className="col-span-4">Audit Details</span>
              <span className="col-span-3 text-right">Timestamp</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Loading secure audit trail…
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <ShieldCheck className="w-8 h-8 text-slate-500 mx-auto" />
                <div className="text-sm font-semibold text-white">No audit records found</div>
                <div className="text-xs text-slate-500">Actions from the console are logged automatically.</div>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {filtered.map((l) => {
                  const badge = actionBadges[l.action] || { bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/25' }
                  return (
                    <div 
                      key={l.id} 
                      className="grid grid-cols-12 items-center text-xs text-slate-300 hover:bg-white/[0.02] transition-colors"
                      style={{ padding: '14px 24px' }}
                    >
                      <div className="col-span-3 flex items-center gap-2">
                        <span className="font-mono font-bold text-white px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                          {l.device_code}
                        </span>
                      </div>

                      <div className="col-span-2">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {l.action}
                        </span>
                      </div>

                      <div className="col-span-4 text-slate-400 text-xs truncate pr-4">
                        {l.details || '—'}
                      </div>

                      <div className="col-span-3 text-right text-slate-500 font-mono text-[11px] flex items-center justify-end gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{fmt(l.created_at)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
