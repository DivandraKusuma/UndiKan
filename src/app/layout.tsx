import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kocok! — Sistem Undian Doorprize',
  description: 'Aplikasi sistem undian doorprize profesional untuk Event Organizer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
