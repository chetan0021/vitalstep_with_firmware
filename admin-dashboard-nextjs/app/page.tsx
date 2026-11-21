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
    <div className="min-h-screen bg-[var(--bg-canvas)] flex flex-col items-center justify-center p-4 transition-colors duration-200">
      <div className="flex flex-col items-center gap-3.5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0047AB] via-[#0B5ED7] to-[#F59E0B] flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
          <Activity className="w-7 h-7 stroke-[2.5] animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-black text-xl tracking-tight text-[#003884] dark:text-white">VitalStep</span>
          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            PRO
          </span>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">Initializing secure clinical session…</p>
      </div>
    </div>
  )
}
