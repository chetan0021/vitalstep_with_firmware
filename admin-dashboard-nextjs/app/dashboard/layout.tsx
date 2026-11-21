import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col md:flex-row relative">
      {/* Ambient glows */}
      <div className="fixed top-[-15%] left-[-8%] w-[520px] h-[520px] rounded-full bg-emerald-700/10 blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-8%] w-[560px] h-[560px] rounded-full bg-cyan-700/10 blur-[160px] pointer-events-none z-0" />
      <div className="fixed top-[45%] right-[25%] w-[380px] h-[380px] rounded-full bg-violet-700/6 blur-[120px] pointer-events-none z-0" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="relative z-10 flex-1 min-w-0 min-h-screen overflow-x-hidden">
        <div className="p-6 sm:p-8 lg:p-10 max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  )
}
