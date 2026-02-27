import { FeedPost } from './types'

const INSTITUTIONS = [
  { id: 'I35440088',  name: 'ETH Zürich' },
  { id: 'I5124864',   name: 'EPFL' },
  { id: 'I202697423', name: 'University of Zurich' },
  { id: 'I118564535', name: 'University of Bern' },
  { id: 'I81007117',  name: 'HSLU' },
]

const HEADERS = {
  'User-Agent': 'SSIP-Exploratorium/1.0 (contact@ssip-pl.ch)',
}

function reconstructAbstract(invertedIndex: Record<string, number[]> | null | undefined): string {
  if (!invertedIndex) return ''
  const positions: [number, string][] = []
  for (const [word, pos] of Object.entries(invertedIndex)) {
    for (const p of pos) {
      positions.push([p, word])
    }
  }
  positions.sort((a, b) => a[0] - b[0])
  const text = positions.map(([, w]) => w).join(' ')
  return text.length > 280 ? text.slice(0, 277) + '…' : text
}

export async function fetchOpenAlexSwiss(): Promise<FeedPost[]> {
  const results = await Promise.all(
    INSTITUTIONS.map(async inst => {
      try {
        const url =
          `https://api.openalex.org/works?filter=authorships.institutions.id:${inst.id}` +
          `&search=space+science+microgravity&sort=publication_date:desc&per_page=3` +
          `&select=id,title,doi,publication_date,primary_location,abstract_inverted_index`
        const res = await fetch(url, {
          headers: HEADERS,
          next: { revalidate: 21600 },
        })
        if (!res.ok) return [] as FeedPost[]
        const data = await res.json()
        return ((data.results ?? []) as Array<{
          id: string
          title: string
          doi: string | null
          publication_date: string
          primary_location: { landing_page_url: string | null } | null
          abstract_inverted_index: Record<string, number[]> | null
        }>).map(work => {
          const url = work.doi ?? work.primary_location?.landing_page_url ?? work.id
          return {
            title: work.title ?? '',
            excerpt: reconstructAbstract(work.abstract_inverted_index),
            date: work.publication_date
              ? new Date(work.publication_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : '',
            source: inst.name,
            url,
          }
        })
      } catch {
        return [] as FeedPost[]
      }
    })
  )

  const merged = results.flat()
  const seen = new Set<string>()
  const deduped: FeedPost[] = []
  for (const post of merged) {
    const key = post.title.toLowerCase().trim()
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(post)
    }
  }
  deduped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return deduped
}
