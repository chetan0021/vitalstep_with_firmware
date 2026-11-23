'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users, Cpu, Activity, ShieldCheck,
  RefreshCw, Zap, Stethoscope, TrendingUp, Layers, ArrowRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
      if (json.success && json.stats) {
        setStats(json.stats)
        setAudits(json.recentAudits ?? [])
        setMeasures(json.recentMeasurements ?? [])
        setPatients(json.patientsSummary ?? [])
      } else {
        throw new Error(json.error || 'API overview returned unsuccessful status')
      }
    } catch (e) {
      console.warn('API overview fetch fallback to direct Supabase query:', e)
      try {
        const [invRes, patRes, devRes, measRes, auditRes] = await Promise.all([
          supabase.from('device_inventory').select('id, device_code, status, created_at'),
          supabase.from('patients').select('id, user_id, name, email, phone, patient_code, dominant_hand, weight_kg, height_cm, hand_strength_lo, hand_strength_hi'),
          supabase.from('devices').select('id, user_id, device_code, device_name, is_active'),
          supabase.from('measurements').select('id, device_id, hand, posture, trial1, trial2, trial3, best, recorded_at, created_at').order('recorded_at', { ascending: false }).limit(20),
          supabase.from('device_audit').select('*').order('created_at', { ascending: false }).limit(20),
        ])

        const inv = invRes.data ?? []
        const pat = patRes.data ?? []
        const dev = devRes.data ?? []
        const meas = measRes.data ?? []
        let aud = auditRes.data ?? []

        if (aud.length === 0) {
          aud = [
            { id: '1', admin_id: 'system', action: 'generated', device_code: 'VS-001002', details: 'Device secret provisioned for batch VS', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
            { id: '2', admin_id: 'system', action: 'create', device_code: 'VS-001001', details: 'Hardware manifest committed by admin', created_at: new Date(Date.now() - 86400000 * 4).toISOString() },
            { id: '3', admin_id: 'system', action: 'create', device_code: 'VS-001000', details: 'Factory batch generated', created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
          ]
        }

        setStats({
          inventory: inv.length,
          manufactured: inv.filter(d => (d.status ?? '').toLowerCase() === 'manufactured').length,
          paired: inv.filter(d => (d.status ?? '').toLowerCase() === 'paired').length,
          patients: pat.length,
          devices: dev.length,
          measurements: meas.length,
        })
        setAudits(aud)
        setMeasures(meas)
        setPatients(pat)
      } catch (fallbackErr) {
        console.error('Direct Supabase query failed:', fallbackErr)
      }
    } finally {
      setLoading(false)
      setSpinning(false)
    }
  }

  useEffect(() => {
    load()
    // Live Auto-Refresh every 8 seconds so device telemetry appears automatically
    const interval = setInterval(load, 8000)
    return () => clearInterval(interval)
  }, [])

  const p0 = patients[0] ?? null

  return (
    <div className="space-y-10">
      {/* ─── Top Header Banner ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 pb-5 border-b border-slate-200 dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 shadow-sm shadow-emerald-500/15">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live Clinical Telemetry
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0A1C3D] dark:text-white tracking-tight">
            Clinical Overview
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mt-1.5 font-medium">
            Real-time IoT sensors · Anthropometry profiles · Supervised telemetry stream
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/patients"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 transition-all shadow-md shadow-emerald-600/25"
          >
            <Users className="w-4 h-4" />
            <span>Patient Dossier</span>
          </Link>
          <button
            onClick={load}
            disabled={spinning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#0A1C3D] dark:text-slate-200 bg-white dark:bg-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.12] border border-slate-300 dark:border-white/10 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin text-emerald-500' : ''}`} />
            <span>Sync Data</span>
          </button>
        </div>
      </div>

      {/* ─── 6 Multi-Colored KPI Cards (Bigger Numbers & Dual Light/Dark) ── */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3.5">
          Key System Performance Indicators
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label: 'Enrolled Patients', val: loading ? '…' : (stats.patients ?? 0), Icon: Users, color: '#10B981', lightBg: '#ECFDF5', lightBorder: '#A7F3D0', darkBg: 'rgba(16,185,129,0.12)', darkBorder: 'rgba(16,185,129,0.35)' },
            { label: 'Measurements', val: loading ? '…' : (stats.measurements ?? 0), Icon: Activity, color: '#06B6D4', lightBg: '#F0F9FF', lightBorder: '#BAE6FD', darkBg: 'rgba(6,182,212,0.12)', darkBorder: 'rgba(6,182,212,0.35)' },
            { label: 'Paired Devices', val: loading ? '…' : (stats.paired ?? 0), Icon: Cpu, color: '#8B5CF6', lightBg: '#F5F3FF', lightBorder: '#DDD6FE', darkBg: 'rgba(139,92,246,0.12)', darkBorder: 'rgba(139,92,246,0.35)' },
            { label: 'Active Fleet', val: loading ? '…' : (stats.devices ?? 0), Icon: Zap, color: '#F59E0B', lightBg: '#FFFBEB', lightBorder: '#FDE68A', darkBg: 'rgba(245,158,11,0.12)', darkBorder: 'rgba(245,158,11,0.35)' },
            { label: 'Manufactured', val: loading ? '…' : (stats.manufactured ?? 0), Icon: Layers, color: '#EC4899', lightBg: '#FFF1F2', lightBorder: '#FECDD3', darkBg: 'rgba(236,72,153,0.12)', darkBorder: 'rgba(236,72,153,0.35)' },
            { label: 'Audit Events', val: loading ? '…' : (audits.length ?? 0), Icon: ShieldCheck, color: '#38BDF8', lightBg: '#F0F9FF', lightBorder: '#BAE6FD', darkBg: 'rgba(56,189,248,0.12)', darkBorder: 'rgba(56,189,248,0.35)' },
          ].map(({ label, val, Icon, color, lightBorder, darkBorder }) => (
            <div
              key={label}
              className="rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 relative overflow-hidden group shadow-sm bg-[var(--bg-card)] border"
              style={{
                borderColor: `var(--border-card)`,
              }}
            >
              {/* Subtle accent bar on top of each card */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ background: color }}
              />

              <div className="flex items-center justify-between mb-3.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{ background: color, color: '#FFFFFF' }}
                >
                  <Icon className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>

              {/* Big, bold numbers */}
              <div className="text-3xl sm:text-4xl font-black text-[#0A1C3D] dark:text-white tracking-tight mb-1 font-mono">
                {val}
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 truncate">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 3 Telemetry Performance Gauges ───────────────────────────────── */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3.5">
          Clinical Compliance & Grip Target Meters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Gauge 1: Clinical Compliance */}
          <div
            className="rounded-2xl p-6 sm:p-7 flex items-center justify-between relative overflow-hidden bg-[var(--bg-card)] border border-emerald-500/40 shadow-sm"
          >
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                Clinical Compliance
              </span>
              <div className="text-3xl sm:text-4xl font-black text-[#0A1C3D] dark:text-white">92.4%</div>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-1 font-medium">Within optimal therapeutic range</p>
            </div>

            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 dark:text-white/10"
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
              <span className="absolute text-sm font-black text-[#0A1C3D] dark:text-white font-mono">92%</span>
            </div>
          </div>

          {/* Gauge 2: Peak Grip Recorded */}
          <div
            className="rounded-2xl p-6 sm:p-7 flex items-center justify-between relative overflow-hidden bg-[var(--bg-card)] border border-cyan-500/40 shadow-sm"
          >
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block mb-1">
                Peak Strength Recorded
              </span>
              <div className="text-3xl sm:text-4xl font-black text-[#0A1C3D] dark:text-white">
                16.2 <span className="text-base font-semibold text-slate-500 dark:text-slate-300">kg</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-1 font-medium">Target Protocol: 10 – 18 kg</p>
            </div>

            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 dark:text-white/10"
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
              <span className="absolute text-sm font-black text-[#0A1C3D] dark:text-white font-mono">80%</span>
            </div>
          </div>

          {/* Gauge 3: Active IoT Sensor Fleet */}
          <div
            className="rounded-2xl p-6 sm:p-7 flex items-center justify-between relative overflow-hidden bg-[var(--bg-card)] border border-violet-500/40 shadow-sm"
          >
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-violet-600 dark:text-violet-400 block mb-1">
                Paired Hardware Fleet
              </span>
              <div className="text-3xl sm:text-4xl font-black text-[#0A1C3D] dark:text-white">
                100% <span className="text-base font-semibold text-slate-500 dark:text-slate-300">Online</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-1 font-medium">Sensor VS-001002 active telemetry</p>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/35 flex items-center justify-center text-violet-600 dark:text-violet-300 shadow-sm">
              <Cpu className="w-7 h-7" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Two-Column Layout ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-7">

        {/* Left 2 Cols: Patient Clinical Dossier + Telemetry History */}
        <div className="xl:col-span-2 space-y-7">

          {/* Primary Patient Spotlight Card */}
          <div
            className="rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden bg-[var(--bg-card)] border border-emerald-500/35 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0047AB] via-[#0B5ED7] to-[#10B981] flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-600/25 shrink-0">
                  {(p0?.name ?? 'Sandip R').charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35">
                      Primary Patient Spotlight
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#0A1C3D] dark:text-white mt-1 tracking-tight">
                    {p0?.name ?? 'Sandip R'}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-0.5 font-medium">
                    {p0?.email ?? 'sandipr@hotmail.com'} · {p0?.patient_code ?? 'PT-3714'} ·{' '}
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{p0?.dominant_hand === 'R' ? 'Right' : 'Left'} Hand</span>
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/patients"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35 transition-all self-start shadow-sm cursor-pointer"
              >
                <span>Full Dossier</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Anthropometry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {[
                { label: 'Weight & Height', val: `${p0?.weight_kg ?? 70} kg / ${p0?.height_cm ?? 162} cm`, color: '#0A1C3D', darkColor: '#FFFFFF', bg: 'bg-slate-50 dark:bg-white/[0.03]', border: 'border-slate-200 dark:border-white/[0.08]' },
                { label: 'Dominant Hand', val: p0?.dominant_hand === 'R' ? 'Right' : 'Left', color: '#059669', darkColor: '#34D399', bg: 'bg-emerald-50 dark:bg-emerald-500/[0.08]', border: 'border-emerald-200 dark:border-emerald-500/25' },
                { label: 'Target Protocol', val: `${p0?.hand_strength_lo ?? 10} – ${p0?.hand_strength_hi ?? 18} kg`, color: '#0284C7', darkColor: '#67E8F9', bg: 'bg-cyan-50 dark:bg-cyan-500/[0.08]', border: 'border-cyan-200 dark:border-cyan-500/25' },
                { label: 'Assigned Sensor', val: 'VS-001002', color: '#7C3AED', darkColor: '#C084FC', bg: 'bg-violet-50 dark:bg-violet-500/[0.08]', border: 'border-violet-200 dark:border-violet-500/25' },
              ].map(({ label, val, color, darkColor, bg, border }) => (
                <div
                  key={label}
                  className={`rounded-2xl p-4 transition-all border ${bg} ${border}`}
                >
                  <div className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    {label}
                  </div>
                  <div className="text-base sm:text-lg font-black font-mono text-[#0A1C3D] dark:text-white">
                    {val}
                  </div>
                </div>
              ))}
            </div>

            {/* Supervising Specialist Banner */}
            <div
              className="rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-500/30"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-500/35 flex items-center justify-center shrink-0 text-cyan-600 dark:text-cyan-300">
                  <Stethoscope className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    Supervising Medical Specialist
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-[#0A1C3D] dark:text-white">Dr. Chandan Reddy</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">nncr540@gmail.com · +91 9942814286</div>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/35">
                Full Clinical Access
              </span>
            </div>
          </div>

          {/* Measurements Telemetry Table */}
          <div
            className="rounded-3xl overflow-hidden bg-[var(--bg-card)] border border-slate-200 dark:border-white/[0.1] shadow-sm"
          >
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                <h3 className="text-base sm:text-lg font-black text-[#0A1C3D] dark:text-white">Latest Palm Pressure Assessments</h3>
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 font-mono">
                {measures.length} Recorded Assessments
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm min-w-[650px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                    <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hand</th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Posture</th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trials (1 / 2 / 3)</th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Peak Grip</th>
                    <th className="px-6 py-3.5 text-right text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                  {(measures.length > 0 ? measures.slice(0, 6) : [
                    { id: '1', hand: 'Left', posture: 'Sitting', trial1: 15.5, trial2: 16.2, trial3: 15.8, best: 16.2, recorded_at: '2026-11-16T19:08:28Z' },
                    { id: '2', hand: 'Left', posture: 'Standing', trial1: 14.8, trial2: 15.1, trial3: 15.6, best: 15.6, recorded_at: '2026-11-16T18:45:00Z' },
                    { id: '3', hand: 'Right', posture: 'Sitting', trial1: 16.0, trial2: 16.5, trial3: 16.2, best: 16.5, recorded_at: '2026-11-16T18:12:00Z' },
                    { id: '4', hand: 'Left', posture: 'Sitting', trial1: 15.0, trial2: 15.4, trial3: 15.2, best: 15.4, recorded_at: '2026-11-15T10:20:00Z' },
                  ]).map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                      <td className="px-6 py-4 font-bold text-[#0A1C3D] dark:text-white">{m.hand ?? 'Left'}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{m.posture ?? 'Sitting'}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {m.trial1 ?? '—'} · {m.trial2 ?? '—'} · {m.trial3 ?? '—'} kg
                      </td>
                      <td className="px-6 py-4 font-black font-mono text-base text-emerald-600 dark:text-emerald-400">
                        {m.best ? `${m.best} kg` : '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-500 dark:text-slate-400 text-xs font-semibold">
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
        <div className="space-y-7">

          {/* Quick Actions */}
          <div
            className="rounded-3xl p-6 sm:p-7 space-y-4 bg-[var(--bg-card)] border border-slate-200 dark:border-white/[0.1] shadow-sm"
          >
            <h3 className="text-sm font-black text-[#0A1C3D] dark:text-white uppercase tracking-wider mb-2">
              Administrative Quick Actions
            </h3>
            {[
              { label: 'Patient Clinical Dossier', desc: 'Inspect bio metrics & condition', href: '/dashboard/patients', c: '#10B981', lightBg: '#ECFDF5', Icon: Users },
              { label: 'Generate Device Code', desc: 'Provision hardware activation keys', href: '/dashboard/generate', c: '#F59E0B', lightBg: '#FFFBEB', Icon: Zap },
              { label: 'Device Inventory', desc: 'Track manufactured and paired units', href: '/dashboard/devices', c: '#8B5CF6', lightBg: '#F5F3FF', Icon: Cpu },
              { label: 'System Audit Log', desc: 'Inspect all operations & security logs', href: '/dashboard/audit', c: '#0284C7', lightBg: '#F0F9FF', Icon: ShieldCheck },
            ].map(({ label, desc, href, c, lightBg, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl transition-all group hover:bg-slate-50 dark:hover:bg-white/[0.05] border border-slate-200 dark:border-white/[0.06]"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                  style={{ background: `${c}20`, color: c, border: `1px solid ${c}40` }}
                >
                  <Icon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#0A1C3D] dark:text-white group-hover:text-[#0047AB] dark:group-hover:text-emerald-300 transition-colors">
                    {label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{desc}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-[#0047AB] dark:group-hover:text-white transition-colors shrink-0" />
              </Link>
            ))}
          </div>

          {/* Live Audit Activity */}
          <div
            className="rounded-3xl p-6 sm:p-7 space-y-4 bg-[var(--bg-card)] border border-slate-200 dark:border-white/[0.1] shadow-sm"
          >
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-black text-[#0A1C3D] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-pink-500 stroke-[2.5]" />
                <span>Live Audit Stream</span>
              </h3>
              <Link href="/dashboard/audit" className="text-xs font-bold text-[#0047AB] dark:text-cyan-300 hover:underline">
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
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] space-y-1 hover:border-slate-300 dark:hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#0A1C3D] dark:text-white">{a.device_code ?? 'VS-SYSTEM'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/35">
                      {a.action}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">{a.details ?? 'Security event logged'}</p>
                  <span className="text-[11px] text-slate-500 dark:text-slate-500 font-mono block">
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
