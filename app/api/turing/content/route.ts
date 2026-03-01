import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const revalidate = 3600

export async function GET() {
  try {
    const dir = path.join(process.cwd(), 'turing')
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
    const data = files.map(file => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8')
      return JSON.parse(raw)
    })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
