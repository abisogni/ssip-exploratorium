import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

const COLLECTION = 'turing-scores'

export async function GET() {
  try {
    const db = await getDb()
    const docs = await db.collection(COLLECTION).find({}).toArray()
    return NextResponse.json(docs)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const { category, correct } = await req.json() as { category: string; correct: boolean }
    if (!category) return NextResponse.json({ error: 'missing category' }, { status: 400 })

    const db = await getDb()
    await db.collection(COLLECTION).updateOne(
      { category },
      { $inc: { correct: correct ? 1 : 0, total: 1 } },
      { upsert: true },
    )
    const doc = await db.collection(COLLECTION).findOne({ category })
    return NextResponse.json(doc)
  } catch {
    return NextResponse.json({ error: 'db error' }, { status: 500 })
  }
}
