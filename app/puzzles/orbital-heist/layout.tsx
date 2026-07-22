import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Orbital Heist — Universium',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
