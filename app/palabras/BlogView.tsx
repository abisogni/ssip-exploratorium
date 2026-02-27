'use client'

import { useEffect, useState } from 'react'
import { Topic } from './page'
import { FeedPost } from '@/lib/feeds/types'

interface Props {
  topic: Topic
  onBack: () => void
}

export default function BlogView({ topic, onBack }: Props) {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    setPosts([])
    fetch(`/api/posts/${topic.id}`)
      .then(r => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json()
      })
      .then((data: FeedPost[]) => {
        setPosts(data)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [topic.id])

  return (
    <div
      className="w-full h-full overflow-y-auto"
      style={{ background: '#0a0705' }}
    >
      {/* Grain */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          opacity: 0.1,
          mixBlendMode: 'overlay',
          zIndex: 1,
        }}
      />
      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 88% 82% at 50% 50%, transparent 30%, rgba(2,1,0,0.88) 100%)',
          zIndex: 1,
        }}
      />

      <div className="relative max-w-2xl mx-auto px-8 py-12" style={{ zIndex: 2 }}>

        {/* Back link */}
        <button
          onClick={onBack}
          className="mb-10 transition-opacity hover:opacity-50"
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: '14px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(200,155,50,0.55)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ← back to the cards
        </button>

        {/* Header */}
        <div className="mb-10">
          <p style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: '13px',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'rgba(200,155,50,0.35)',
            marginBottom: '0.5rem',
          }}>
            palabras &mdash; the exploratorium
          </p>
          <h1 style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 'clamp(32px, 5vw, 51px)',
            fontWeight: 'bold',
            color: 'rgba(220,185,100,0.92)',
            lineHeight: 1.1,
            marginBottom: '1rem',
          }}>
            {topic.label}
          </h1>
          <div style={{ height: '1px', background: 'rgba(180,130,40,0.2)' }}/>
        </div>

        {/* Loading */}
        {loading && (
          <p style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: '14px',
            fontStyle: 'italic',
            color: 'rgba(220,180,90,0.6)',
            textAlign: 'center',
          }}>
            gathering transmissions...
          </p>
        )}

        {/* Error */}
        {error && (
          <p style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: '14px',
            fontStyle: 'italic',
            color: 'rgba(200,100,60,0.7)',
            textAlign: 'center',
          }}>
            the signal was lost
          </p>
        )}

        {/* Post list */}
        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {posts.map((post, i) => (
              <article
                key={i}
                style={{
                  borderLeft: '2px solid rgba(180,130,40,0.22)',
                  paddingLeft: '1.5rem',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.5rem',
                }}>
                  <span style={{
                    fontFamily: "'Times New Roman', Times, serif",
                    fontSize: '12px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'rgba(220,180,90,0.9)',
                  }}>
                    {post.source}
                  </span>
                  <span style={{ color: 'rgba(220,180,90,0.5)', fontSize: '12px' }}>·</span>
                  <span style={{
                    fontFamily: "'Times New Roman', Times, serif",
                    fontSize: '12px',
                    color: 'rgba(220,180,90,0.75)',
                  }}>
                    {post.date}
                  </span>
                </div>
                <h2 style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: 'rgba(230,195,115,0.9)',
                  lineHeight: 1.35,
                  marginBottom: '0.6rem',
                }}>
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    {post.title}
                  </a>
                </h2>
                {post.excerpt && (
                  <p style={{
                    fontFamily: "'Times New Roman', Times, serif",
                    fontSize: '17px',
                    lineHeight: 1.75,
                    color: 'rgba(200,170,100,0.6)',
                  }}>
                    {post.excerpt}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
