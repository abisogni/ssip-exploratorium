'use client'

import { useEffect, useState } from 'react'
import { REVEALS } from './data'

const MONO  = 'var(--font-geist-mono, monospace)'
const SERIF = '"Georgia", "Times New Roman", serif'

interface Props {
  level: number
  onContinue: () => void
}

export default function RevealPanel({ level, onContinue }: Props) {
  const reveal = REVEALS[level]
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  if (!reveal) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        background: visible ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0)',
        transition: 'background 0.5s ease',
        pointerEvents: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onContinue() }}
    >
      <div
        style={{
          width: 'min(560px, 100vw)',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: '#0f0d09',
          borderLeft: '1px solid rgba(200,148,20,0.22)',
          borderTop: '1px solid rgba(200,148,20,0.12)',
          padding: '2.5rem 2.2rem 2.8rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.4rem',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.55s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* Header badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#4a9e6a',
              boxShadow: '0 0 8px rgba(74,158,106,0.8)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: MONO,
              fontSize: '0.68rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#4a9e6a',
            }}
          >
            Decipherment Complete
          </span>
        </div>

        {/* Title */}
        <div>
          <h2
            style={{
              fontFamily: MONO,
              fontSize: 'clamp(1.1rem, 2.5vw, 1.45rem)',
              fontWeight: 700,
              color: '#e8dcc8',
              margin: '0 0 0.3rem',
              lineHeight: 1.2,
            }}
          >
            {reveal.title}
          </h2>
          <p
            style={{
              fontFamily: MONO,
              fontSize: '0.75rem',
              color: 'rgba(200,170,120,0.5)',
              margin: 0,
              letterSpacing: '0.06em',
            }}
          >
            {reveal.location}
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(200,148,20,0.14)' }} />

        {/* Body paragraphs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reveal.body.map((para, i) => (
            <p
              key={i}
              style={{
                fontFamily: SERIF,
                fontSize: '0.92rem',
                lineHeight: 1.85,
                color: 'rgba(232,220,200,0.78)',
                margin: 0,
              }}
            >
              {para}
            </p>
          ))}
        </div>

        {/* Impact badge */}
        <div
          style={{
            background: 'rgba(74,158,106,0.08)',
            border: '1px solid rgba(74,158,106,0.22)',
            borderRadius: '4px',
            padding: '0.75rem 1rem',
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: '0.65rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(74,158,106,0.7)',
              display: 'block',
              marginBottom: '0.35rem',
            }}
          >
            Impact
          </span>
          <p
            style={{
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontSize: '0.9rem',
              color: 'rgba(232,220,200,0.65)',
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            {reveal.impact}
          </p>
        </div>

        {/* Continue button */}
        <button
          onClick={onContinue}
          style={{
            alignSelf: 'flex-end',
            background: 'transparent',
            border: '1px solid rgba(200,148,20,0.45)',
            borderRadius: '3px',
            padding: '0.6rem 1.4rem',
            fontFamily: MONO,
            fontSize: '0.72rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(200,148,20,0.85)',
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(200,148,20,0.12)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(200,148,20,1)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(200,148,20,0.85)'
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
