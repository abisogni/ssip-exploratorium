import { FeedPost } from './types'

const BASE = 'https://api.spaceflightnewsapi.net/v4/articles/'
const CACHE = { next: { revalidate: 21600 } }

function toPost(a: { title: string; summary: string; published_at: string; news_site: string; url: string }): FeedPost {
  return {
    title: a.title,
    excerpt: a.summary ?? '',
    date: new Date(a.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    source: a.news_site,
    url: a.url,
  }
}

export async function fetchSpaceflightLatest(): Promise<FeedPost[]> {
  try {
    const res = await fetch(`${BASE}?limit=10&ordering=-published_at`, CACHE)
    if (!res.ok) return []
    const data = await res.json()
    return (data.results ?? []).map(toPost)
  } catch {
    return []
  }
}

export async function fetchSpaceflightSearch(query: string): Promise<FeedPost[]> {
  try {
    const res = await fetch(`${BASE}?limit=10&ordering=-published_at&search=${encodeURIComponent(query)}`, CACHE)
    if (!res.ok) return []
    const data = await res.json()
    return (data.results ?? []).map(toPost)
  } catch {
    return []
  }
}

export async function fetchSpaceflightMultiSearch(terms: string[]): Promise<FeedPost[]> {
  try {
    const results = await Promise.all(
      terms.map(term =>
        fetch(`${BASE}?limit=4&ordering=-published_at&search=${encodeURIComponent(term)}`, CACHE)
          .then(r => r.ok ? r.json() : { results: [] })
          .then(d => (d.results ?? []).map(toPost))
          .catch(() => [] as FeedPost[])
      )
    )
    const merged = results.flat()
    // Deduplicate by title
    const seen = new Set<string>()
    const deduped: FeedPost[] = []
    for (const post of merged) {
      const key = post.title.toLowerCase().trim()
      if (!seen.has(key)) { seen.add(key); deduped.push(post) }
    }
    deduped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return deduped.slice(0, 10)
  } catch {
    return []
  }
}

export async function fetchSpaceflightByAgency(newsSites: string[]): Promise<FeedPost[]> {
  try {
    const results = await Promise.all(
      newsSites.map(site =>
        fetch(`${BASE}?limit=3&ordering=-published_at&news_site=${encodeURIComponent(site)}`, CACHE)
          .then(r => r.ok ? r.json() : { results: [] })
          .then(d => (d.results ?? []).map(toPost))
          .catch(() => [] as FeedPost[])
      )
    )
    const merged = results.flat()
    merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return merged.slice(0, 10)
  } catch {
    return []
  }
}
