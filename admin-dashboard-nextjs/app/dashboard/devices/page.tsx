'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cpu, Search, RefreshCw, Zap, Copy, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react'
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/25 shadow-sm shadow-violet-500/20">
              <Cpu className="w-3.5 h-3.5" />
              Hardware Telemetry Inventory
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Device Fleet Inventory
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manufacturing activation keys, cryptographic pairing hashes, and active patient assignments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/generate"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Generate New</span>
          </Link>

          <button 
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.1] transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 3 Luminous Neon KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Fleet Units', val: total, c: '#06B6D4', glow: 'rgba(6,182,212,0.25)', badge: 'All Inventory' },
          { label: 'Manufactured / Ready', val: manufactured, c: '#10B981', glow: 'rgba(16,185,129,0.25)', badge: 'In Stock' },
          { label: 'Paired to Patient', val: paired, c: '#8B5CF6', glow: 'rgba(139,92,246,0.25)', badge: 'In Clinical Field' },
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

      {/* Filter and Search Bar */}
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
            placeholder="Search by device code..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs text-slate-200 outline-none transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-xs text-slate-200 outline-none cursor-pointer"
          style={{
            background: '#0B111A',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <option value="all">All Statuses</option>
          <option value="manufactured">Manufactured (In Stock)</option>
          <option value="paired">Paired (Clinical)</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Devices Glass Table with Horizontal Scroll Protection */}
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
            {/* Table Header */}
            <div
              className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider"
              style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '16px 24px',
              }}
            >
              <span className="col-span-3">Device Code</span>
              <span className="col-span-5">Hardware Secret</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-2 text-right">Registered Date</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading hardware inventory…</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Cpu className="w-8 h-8 text-slate-500 mx-auto" />
                <div className="text-sm font-semibold text-white">No devices found</div>
                <div className="text-xs text-slate-500">Generate a new device code to populate this fleet.</div>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {filtered.map((d) => {
                  const isRevealed = revealedSecrets[d.id]
                  const isPaired = d.status === 'paired'
                  return (
                    <div
                      key={d.id}
                      className="grid grid-cols-12 items-center text-xs text-slate-300 hover:bg-white/[0.02] transition-colors"
                      style={{ padding: '14px 24px' }}
                    >
                      <div className="col-span-3 flex items-center gap-2">
                        <span className="font-mono font-bold text-white px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                          {d.device_code}
                        </span>
                        {d.device_code === 'VS-001002' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Sandip R
                          </span>
                        )}
                      </div>

                      <div className="col-span-5 flex items-center gap-2 pr-4">
                        <span className="font-mono text-[11px] text-slate-400 truncate">
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

                      <div className="col-span-2">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                          style={isPaired ? {
                            background: 'rgba(16, 185, 129, 0.15)',
                            borderColor: 'rgba(16, 185, 129, 0.35)',
                            color: '#34D399',
                          } : {
                            background: 'rgba(6, 182, 212, 0.15)',
                            borderColor: 'rgba(6, 182, 212, 0.35)',
                            color: '#67E8F9',
                          }}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isPaired ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                          {d.status}
                        </span>
                      </div>

                      <div className="col-span-2 text-right font-mono text-[11px] text-slate-500">
                        {fmt(d.created_at)}
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
