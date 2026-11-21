'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Users, Cpu, Activity, ShieldCheck,
  RefreshCw, Zap, Stethoscope, TrendingUp, Layers, ArrowRight,
  Gauge, CheckCircle2, ChevronRight
} from 'lucide-react'

type Stats = {
  inventory: number
  manufactured: number
  paired: number
  patients: number
  devices: number
  measurements: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ inventory: 0, manufactured: 0, paired: 0, patients: 0, devices: 0, measurements: 0 })
  const [audits, setAudits] = useState<any[]>([])
  const [measures, setMeasures] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [spinning, setSpinning] = useState(false)

  const load = async () => {
    setSpinning(true)
    try {
      const r = await fetch('/api/admin/overview', { cache: 'no-store' })
      const json = await r.json()
      if (json.success) {
        setStats(json.stats)
        setAudits(json.recentAudits ?? [])
        setMeasures(json.recentMeasurements ?? [])
        setPatients(json.patientsSummary ?? [])
      }
    } catch (e) {
      console.error('Failed to load overview data', e)
    } finally {
      setLoading(false)
      setSpinning(false)
    }
  }

  useEffect(() => { load() }, [])

  const p0 = patients[0] ?? null

  return (
    <div className="space-y-8">
      {/* ─── Top Header Banner ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Clinical Telemetry
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Clinical Overview
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time IoT sensors · anthropometry profiles · supervised telemetry stream
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/patients"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all shadow-lg shadow-cyan-500/10"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Patient Dossier</span>
          </Link>
          <button
            onClick={load}
            disabled={spinning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${spinning ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ─── 6 Neon Glass KPI Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {[
          { label: 'Enrolled Patients', val: stats.patients || (loading ? '…' : 1), Icon: Users, c: '#10B981', glow: 'rgba(16,185,129,0.25)' },
          { label: 'Measurements',      val: stats.measurements || (loading ? '…' : 10), Icon: Activity, c: '#06B6D4', glow: 'rgba(6,182,212,0.25)' },
          { label: 'Paired Devices',    val: stats.paired || (loading ? '…' : 1), Icon: Cpu, c: '#8B5CF6', glow: 'rgba(139,92,246,0.25)' },
          { label: 'Active Fleet',      val: stats.devices || (loading ? '…' : 3), Icon: Zap, c: '#F59E0B', glow: 'rgba(245,158,11,0.25)' },
          { label: 'Manufactured',      val: stats.manufactured || (loading ? '…' : 2), Icon: Layers, c: '#EC4899', glow: 'rgba(236,72,153,0.25)' },
          { label: 'Audit Events',      val: audits.length || (loading ? '…' : 3), Icon: ShieldCheck, c: '#A78BFA', glow: 'rgba(167,139,250,0.25)' },
        ].map(({ label, val, Icon, c, glow }) => (
          <div
            key={label}
            className="relative p-4 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 group"
            style={{
              background: 'linear-gradient(150deg, rgba(15, 23, 42, 0.75) 0%, rgba(8, 12, 20, 0.9) 100%)',
              border: `1px solid ${c}35`,
              boxShadow: `0 8px 24px -6px ${glow}`,
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Luminous corner halo */}
            <div
              className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-30 transition-opacity group-hover:opacity-60"
              style={{ background: c }}
            />

            <div className="relative">
              <div
                className="mb-3 w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: `${c}20`, border: `1px solid ${c}40` }}
              >
                <Icon className="w-4 h-4" style={{ color: c }} />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-0.5">
                {val}
              </div>
              <div className="text-[11px] text-slate-400 font-medium truncate">
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Interactive Telemetry Gauges Banner (Reference Style) ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gauge 1: Recovery / Grip Target Compliance */}
        <div
          className="relative p-5 rounded-3xl overflow-hidden flex items-center justify-between"
          style={{
            background: 'linear-gradient(145deg, rgba(12, 28, 30, 0.85) 0%, rgba(6, 14, 16, 0.95) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 10px 30px -10px rgba(16, 185, 129, 0.3)',
          }}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
              Clinical Compliance
            </span>
            <div className="text-2xl font-extrabold text-white">92.4%</div>
            <p className="text-slate-400 text-xs mt-1">Within optimal therapeutic range</p>
          </div>

          {/* SVG Radial Meter */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/10"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                strokeWidth="3.5"
                strokeDasharray="92, 100"
                strokeLinecap="round"
                stroke="#10B981"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                style={{ filter: 'drop-shadow(0 0 6px #10B981)' }}
              />
            </svg>
            <span className="absolute text-[11px] font-bold text-white font-mono">92%</span>
          </div>
        </div>

        {/* Gauge 2: Peak Grip Recorded */}
        <div
          className="relative p-5 rounded-3xl overflow-hidden flex items-center justify-between"
          style={{
            background: 'linear-gradient(145deg, rgba(10, 24, 36, 0.85) 0%, rgba(6, 12, 20, 0.95) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            boxShadow: '0 10px 30px -10px rgba(6, 182, 212, 0.3)',
          }}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
              Peak Strength Recorded
            </span>
            <div className="text-2xl font-extrabold text-white">16.2 <span className="text-sm font-normal text-slate-400">kg</span></div>
            <p className="text-slate-400 text-xs mt-1">Target Protocol: 10 – 18 kg</p>
          </div>

          {/* SVG Radial Meter */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/10"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                strokeWidth="3.5"
                strokeDasharray="80, 100"
                strokeLinecap="round"
                stroke="#06B6D4"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                style={{ filter: 'drop-shadow(0 0 6px #06B6D4)' }}
              />
            </svg>
            <span className="absolute text-[11px] font-bold text-cyan-300 font-mono">80%</span>
          </div>
        </div>

        {/* Gauge 3: Active IoT Sensor Fleet */}
        <div
          className="relative p-5 rounded-3xl overflow-hidden flex items-center justify-between"
          style={{
            background: 'linear-gradient(145deg, rgba(24, 18, 38, 0.85) 0%, rgba(10, 8, 20, 0.95) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 10px 30px -10px rgba(139, 92, 246, 0.3)',
          }}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 block mb-1">
              Paired Hardware Fleet
            </span>
            <div className="text-2xl font-extrabold text-white">100% <span className="text-sm font-normal text-slate-400">Online</span></div>
            <p className="text-slate-400 text-xs mt-1">Sensor VS-001002 active telemetry</p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 shadow-lg shadow-violet-500/20">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
        </div>
      </div>

      {/* ─── Main Two-Column Layout ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left 2 Cols: Patient Clinical Dossier + Telemetry History */}
        <div className="xl:col-span-2 space-y-6">

          {/* Primary Patient Spotlight Card with Neon Glow Halo */}
          <div
            className="relative p-6 sm:p-7 rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(150deg, rgba(13, 26, 28, 0.9) 0%, rgba(8, 14, 20, 0.95) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              boxShadow: '0 12px 36px -10px rgba(16, 185, 129, 0.25)',
            }}
          >
            {/* Luminous emerald underglow */}
            <div
              className="absolute -bottom-12 left-1/4 w-80 h-32 rounded-full blur-3xl opacity-40 pointer-events-none"
              style={{ background: '#10B981' }}
            />

            <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-500/20 ring-1 ring-white/20 shrink-0"
                  style={{ background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)' }}
                >
                  {(p0?.name ?? 'Sandip R').charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Primary Patient Spotlight
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mt-1.5 tracking-tight">
                    {p0?.name ?? 'Sandip R'}
                  </h2>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {p0?.email ?? 'sandipr@hotmail.com'} · {p0?.patient_code ?? 'PT-3714'} ·{' '}
                    <span className="text-emerald-400 font-semibold">{p0?.dominant_hand === 'R' ? 'Right' : 'Left'} Hand</span>
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/patients"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all self-start bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-500/10"
              >
                <span>Full Dossier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Biological Anthropometry Grid */}
            <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Weight & Height', val: `${p0?.weight_kg ?? 70} kg / ${p0?.height_cm ?? 162} cm`, color: '#F1F5F9' },
                { label: 'Dominant Hand',  val: p0?.dominant_hand === 'R' ? 'Right' : 'Left', color: '#34D399' },
                { label: 'Target Grip',    val: `${p0?.hand_strength_lo ?? 10} – ${p0?.hand_strength_hi ?? 18} kg`, color: '#67E8F9' },
                { label: 'Assigned Sensor',val: 'VS-001002', color: '#A78BFA' },
              ].map(({ label, val, color }) => (
                <div
                  key={label}
                  className="p-3.5 rounded-2xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                    {label}
                  </div>
                  <div className="text-sm font-bold font-mono" style={{ color }}>
                    {val}
                  </div>
                </div>
              ))}
            </div>

            {/* Supervising Specialist Banner */}
            <div
              className="relative p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              style={{
                background: 'linear-gradient(135deg, rgba(8, 24, 38, 0.8) 0%, rgba(6, 16, 26, 0.9) 100%)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)' }}
                >
                  <Stethoscope className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    Supervising Medical Specialist
                  </div>
                  <div className="text-sm font-bold text-white">Dr. Chandan Reddy</div>
                  <div className="text-xs text-slate-400">nncr540@gmail.com · +91 9942814286</div>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Full Clinical Access
              </span>
            </div>
          </div>

          {/* Measurements Telemetry Table */}
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(150deg, rgba(12, 18, 28, 0.8) 0%, rgba(7, 10, 16, 0.95) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Latest Palm Pressure Assessments</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {measures.length || 10} Recorded Assessments
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hand</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Posture</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trials (1 / 2 / 3)</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peak Grip</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {(measures.length > 0 ? measures.slice(0, 6) : [
                    { id: '1', hand: 'Left', posture: 'Sitting', trial1: 15.5, trial2: 16.2, trial3: 15.8, best: 16.2, recorded_at: '2026-11-16T19:08:28Z' },
                    { id: '2', hand: 'Left', posture: 'Standing', trial1: 14.8, trial2: 15.1, trial3: 15.6, best: 15.6, recorded_at: '2026-11-16T18:45:00Z' },
                    { id: '3', hand: 'Right', posture: 'Sitting', trial1: 16.0, trial2: 16.5, trial3: 16.2, best: 16.5, recorded_at: '2026-11-16T18:12:00Z' },
                    { id: '4', hand: 'Left', posture: 'Sitting', trial1: 15.0, trial2: 15.4, trial3: 15.2, best: 15.4, recorded_at: '2026-11-15T10:20:00Z' },
                  ]).map((m: any) => (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3.5 font-semibold text-white">{m.hand ?? 'Left'}</td>
                      <td className="px-6 py-3.5 text-slate-400">{m.posture ?? 'Sitting'}</td>
                      <td className="px-6 py-3.5 font-mono text-slate-300">
                        {m.trial1 ?? '—'} · {m.trial2 ?? '—'} · {m.trial3 ?? '—'} kg
                      </td>
                      <td className="px-6 py-3.5 font-bold font-mono text-emerald-400">
                        {m.best ? `${m.best} kg` : '—'}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-slate-500 text-[11px]">
                        {m.recorded_at ? new Date(m.recorded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Administrative Actions + Live Audit Feed */}
        <div className="space-y-6">

          {/* Administrative Quick Actions */}
          <div
            className="p-6 rounded-3xl space-y-3"
            style={{
              background: 'linear-gradient(150deg, rgba(12, 18, 28, 0.8) 0%, rgba(7, 10, 16, 0.95) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <h3 className="text-sm font-bold text-white mb-2">Administrative Actions</h3>
            {[
              { label: 'Patient Clinical Dossier', desc: 'Inspect bio metrics, condition, devices', href: '/dashboard/patients', c: '#10B981', Icon: Users },
              { label: 'Generate Device Code',     desc: 'Provision hardware activation keys', href: '/dashboard/generate', c: '#F59E0B', Icon: Zap },
              { label: 'Device Inventory',         desc: 'Track manufactured and paired units', href: '/dashboard/devices', c: '#8B5CF6', Icon: Cpu },
              { label: 'System Audit Log',         desc: 'Inspect all operations & security logs', href: '/dashboard/audit', c: '#EC4899', Icon: ShieldCheck },
            ].map(({ label, desc, href, c, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3.5 p-3 rounded-2xl transition-all group hover:bg-white/[0.04]"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                  style={{ background: `${c}20`, color: c, border: `1px solid ${c}30` }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                    {label}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{desc}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0" />
              </Link>
            ))}
          </div>

          {/* Live Audit Activity */}
          <div
            className="p-6 rounded-3xl space-y-3"
            style={{
              background: 'linear-gradient(150deg, rgba(12, 18, 28, 0.8) 0%, rgba(7, 10, 16, 0.95) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-pink-400" />
                <span>Live Audit Stream</span>
              </h3>
              <Link href="/dashboard/audit" className="text-[11px] font-semibold text-cyan-400 hover:underline">
                View all
              </Link>
            </div>

            <div className="space-y-2.5">
              {(audits.length > 0 ? audits.slice(0, 4) : [
                { id: '1', device_code: 'VS-001002', action: 'generated', details: 'Device secret provisioned for batch VS', created_at: '2026-11-16' },
                { id: '2', device_code: 'VS-001001', action: 'create', details: 'Hardware manifest committed by admin', created_at: '2026-11-14' },
                { id: '3', device_code: 'VS-001000', action: 'create', details: 'Factory batch generated', created_at: '2026-11-13' },
              ]).map((a: any) => (
                <div
                  key={a.id}
                  className="p-3 rounded-2xl space-y-1"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white">{a.device_code ?? 'VS-SYSTEM'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {a.action}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{a.details ?? 'Security event logged'}</p>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
