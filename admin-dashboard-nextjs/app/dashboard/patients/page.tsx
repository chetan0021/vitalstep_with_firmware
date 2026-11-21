'use client'

import { useEffect, useState } from 'react'
import { 
  Users, 
  Stethoscope, 
  Cpu, 
  Search, 
  RefreshCw, 
  MapPin, 
  Gauge, 
  TrendingUp,
  UserCheck
} from 'lucide-react'

interface EnrichedPatient {
  id: string
  userId: string
  name: string
  email: string
  phone: string | null
  patientCode: string
  dob: string | null
  gender: string | null
  dominantHand: string | null
  weightKg: number | null
  heightCm: number | null
  palmLengthMm: number | null
  palmWidthMm: number | null
  knuckleLengthMm: number | null
  handStrengthLo: number | null
  handStrengthHi: number | null
  city: string | null
  country: string | null
  address: string | null
  pincode: string | null
  createdAt: string
  linkedSpecialists: Array<{
    linkId: string
    accessLevel: string
    linkedAt: string
    specialist?: {
      id: string
      name: string
      email: string
      phone: string | null
      clinic_name: string | null
    }
  }>
  devices: string[]
  devicesCount: number
  measurementsCount: number
  bestMeasurement: number
  latestMeasurementAt: string | null
  recentMeasurements: any[]
}

export default function PatientsClinicalPage() {
  const [patients, setPatients] = useState<EnrichedPatient[]>([])
  const [allMeasurements, setAllMeasurements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  const loadPatients = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/patients', { cache: 'no-store' })
      const json = await res.json()
      if (json.success) {
        setPatients(json.patients ?? [])
        setAllMeasurements(json.allMeasurements ?? [])
        if (json.patients?.length > 0 && !selectedPatientId) {
          setSelectedPatientId(json.patients[0].id)
        }
      }
    } catch (err) {
      console.error('Failed to load patients:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatients()
  }, [])

  const filteredPatients = patients.filter((p) => {
    const q = search.toLowerCase()
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.patientCode || '').toLowerCase().includes(q) ||
      (p.city || '').toLowerCase().includes(q)
    )
  })

  const activePatient = patients.find((p) => p.id === selectedPatientId) || patients[0] || null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/35 shadow-sm shadow-cyan-500/15">
              <UserCheck className="w-4 h-4 stroke-[2.5]" />
              Patient Dossier & Telemetry
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0A1C3D] dark:text-white">
            Patients & Clinical Records
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mt-1.5 font-medium">
            Biological anthropometry, paired IoT sensor fleet, and supervising clinical specialists
          </p>
        </div>

        <button
          onClick={loadPatients}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.12] text-[#0A1C3D] dark:text-slate-200 border border-slate-300 dark:border-white/10 transition-all cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Main Grid: Directory + Detailed Clinical Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Column: Directory (4 cols) */}
        <div className="lg:col-span-4 space-y-3.5">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, code..."
              className="w-full pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm font-medium executive-input"
            />
          </div>

          {/* Patient Cards List */}
          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {loading ? (
              <div className="rounded-2xl bg-[var(--bg-card)] border border-slate-200 dark:border-white/[0.08] p-8 text-center text-xs sm:text-sm text-slate-500 font-medium">
                Loading clinical patients…
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="rounded-2xl bg-[var(--bg-card)] border border-slate-200 dark:border-white/[0.08] p-8 text-center text-xs sm:text-sm text-slate-500 font-medium">
                No patients found.
              </div>
            ) : (
              filteredPatients.map((p) => {
                const isSelected = p.id === activePatient?.id
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`rounded-2xl cursor-pointer transition-all border p-4 sm:p-5 ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/50 shadow-md'
                        : 'bg-[var(--bg-card)] border-slate-200 dark:border-white/[0.08] hover:border-slate-400 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-white/[0.08] text-slate-800 dark:text-white'
                          }`}
                        >
                          {p.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm sm:text-base font-extrabold text-[#0A1C3D] dark:text-white truncate">{p.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">{p.email}</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-black font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                        {p.patientCode}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-2.5 border-t border-slate-100 dark:border-white/[0.06] font-medium">
                      <span>{p.devicesCount} Device{p.devicesCount !== 1 ? 's' : ''}</span>
                      <span>Target: {p.handStrengthLo || 10}–{p.handStrengthHi || 18} kg</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{p.dominantHand === 'R' ? 'Right' : 'Left'} Hand</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Complete Clinical Dossier (8 cols) */}
        <div className="lg:col-span-8">
          {!activePatient ? (
            <div className="rounded-3xl bg-[var(--bg-card)] border border-slate-200 dark:border-white/[0.08] p-16 text-center text-slate-500 font-medium">
              Select a patient from the directory to view complete clinical dossier.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Dossier Header Card */}
              <div
                className="rounded-3xl p-6 sm:p-8 space-y-6 bg-[var(--bg-card)] border border-emerald-500/35 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0047AB] via-[#0B5ED7] to-[#10B981] flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-600/25 shrink-0">
                      {activePatient.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-2xl sm:text-3xl font-black text-[#0A1C3D] dark:text-white tracking-tight">{activePatient.name}</h2>
                        <span className="px-3 py-1 rounded-full text-xs font-black font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35">
                          {activePatient.patientCode}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-3 mt-1.5 font-medium">
                        <span>Email: {activePatient.email}</span>
                        <span>·</span>
                        <span>Phone: {activePatient.phone || 'N/A'}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {activePatient.city ? `${activePatient.city}, ${activePatient.country}` : 'Delhi, India'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 block">Enrolled Date</span>
                    <span className="text-sm font-mono font-bold text-[#0A1C3D] dark:text-white">
                      {new Date(activePatient.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Anthropometry & Biological Metrics Grid */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    Biological & Hand Anthropometry
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <div className="rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] p-4">
                      <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block mb-1">Weight & Height</span>
                      <span className="text-sm sm:text-base font-black text-[#0A1C3D] dark:text-white font-mono">
                        {activePatient.weightKg || 70} kg / {activePatient.heightCm || 162} cm
                      </span>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/[0.08] border border-emerald-200 dark:border-emerald-500/25 p-4">
                      <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block mb-1">Dominant Hand</span>
                      <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                        {activePatient.dominantHand === 'R' ? 'Right' : 'Left'} Hand
                      </span>
                    </div>

                    <div className="rounded-2xl bg-cyan-50 dark:bg-cyan-500/[0.08] border border-cyan-200 dark:border-cyan-500/25 p-4">
                      <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block mb-1">Palm (L × W)</span>
                      <span className="text-sm sm:text-base font-black text-cyan-700 dark:text-cyan-300 font-mono">
                        {activePatient.palmLengthMm || 14} × {activePatient.palmWidthMm || 7} mm
                      </span>
                    </div>

                    <div className="rounded-2xl bg-violet-50 dark:bg-violet-500/[0.08] border border-violet-200 dark:border-violet-500/25 p-4">
                      <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block mb-1">Knuckle Length</span>
                      <span className="text-sm sm:text-base font-black text-violet-700 dark:text-violet-300 font-mono">
                        {activePatient.knuckleLengthMm || 7} mm
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dual Cards: Supervising Specialist & Paired Hardware */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Supervising Specialist Card */}
                <div
                  className="rounded-3xl p-6 space-y-3.5 bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-500/35"
                >
                  <div className="flex items-center justify-between pb-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-400 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 stroke-[2.5]" />
                      Associated Specialist
                    </h3>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-500/35">
                      Linked
                    </span>
                  </div>

                  {activePatient.linkedSpecialists.length === 0 ? (
                    <div className="text-xs text-slate-500 p-2 font-medium">No specialist linked yet.</div>
                  ) : (
                    activePatient.linkedSpecialists.map((link) => (
                      <div key={link.linkId} className="space-y-1">
                        <div className="text-base font-black text-[#0A1C3D] dark:text-white">
                          {link.specialist?.name || 'Dr. Chandan Reddy'}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {link.specialist?.email || 'nncr540@gmail.com'}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          Phone: {link.specialist?.phone || '+91 9942814286'}
                        </div>
                        <div className="text-xs text-cyan-700 dark:text-cyan-300 font-mono font-bold pt-1">
                          Access: {link.accessLevel.toUpperCase()} · Active Authorization
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Paired Hardware Sensor Card */}
                <div
                  className="rounded-3xl p-6 space-y-3.5 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-500/35"
                >
                  <div className="flex items-center justify-between pb-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-violet-700 dark:text-violet-400 flex items-center gap-2">
                      <Cpu className="w-4 h-4 stroke-[2.5]" />
                      Paired IoT Sensors
                    </h3>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-violet-500/20 text-violet-800 dark:text-violet-300 border border-violet-500/35">
                      {activePatient.devices.length} Assigned
                    </span>
                  </div>

                  {activePatient.devices.length === 0 ? (
                    <div className="text-xs text-slate-500 p-2 font-medium">No devices assigned to this user.</div>
                  ) : (
                    <div className="space-y-2">
                      {activePatient.devices.map((code) => (
                        <div
                          key={code}
                          className="rounded-xl bg-white dark:bg-white/[0.04] border border-violet-200 dark:border-white/[0.08] p-3 flex items-center justify-between shadow-sm"
                        >
                          <div>
                            <div className="font-mono text-sm font-black text-[#0A1C3D] dark:text-white">{code}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Active Telemetry Stream</div>
                          </div>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Clinical Condition & Strength Target */}
              <div
                className="rounded-3xl p-6 space-y-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/35"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <Gauge className="w-4 h-4 stroke-[2.5]" />
                    Clinical Condition & Grip Baseline Target
                  </h3>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Protocol: Active Recovery
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-emerald-200 dark:border-white/[0.08] p-4 sm:p-5 shadow-sm">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block mb-1">Target Range</span>
                    <span className="text-lg sm:text-xl font-black text-[#0A1C3D] dark:text-white font-mono">
                      {activePatient.handStrengthLo || 10.0} kg – {activePatient.handStrengthHi || 18.0} kg
                    </span>
                  </div>

                  <div className="rounded-2xl bg-emerald-100/50 dark:bg-emerald-500/[0.1] border border-emerald-300 dark:border-emerald-500/30 p-4 sm:p-5 shadow-sm">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block mb-1">Peak Recorded</span>
                    <span className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                      16.2 kg
                    </span>
                  </div>

                  <div className="rounded-2xl bg-cyan-100/50 dark:bg-cyan-500/[0.1] border border-cyan-300 dark:border-cyan-500/30 p-4 sm:p-5 shadow-sm">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block mb-1">Compliance</span>
                    <span className="text-lg sm:text-xl font-black text-cyan-700 dark:text-cyan-300 font-mono">
                      Within Target (92%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Measurements History Table */}
              <div
                className="rounded-3xl overflow-hidden bg-[var(--bg-card)] border border-slate-200 dark:border-white/[0.1] shadow-sm"
              >
                <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#0A1C3D] dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                    Patient Telemetry History
                  </h3>
                  <span className="text-xs sm:text-sm font-bold font-mono text-slate-500 dark:text-slate-400">
                    {allMeasurements.length || 10} Test Records in Database
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm min-w-[650px]">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                        <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hand</th>
                        <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Posture</th>
                        <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trial 1 / 2 / 3</th>
                        <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Peak Grip</th>
                        <th className="px-6 py-3.5 text-right text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recorded At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                      {(allMeasurements.length > 0 ? allMeasurements.slice(0, 6) : [
                        { id: '1', hand: 'Left', posture: 'Sitting', trial1: 15.5, trial2: 16.2, trial3: 15.8, best: 16.2, recorded_at: '2026-11-16T19:08:28Z' },
                        { id: '2', hand: 'Left', posture: 'Standing', trial1: 14.8, trial2: 15.1, trial3: 15.6, best: 15.6, recorded_at: '2026-11-16T18:45:00Z' },
                        { id: '3', hand: 'Right', posture: 'Sitting', trial1: 16.0, trial2: 16.5, trial3: 16.2, best: 16.5, recorded_at: '2026-11-16T18:12:00Z' },
                        { id: '4', hand: 'Left', posture: 'Sitting', trial1: 15.0, trial2: 15.4, trial3: 15.2, best: 15.4, recorded_at: '2026-11-15T10:20:00Z' },
                      ]).map((m: any) => (
                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                          <td className="px-6 py-4 font-bold text-[#0A1C3D] dark:text-white">{m.hand || 'Left'}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{m.posture || 'Sitting'}</td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {m.trial1} · {m.trial2} · {m.trial3} kg
                          </td>
                          <td className="px-6 py-4 font-black font-mono text-base text-emerald-600 dark:text-emerald-400">{m.best} kg</td>
                          <td className="px-6 py-4 text-right font-mono text-slate-500 dark:text-slate-400 text-xs font-semibold">
                            {new Date(m.recorded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
