import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Signal from Deep Space — Exploratorium',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
