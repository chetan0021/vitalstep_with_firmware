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
  create: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  generated: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  delete: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  update: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
  disable: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              Security & Provisioning Audit Log
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Audit Stream
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Tamper-evident logs of manufacturing codes, device provisioning, and system events.
          </p>
        </div>

        <button 
          onClick={load} 
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.1] transition-all cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Counter Glass Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[
          { label: 'Total Events', value: logs.length, color: '#38BDF8', badge: 'All Records' },
          { label: 'Generation / Create', value: logs.filter(l => ['create', 'generated'].includes(l.action)).length, color: '#34D399', badge: 'Provisioned' },
          { label: 'Modifications', value: logs.filter(l => ['update', 'delete'].includes(l.action)).length, color: '#F472B6', badge: 'State Changes' },
          { label: 'Other Activity', value: logs.filter(l => !['create', 'generated', 'update', 'delete'].includes(l.action)).length, color: '#FBBF24', badge: 'Operations' },
        ].map((s) => (
          <div key={s.label} className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              {s.badge}
            </span>
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-white mb-0.5" style={{ color: s.color }}>
                {loading ? '…' : s.value}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="glass-panel p-3 rounded-2xl flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search device code, details, action..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl glass-input text-xs bg-[#0F172A] text-slate-200 cursor-pointer"
          >
            <option value="all">All Actions</option>
            <option value="generated">Generated</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>
        </div>
      </div>

      {/* Main Glass Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/[0.08]">
        <div className="grid grid-cols-12 text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5 bg-white/[0.02] border-b border-white/[0.06]">
          <span className="col-span-3">Device Code</span>
          <span className="col-span-2">Action</span>
          <span className="col-span-4">Audit Details</span>
          <span className="col-span-3 text-right">Timestamp</span>
        </div>

        {error && (
          <div className="p-4 text-xs text-rose-400 bg-rose-500/10 border-b border-rose-500/20">
            ⚠️ {error}
          </div>
        )}

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
              const badge = actionBadges[l.action] || { bg: 'bg-slate-500/10', text: 'text-slate-300', border: 'border-slate-500/20' }
              return (
                <div 
                  key={l.id} 
                  className="grid grid-cols-12 items-center px-5 py-3.5 text-xs text-slate-300 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="col-span-3 flex items-center gap-2">
                    <span className="font-mono font-bold text-white px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
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

                  <div className="col-span-3 text-right text-slate-400 font-mono text-[11px] flex items-center justify-end gap-1.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{fmt(l.created_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
