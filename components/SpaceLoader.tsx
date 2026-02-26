'use client'

import dynamic from 'next/dynamic'

const SpaceScene = dynamic(() => import('@/components/SpaceScene'), { ssr: false })

export default function SpaceLoader() {
  return <SpaceScene />
}
