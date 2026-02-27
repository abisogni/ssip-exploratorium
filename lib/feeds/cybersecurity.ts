import Parser from 'rss-parser'
import { FeedPost } from './types'

const parser = new Parser({ timeout: 10000 })

const FEEDS = [
  { url: 'https://krebsonsecurity.com/feed/',        source: 'Krebs on Security' },
  { url: 'https://www.bleepingcomputer.com/feed/',   source: 'Bleeping Computer' },
]

export async function fetchCybersecurityNews(): Promise<FeedPost[]> {
  const results = await Promise.all(
    FEEDS.map(async ({ url, source }) => {
      try {
        const feed = await parser.parseURL(url)
        return (feed.items ?? []).slice(0, 6).map(item => {
          const pubDate = item.pubDate ? new Date(item.pubDate) : new Date()
          const raw = (item.contentSnippet ?? item.summary ?? '').replace(/\n/g, ' ').trim()
          const excerpt = raw.length > 280 ? raw.slice(0, 277) + '…' : raw
          return {
            title: (item.title ?? '').trim(),
            excerpt,
            date: pubDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            source,
            url: item.link ?? '',
          }
        })
      } catch {
        return [] as FeedPost[]
      }
    })
  )
  const merged = results.flat()
  merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return merged.slice(0, 10)
}
