'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Zap, Copy, Check, ArrowRight, RefreshCw, KeyRound } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function GeneratePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ device_code: string; device_secret: string } | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [prefix, setPrefix] = useState('VS')

  const generate = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const digits = Math.floor(100000 + Math.random() * 900000).toString()
      const device_code = `${prefix}-${digits}`

      const bytes = crypto.getRandomValues(new Uint8Array(32))
      const device_secret = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')

      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      let admin_id: string | null = null
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          admin_id = payload.sub
        } catch {}
      }

      const { error: insertError } = await supabase
        .from('device_inventory')
        .insert({
          device_code,
          device_secret,
          status: 'manufactured',
          created_by: admin_id,
        })

      if (insertError) throw new Error(insertError.message)

      if (admin_id) {
        await supabase.from('device_audit').insert({
          admin_id,
          action: 'create',
          device_code,
          details: 'Device code provisioned from admin console',
        })
      }

      setResult({ device_code, device_secret })
    } catch (err: any) {
      setError(err.message || 'Failed to generate device credentials')
    } finally {
      setLoading(false)
    }
  }

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="pb-5 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/35 shadow-sm shadow-amber-500/15">
            <KeyRound className="w-4 h-4 stroke-[2.5]" />
            Hardware Cryptographic Provisioning
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0A1C3D] dark:text-white">
          Generate Device Code
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mt-1.5 font-medium">
          Mint fresh activation credentials and SHA-256 pairing secrets for factory hardware
        </p>
      </div>

      {/* Main Provisioning Card */}
      <div
        className="rounded-3xl p-7 sm:p-9 space-y-7 relative overflow-hidden bg-[var(--bg-card)] border border-amber-500/35 shadow-sm"
      >
        <div>
          <label className="block text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2.5">
            Device Code Prefix
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <input
              type="text"
              value={prefix}
              onChange={e => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={6}
              className="w-32 px-4 py-3 rounded-xl font-mono text-lg font-black text-[#0A1C3D] dark:text-white tracking-widest text-center bg-white dark:bg-black/40 border border-amber-500/50 shadow-inner outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-mono font-medium">
              Pattern: <span className="text-amber-600 dark:text-amber-400 font-bold">{prefix}-XXXXXX</span> (e.g. {prefix}-001003)
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={generate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl text-sm sm:text-base font-extrabold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:from-amber-600 active:to-orange-600 transition-all shadow-lg shadow-amber-500/25 cursor-pointer"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin text-white" />
              <span>Generating Cryptographic Keys…</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 fill-current" />
              <span>Provision Device Credentials</span>
            </>
          )}
        </button>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl text-xs sm:text-sm text-rose-600 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20 font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Generated Result Container */}
        {result && (
          <div
            className="rounded-2xl p-6 space-y-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-500/40 shadow-sm"
          >
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>Hardware Credentials Successfully Minted</span>
            </div>

            {/* Device Code */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                Device Code
              </span>
              <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 shadow-inner">
                <span className="font-mono text-base font-black text-[#0A1C3D] dark:text-white tracking-wider">
                  {result.device_code}
                </span>
                <button
                  onClick={() => copy(result.device_code, 'code')}
                  className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer"
                >
                  {copiedKey === 'code' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Hardware Secret */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                64-Char Hardware Secret (Pairing Hash)
              </span>
              <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 shadow-inner">
                <span className="font-mono text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 truncate pr-3">
                  {result.device_secret}
                </span>
                <button
                  onClick={() => copy(result.device_secret, 'secret')}
                  className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center gap-2 text-xs font-bold shrink-0 cursor-pointer"
                >
                  {copiedKey === 'secret' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Next Step */}
            <div className="pt-2 flex items-center justify-between">
              <Link
                href="/dashboard/devices"
                className="text-xs sm:text-sm font-bold text-[#0047AB] dark:text-cyan-300 hover:underline flex items-center gap-1.5"
              >
                <span>View in Fleet Inventory</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-xs text-slate-500 font-mono font-bold">Status: MANUFACTURED</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
