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
  create:    { bg: 'bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/30' },
  generated: { bg: 'bg-teal-500/15',    text: 'text-teal-700 dark:text-teal-400',    border: 'border-teal-500/30' },
  delete:    { bg: 'bg-rose-500/15',    text: 'text-rose-700 dark:text-rose-400',    border: 'border-rose-500/30' },
  update:    { bg: 'bg-sky-500/15',     text: 'text-sky-700 dark:text-sky-400',     border: 'border-sky-500/30' },
  disable:   { bg: 'bg-amber-500/15',   text: 'text-amber-700 dark:text-amber-400',   border: 'border-amber-500/30' },
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-black/10 dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/35 shadow-sm shadow-rose-500/20">
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              Security & Provisioning Audit Log
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#003884] dark:text-white">
            Audit Stream
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mt-1.5 font-medium">
            Tamper-evident logs of manufacturing codes, device provisioning, and system events
          </p>
        </div>

        <button 
          onClick={load} 
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-black/5 dark:bg-white/[0.06] hover:bg-black/10 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 border border-black/10 dark:border-white/10 transition-all cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-rose-500' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-[var(--bg-card)] border border-black/10 dark:border-white/[0.08] p-4 sm:p-5 flex flex-col sm:flex-row gap-3.5 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by device code, action, or details..."
            className="w-full pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm font-medium executive-input"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-4 py-3 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer bg-black/5 dark:bg-[#0D121B] border border-black/10 dark:border-white/10"
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
      <div
        className="rounded-3xl overflow-hidden bg-[var(--bg-card)] border border-black/10 dark:border-white/[0.1] shadow-sm"
      >
        {error && (
          <div className="p-4 text-xs font-semibold text-rose-600 dark:text-rose-300 bg-rose-500/10 border-b border-rose-500/20">
            ⚠️ {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02]">
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[20%]">Action</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[25%]">Device Code</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[35%]">Details</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[20%]">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-16 text-center text-xs sm:text-sm text-slate-500 font-medium">Loading audit trail…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-16 text-center text-slate-500">
                    <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <div className="text-base font-bold text-slate-800 dark:text-white">No audit records found</div>
                    <div className="text-xs text-slate-500 mt-1">Actions taken across the console will appear here.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const badge = actionBadges[log.action] || { bg: 'bg-slate-500/15', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-500/30' }
                  return (
                    <tr key={log.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {log.action}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono font-black text-slate-900 dark:text-white text-sm px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/[0.06] border border-black/10 dark:border-white/[0.1]">
                          {log.device_code}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                        {log.details || '—'}
                      </td>

                      <td className="px-6 py-4 text-right font-mono text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
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
