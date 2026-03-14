import { getDb } from './mongodb'
import type { SSIPEventDoc, SSIPEvent, EventTypeCode, WaveType } from '../app/event_log/types'

const CLOUD_NAME = 'dutcsd19r'

export const TYPE_META: Record<EventTypeCode, {
  label: string
  color: string
  waveType: WaveType
  snrBase: number
}> = {
  HX: { label: 'HACKATHON TRANSMISSION', color: '#4a9eff', waveType: 'burst',  snrBase: 15.5 },
  FS: { label: 'RESEARCH BROADCAST',     color: '#4eff9a', waveType: 'smooth', snrBase: 14.0 },
  CW: { label: 'WORKSHOP SIGNAL',        color: '#fb923c', waveType: 'dense',  snrBase: 20.0 },
  DD: { label: 'DEMO BROADCAST',         color: '#f472b6', waveType: 'sharp',  snrBase: 17.0 },
  NW: { label: 'NETWORK SIGNAL',         color: '#a78bfa', waveType: 'smooth', snrBase: 12.0 },
}

function computeSpecPos(index: number, total: number): number {
  return (index + 1) / (total + 1)
}

function computeFreq(specPos: number): string {
  const ghz = 0.5 * Math.pow(20, specPos)
  if (ghz < 1) return `${ghz.toFixed(3)} GHz`
  if (ghz < 4) return `${ghz.toFixed(2)} GHz`
  return `${ghz.toFixed(1)} GHz`
}

function computeSnr(type: EventTypeCode, participants: number): string {
  const base = TYPE_META[type].snrBase
  const snr = base + Math.log10(Math.max(1, participants)) * 2.5
  return `+${snr.toFixed(1)} dB`
}

function cloudinaryUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${publicId}`
}

export async function getEvents(): Promise<SSIPEvent[]> {
  const db = await getDb()
  const docs = await db
    .collection<SSIPEventDoc>('events')
    .find({ published: true })
    .sort({ eventDate: -1 })  // most recent first → leftmost on spectrum
    .toArray()

  const total = docs.length

  return docs.map((doc, index) => {
    const meta = TYPE_META[doc.type]
    const specPos = computeSpecPos(index, total)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...rest } = doc
    return {
      ...rest,
      eventDate: doc.eventDate instanceof Date
        ? doc.eventDate.toISOString()
        : doc.eventDate,
      createdAt: doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : doc.createdAt,
      updatedAt: doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : doc.updatedAt,
      typeLabel: meta.label,
      typeColor: meta.color,
      waveType: meta.waveType,
      waveColor: meta.color,
      specPos,
      freq: computeFreq(specPos),
      snr: computeSnr(doc.type, doc.participants),
      photoUrls: (doc.photos ?? []).map(cloudinaryUrl),
    }
  })
}
