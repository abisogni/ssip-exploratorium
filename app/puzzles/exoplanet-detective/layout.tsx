import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Exoplanet Detective — Exploratorium',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
