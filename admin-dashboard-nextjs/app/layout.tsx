import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeContext'

export const metadata: Metadata = {
  title: 'VitalStep Pro · Clinical Console',
  description: 'Clinical Telemetry & IoT Hardware Management Console',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark" data-theme="dark">
      <body className="antialiased selection:bg-blue-500/30 selection:text-blue-900 dark:selection:text-blue-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
