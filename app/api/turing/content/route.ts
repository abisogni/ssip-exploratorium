import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const revalidate = 3600

interface Entry {
  source: string
  title: string
  content: string | string[]
}

interface CategoryPool {
  category: string
  human: Entry[]
  ai: Entry[]
}

export async function GET() {
  try {
    const dir = path.join(process.cwd(), 'turing')
    const files = fs.readdirSync(dir).filter(f =>
      f.endsWith('.json') && f !== 'turing_template.json'
    )

    const pools: Record<string, CategoryPool> = {}

    for (const file of files) {
      // Expected format: {category}_{type}.json  (type = 'human' or 'ai')
      const base = file.slice(0, -5) // strip .json
      const sep  = base.lastIndexOf('_')
      if (sep === -1) continue

      const category = base.slice(0, sep)
      const type     = base.slice(sep + 1)
      if (type !== 'human' && type !== 'ai') continue

      try {
        const raw: Entry[] = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
        if (!Array.isArray(raw)) continue

        if (!pools[category]) pools[category] = { category, human: [], ai: [] }
        pools[category][type].push(...raw)
      } catch { /* skip malformed files */ }
    }

    // Only expose categories that have at least 1 human and 2 AI entries
    const result = Object.values(pools).filter(
      p => p.human.length >= 1 && p.ai.length >= 2
    )
    return NextResponse.json(result)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
