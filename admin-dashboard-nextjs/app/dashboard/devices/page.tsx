'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cpu, Search, RefreshCw, Zap, Copy, Check, Eye, EyeOff } from 'lucide-react'
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
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: dErr } = await supabase
        .from('device_inventory')
        .select('*')
        .order('created_at', { ascending: false })

      if (dErr) throw dErr
      setDevices(data ?? [])
      setFiltered(data ?? [])
    } catch (err: any) {
      setError(err.message || 'Error loading devices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let r = [...devices]
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(d => (d.device_code || '').toLowerCase().includes(q))
    }
    if (statusFilter !== 'all') r = r.filter(d => d.status === statusFilter)
    setFiltered(r)
  }, [search, statusFilter, devices])

  const copySecret = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleReveal = (id: string) => {
    setRevealedSecrets(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const total = devices.length
  const manufactured = devices.filter(d => d.status === 'manufactured').length
  const paired = devices.filter(d => d.status === 'paired').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Cpu className="w-3.5 h-3.5" />
              Hardware Telemetry Inventory
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Device Fleet Inventory
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Manufacturing activation keys, cryptographic pairing hashes, and active patient assignments
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/generate"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Generate New</span>
          </Link>

          <button 
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 3 Executive Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Fleet Units', val: total, color: '#38BDF8', badge: 'All Inventory' },
          { label: 'Manufactured / Ready', val: manufactured, color: '#64748B', badge: 'In Stock' },
          { label: 'Paired to Patient', val: paired, color: '#10B981', badge: 'In Clinical Field' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl bg-[#101520] border border-white/[0.07] p-5 sm:p-6"
          >
            <span
              className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded mb-3"
              style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}30` }}
            >
              {s.badge}
            </span>
            <div className="text-3xl font-bold tracking-tight text-white mb-1 font-mono">
              {loading ? '…' : s.val}
            </div>
            <div className="text-xs text-slate-400 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl bg-[#101520] border border-white/[0.07] p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by device code..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs executive-input"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-xs text-slate-200 outline-none cursor-pointer bg-[#0D121B] border border-white/10"
        >
          <option value="all">All Statuses</option>
          <option value="manufactured">Manufactured (In Stock)</option>
          <option value="paired">Paired (Clinical)</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Devices Table */}
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
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-[25%]">Device Code</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-[40%]">Hardware Secret</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-[18%]">Status</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-[17%]">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-xs text-slate-400">Loading hardware inventory…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400">
                    <Cpu className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <div className="text-sm font-semibold text-white">No devices found</div>
                    <div className="text-xs text-slate-500 mt-1">Generate a new device code to populate this fleet.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((d) => {
                  const isRevealed = revealedSecrets[d.id]
                  const isPaired = d.status === 'paired'
                  return (
                    <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]">
                            {d.device_code}
                          </span>
                          {d.device_code === 'VS-001002' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Sandip R
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-400 truncate max-w-[240px]">
                            {isRevealed ? d.device_secret : `${(d.device_secret || '').substring(0, 16)}••••••••••••••••`}
                          </span>
                          <button 
                            onClick={() => toggleReveal(d.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                            title={isRevealed ? "Hide secret" : "Show secret"}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button 
                            onClick={() => copySecret(d.device_secret, d.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                            title="Copy secret"
                          >
                            {copiedId === d.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                            isPaired
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-700/20 text-slate-300 border-slate-600/30'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isPaired ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                          {d.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right font-mono text-[11px] text-slate-500">
                        {fmt(d.created_at)}
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
