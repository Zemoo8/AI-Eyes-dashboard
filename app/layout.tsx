import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AIEyes Dashboard',
  description: 'Real-time family safety dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" style={{ height: '100%', overflow: 'hidden' }}>
      <body style={{ height: '100%', overflow: 'hidden' }}>{children}</body>
    </html>
  )
}
