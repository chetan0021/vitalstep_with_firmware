'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Activity } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-[#0A0D14] flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Activity className="w-6 h-6 animate-pulse" strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg tracking-tight">VitalStep</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            PRO
          </span>
        </div>
        <p className="text-xs text-slate-500">Initializing secure session…</p>
      </div>
    </div>
  )
}
