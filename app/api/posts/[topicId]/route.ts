import { NextResponse } from 'next/server'
import { fetchSpaceflightLatest, fetchSpaceflightMultiSearch, fetchSpaceflightByAgency } from '@/lib/feeds/spaceflight'
import { fetchArxiv } from '@/lib/feeds/arxiv'
import { fetchPubMed } from '@/lib/feeds/pubmed'
import { fetchOpenAlexSwiss } from '@/lib/feeds/openAlex'
import { fetchCybersecurityNews } from '@/lib/feeds/cybersecurity'
import { FeedPost } from '@/lib/feeds/types'

export const revalidate = 21600

const SSIP_POSTS: FeedPost[] = [
  {
    title: "The Exploratorium Is Live — SSIP's New Experimental Web Space",
    excerpt: 'The Swiss Space Innovation Platform has launched the Exploratorium, an open platform for experimental tools, interactive data visualisations, and team-driven projects. Access is open to SSIP members and the broader community.',
    date: 'Feb 27, 2026',
    source: 'SSIP',
    url: 'https://exploratorium.ssip-pl.ch',
  },
  {
    title: 'SSIP Annual Conference 2026 — Call for Submissions Now Open',
    excerpt: 'The 2026 SSIP Annual Conference will take place in Lucerne this autumn. Submissions for paper presentations, posters, and half-day workshops are accepted through 15 April via the conference portal.',
    date: 'Feb 20, 2026',
    source: 'SSIP',
    url: 'https://ssip-pl.ch',
  },
  {
    title: 'SSIP Formalises Partnership with CERN IdeaSquare',
    excerpt: "A collaboration agreement between SSIP and CERN's IdeaSquare innovation hub enables joint workshops, student co-working access in Geneva, and shared mentorship resources for Swiss space entrepreneurship projects.",
    date: 'Feb 14, 2026',
    source: 'SSIP',
    url: 'https://ssip-pl.ch',
  },
]

function sortByDate(posts: FeedPost[]): FeedPost[] {
  return posts.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const { topicId } = await params

  let posts: FeedPost[] = []

  switch (topicId) {
    case 'space-news':
      posts = await fetchSpaceflightLatest()
      break
    case 'space-station':
      posts = await fetchSpaceflightMultiSearch(['ISS', 'space station', 'Starlab', 'Axiom'])
      break
    case 'space-agencies':
      posts = await fetchSpaceflightByAgency(['NASA', 'ESA', 'JAXA', 'ISRO'])
      break
    case 'ai-ml':
      posts = await fetchArxiv(['cs.AI', 'cs.LG', 'stat.ML'])
      break
    case 'materials':
      posts = await fetchArxiv(['cond-mat.mtrl-sci'])
      break
    case 'life-sciences':
      posts = await fetchPubMed('microgravity OR "space medicine"')
      break
    case 'pharmaceuticals':
      posts = await fetchPubMed('pharmaceutical AND (space OR microgravity)')
      break
    case 'cybersecurity':
      posts = await fetchCybersecurityNews()
      break
    case 'swiss-uni':
      posts = await fetchOpenAlexSwiss()
      break
    case 'ssip':
      posts = SSIP_POSTS
      break
    default:
      posts = []
  }

  return NextResponse.json(sortByDate(posts))
}
