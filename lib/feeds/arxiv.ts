import Parser from 'rss-parser'
import { FeedPost } from './types'

const parser = new Parser({ timeout: 10000 })

export async function fetchArxiv(categories: string[]): Promise<FeedPost[]> {
  try {
    const catQuery = categories.map(c => `cat:${c}`).join('+OR+')
    const url = `https://export.arxiv.org/api/query?search_query=${catQuery}&sortBy=submittedDate&sortOrder=descending&max_results=10`
    const feed = await parser.parseURL(url)
    return (feed.items ?? []).map(item => {
      const title = (item.title ?? '').replace(/\n/g, ' ').trim()
      const summary = (item.summary ?? item.contentSnippet ?? '').replace(/\n/g, ' ').trim()
      const excerpt = summary.length > 280 ? summary.slice(0, 277) + '…' : summary
      const pubDate = item.pubDate ? new Date(item.pubDate) : new Date()
      return {
        title,
        excerpt,
        date: pubDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        source: 'arXiv',
        url: item.link ?? '',
      }
    })
  } catch {
    return []
  }
}
