import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Puzzles — Universium',
}

export default function PuzzlesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
