import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Orbital Heist — Exploratorium',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
