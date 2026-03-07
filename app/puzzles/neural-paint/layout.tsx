import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Neural Paint — Exploratorium',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
