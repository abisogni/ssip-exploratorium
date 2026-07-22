import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Signal from Deep Space — Universium',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
