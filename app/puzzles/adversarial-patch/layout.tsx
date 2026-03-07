import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Adversarial Patch — Exploratorium',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
