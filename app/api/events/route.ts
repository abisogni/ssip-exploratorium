import { NextResponse } from 'next/server'
import { getEvents } from '@/lib/events'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const events = await getEvents()
    return NextResponse.json(events)
  } catch (err) {
    console.error('GET /api/events:', err)
    return NextResponse.json({ error: 'Failed to load events' }, { status: 500 })
  }
}
