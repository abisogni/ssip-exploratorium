import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kryptos Lab — Universium',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
