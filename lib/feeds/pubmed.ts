import { FeedPost } from './types'

const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

export async function fetchPubMed(query: string): Promise<FeedPost[]> {
  try {
    const searchRes = await fetch(
      `${BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=10&sort=date&retmode=json`,
      { next: { revalidate: 21600 } }
    )
    if (!searchRes.ok) return []
    const searchData = await searchRes.json()
    const ids: string[] = searchData.esearchresult?.idlist ?? []
    if (ids.length === 0) return []

    const summaryRes = await fetch(
      `${BASE}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`,
      { next: { revalidate: 21600 } }
    )
    if (!summaryRes.ok) return []
    const summaryData = await summaryRes.json()
    const uids: string[] = summaryData.result?.uids ?? []

    return uids.map((uid: string) => {
      const article = summaryData.result[uid]
      const doi = (article.articleids ?? []).find((a: { idtype: string; value: string }) => a.idtype === 'doi')?.value
      const url = doi ? `https://doi.org/${doi}` : `https://pubmed.ncbi.nlm.nih.gov/${uid}/`
      const pubDate = article.pubdate ? new Date(article.pubdate) : new Date()
      return {
        title: article.title ?? '',
        excerpt: '',
        date: pubDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        source: article.fulljournalname ?? 'PubMed',
        url,
      }
    })
  } catch {
    return []
  }
}
