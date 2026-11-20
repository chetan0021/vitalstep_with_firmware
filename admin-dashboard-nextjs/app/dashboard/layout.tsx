import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#080B11', color: '#F1F5F9' }}>
      {/* Ambient glows */}
      <div style={{
        position: 'fixed', top: '-15%', left: '-8%',
        width: 520, height: 520, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', right: '-8%',
        width: 560, height: 560, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)',
        filter: 'blur(70px)', pointerEvents: 'none', zIndex: 0
      }} />

      {/* Sidebar — fixed 260px left */}
      <Sidebar />

      {/* Main content — always offset 260px on desktop */}
      <main style={{ position: 'relative', zIndex: 10, minHeight: '100vh' }}
            className="md:ml-[260px]">
        <div className="px-5 py-8 md:px-10 md:py-10" style={{ maxWidth: 1400 }}>
          {children}
        </div>
      </main>
    </div>
  )
}
