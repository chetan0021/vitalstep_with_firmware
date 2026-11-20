'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Users, Cpu, Activity, ShieldCheck,
  RefreshCw, Zap, Stethoscope, TrendingUp, Layers, ArrowRight
} from 'lucide-react'

type Stats = {
  inventory: number; manufactured: number; paired: number
  patients: number; devices: number; measurements: number
}

export default function DashboardPage() {
  const [stats, setStats]       = useState<Stats>({ inventory:0, manufactured:0, paired:0, patients:0, devices:0, measurements:0 })
  const [audits, setAudits]     = useState<any[]>([])
  const [measures, setMeasures] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [spinning, setSpinning] = useState(false)

  const load = async () => {
    setSpinning(true)
    try {
      const r    = await fetch('/api/admin/overview', { cache: 'no-store' })
      const json = await r.json()
      if (json.success) {
        setStats(json.stats)
        setAudits(json.recentAudits    ?? [])
        setMeasures(json.recentMeasurements ?? [])
        setPatients(json.patientsSummary    ?? [])
      }
    } catch {}
    setLoading(false)
    setSpinning(false)
  }

  useEffect(() => { load() }, [])

  const p0 = patients[0] ?? null

  return (
    <div className="space-y-8">
      {/* ─── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full border"
              style={{ background:'#10B98115', borderColor:'#10B98135', color:'#34D399' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Clinical Overview</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time IoT sensors · patient profiles · medical specialists
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/patients"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background:'#06B6D415', border:'1px solid #06B6D430', color:'#67E8F9' }}>
            <Users className="w-3.5 h-3.5" /> Patient Dossier
          </Link>
          <button onClick={load} disabled={spinning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 transition-all cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${spinning ? 'animate-spin text-emerald-400' : ''}`} /> Sync
          </button>
        </div>
      </div>

      {/* ─── KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label:'Patients',         val: stats.patients,     Icon: Users,       c:'#10B981' },
          { label:'Measurements',     val: stats.measurements, Icon: Activity,    c:'#06B6D4' },
          { label:'Paired Devices',   val: stats.paired,       Icon: Cpu,         c:'#8B5CF6' },
          { label:'Active Devices',   val: stats.devices,      Icon: Zap,         c:'#F59E0B' },
          { label:'Manufactured',     val: stats.manufactured, Icon: Layers,      c:'#EC4899' },
          { label:'Audit Events',     val: audits.length,      Icon: ShieldCheck, c:'#A78BFA' },
        ].map(({ label, val, Icon, c }) => (
          <div key={label}
            className="relative p-5 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(145deg, ${c}10 0%, #0A0E1890 100%)`,
              border: `1px solid ${c}25`,
              boxShadow: `0 4px 24px -4px ${c}20`
            }}>
            {/* soft inner glow */}
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20"
              style={{ background: c, transform:'translate(30%,-30%)' }} />
            <div className="relative">
              <div className="mb-3 w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${c}18`, border: `1px solid ${c}30` }}>
                <Icon className="w-4 h-4" style={{ color: c }} />
              </div>
              <div className="text-3xl font-extrabold text-white mb-0.5">
                {loading ? '…' : val}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Main Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left — Patient Spotlight + Measurements */}
        <div className="xl:col-span-2 space-y-5">

          {/* Patient Card */}
          <div className="relative p-6 rounded-2xl overflow-hidden"
            style={{ background:'linear-gradient(145deg,#0D1F1D 0%,#080E14 100%)', border:'1px solid #10B98125' }}>
            <div className="absolute top-0 right-0 w-56 h-56 rounded-full blur-3xl opacity-10"
              style={{ background:'#10B981', transform:'translate(40%,-40%)' }} />

            <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                  style={{ background:'#10B98118', color:'#34D399', border:'1px solid #10B98130' }}>
                  Primary Patient Spotlight
                </span>
                <h2 className="text-xl font-bold text-white mt-2">{p0?.name ?? 'Sandip R'}</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  {p0?.email ?? 'sandipr@hotmail.com'} ·{' '}
                  {p0?.patient_code ?? 'PT-3714'} ·{' '}
                  {p0?.dominant_hand === 'R' ? 'Right' : 'Left'} hand
                </p>
              </div>
              <Link href="/dashboard/patients"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap self-start"
                style={{ background:'#10B98115', border:'1px solid #10B98130', color:'#6EE7B7' }}>
                Full Dossier <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Bio grid */}
            <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label:'Weight', val: p0?.weight_kg ?? 70,  unit:'kg' },
                { label:'Height', val: p0?.height_cm ?? 162, unit:'cm' },
                { label:'Target Grip', val: `${p0?.hand_strength_lo??10}–${p0?.hand_strength_hi??18}`, unit:'kg', accent:'#06B6D4' },
                { label:'Device', val: 'VS-001002', unit:'', accent:'#8B5CF6' },
              ].map(({ label, val, unit, accent }) => (
                <div key={label} className="p-3.5 rounded-xl"
                  style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-[11px] text-slate-400 mb-1 font-medium">{label}</div>
                  <div className="text-base font-bold" style={{ color: accent ?? '#fff' }}>
                    {val}{unit && <span className="text-xs text-slate-400 font-normal ml-1">{unit}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Specialist */}
            <div className="relative p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              style={{ background:'linear-gradient(135deg,#0E2032 0%,#0A1626 100%)', border:'1px solid #06B6D420' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background:'#06B6D420', border:'1px solid #06B6D430' }}>
                  <Stethoscope className="w-4 h-4" style={{ color:'#67E8F9' }} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color:'#67E8F9' }}>
                    Supervising Specialist
                  </div>
                  <div className="text-sm font-bold text-white">Dr. Chandan Reddy</div>
                  <div className="text-xs text-slate-400">nncr540@gmail.com · +91 9942814286</div>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-3 py-1 rounded-lg"
                style={{ background:'#06B6D415', color:'#67E8F9', border:'1px solid #06B6D430' }}>
                Full Clinical Access
              </span>
            </div>
          </div>

          {/* Measurements Table */}
          <div className="rounded-2xl overflow-hidden"
            style={{ border:'1px solid rgba(255,255,255,0.07)', background:'rgba(10,14,20,0.8)' }}>
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Latest Palm Pressure Readings
              </div>
              <span className="text-[11px] text-slate-400">{stats.measurements} total assessments</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    {['Hand','Posture','T1 / T2 / T3','Peak','Date'].map(h => (
                      <th key={h} className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {measures.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-6 text-center text-slate-500">No measurements yet</td></tr>
                  ) : (
                    measures.slice(0,5).map((m: any) => (
                      <tr key={m.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                        <td className="px-5 py-3 font-semibold text-white">{m.hand ?? 'Left'}</td>
                        <td className="px-5 py-3 text-slate-400">{m.posture ?? 'Sitting'}</td>
                        <td className="px-5 py-3 font-mono text-slate-300">{m.trial1??'—'} / {m.trial2??'—'} / {m.trial3??'—'}</td>
                        <td className="px-5 py-3 font-bold" style={{ color:'#34D399' }}>{m.best ? `${m.best} kg` : '—'}</td>
                        <td className="px-5 py-3 text-slate-500 font-mono text-[11px]">
                          {m.recorded_at ? new Date(m.recorded_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right — Quick actions + Audit feed */}
        <div className="space-y-5">

          {/* Quick Actions */}
          <div className="p-5 rounded-2xl space-y-3"
            style={{ background:'rgba(10,14,20,0.85)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <h3 className="text-sm font-bold text-white mb-1">Administrative Actions</h3>
            {[
              { label:'Patient Clinical Dossier', desc:'Bio metrics, condition, devices', href:'/dashboard/patients', c:'#10B981', Icon:Users },
              { label:'Generate Device Code',     desc:'Provision hardware activation keys', href:'/dashboard/generate', c:'#F59E0B', Icon:Zap },
              { label:'Device Inventory',         desc:'Manufactured & paired units', href:'/dashboard/devices', c:'#8B5CF6', Icon:Cpu },
              { label:'System Audit Log',         desc:'All operations & security logs', href:'/dashboard/audit', c:'#EC4899', Icon:ShieldCheck },
            ].map(({ label, desc, href, c, Icon }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 p-3 rounded-xl transition-all group cursor-pointer"
                style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${c}30`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)')}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background:`${c}18`, color:c }}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">{label}</div>
                  <div className="text-[11px] text-slate-500 truncate">{desc}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>

          {/* Audit Feed */}
          <div className="p-5 rounded-2xl space-y-3"
            style={{ background:'rgba(10,14,20,0.85)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-pink-400" /> Live Audit Activity
              </h3>
              <Link href="/dashboard/audit" className="text-[11px] font-semibold hover:underline" style={{ color:'#67E8F9' }}>
                View all
              </Link>
            </div>

            {audits.length === 0 ? (
              <div className="py-5 text-center text-xs text-slate-500">No audit events recorded yet.</div>
            ) : (
              audits.slice(0,4).map((a: any) => (
                <div key={a.id} className="p-3 rounded-xl space-y-1"
                  style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-200">{a.device_code ?? '—'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background:'#06B6D415', color:'#67E8F9', border:'1px solid #06B6D425' }}>
                      {a.action}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{a.details ?? 'System event'}</p>
                  <span className="text-[10px] text-slate-600 font-mono block">
                    {a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
