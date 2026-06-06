import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ILM++',
  description: 'Inverter Lead Management — Sun King Kenya',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
