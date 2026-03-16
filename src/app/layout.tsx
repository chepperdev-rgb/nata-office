import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nataly Agent Office',
  description: 'AI Team Visualization',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  )
}
