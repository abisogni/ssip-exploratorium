/**
 * Seed script — SSIP event log events
 *
 * Usage:
 *   node scripts/seed-events.mjs           → seeds v1-development
 *   node scripts/seed-events.mjs prod      → seeds v1-production
 *
 * Run dev first, verify in the app, then run prod.
 */

import { MongoClient } from 'mongodb'

const MONGODB_URI =
  'mongodb+srv://geirnaertalan:gOerlLZmEHWoz7JV@ssip.zpj2q4v.mongodb.net/?appName=ssip'

const DB_NAME = process.argv[2] === 'prod' ? 'v1-production' : 'v1-development'

console.log(`Seeding → ${DB_NAME}`)

// ── Event data ────────────────────────────────────────────────────────────────
// Fields marked TODO need to be filled in via MongoDB Compass or the dashboard.
// photos: add Cloudinary public IDs here once images are uploaded to
//   ssip/events/{ref}/ in Cloudinary (cloud: dutcsd19r).
// ─────────────────────────────────────────────────────────────────────────────

const now = new Date()

const events = [
  {
    ref: 'CW20260220',
    name: 'Elara Strategic Session',
    type: 'CW',
    eventDate: new Date('2026-02-20'),
    dateDisplay: 'Feb 20, 2026',
    venue: 'TODO: venue name',
    location: 'TODO: city, Switzerland',
    participants: 52,
    description: 'TODO: 1–2 sentence tagline.',
    outcomes: 'TODO: key outcomes paragraph.',
    summary: 'TODO: paragraph 1.\n\nTODO: paragraph 2.',
    sponsors: [],
    tags: ['STRATEGY', 'WORKSHOP'],
    photos: [],
    published: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    ref: 'HX20260130',
    name: 'ActInSpace Hackathon',
    type: 'HX',
    eventDate: new Date('2026-01-30'),
    dateDisplay: 'Jan 30–31, 2026',
    venue: 'TODO: venue name',
    location: 'TODO: city, Switzerland',
    participants: 80, // TODO: confirm actual count
    description: 'TODO: 1–2 sentence tagline.',
    outcomes: 'TODO: key outcomes paragraph.',
    summary: 'TODO: paragraph 1.\n\nTODO: paragraph 2.',
    sponsors: [],
    tags: ['CNES', 'INNOVATION', 'SPACE APPS', 'STARTUPS'],
    photos: [],
    published: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    ref: 'FS20260122',
    name: 'Microgravity Forum',
    type: 'FS',
    eventDate: new Date('2026-01-22'),
    dateDisplay: 'Jan 22–23, 2026',
    venue: 'TechnoPark Luzern',
    location: 'Luzern, Switzerland',
    participants: 167,
    description: 'TODO: 1–2 sentence tagline.',
    outcomes: 'TODO: key outcomes paragraph.',
    summary: 'TODO: paragraph 1.\n\nTODO: paragraph 2.\n\nTODO: paragraph 3.',
    sponsors: [],
    tags: ['MICROGRAVITY', 'RESEARCH', 'SCIENCE'],
    photos: [],
    published: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    ref: 'HX20251004',
    name: 'NASA Space Apps Challenge',
    type: 'HX',
    eventDate: new Date('2025-10-04'),
    dateDisplay: 'Oct 4–6, 2025',
    venue: 'TODO: venue name',
    location: 'Geneva, Switzerland',
    participants: 60,
    description: 'TODO: 1–2 sentence tagline.',
    outcomes: 'TODO: key outcomes paragraph.',
    summary: 'TODO: paragraph 1.\n\nTODO: paragraph 2.\n\nTODO: paragraph 3.',
    sponsors: [],
    tags: ['NASA', 'OPEN DATA', 'SPACE TECH', 'GLOBAL'],
    photos: [],
    published: true,
    createdAt: now,
    updatedAt: now,
  },
]

// ── Insert ────────────────────────────────────────────────────────────────────

const client = new MongoClient(MONGODB_URI)

try {
  await client.connect()
  const db = client.db(DB_NAME)
  const col = db.collection('events')

  // Create index once
  await col.createIndex({ published: 1, eventDate: -1 })

  let inserted = 0, updated = 0
  for (const ev of events) {
    const { createdAt, ...updateFields } = ev
    const result = await col.updateOne(
      { ref: ev.ref },
      { $set: updateFields, $setOnInsert: { createdAt } },
      { upsert: true }
    )
    if (result.upsertedCount) inserted++
    else if (result.modifiedCount) updated++
  }

  console.log(`Done. ${inserted} inserted, ${updated} updated in ${DB_NAME}.`)
  console.log('Next: fill in TODO fields via MongoDB Compass or the SSIP dashboard.')
  console.log('      Upload photos to Cloudinary under ssip/events/{ref}/')
  console.log('      then add the public IDs to the photos array for each event.')
} finally {
  await client.close()
}
