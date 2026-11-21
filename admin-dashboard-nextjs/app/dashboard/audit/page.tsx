'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, Search, RefreshCw } from 'lucide-react'

interface AuditEntry {
  id: string
  admin_id: string
  action: string
  device_code: string
  details: string | null
  created_at: string
}

const actionBadges: Record<string, { bg: string; text: string; border: string }> = {
  create:    { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  generated: { bg: 'bg-teal-500/10',    text: 'text-teal-400',    border: 'border-teal-500/20' },
  delete:    { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20' },
  update:    { bg: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'border-sky-500/20' },
  disable:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Security & Provisioning Audit Log
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Audit Stream
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Tamper-evident logs of manufacturing codes, device provisioning, and system events
          </p>
        </div>

        <button 
          onClick={load} 
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl bg-[#101520] border border-white/[0.07] p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by device code, action, or details..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs executive-input"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-xs text-slate-200 outline-none cursor-pointer bg-[#0D121B] border border-white/10"
        >
          <option value="all">All Actions</option>
          <option value="create">Create</option>
          <option value="generated">Generated</option>
          <option value="delete">Delete</option>
          <option value="update">Update</option>
          <option value="disable">Disable</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-[#101520] border border-white/[0.07] overflow-hidden">
        {error && (
          <div className="p-4 text-xs text-rose-400 bg-rose-500/10 border-b border-rose-500/20">
            ⚠️ {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-[20%]">Action</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-[25%]">Device Code</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-[35%]">Details</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-[20%]">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-xs text-slate-400">Loading audit trail…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <div className="text-sm font-semibold text-white">No audit records found</div>
                    <div className="text-xs text-slate-500 mt-1">Actions taken across the console will appear here.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const badge = actionBadges[log.action] || { bg: 'bg-slate-700/20', text: 'text-slate-300', border: 'border-slate-600/30' }
                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {log.action}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]">
                          {log.device_code}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-slate-300">
                        {log.details || '—'}
                      </td>

                      <td className="px-5 py-3.5 text-right font-mono text-[11px] text-slate-500">
                        {fmt(log.created_at)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
