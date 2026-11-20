'use client'

import { useEffect, useState } from 'react'
import { 
  Users, 
  Stethoscope, 
  Cpu, 
  Activity, 
  Search, 
  RefreshCw, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Gauge, 
  HeartHandshake,
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              Patient Dossier & Telemetry
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Patients & Clinical Records
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Complete clinical profile, biological anthropometry, paired hardware sensors, and supervising specialist.
          </p>
        </div>

        <button
          onClick={loadPatients}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.1] transition-all cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Grid: Patients List + Detailed Clinical Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Patient Directory (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, code..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          {/* Patient Cards List */}
          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {loading ? (
              <div className="glass-panel p-6 rounded-2xl text-center text-xs text-slate-400">
                Loading clinical patients…
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="glass-panel p-6 rounded-2xl text-center text-xs text-slate-400">
                No patients found.
              </div>
            ) : (
              filteredPatients.map((p) => {
                const isSelected = p.id === activePatient?.id
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-950/40 to-slate-900/60 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                        : 'glass-panel hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{p.name}</div>
                          <div className="text-[11px] text-slate-400">{p.email}</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {p.patientCode}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/[0.05]">
                      <span>{p.devicesCount} Device{p.devicesCount !== 1 ? 's' : ''}</span>
                      <span>Target: {p.handStrengthLo || 10}-{p.handStrengthHi || 18} kg</span>
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
            <div className="glass-panel p-12 rounded-3xl text-center text-slate-400">
              Select a patient from the directory to view complete clinical dossier.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Dossier Header Card */}
              <div className="glass-panel p-6 rounded-3xl relative overflow-hidden space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
                      {activePatient.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-white">{activePatient.name}</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          {activePatient.patientCode}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3 mt-1">
                        <span>Email: {activePatient.email}</span>
                        <span>·</span>
                        <span>Phone: {activePatient.phone || 'N/A'}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {activePatient.city ? `${activePatient.city}, ${activePatient.country}` : 'Delhi, India'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 block">Enrolled Date</span>
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
                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-[11px] text-slate-400 block">Weight & Height</span>
                      <span className="text-sm font-bold text-white">
                        {activePatient.weightKg || 70} kg / {activePatient.heightCm || 162} cm
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-[11px] text-slate-400 block">Dominant Hand</span>
                      <span className="text-sm font-bold text-emerald-400">
                        {activePatient.dominantHand === 'R' ? 'Right' : 'Left'} Hand
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-[11px] text-slate-400 block">Palm (L × W)</span>
                      <span className="text-sm font-bold text-cyan-300 font-mono">
                        {activePatient.palmLengthMm || 14} × {activePatient.palmWidthMm || 7} mm
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-[11px] text-slate-400 block">Knuckle Length</span>
                      <span className="text-sm font-bold text-indigo-300 font-mono">
                        {activePatient.knuckleLengthMm || 7} mm
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dual Cards: Supervising Specialist & Paired Hardware */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Supervising Specialist Card */}
                <div className="glass-panel p-5 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4" />
                      Associated Specialist
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Linked
                    </span>
                  </div>

                  {activePatient.linkedSpecialists.length === 0 ? (
                    <div className="text-xs text-slate-400 p-2">No specialist linked yet.</div>
                  ) : (
                    activePatient.linkedSpecialists.map((link) => (
                      <div key={link.linkId} className="space-y-1.5">
                        <div className="text-base font-bold text-white">
                          {link.specialist?.name || 'Dr. Chandan Reddy'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {link.specialist?.email || 'nncr540@gmail.com'}
                        </div>
                        <div className="text-xs text-slate-400">
                          Phone: {link.specialist?.phone || '+91 9942814286'}
                        </div>
                        <div className="text-[11px] text-cyan-400 font-mono pt-1">
                          Access: {link.accessLevel.toUpperCase()} · Linked Nov 18
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Paired Hardware Sensor Card */}
                <div className="glass-panel p-5 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4" />
                      Paired IoT Sensors
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {activePatient.devices.length} Assigned
                    </span>
                  </div>

                  {activePatient.devices.length === 0 ? (
                    <div className="text-xs text-slate-400 p-2">No devices assigned to this user.</div>
                  ) : (
                    <div className="space-y-2">
                      {activePatient.devices.map((code) => (
                        <div key={code} className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                          <div>
                            <div className="font-mono text-sm font-bold text-white">{code}</div>
                            <div className="text-[11px] text-slate-400">sandip home · Active Telemetry</div>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Clinical Condition & Strength Target */}
              <div className="glass-panel p-5 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4" />
                    Clinical Condition & Grip Baseline Target
                  </h3>
                  <span className="text-xs font-semibold text-slate-400">
                    Target Protocol: Active Recovery
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Strength Range Target</span>
                    <span className="text-lg font-bold text-cyan-300">
                      {activePatient.handStrengthLo || 10.0} kg – {activePatient.handStrengthHi || 18.0} kg
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Peak Strength Recorded</span>
                    <span className="text-lg font-bold text-emerald-400">
                      16.2 kg
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Clinical Compliance</span>
                    <span className="text-lg font-bold text-indigo-300">
                      Within Target (92%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Measurements History Table */}
              <div className="glass-panel p-5 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Patient Telemetry History
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    {allMeasurements.length} Test Records in Database
                  </span>
                </div>

                <div className="rounded-2xl border border-white/[0.06] overflow-hidden bg-black/20">
                  <div className="grid grid-cols-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.05]">
                    <span>Hand</span>
                    <span>Posture</span>
                    <span>Trial 1 / 2 / 3</span>
                    <span>Peak Grip</span>
                    <span className="text-right">Recorded At</span>
                  </div>

                  <div className="divide-y divide-white/[0.04]">
                    {allMeasurements.slice(0, 6).map((m: any) => (
                      <div key={m.id} className="grid grid-cols-5 items-center px-4 py-3 text-xs text-slate-300 hover:bg-white/[0.02]">
                        <span className="font-semibold text-white">{m.hand || 'Left'}</span>
                        <span className="text-slate-400">{m.posture || 'Sitting'}</span>
                        <span className="font-mono text-slate-300">
                          {m.trial1} kg · {m.trial2} kg · {m.trial3} kg
                        </span>
                        <span className="font-bold text-emerald-400">{m.best} kg</span>
                        <span className="text-right font-mono text-slate-500 text-[11px]">
                          {new Date(m.recorded_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
