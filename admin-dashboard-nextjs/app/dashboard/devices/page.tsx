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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/15 text-violet-300 border border-violet-500/35 shadow-sm shadow-violet-500/20">
              <Cpu className="w-4 h-4 stroke-[2.5]" />
              Hardware Telemetry Inventory
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Device Fleet Inventory
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-1.5 font-medium">
            Manufacturing activation keys, cryptographic pairing hashes, and active patient assignments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/generate"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white transition-all shadow-md shadow-amber-500/25 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Generate New</span>
          </Link>

          <button 
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/10 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-violet-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 3 Vibrant Multi-Colored KPI Cards (Bigger Numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Total Fleet Units', val: total, color: '#38BDF8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.35)', shadow: 'rgba(56,189,248,0.2)', badge: 'All Inventory' },
          { label: 'Manufactured / Ready', val: manufactured, color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', shadow: 'rgba(16,185,129,0.2)', badge: 'In Stock' },
          { label: 'Paired to Patient', val: paired, color: '#A855F7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.35)', shadow: 'rgba(168,85,247,0.2)', badge: 'In Clinical Field' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-3xl p-6 sm:p-7 relative overflow-hidden transition-all duration-200 hover:-translate-y-1"
            style={{
              background: `linear-gradient(145deg, ${s.bg} 0%, rgba(12, 17, 28, 0.95) 100%)`,
              border: `1px solid ${s.border}`,
              boxShadow: `0 10px 30px -8px ${s.shadow}`,
            }}
          >
            <span
              className="inline-block text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-3.5"
              style={{ background: `${s.color}25`, color: s.color, border: `1px solid ${s.color}45` }}
            >
              {s.badge}
            </span>
            <div className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-1.5 font-mono">
              {loading ? '…' : s.val}
            </div>
            <div className="text-xs sm:text-sm text-slate-300 font-bold">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-[#101520] border border-white/[0.08] p-4 sm:p-5 flex flex-col sm:flex-row gap-3.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by device code..."
            className="w-full pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm font-medium executive-input"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 rounded-xl text-xs sm:text-sm font-bold text-slate-200 outline-none cursor-pointer bg-[#0D121B] border border-white/10"
        >
          <option value="all">All Statuses</option>
          <option value="manufactured">Manufactured (In Stock)</option>
          <option value="paired">Paired (Clinical)</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Devices Table */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(150deg, rgba(14, 20, 32, 0.9) 0%, rgba(8, 12, 20, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {error && (
          <div className="p-4 text-xs text-rose-300 bg-rose-500/10 border-b border-rose-500/20">
            ⚠️ {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider w-[25%]">Device Code</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider w-[40%]">Hardware Secret</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider w-[18%]">Status</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider w-[17%]">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-16 text-center text-xs sm:text-sm text-slate-400 font-medium">Loading hardware inventory…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-16 text-center text-slate-400">
                    <Cpu className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                    <div className="text-base font-bold text-white">No devices found</div>
                    <div className="text-xs text-slate-400 mt-1">Generate a new device code to populate this fleet.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((d) => {
                  const isRevealed = revealedSecrets[d.id]
                  const isPaired = d.status === 'paired'
                  return (
                    <tr key={d.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-white text-sm px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/[0.1]">
                            {d.device_code}
                          </span>
                          {d.device_code === 'VS-001002' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/35">
                              Sandip R
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs sm:text-sm text-slate-300 truncate max-w-[260px]">
                            {isRevealed ? d.device_secret : `${(d.device_secret || '').substring(0, 16)}••••••••••••••••`}
                          </span>
                          <button 
                            onClick={() => toggleReveal(d.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                            title={isRevealed ? "Hide secret" : "Show secret"}
                          >
                            {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => copySecret(d.device_secret, d.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                            title="Copy secret"
                          >
                            {copiedId === d.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            isPaired
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isPaired ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                          {d.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right font-mono text-xs sm:text-sm font-semibold text-slate-400">
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
