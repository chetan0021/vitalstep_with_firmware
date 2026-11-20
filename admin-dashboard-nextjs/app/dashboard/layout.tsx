import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 flex relative selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Ambient decorative glowing backdrops */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none" />
      <div className="fixed top-[40%] right-[20%] w-[400px] h-[400px] rounded-full bg-emerald-600/5 blur-[120px] pointer-events-none" />

      {/* Persistent Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="md:ml-[270px] flex-1 min-h-screen px-4 py-8 md:px-10 md:py-10 z-10 overflow-y-auto">
        <div className="max-w-[1300px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
