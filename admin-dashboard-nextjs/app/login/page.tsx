'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, AlertCircle, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

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
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-main)] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* Top right theme toggle */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle compact />
      </div>

      {/* Brand ambient glows */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-blue-600/[0.08] dark:bg-blue-600/[0.04] blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Main Authentication Card */}
        <div
          className="rounded-3xl border border-black/10 dark:border-white/[0.08] bg-[var(--bg-card)] shadow-2xl relative overflow-hidden p-8 sm:p-10 transition-colors duration-200"
          style={{
            boxShadow: '0 20px 50px -10px rgba(0, 59, 130, 0.15)',
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0047AB] via-[#0B5ED7] to-[#F59E0B] text-white mb-4 shadow-lg shadow-blue-600/30">
              <Activity className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div className="flex items-center justify-center gap-2.5">
              <h1 className="text-3xl font-black tracking-tight text-[#003884] dark:text-white">VitalStep</h1>
              <span className="text-xs font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-semibold">
              Clinical Telemetry & IoT Management Console
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vitalstep.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm font-medium executive-input placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-xs sm:text-sm font-medium executive-input placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#0047AB] to-[#0D6EFD] hover:from-[#003884] hover:to-[#0B5ED7] transition-all shadow-md shadow-blue-600/30 cursor-pointer mt-3"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating…</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Presets */}
          <div className="mt-7 pt-5 border-t border-black/10 dark:border-white/[0.08]">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Quick Role Authentication
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@vitalstep.com', 'Admin@123')}
                className="px-2 py-2 rounded-xl bg-black/5 dark:bg-white/[0.04] hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-black/10 dark:border-white/[0.08] transition-colors cursor-pointer text-center"
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Admin</div>
                <div className="text-[10px] text-slate-500 truncate">System</div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('nncr540@gmail.com', 'password123')}
                className="px-2 py-2 rounded-xl bg-black/5 dark:bg-white/[0.04] hover:bg-teal-50 dark:hover:bg-teal-900/20 border border-black/10 dark:border-white/[0.08] transition-colors cursor-pointer text-center"
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Specialist</div>
                <div className="text-[10px] text-slate-500 truncate">Dr. Chandan</div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('sandipr@hotmail.com', 'Sandip@202')}
                className="px-2 py-2 rounded-xl bg-black/5 dark:bg-white/[0.04] hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-black/10 dark:border-white/[0.08] transition-colors cursor-pointer text-center"
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Patient</div>
                <div className="text-[10px] text-slate-500 truncate">Sandip R</div>
              </button>
            </div>
          </div>

          {/* Security Assurance Footer */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>End-to-End Encrypted Telemetry Link</span>
          </div>
        </div>
      </div>
    </div>
  )
}
