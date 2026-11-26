'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cpu, Search, RefreshCw, Zap, Copy, Check, Eye, EyeOff, QrCode, Trash2, Lock, X, AlertTriangle } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
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
  const [selectedQrDevice, setSelectedQrDevice] = useState<DeviceInv | null>(null)
  const [clearConfirmDevice, setClearConfirmDevice] = useState<DeviceInv | null>(null)
  const [clearing, setClearing] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

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

  const handleClearData = async (device: DeviceInv) => {
    if (device.status === 'paired' || device.paired_user_id) {
      alert('This device is currently paired! It must first be unpaired from the mobile app or device before clearing data.')
      return
    }
    setClearing(true)
    try {
      const { error: updErr } = await supabase
        .from('device_inventory')
        .update({ notes: 'CLEAR_DATA_REQUESTED' })
        .eq('id', device.id)

      if (updErr) throw updErr
      setToastMsg(`SD Card wipe command queued for ${device.device_code}. On its next sync, the device will wipe /vs/history.csv.`)
      setClearConfirmDevice(null)
      load()
    } catch (err: any) {
      alert(err.message || 'Error scheduling data wipe')
    } finally {
      setClearing(false)
    }
  }

  const total = devices.length
  const manufactured = devices.filter(d => d.status === 'manufactured').length
  const paired = devices.filter(d => d.status === 'paired').length

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-sm font-semibold shadow-lg">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/35 shadow-sm shadow-violet-500/15">
              <Cpu className="w-4 h-4 stroke-[2.5]" />
              Hardware Telemetry Inventory
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0A1C3D] dark:text-white">
            Device Fleet Inventory
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mt-1.5 font-medium">
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.12] text-[#0A1C3D] dark:text-slate-200 border border-slate-300 dark:border-white/10 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-violet-600 dark:text-violet-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 3 Multi-Colored KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Total Fleet Units', val: total, color: '#0284C7', badge: 'All Inventory' },
          { label: 'Manufactured / Ready', val: manufactured, color: '#059669', badge: 'In Stock' },
          { label: 'Paired to Patient', val: paired, color: '#7C3AED', badge: 'In Clinical Field' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-3xl p-6 sm:p-7 relative overflow-hidden transition-all duration-200 hover:-translate-y-1 bg-[var(--bg-card)] border border-slate-200 dark:border-white/[0.08] shadow-sm"
          >
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ background: s.color }}
            />
            <span
              className="inline-block text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-3.5"
              style={{ background: `${s.color}20`, color: s.color, border: `1px solid ${s.color}40` }}
            >
              {s.badge}
            </span>
            <div className="text-4xl sm:text-5xl font-black tracking-tight text-[#0A1C3D] dark:text-white mb-1.5 font-mono">
              {loading ? '…' : s.val}
            </div>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-bold">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-[var(--bg-card)] border border-slate-200 dark:border-white/[0.08] p-4 sm:p-5 flex flex-col sm:flex-row gap-3.5 shadow-sm">
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
          className="px-4 py-3 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer bg-white dark:bg-[#0D121B] border border-slate-300 dark:border-white/10"
        >
          <option value="all">All Statuses</option>
          <option value="manufactured">Manufactured (In Stock)</option>
          <option value="paired">Paired (Clinical)</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Devices Table */}
      <div
        className="rounded-3xl overflow-hidden bg-[var(--bg-card)] border border-slate-200 dark:border-white/[0.1] shadow-sm"
      >
        {error && (
          <div className="p-4 text-xs font-semibold text-rose-600 dark:text-rose-300 bg-rose-500/10 border-b border-rose-500/20">
            ⚠️ {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[22%]">Device Code</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[36%]">Hardware Secret</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[14%]">Status</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[14%]">Registered Date</th>
                <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[14%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-xs sm:text-sm text-slate-500 font-medium">Loading hardware inventory…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-slate-500">
                    <Cpu className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <div className="text-base font-bold text-slate-800 dark:text-white">No devices found</div>
                    <div className="text-xs text-slate-500 mt-1">Generate a new device code to populate this fleet.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((d) => {
                  const isRevealed = revealedSecrets[d.id]
                  const isPaired = d.status === 'paired' || !!d.paired_user_id
                  const isWipePending = d.notes === 'CLEAR_DATA_REQUESTED'
                  return (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-[#0A1C3D] dark:text-white text-sm px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.1]">
                            {d.device_code}
                          </span>
                          {d.device_code === 'VS-001002' && isPaired && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35">
                              Sandip R
                            </span>
                          )}
                          {isWipePending && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/35">
                              Wipe Pending
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs sm:text-sm text-slate-600 dark:text-slate-300 truncate max-w-[220px]">
                            {isRevealed ? d.device_secret : `${(d.device_secret || '').substring(0, 16)}••••••••••••••••`}
                          </span>
                          <button 
                            onClick={() => toggleReveal(d.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                            title={isRevealed ? "Hide secret" : "Show secret"}
                          >
                            {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => copySecret(d.device_secret, d.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                            title="Copy secret"
                          >
                            {copiedId === d.id ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            isPaired
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35'
                              : 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/35'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isPaired ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
                          {d.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right font-mono text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                        {fmt(d.created_at)}
                      </td>

                      {/* Actions: QR Modal & Clear SD Data */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* QR Code Provisioning Button */}
                          <button
                            onClick={() => setSelectedQrDevice(d)}
                            className="p-2 rounded-xl text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 transition-all cursor-pointer"
                            title="View BLE Provisioning QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Clear SD Data Button: strictly restricted to UNPAIRED devices */}
                          {isPaired ? (
                            <button
                              disabled
                              className="p-2 rounded-xl text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] cursor-not-allowed opacity-60"
                              title="Device is currently paired! Must unpair first before clearing data."
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setClearConfirmDevice(d)}
                              className="p-2 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition-all cursor-pointer"
                              title="Clear SD Card History (Unpaired Only)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal */}
      {selectedQrDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0D121B] border border-slate-200 dark:border-white/10 shadow-2xl text-center">
            <button
              onClick={() => setSelectedQrDevice(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center gap-2 mb-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
              <QrCode className="w-4 h-4" />
              <span>Admin Hardware Provisioning</span>
            </div>

            <h3 className="text-xl font-black text-[#0A1C3D] dark:text-white mb-1">
              {selectedQrDevice.device_code}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Scan this QR in the mobile app under <strong>Account → Admin Device Setup</strong> to provision the ESP32 over BLE.
            </p>

            <div className="inline-block p-4 bg-white rounded-2xl shadow-inner border border-slate-200 mb-6">
              <QRCodeSVG
                value={JSON.stringify({
                  code: selectedQrDevice.device_code,
                  secret: selectedQrDevice.device_secret,
                  type: 'vitalstep_admin_provision',
                })}
                size={220}
                level="M"
              />
            </div>

            <button
              onClick={() => setSelectedQrDevice(null)}
              className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/20 transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Clear SD Data Confirmation Modal */}
      {clearConfirmDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0D121B] border border-rose-500/30 shadow-2xl text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#0A1C3D] dark:text-white">
                  Clear SD Card History?
                </h3>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Condition Met: Device is completely unpaired
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Are you sure you want to queue a measurement history wipe for{' '}
              <strong className="text-[#0A1C3D] dark:text-white font-mono">{clearConfirmDevice.device_code}</strong>?
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 mb-6 space-y-1">
              <div>• Hardware identity & secret in SD card will remain intact.</div>
              <div>• Only local SD CSV test history (<code className="text-rose-500 font-mono">/vs/history.csv</code>) will be wiped on next sync.</div>
              <div>• This ensures fresh, clean calibration for the next user.</div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setClearConfirmDevice(null)}
                disabled={clearing}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleClearData(clearConfirmDevice)}
                disabled={clearing}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md shadow-rose-500/25 cursor-pointer disabled:opacity-50"
              >
                {clearing ? 'Queueing Wipe…' : 'Yes, Wipe SD History'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
