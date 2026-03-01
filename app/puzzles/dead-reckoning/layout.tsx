import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dead Reckoning — Exploratorium',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
