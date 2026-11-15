import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      <Sidebar />
      {/* Main content pushed right by sidebar width */}
      <main style={{
        marginLeft: '260px',
        flex: 1,
        minHeight: '100vh',
        padding: '40px 40px',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}>
        {children}
      </main>

      <style>{`
        @media (max-width: 768px) {
          main { margin-left: 0 !important; padding: 72px 20px 20px !important; }
        }
      `}</style>
    </div>
  )
}
