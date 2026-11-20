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
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: '#38BDF8' },
  { label: 'Patients & Clinical', href: '/dashboard/patients', icon: Users, color: '#34D399' },
  { label: 'Device Inventory', href: '/dashboard/devices', icon: Cpu, color: '#A78BFA' },
  { label: 'Generate Device', href: '/dashboard/generate', icon: Zap, color: '#FBBF24' },
  { label: 'Audit Log', href: '/dashboard/audit', icon: ShieldCheck, color: '#F472B6' },
]

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_email')
    document.cookie = 'access_token=; path=/; max-age=0'
    try { await supabase.auth.signOut() } catch {}
    router.push('/login')
  }

  const SidebarContent = () => (
    <aside className="w-[270px] h-screen flex flex-col fixed top-0 left-0 z-50 glass-panel border-r border-white/[0.08] bg-[#0A0D14]/90 backdrop-blur-2xl">
      {/* Brand Header */}
      <div className="p-6 pb-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
            <Activity className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-extrabold text-[19px] tracking-tight">VitalStep</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">PRO</span>
            </div>
            <p className="text-slate-400 text-xs font-medium tracking-wide mt-0.5">Clinical Console</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3.5 flex-1 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          Management
        </div>

        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              onClick={() => setMobileOpen(false)} 
              className="block group"
            >
              <div className={`
                flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${active 
                  ? 'bg-gradient-to-r from-white/[0.08] to-white/[0.03] text-white border border-white/[0.12] shadow-inner shadow-white/5' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
                }
              `}>
                <div 
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 ${active ? 'bg-white/[0.1]' : 'group-hover:bg-white/[0.05]'}`}
                  style={{ color: item.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="flex-1 tracking-tight">{item.label}</span>
                {active && (
                  <span 
                    className="w-1.5 h-1.5 rounded-full shadow-sm"
                    style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }}
                  />
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Cloud & User Indicator */}
      <div className="p-3.5 border-t border-white/[0.06] space-y-2.5">
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-medium text-slate-300">oyqecdcpic...</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            Live DB
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/20 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <SidebarContent />
      </div>

      {/* Mobile Trigger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white backdrop-blur-md"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)} 
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40" 
        />
      )}
      {mobileOpen && <SidebarContent />}
    </>
  )
}
