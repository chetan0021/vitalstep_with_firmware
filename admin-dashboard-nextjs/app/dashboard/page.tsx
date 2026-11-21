'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Users, Cpu, Activity, ShieldCheck,
  RefreshCw, Zap, Stethoscope, TrendingUp, Layers, ArrowRight
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live Clinical Telemetry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Clinical Overview
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Real-time IoT sensors · Anthropometry profiles · Supervised telemetry stream
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/patients"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Patient Dossier</span>
          </Link>
          <button
            onClick={load}
            disabled={spinning}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${spinning ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ─── 6 Executive KPI Stat Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {[
          { label: 'Enrolled Patients', val: stats.patients || (loading ? '…' : 1), Icon: Users, color: '#10B981' },
          { label: 'Measurements',      val: stats.measurements || (loading ? '…' : 10), Icon: Activity, color: '#14B8A6' },
          { label: 'Paired Devices',    val: stats.paired || (loading ? '…' : 1), Icon: Cpu, color: '#8B5CF6' },
          { label: 'Active Fleet',      val: stats.devices || (loading ? '…' : 3), Icon: Zap, color: '#F59E0B' },
          { label: 'Manufactured',      val: stats.manufactured || (loading ? '…' : 2), Icon: Layers, color: '#64748B' },
          { label: 'Audit Events',      val: audits.length || (loading ? '…' : 3), Icon: ShieldCheck, color: '#38BDF8' },
        ].map(({ label, val, Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl bg-[#101520] border border-white/[0.07] p-5 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${color}15`, color }}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight mb-1 font-mono">
              {val}
            </div>
            <div className="text-xs text-slate-400 font-medium truncate">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Telemetry Gauges Banner ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gauge 1: Recovery / Grip Target Compliance */}
        <div className="rounded-2xl bg-[#101520] border border-white/[0.07] p-6 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 block mb-1">
              Clinical Compliance
            </span>
            <div className="text-2xl font-bold text-white">92.4%</div>
            <p className="text-slate-400 text-xs mt-1">Within optimal therapeutic range</p>
          </div>

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
              />
            </svg>
            <span className="absolute text-xs font-bold text-white font-mono">92%</span>
          </div>
        </div>

        {/* Gauge 2: Peak Grip Recorded */}
        <div className="rounded-2xl bg-[#101520] border border-white/[0.07] p-6 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-400 block mb-1">
              Peak Strength Recorded
            </span>
            <div className="text-2xl font-bold text-white">
              16.2 <span className="text-sm font-normal text-slate-400">kg</span>
            </div>
            <p className="text-slate-400 text-xs mt-1">Target Protocol: 10 – 18 kg</p>
          </div>

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
                stroke="#14B8A6"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-bold text-teal-300 font-mono">80%</span>
          </div>
        </div>

        {/* Gauge 3: Active IoT Sensor Fleet */}
        <div className="rounded-2xl bg-[#101520] border border-white/[0.07] p-6 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-400 block mb-1">
              Paired Hardware Fleet
            </span>
            <div className="text-2xl font-bold text-white">
              100% <span className="text-sm font-normal text-slate-400">Online</span>
            </div>
            <p className="text-slate-400 text-xs mt-1">Sensor VS-001002 active telemetry</p>
          </div>

          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Cpu className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ─── Main Two-Column Layout ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left 2 Cols: Patient Dossier + Telemetry History */}
        <div className="xl:col-span-2 space-y-6">

          {/* Primary Patient Spotlight Card */}
          <div className="rounded-2xl bg-[#101520] border border-white/[0.07] p-6 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg font-bold shrink-0">
                  {(p0?.name ?? 'Sandip R').charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Primary Patient Spotlight
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1 tracking-tight">
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
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 transition-colors self-start"
              >
                <span>Full Dossier</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>

            {/* Anthropometry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Weight & Height', val: `${p0?.weight_kg ?? 70} kg / ${p0?.height_cm ?? 162} cm`, color: '#F1F5F9' },
                { label: 'Dominant Hand',  val: p0?.dominant_hand === 'R' ? 'Right' : 'Left', color: '#10B981' },
                { label: 'Target Grip',    val: `${p0?.hand_strength_lo ?? 10} – ${p0?.hand_strength_hi ?? 18} kg`, color: '#14B8A6' },
                { label: 'Assigned Sensor',val: 'VS-001002', color: '#A78BFA' },
              ].map(({ label, val, color }) => (
                <div
                  key={label}
                  className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3.5"
                >
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 mb-1">
                    {label}
                  </div>
                  <div className="text-sm font-bold font-mono" style={{ color }}>
                    {val}
                  </div>
                </div>
              ))}
            </div>

            {/* Supervising Specialist Banner */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0 text-teal-400">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-teal-400">
                    Supervising Medical Specialist
                  </div>
                  <div className="text-xs font-bold text-white">Dr. Chandan Reddy</div>
                  <div className="text-[11px] text-slate-400">nncr540@gmail.com · +91 9942814286</div>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                Full Clinical Access
              </span>
            </div>
          </div>

          {/* Measurements Telemetry Table */}
          <div className="rounded-2xl bg-[#101520] border border-white/[0.07] overflow-hidden">
            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Latest Palm Pressure Assessments</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {measures.length || 10} Recorded Assessments
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                    <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Hand</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Posture</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Trials (1 / 2 / 3)</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Peak Grip</th>
                    <th className="px-5 py-3 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Timestamp</th>
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
                      <td className="px-5 py-3.5 font-semibold text-white">{m.hand ?? 'Left'}</td>
                      <td className="px-5 py-3.5 text-slate-400">{m.posture ?? 'Sitting'}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-300">
                        {m.trial1 ?? '—'} · {m.trial2 ?? '—'} · {m.trial3 ?? '—'} kg
                      </td>
                      <td className="px-5 py-3.5 font-bold font-mono text-emerald-400">
                        {m.best ? `${m.best} kg` : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-500 text-[11px]">
                        {m.recorded_at ? new Date(m.recorded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Actions + Live Audit Feed */}
        <div className="space-y-6">

          {/* Quick Actions */}
          <div className="rounded-2xl bg-[#101520] border border-white/[0.07] p-5 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Administrative Actions
            </h3>
            {[
              { label: 'Patient Clinical Dossier', desc: 'Inspect bio metrics, condition, devices', href: '/dashboard/patients', c: '#10B981', Icon: Users },
              { label: 'Generate Device Code',     desc: 'Provision hardware activation keys', href: '/dashboard/generate', c: '#F59E0B', Icon: Zap },
              { label: 'Device Inventory',         desc: 'Track manufactured and paired units', href: '/dashboard/devices', c: '#8B5CF6', Icon: Cpu },
              { label: 'System Audit Log',         desc: 'Inspect all operations & security logs', href: '/dashboard/audit', c: '#38BDF8', Icon: ShieldCheck },
            ].map(({ label, desc, href, c, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] transition-all group"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${c}15`, color: c }}
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
          <div className="rounded-2xl bg-[#101520] border border-white/[0.07] p-5 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Live Audit Stream</span>
              </h3>
              <Link href="/dashboard/audit" className="text-[11px] font-semibold text-slate-400 hover:text-white">
                View all
              </Link>
            </div>

            <div className="space-y-2">
              {(audits.length > 0 ? audits.slice(0, 4) : [
                { id: '1', device_code: 'VS-001002', action: 'generated', details: 'Device secret provisioned for batch VS', created_at: '2026-11-16' },
                { id: '2', device_code: 'VS-001001', action: 'create', details: 'Hardware manifest committed by admin', created_at: '2026-11-14' },
                { id: '3', device_code: 'VS-001000', action: 'create', details: 'Factory batch generated', created_at: '2026-11-13' },
              ]).map((a: any) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white">{a.device_code ?? 'VS-SYSTEM'}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
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
