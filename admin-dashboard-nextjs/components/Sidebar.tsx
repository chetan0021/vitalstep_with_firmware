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
  { label: 'Dashboard',           href: '/dashboard',          icon: LayoutDashboard, accent: '#10B981' },
  { label: 'Patients & Clinical', href: '/dashboard/patients', icon: Users,           accent: '#06B6D4' },
  { label: 'Device Inventory',    href: '/dashboard/devices',  icon: Cpu,             accent: '#8B5CF6' },
  { label: 'Generate Device',     href: '/dashboard/generate', icon: Zap,             accent: '#F59E0B' },
  { label: 'Audit Log',           href: '/dashboard/audit',    icon: ShieldCheck,     accent: '#EC4899' },
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
    <div className="flex flex-col h-full relative">
      {/* top glow hairline */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      {/* Brand */}
      <div className="px-6 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20"
            style={{ background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)' }}
          >
            <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-[17px] tracking-tight">VitalStep</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                PRO
              </span>
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5 font-medium">Clinical Console</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3.5 flex-1 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          Management
        </div>
        <div className="mx-3 h-px bg-white/[0.06] mb-2" />

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
                transition-all duration-200 group
                ${active
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }
              `}
              style={active ? {
                background: `linear-gradient(135deg, ${item.accent}1c 0%, transparent 100%)`,
                border: `1px solid ${item.accent}35`,
                boxShadow: `0 0 16px -4px ${item.accent}30`,
              } : { border: '1px solid transparent' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0"
                style={{
                  background: active ? `${item.accent}25` : 'rgba(255,255,255,0.03)',
                  color: active ? item.accent : 'currentColor',
                }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="flex-1 tracking-tight truncate">{item.label}</span>
              {active && (
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: item.accent, boxShadow: `0 0 8px ${item.accent}` }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 space-y-2 border-t border-white/[0.06]">
        {/* DB Status */}
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] text-slate-400 font-mono">oyqecdcpic…</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
            Live DB
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
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
      {/* Desktop Sidebar: in normal document flow, sticky at top */}
      <aside className="hidden md:block w-[260px] shrink-0 sticky top-0 h-screen border-r border-white/[0.07] bg-[#070A10]/95 backdrop-blur-2xl z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Top Header with hamburger */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#070A10]/95 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20"
            style={{ background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)' }}
          >
            <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-bold text-base tracking-tight">VitalStep</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            PRO
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-white hover:bg-white/10 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Backdrop and Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer content */}
          <div className="relative w-[280px] max-w-[85vw] h-full bg-[#070A10] border-r border-white/10 z-10 shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white"
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
