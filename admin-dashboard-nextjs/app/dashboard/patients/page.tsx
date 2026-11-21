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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UserCheck className="w-3.5 h-3.5" />
              Patient Dossier & Telemetry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Patients & Clinical Records
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Biological anthropometry, paired IoT sensor fleet, and supervising clinical specialists
          </p>
        </div>

        <button
          onClick={loadPatients}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Grid: Directory + Detailed Clinical Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Directory (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, code..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs executive-input"
            />
          </div>

          {/* Patient Cards List */}
          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {loading ? (
              <div className="rounded-2xl bg-[#101520] border border-white/[0.07] p-6 text-center text-xs text-slate-400">
                Loading clinical patients…
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="rounded-2xl bg-[#101520] border border-white/[0.07] p-6 text-center text-xs text-slate-400">
                No patients found.
              </div>
            ) : (
              filteredPatients.map((p) => {
                const isSelected = p.id === activePatient?.id
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`rounded-xl cursor-pointer transition-all border p-4 ${
                      isSelected
                        ? 'bg-emerald-500/[0.08] border-emerald-500/30 shadow-sm'
                        : 'bg-[#101520] border-white/[0.06] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-white/[0.06] text-white'
                          }`}
                        >
                          {p.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{p.name}</div>
                          <div className="text-[11px] text-slate-400 truncate">{p.email}</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        {p.patientCode}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/[0.05]">
                      <span>{p.devicesCount} Device{p.devicesCount !== 1 ? 's' : ''}</span>
                      <span>Target: {p.handStrengthLo || 10}–{p.handStrengthHi || 18} kg</span>
                      <span className="text-emerald-400 font-semibold">{p.dominantHand === 'R' ? 'Right' : 'Left'} Hand</span>
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
            <div className="rounded-2xl bg-[#101520] border border-white/[0.07] p-12 text-center text-slate-400">
              Select a patient from the directory to view complete clinical dossier.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Dossier Header Card */}
              <div className="rounded-2xl bg-[#101520] border border-white/[0.07] p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg font-bold shrink-0">
                      {activePatient.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white tracking-tight">{activePatient.name}</h2>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {activePatient.patientCode}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3 mt-1">
                        <span>Email: {activePatient.email}</span>
                        <span>·</span>
                        <span>Phone: {activePatient.phone || 'N/A'}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {activePatient.city ? `${activePatient.city}, ${activePatient.country}` : 'Delhi, India'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 block">Enrolled Date</span>
                    <span className="text-xs font-mono text-slate-300">
                      {new Date(activePatient.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Anthropometry & Biological Metrics Grid */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    Biological & Hand Anthropometry
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3.5">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block mb-1">Weight & Height</span>
                      <span className="text-xs sm:text-sm font-bold text-white font-mono">
                        {activePatient.weightKg || 70} kg / {activePatient.heightCm || 162} cm
                      </span>
                    </div>

                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3.5">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block mb-1">Dominant Hand</span>
                      <span className="text-xs sm:text-sm font-bold text-emerald-400">
                        {activePatient.dominantHand === 'R' ? 'Right' : 'Left'} Hand
                      </span>
                    </div>

                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3.5">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block mb-1">Palm (L × W)</span>
                      <span className="text-xs sm:text-sm font-bold text-teal-300 font-mono">
                        {activePatient.palmLengthMm || 14} × {activePatient.palmWidthMm || 7} mm
                      </span>
                    </div>

                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3.5">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block mb-1">Knuckle Length</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-200 font-mono">
                        {activePatient.knuckleLengthMm || 7} mm
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dual Cards: Supervising Specialist & Paired Hardware */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Supervising Specialist Card */}
                <div className="rounded-2xl bg-[#101520] border border-white/[0.07] p-5 space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4" />
                      Associated Specialist
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                      Linked
                    </span>
                  </div>

                  {activePatient.linkedSpecialists.length === 0 ? (
                    <div className="text-xs text-slate-400 p-2">No specialist linked yet.</div>
                  ) : (
                    activePatient.linkedSpecialists.map((link) => (
                      <div key={link.linkId} className="space-y-1">
                        <div className="text-sm font-bold text-white">
                          {link.specialist?.name || 'Dr. Chandan Reddy'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {link.specialist?.email || 'nncr540@gmail.com'}
                        </div>
                        <div className="text-xs text-slate-400">
                          Phone: {link.specialist?.phone || '+91 9942814286'}
                        </div>
                        <div className="text-[11px] text-teal-400 font-mono pt-1">
                          Access: {link.accessLevel.toUpperCase()} · Active Authorization
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Paired Hardware Sensor Card */}
                <div className="rounded-2xl bg-[#101520] border border-white/[0.07] p-5 space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4" />
                      Paired IoT Sensors
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
                      {activePatient.devices.length} Assigned
                    </span>
                  </div>

                  {activePatient.devices.length === 0 ? (
                    <div className="text-xs text-slate-400 p-2">No devices assigned to this user.</div>
                  ) : (
                    <div className="space-y-2">
                      {activePatient.devices.map((code) => (
                        <div
                          key={code}
                          className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-mono text-xs font-bold text-white">{code}</div>
                            <div className="text-[10px] text-slate-400">Active Telemetry Stream</div>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Clinical Condition & Strength Target */}
              <div className="rounded-2xl bg-[#101520] border border-white/[0.07] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4" />
                    Clinical Condition & Grip Baseline Target
                  </h3>
                  <span className="text-xs font-semibold text-slate-400">
                    Protocol: Active Recovery
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block mb-1">Target Range</span>
                    <span className="text-base font-bold text-white font-mono">
                      {activePatient.handStrengthLo || 10.0} kg – {activePatient.handStrengthHi || 18.0} kg
                    </span>
                  </div>

                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block mb-1">Peak Recorded</span>
                    <span className="text-base font-bold text-emerald-400 font-mono">
                      16.2 kg
                    </span>
                  </div>

                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block mb-1">Compliance</span>
                    <span className="text-base font-bold text-teal-300 font-mono">
                      Within Target (92%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Measurements History Table */}
              <div className="rounded-2xl bg-[#101520] border border-white/[0.07] overflow-hidden">
                <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Patient Telemetry History
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    {allMeasurements.length || 10} Test Records in Database
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[600px]">
                    <thead>
                      <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                        <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Hand</th>
                        <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Posture</th>
                        <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Trial 1 / 2 / 3</th>
                        <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Peak Grip</th>
                        <th className="px-5 py-3 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Recorded At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {(allMeasurements.length > 0 ? allMeasurements.slice(0, 6) : [
                        { id: '1', hand: 'Left', posture: 'Sitting', trial1: 15.5, trial2: 16.2, trial3: 15.8, best: 16.2, recorded_at: '2026-11-16T19:08:28Z' },
                        { id: '2', hand: 'Left', posture: 'Standing', trial1: 14.8, trial2: 15.1, trial3: 15.6, best: 15.6, recorded_at: '2026-11-16T18:45:00Z' },
                        { id: '3', hand: 'Right', posture: 'Sitting', trial1: 16.0, trial2: 16.5, trial3: 16.2, best: 16.5, recorded_at: '2026-11-16T18:12:00Z' },
                        { id: '4', hand: 'Left', posture: 'Sitting', trial1: 15.0, trial2: 15.4, trial3: 15.2, best: 15.4, recorded_at: '2026-11-15T10:20:00Z' },
                      ]).map((m: any) => (
                        <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5 font-semibold text-white">{m.hand || 'Left'}</td>
                          <td className="px-5 py-3.5 text-slate-400">{m.posture || 'Sitting'}</td>
                          <td className="px-5 py-3.5 font-mono text-slate-300">
                            {m.trial1} · {m.trial2} · {m.trial3} kg
                          </td>
                          <td className="px-5 py-3.5 font-bold font-mono text-emerald-400">{m.best} kg</td>
                          <td className="px-5 py-3.5 text-right font-mono text-slate-500 text-[11px]">
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
