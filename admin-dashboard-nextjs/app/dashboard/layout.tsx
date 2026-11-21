import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 flex flex-col md:flex-row relative selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Subtle executive background accents */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[300px] bg-emerald-500/[0.03] blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[300px] bg-teal-500/[0.02] blur-[160px] pointer-events-none z-0" />

      {/* In-flow Desktop Sidebar & Mobile Drawer */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 min-w-0 min-h-screen overflow-x-hidden">
        <div className="p-6 sm:p-8 lg:p-10 max-w-[1440px]">
          {children}
        </div>
      </main>
    </div>
  )
}
