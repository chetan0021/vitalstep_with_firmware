import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 relative">
      {/* Ambient glows — fixed, behind everything */}
      <div className="fixed top-[-15%] left-[-8%]  w-[520px] h-[520px] rounded-full bg-emerald-700/10  blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-8%] w-[560px] h-[560px] rounded-full bg-cyan-700/10    blur-[160px] pointer-events-none z-0" />
      <div className="fixed top-[45%]  right-[25%]  w-[380px] h-[380px] rounded-full bg-violet-700/6    blur-[120px] pointer-events-none z-0" />

      {/* Sidebar — fixed, 260 px wide */}
      <Sidebar />

      {/* Main content — offset by sidebar width on md+ */}
      <main className="relative z-10 md:pl-[260px] min-h-screen">
        <div className="px-5 py-8 md:px-10 md:py-10 max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  )
}
