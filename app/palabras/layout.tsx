import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'palabras — The Universium',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
