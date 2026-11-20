'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Users, 
  Cpu, 
  Activity, 
  ShieldCheck, 
  ArrowUpRight, 
  RefreshCw, 
  Sparkles,
  Zap,
  CheckCircle2,
  Stethoscope,
  ChevronRight,
  TrendingUp,
  Layers
} from 'lucide-react'

export default function DashboardPage() {
  const [data, setData] = useState<{
    stats: {
      inventory: number
      manufactured: number
      paired: number
      patients: number
      devices: number
      measurements: number
    }
    recentAudits: any[]
    recentMeasurements: any[]
    patientsSummary: any[]
  }>({
    stats: { inventory: 0, manufactured: 0, paired: 0, patients: 0, devices: 0, measurements: 0 },
    recentAudits: [],
    recentMeasurements: [],
    patientsSummary: [],
  })

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    try {
      setRefreshing(true)
      const res = await fetch('/api/admin/overview', { cache: 'no-store' })
      const json = await res.json()
      if (json.success) {
        setData({
          stats: json.stats,
          recentAudits: json.recentAudits ?? [],
          recentMeasurements: json.recentMeasurements ?? [],
          patientsSummary: json.patientsSummary ?? [],
        })
      }
    } catch (err) {
      console.error('Failed to load overview data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const { stats, recentAudits, recentMeasurements, patientsSummary } = data
  const primaryPatient = patientsSummary[0] || null

  return (
    <div className="space-y-8">
      {/* Top Glass Header & Capsule Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry Connected
            </span>
            <span className="text-xs text-slate-400">VitalStep Clinical Network</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Clinical Overview
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time synchronization between IoT hand sensors, patient profiles, and medical specialists.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/patients"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all shadow-sm"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Patient Dossier</span>
          </Link>

          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.1] transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* KPI Glass Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[
          { label: 'Registered Patients', value: loading ? '…' : stats.patients, icon: Users, color: '#34D399', badge: 'Active Clinical' },
          { label: 'Total Measurements', value: loading ? '…' : stats.measurements, icon: Activity, color: '#38BDF8', badge: 'Telemetry Tests' },
          { label: 'Paired Devices', value: loading ? '…' : stats.paired, icon: Cpu, color: '#818CF8', badge: 'In Field' },
          { label: 'Active Devices', value: loading ? '…' : stats.devices, icon: Zap, color: '#F472B6', badge: 'Hardware Linked' },
          { label: 'Manufactured Inventory', value: loading ? '…' : stats.manufactured, icon: Layers, color: '#FBBF24', badge: 'Ready to Ship' },
          { label: 'Audit Events', value: loading ? '…' : recentAudits.length, icon: ShieldCheck, color: '#A78BFA', badge: 'Security Logs' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div 
              key={stat.label}
              className="glass-panel glass-panel-hover p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.05] ring-1 ring-white/10"
                  style={{ color: stat.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  {stat.badge}
                </span>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-0.5">
                  {stat.value}
                </div>
                <div className="text-xs text-slate-400 font-medium leading-tight">
                  {stat.label}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Featured Patient Clinical Spotlight (Glass Card inspired by Reference Image) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Patient & Biological Metrics */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl relative overflow-hidden space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Primary Patient Spotlight
                </span>
                <span className="text-xs text-slate-400">ID: {primaryPatient?.patient_code || 'PT-3714'}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">
                {primaryPatient?.name || 'Sandip R'}
              </h2>
              <p className="text-slate-400 text-xs">
                {primaryPatient?.email || 'sandipr@hotmail.com'} · Dominant Hand: {primaryPatient?.dominant_hand === 'R' ? 'Right' : 'Left'}
              </p>
            </div>

            <Link
              href="/dashboard/patients"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-slate-200 border border-white/[0.1] transition-all"
            >
              <span>View Full Dossier</span>
              <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
            </Link>
          </div>

          {/* Biological & Grip Baseline Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">Body Weight</span>
              <div className="text-lg font-bold text-white flex items-baseline gap-1">
                {primaryPatient?.weight_kg || '70'} <span className="text-xs font-normal text-slate-400">kg</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">Height</span>
              <div className="text-lg font-bold text-white flex items-baseline gap-1">
                {primaryPatient?.height_cm || '162'} <span className="text-xs font-normal text-slate-400">cm</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">Target Grip Range</span>
              <div className="text-lg font-bold text-cyan-300 flex items-baseline gap-1">
                {primaryPatient?.hand_strength_lo || '10'} - {primaryPatient?.hand_strength_hi || '18'} <span className="text-xs font-normal text-slate-400">kg</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">Hardware Sensor</span>
              <div className="text-lg font-bold text-indigo-300">
                VS-001002
              </div>
            </div>
          </div>

          {/* Linked Medical Specialist Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/20 via-indigo-950/20 to-slate-900/40 border border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Supervising Specialist</span>
                <div className="text-sm font-bold text-white">Dr. Chandan Reddy</div>
                <div className="text-xs text-slate-400">nncr540@gmail.com · Phone: +91 9942814286</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Full Clinical Access
              </span>
            </div>
          </div>

          {/* Recent Measurements from Sensor */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Latest Palm Pressure Readings
              </h3>
              <span className="text-xs text-slate-400 font-medium">9 Total Assessments Recorded</span>
            </div>

            <div className="rounded-2xl border border-white/[0.06] overflow-hidden bg-black/20">
              <div className="grid grid-cols-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.05]">
                <span>Hand</span>
                <span>Posture</span>
                <span>Trials (1 / 2 / 3)</span>
                <span>Peak Strength</span>
                <span className="text-right">Timestamp</span>
              </div>

              <div className="divide-y divide-white/[0.04]">
                {recentMeasurements.slice(0, 4).map((m: any) => (
                  <div key={m.id} className="grid grid-cols-5 items-center px-4 py-3 text-xs text-slate-300 hover:bg-white/[0.02] transition-colors">
                    <span className="font-semibold text-white">{m.hand || 'Left'}</span>
                    <span className="text-slate-400">{m.posture || 'Sitting'}</span>
                    <span className="font-mono text-slate-300">
                      {m.trial1 ?? '-'} / {m.trial2 ?? '-'} / {m.trial3 ?? '-'}
                    </span>
                    <span className="font-bold text-emerald-400">
                      {m.best ? `${m.best} kg` : '—'}
                    </span>
                    <span className="text-right text-slate-500 font-mono text-[11px]">
                      {m.recorded_at ? new Date(m.recorded_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Links & Live Audit Stream */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="glass-panel p-5 rounded-3xl space-y-3">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Administrative Actions
            </h3>

            <div className="space-y-2">
              {[
                { label: 'Patient Clinical Dossier', href: '/dashboard/patients', desc: 'Inspect bio metrics, condition, devices', icon: Users, color: '#34D399' },
                { label: 'Generate Device Code', href: '/dashboard/generate', desc: 'Provision hardware activation keys', icon: Zap, color: '#FBBF24' },
                { label: 'Device Inventory', href: '/dashboard/devices', desc: 'Track manufactured and paired units', icon: Cpu, color: '#818CF8' },
                { label: 'System Audit Log', href: '/dashboard/audit', desc: 'Inspect all operations & security logs', icon: ShieldCheck, color: '#F472B6' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.04]"
                        style={{ color: item.color }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.desc}
                        </div>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Recent Audit Feed */}
          <div className="glass-panel p-5 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                Live Audit Activity
              </h3>
              <Link href="/dashboard/audit" className="text-[11px] font-semibold text-cyan-400 hover:underline">
                View all
              </Link>
            </div>

            <div className="space-y-2">
              {recentAudits.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No audit events recorded yet.
                </div>
              ) : (
                recentAudits.slice(0, 3).map((a: any) => (
                  <div key={a.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-200">{a.device_code}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {a.action}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{a.details || 'System event'}</p>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      {a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
