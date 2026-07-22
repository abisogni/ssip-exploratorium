import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Adversarial Patch — Universium',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
