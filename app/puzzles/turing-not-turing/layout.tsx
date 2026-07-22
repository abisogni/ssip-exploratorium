import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Turing, Not Turing — Universium',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
