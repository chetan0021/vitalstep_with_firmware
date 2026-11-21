'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Zap, Copy, Check, ArrowRight, ShieldCheck, Cpu, RefreshCw, KeyRound } from 'lucide-react'
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
      // Generate code: prefix + 6 random digits
      const digits = Math.floor(100000 + Math.random() * 900000).toString()
      const device_code = `${prefix}-${digits}`

      // Generate 64-char hex secret
      const bytes = crypto.getRandomValues(new Uint8Array(32))
      const device_secret = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')

      // Get current admin id from localStorage token
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      let admin_id: string | null = null
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          admin_id = payload.sub
        } catch {}
      }

      // Insert into device_inventory
      const { error: insertError } = await supabase
        .from('device_inventory')
        .insert({
          device_code,
          device_secret,
          status: 'manufactured',
          created_by: admin_id,
        })

      if (insertError) throw new Error(insertError.message)

      // Log to device_audit
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
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm shadow-amber-500/20">
            <KeyRound className="w-3.5 h-3.5" />
            Hardware Cryptographic Provisioning
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Generate Device Code
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Mint fresh activation credentials and SHA-256 pairing secrets for factory hardware
        </p>
      </div>

      {/* Main Glassmorphic Card */}
      <div
        className="relative p-6 sm:p-8 rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(150deg, rgba(16, 22, 34, 0.85) 0%, rgba(8, 12, 20, 0.95) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          boxShadow: '0 12px 36px -10px rgba(245, 158, 11, 0.2)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Glow halo */}
        <div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: '#F59E0B' }}
        />

        <div className="relative space-y-6">
          {/* Prefix Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Device Code Prefix
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={prefix}
                onChange={e => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                maxLength={6}
                className="w-28 px-4 py-2.5 rounded-xl font-mono text-base font-bold text-white tracking-widest text-center outline-none transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  boxShadow: '0 0 16px -4px rgba(245, 158, 11, 0.25)',
                }}
              />
              <span className="text-xs text-slate-400 font-mono">
                Pattern: <span className="text-amber-400 font-bold">{prefix}-XXXXXX</span> (e.g. {prefix}-001003)
              </span>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl text-sm font-bold text-white transition-all shadow-lg cursor-pointer"
            style={{
              background: loading ? '#475569' : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              boxShadow: loading ? 'none' : '0 8px 24px -4px rgba(245, 158, 11, 0.4)',
            }}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Generating Cryptographic Keys…</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>Provision Device Credentials</span>
              </>
            )}
          </button>

          {/* Error notice */}
          {error && (
            <div className="p-4 rounded-xl text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20">
              ⚠️ {error}
            </div>
          )}

          {/* Generated Result Container */}
          {result && (
            <div
              className="mt-6 p-5 rounded-2xl space-y-4"
              style={{
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 8px 24px -6px rgba(16, 185, 129, 0.2)',
              }}
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Check className="w-4 h-4" />
                <span>Hardware Credentials Successfully Minted</span>
              </div>

              {/* Device Code */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Device Code
                </span>
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="font-mono text-base font-extrabold text-white tracking-wider">
                    {result.device_code}
                  </span>
                  <button
                    onClick={() => copy(result.device_code, 'code')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs"
                  >
                    {copiedKey === 'code' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Hardware Secret */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  64-Char Hardware Secret (Pairing Hash)
                </span>
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="font-mono text-xs text-amber-300 truncate pr-3">
                    {result.device_secret}
                  </span>
                  <button
                    onClick={() => copy(result.device_secret, 'secret')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs shrink-0"
                  >
                    {copiedKey === 'secret' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-between">
                <Link
                  href="/dashboard/devices"
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>View in Fleet Inventory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span className="text-[11px] text-slate-500 font-mono">Status: MANUFACTURED</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
