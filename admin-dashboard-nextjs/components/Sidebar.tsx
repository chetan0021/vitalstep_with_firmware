'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Cpu,
  Zap,
  ShieldCheck,
  LogOut,
  Activity,
  Menu,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const navItems = [
  { label: 'Dashboard',           href: '/dashboard',          icon: LayoutDashboard },
  { label: 'Patients & Clinical', href: '/dashboard/patients', icon: Users },
  { label: 'Device Inventory',    href: '/dashboard/devices',  icon: Cpu },
  { label: 'Generate Device',     href: '/dashboard/generate', icon: Zap },
  { label: 'Audit Log',           href: '/dashboard/audit',    icon: ShieldCheck },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_email')
    document.cookie = 'access_token=; path=/; max-age=0'
    try { await supabase.auth.signOut() } catch { }
    router.push('/login')
  }

  return (
    <div className="flex flex-col h-full bg-[#0D111A] text-slate-300">
      {/* Brand Header */}
      <div className="p-6 pb-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400 shadow-sm">
            <Activity className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-base tracking-tight">VitalStep</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">Clinical Console</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold
                transition-all duration-150 group
                ${active
                  ? 'text-white bg-emerald-500/10 border border-emerald-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                }
              `}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  active ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white'
                }`}
              />
              <span className="flex-1 tracking-tight truncate">{item.label}</span>
              {active && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Footer / Live Status & Logout */}
      <div className="p-4 border-t border-white/[0.06] space-y-2.5">
        {/* DB Status */}
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Supabase DB</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Connected
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Session</span>
        </button>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop Sidebar: sticky in normal document flow */}
      <aside className="hidden md:block w-[260px] shrink-0 sticky top-0 h-screen border-r border-white/[0.07] z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#0D111A] border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
            <Activity className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <span className="text-white font-bold text-base tracking-tight">VitalStep</span>
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            PRO
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />
          <div className="relative w-[280px] max-w-[85vw] h-full bg-[#0D111A] border-r border-white/10 z-10 shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
