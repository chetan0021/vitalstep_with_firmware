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
import ThemeToggle from './ThemeToggle'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: '#0047AB', bg: 'rgba(0, 71, 171, 0.12)' },
  { label: 'Patients & Clinical', href: '/dashboard/patients', icon: Users, color: '#0D9488', bg: 'rgba(13, 148, 136, 0.12)' },
  { label: 'Device Inventory', href: '/dashboard/devices', icon: Cpu, color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.12)' },
  { label: 'Generate Device', href: '/dashboard/generate', icon: Zap, color: '#D97706', bg: 'rgba(217, 119, 6, 0.12)' },
  { label: 'Audit Log', href: '/dashboard/audit', icon: ShieldCheck, color: '#E11D48', bg: 'rgba(225, 29, 72, 0.12)' },
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
    <div className="flex flex-col h-full bg-[var(--bg-sidebar)] text-[var(--text-main)] transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-6 pb-5 border-b border-black/10 dark:border-white/[0.08]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#0047AB] via-[#0B5ED7] to-[#F59E0B] flex items-center justify-center shrink-0 text-white shadow-lg shadow-blue-600/25">
            <Activity className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-[#003884] dark:text-white">VitalStep</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Clinical Console</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-black tracking-wider text-slate-400 uppercase">
          Management
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
                flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-bold
                transition-all duration-200 group
                ${active
                  ? 'border shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.05] border border-transparent'
                }
              `}
              style={active ? {
                background: item.bg,
                borderColor: `${item.color}50`,
                color: item.color,
              } : {}}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                style={{
                  background: active ? item.color : item.bg,
                  color: active ? '#FFFFFF' : item.color,
                }}
              >
                <Icon className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="flex-1 tracking-tight truncate">{item.label}</span>
              {active && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: item.color, boxShadow: `0 0 10px ${item.color}` }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Footer: Theme Toggle, DB Status, Logout */}
      <div className="p-4 border-t border-black/10 dark:border-white/[0.08] space-y-3">
        {/* Light / Dark Mode Toggle */}
        <ThemeToggle />

        {/* DB Status */}
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">Supabase DB</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
            Connected
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
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
      <aside className="hidden md:block w-[270px] shrink-0 sticky top-0 h-screen border-r border-black/10 dark:border-white/[0.08] z-30 transition-colors duration-200">
        <SidebarContent />
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[var(--bg-sidebar)] border-b border-black/10 dark:border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#0047AB] to-[#F59E0B] flex items-center justify-center shrink-0 text-white shadow-md shadow-blue-500/30">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-black text-base tracking-tight text-[#003884] dark:text-white">VitalStep</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
            PRO
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-slate-700 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />
          <div className="relative w-[280px] max-w-[85vw] h-full bg-[var(--bg-sidebar)] border-r border-black/10 dark:border-white/10 z-10 shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
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
