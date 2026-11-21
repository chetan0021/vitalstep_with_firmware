'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, AlertCircle, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      router.push('/dashboard')
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!email || !password) {
        setError('Please enter both email and password.')
        setLoading(false)
        return
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Authentication failed. Please verify credentials.')
        setLoading(false)
        return
      }

      if (data.session) {
        localStorage.setItem('access_token', data.session.access_token)
        localStorage.setItem('user_email', email)
        document.cookie = `access_token=${data.session.access_token}; path=/; max-age=3600; SameSite=Lax`
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError('Network connection error. Please try again.')
      setLoading(false)
    }
  }

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail)
    setPassword(userPass)
    setError('')
  }

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Subtle ambient light */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-500/[0.04] blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Main Authentication Card */}
        <div
          className="rounded-2xl border border-white/[0.08] bg-[#101520] shadow-2xl relative overflow-hidden"
          style={{ padding: '36px 32px' }}
        >
          {/* Subtle top edge highlight */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

          {/* Header */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3.5 shadow-sm">
              <Activity className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">VitalStep</h1>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Clinical Telemetry & IoT Management Console
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded-xl text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vitalstep.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs executive-input placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs executive-input placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 transition-colors shadow-sm cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Authenticating…</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Presets */}
          <div className="mt-6 pt-5 border-t border-white/[0.06]">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              Quick Role Authentication
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@vitalstep.com', 'Admin@123')}
                className="px-2 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-left transition-colors cursor-pointer text-center"
              >
                <div className="text-[11px] font-semibold text-slate-200">Admin</div>
                <div className="text-[10px] text-slate-500 truncate">System</div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('nncr540@gmail.com', 'password123')}
                className="px-2 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-left transition-colors cursor-pointer text-center"
              >
                <div className="text-[11px] font-semibold text-slate-200">Specialist</div>
                <div className="text-[10px] text-slate-500 truncate">Dr. Chandan</div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('sandipr@hotmail.com', 'Sandip@202')}
                className="px-2 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-left transition-colors cursor-pointer text-center"
              >
                <div className="text-[11px] font-semibold text-slate-200">Patient</div>
                <div className="text-[10px] text-slate-500 truncate">Sandip R</div>
              </button>
            </div>
          </div>

          {/* Security Assurance Footer */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
            <span>End-to-End Encrypted Telemetry Link</span>
          </div>
        </div>
      </div>
    </div>
  )
}
