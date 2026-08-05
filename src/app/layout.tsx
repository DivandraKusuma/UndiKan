import type { Metadata } from 'next'
import './globals.css'
import NextTopLoader from 'nextjs-toploader'

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
      <body>
        <NextTopLoader color="#299D91" showSpinner={false} height={3} />
        {children}
      </body>
    </html>
  )
}
