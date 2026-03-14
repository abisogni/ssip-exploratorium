export type EventTypeCode = 'HX' | 'FS' | 'CW' | 'DD' | 'NW'
export type WaveType = 'sharp' | 'smooth' | 'burst' | 'dense'

/** Shape stored in MongoDB */
export interface SSIPEventDoc {
  _id?: unknown
  ref: string            // "HX20251004"
  name: string           // "NASA Space Apps Challenge"
  type: EventTypeCode
  eventDate: Date | string
  dateDisplay: string    // "Oct 4–6, 2025" — shown in stats grid DATE cell
  venue: string          // "Campus Biotech Geneva" — shown in stats grid LOCATION cell
  location: string       // "Geneva, Switzerland"
  participants: number   // 60 — drives SNR + stats grid PARTICIPANTS cell
  description: string    // short tagline (1–2 sentences, shown under waveform)
  outcomes: string       // one paragraph
  summary: string        // multi-paragraph, \n\n separated
  sponsors: string[]
  tags: string[]
  photos: string[]       // Cloudinary public IDs e.g. "ssip/events/HX20251004/photo-01"
  published: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

/** Shape returned by the API (enriched — all computed fields added) */
export interface SSIPEvent extends Omit<SSIPEventDoc, '_id'> {
  typeLabel: string      // "HACKATHON TRANSMISSION"
  typeColor: string      // "#4a9eff"
  waveType: WaveType
  waveColor: string      // same as typeColor
  specPos: number        // 0–1, computed from sort order
  freq: string           // "8.4 GHz", computed from specPos
  snr: string            // "+19.9 dB", computed from type + participants
  photoUrls: string[]    // resolved Cloudinary URLs
}
