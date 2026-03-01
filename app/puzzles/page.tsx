'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// PUZZLES shifted 713 places (713 mod 26 = 11) → AFKKWPD
const CIPHER_TITLE = 'AFKKWPD'

type Phase = 'hold' | 'dissolve' | 'done'
type Theme = 'CRYPTO' | 'AI' | 'SPACE'

// ── Per-letter dissolve values (stable — not computed at render time) ─────────
// Each letter drifts independently: upward + slight lateral spread, staggered
const LETTER_DISSOLVE: { delayMs: number; dx: number; dy: number; rotate: number }[] = [
  { delayMs:  60, dx:  -9, dy: -18, rotate: -1.4 }, // A
  { delayMs: 180, dx:  -4, dy: -22, rotate:  0.9 }, // F
  { delayMs:  20, dx:   1, dy: -15, rotate: -0.6 }, // K
  { delayMs: 250, dx:   6, dy: -20, rotate:  1.3 }, // K
  { delayMs: 110, dx:  -6, dy: -25, rotate: -1.0 }, // W
  { delayMs: 200, dx:   8, dy: -17, rotate:  1.7 }, // P
  { delayMs:  40, dx:  12, dy: -13, rotate: -1.1 }, // D
]

// ── Puzzle registry ───────────────────────────────────────────────────────────

const PUZZLES_DATA: { id: string; title: string; theme: Theme; desc: string; route?: string }[] = [
  {
    id: 'cipher-room',
    title: 'The Cipher Room',
    theme: 'CRYPTO',
    desc: 'Crack intercepted SSIP transmissions across three cipher levels.',
  },
  {
    id: 'frequency-fingerprint',
    title: 'Frequency Fingerprint',
    theme: 'CRYPTO',
    desc: 'Break a substitution cipher by analyzing letter frequency distributions.',
  },
  {
    id: 'signal-deep-space',
    title: 'Signal from Deep Space',
    theme: 'CRYPTO',
    desc: 'Reconstruct a binary transmission from deep space into a hidden image.',
    route: '/puzzles/signal-deep-space',
  },
  {
    id: 'turing-or-not',
    title: 'Turing or Not Turing',
    theme: 'AI',
    desc: 'Read two conversation transcripts — determine which participant is an AI.',
  },
  {
    id: 'neural-paint',
    title: 'Neural Paint',
    theme: 'AI',
    desc: 'Draw a shape on a canvas; watch a neural network classify it in real time.',
  },
  {
    id: 'adversarial-patch',
    title: 'Adversarial Patch',
    theme: 'AI',
    desc: 'See how imperceptible pixel changes fool image classifiers.',
  },
  {
    id: 'exoplanet-detective',
    title: 'Exoplanet Detective',
    theme: 'SPACE',
    desc: 'Analyze a stellar light curve to identify a transiting exoplanet.',
  },
  {
    id: 'orbital-heist',
    title: 'Orbital Heist',
    theme: 'SPACE',
    desc: 'Thread a spacecraft through gravity wells to reach the target zone.',
  },
  {
    id: 'dead-reckoning',
    title: 'Dead Reckoning',
    theme: 'SPACE',
    desc: 'Plan Mars rover commands 20 minutes before they reach the surface.',
    route: '/puzzles/dead-reckoning',
  },
]

// ── Theme styling ─────────────────────────────────────────────────────────────

const THEME_ACCENT: Record<Theme, string> = {
  CRYPTO: 'rgba(210,158,32,0.92)',
  AI:     'rgba(0,198,212,0.92)',
  SPACE:  'rgba(128,92,232,0.92)',
}

const THEME_GLOW: Record<Theme, string> = {
  CRYPTO: 'rgba(200,148,20,0.14)',
  AI:     'rgba(0,190,210,0.14)',
  SPACE:  'rgba(110,82,220,0.14)',
}

const THEME_BORDER: Record<Theme, string> = {
  CRYPTO: 'rgba(200,148,20,0.22)',
  AI:     'rgba(0,190,210,0.22)',
  SPACE:  'rgba(110,82,220,0.22)',
}

// ── Backgrounds ───────────────────────────────────────────────────────────────

const INTRO_BG = '#04060f'

const PUZZLES_BG =
  'radial-gradient(ellipse 60% 50% at 88% 14%, rgba(0,160,180,0.14) 0%, transparent 55%),' +
  'radial-gradient(ellipse 55% 60% at 10% 52%, rgba(20,60,200,0.13) 0%, transparent 58%),' +
  'radial-gradient(ellipse 65% 45% at 50% 95%, rgba(80,10,140,0.17) 0%, transparent 55%),' +
  'radial-gradient(ellipse 48% 52% at 6%  90%, rgba(0,120,100,0.11) 0%, transparent 50%),' +
  'radial-gradient(ellipse 52% 44% at 94% 82%, rgba(10,40,160,0.13) 0%, transparent 52%),' +
  'radial-gradient(ellipse 70% 36% at 50% 10%, rgba(0,30,80,0.20)  0%, transparent 55%),' +
  '#04060f'

const GRAIN_URI =
  "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"

// ── Component ─────────────────────────────────────────────────────────────────

export default function Puzzles() {
  const [phase, setPhase]         = useState<Phase>('hold')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const scrollRef   = useRef<HTMLDivElement>(null)
  const section2Ref = useRef<HTMLDivElement>(null)

  // Animation sequence
  useEffect(() => {
    let active = true
    const timers: ReturnType<typeof setTimeout>[] = []

    // Hold for 1.4s, then dissolve
    const t1 = setTimeout(() => {
      if (!active) return
      setPhase('dissolve')

      // Dissolve takes ~1.6s (max letter delay 250ms + transition 1350ms)
      const t2 = setTimeout(() => {
        if (!active) return
        setPhase('done')
      }, 1600)
      timers.push(t2)
    }, 1400)
    timers.push(t1)

    return () => {
      active = false
      timers.forEach(clearTimeout)
    }
  }, [])

  // Scroll to section 2 once done
  useEffect(() => {
    if (phase !== 'done') return
    const t = setTimeout(() => {
      const top = section2Ref.current?.offsetTop ?? window.innerHeight
      scrollRef.current?.scrollTo({ top, behavior: 'smooth' })
    }, 280)
    return () => clearTimeout(t)
  }, [phase])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="relative w-screen h-screen overflow-hidden" style={{ background: INTRO_BG }}>
      <div
        ref={scrollRef}
        className="hide-scrollbar"
        style={{ position: 'absolute', inset: 0, overflowY: 'scroll' }}
      >

        {/* ── Section 1: Intro ── */}
        <div
          style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: INTRO_BG,
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-geist-mono, monospace)',
              fontSize: '0.75rem',
              letterSpacing: '0.38em',
              textTransform: 'uppercase',
              color: 'rgba(0,190,210,0.38)',
              marginBottom: '1.6rem',
            }}
          >
            SSIP &mdash; Exploratorium
          </p>

          {/* Per-letter dissolve title */}
          <h1
            style={{
              fontFamily: 'var(--font-geist-mono, monospace)',
              fontSize: 'clamp(3rem, 10vw, 6.5rem)',
              fontWeight: 700,
              letterSpacing: '0.14em',
              userSelect: 'none',
              display: 'flex',
              margin: 0,
            }}
          >
            {CIPHER_TITLE.split('').map((letter, i) => {
              const d = LETTER_DISSOLVE[i]
              const dissolving = phase === 'dissolve' || phase === 'done'
              return (
                <span
                  key={i}
                  style={{
                    display: 'inline-block',
                    color: 'rgba(255,255,255,0.92)',
                    opacity:    dissolving ? 0 : 1,
                    filter:     dissolving ? 'blur(18px)' : 'blur(0px)',
                    transform:  dissolving
                      ? `translateX(${d.dx}px) translateY(${d.dy}px) rotate(${d.rotate}deg) scale(1.25)`
                      : 'translateX(0) translateY(0) rotate(0deg) scale(1)',
                    transition: dissolving
                      ? [
                          `opacity 1.35s ${d.delayMs}ms ease-in`,
                          `filter 1.2s ${d.delayMs}ms ease-in`,
                          `transform 1.5s ${d.delayMs}ms ease-out`,
                        ].join(', ')
                      : 'none',
                  }}
                >
                  {letter}
                </span>
              )
            })}
          </h1>
        </div>

        {/* ── Section 2: Puzzle cards ── */}
        <div
          ref={section2Ref}
          style={{
            position: 'relative',
            minHeight: '100vh',
            background: PUZZLES_BG,
            paddingBottom: '8vh',
          }}
        >
          {/* Grain overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url("${GRAIN_URI}")`,
              backgroundSize: '200px 200px',
              opacity: 0.11,
              mixBlendMode: 'overlay',
            }}
          />
          {/* Edge vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 90% 85% at 50% 50%, transparent 40%, rgba(2,3,10,0.9) 100%)',
            }}
          />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 2 }}>

            {/* Back link */}
            <Link
              href="/"
              style={{
                position: 'absolute',
                top: '2rem',
                right: '2rem',
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: '0.95rem',
                letterSpacing: '0.08em',
                color: 'rgba(0,190,210,0.6)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                zIndex: 10,
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(0,210,230,1)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,190,210,0.6)')}
            >
              <span style={{ fontSize: '1.2rem' }}>←</span>
              <span>back to Exploratorium space</span>
            </Link>

            {/* Page header */}
            <div style={{ textAlign: 'center', paddingTop: '6vh', paddingBottom: '5vh' }}>
              <p
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '0.72rem',
                  letterSpacing: '0.32em',
                  textTransform: 'uppercase',
                  color: 'rgba(0,190,210,0.32)',
                  marginBottom: '0.6rem',
                }}
              >
                SSIP Exploratorium
              </p>
              <h1
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
                  fontWeight: 'bold',
                  fontStyle: 'italic',
                  color: 'rgba(200,230,255,0.82)',
                  lineHeight: 1,
                  marginBottom: '0.85rem',
                  letterSpacing: '0.04em',
                }}
              >
                puzzles
              </h1>
              <p
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '0.95rem',
                  fontStyle: 'italic',
                  color: 'rgba(150,200,230,0.42)',
                  letterSpacing: '0.06em',
                  marginBottom: '2.5vh',
                }}
              >
                a collection of interactive challenges
              </p>
              <div
                style={{
                  width: '120px',
                  height: '1px',
                  background: 'rgba(0,190,210,0.18)',
                  margin: '0 auto',
                }}
              />
            </div>

            {/* Cards grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1.5rem',
                maxWidth: '980px',
                margin: '0 auto',
                padding: '0 2rem',
              }}
            >
              {PUZZLES_DATA.map(p => {
                const hovered = hoveredId === p.id
                const cardStyle: React.CSSProperties = {
                  background: hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${hovered ? THEME_BORDER[p.theme] : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '6px',
                  padding: '1.5rem 1.4rem',
                  cursor: p.route ? 'pointer' : 'default',
                  transition: 'background 0.25s, border-color 0.25s, box-shadow 0.25s, transform 0.25s',
                  transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
                  boxShadow: hovered
                    ? `0 8px 32px ${THEME_GLOW[p.theme]}, 0 0 0 1px ${THEME_BORDER[p.theme]}`
                    : 'none',
                  textDecoration: 'none',
                  display: 'block',
                }
                const inner = (
                  <>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-geist-mono, monospace)',
                          fontSize: '0.7rem',
                          letterSpacing: '0.18em',
                          color: THEME_ACCENT[p.theme],
                          opacity: hovered ? 1 : 0.7,
                          transition: 'opacity 0.25s',
                        }}
                      >
                        {p.theme}
                      </span>
                    </div>

                    <h2
                      style={{
                        fontFamily: 'var(--font-geist-mono, monospace)',
                        fontSize: '1.02rem',
                        fontWeight: 600,
                        color: hovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.72)',
                        marginBottom: '0.65rem',
                        lineHeight: 1.35,
                        transition: 'color 0.25s',
                        letterSpacing: '0.01em',
                      }}
                    >
                      {p.title}
                    </h2>

                    <p
                      style={{
                        fontFamily: "'Times New Roman', Times, serif",
                        fontSize: '0.92rem',
                        fontStyle: 'italic',
                        color: 'rgba(180,210,230,0.5)',
                        lineHeight: 1.6,
                        marginBottom: '1.1rem',
                      }}
                    >
                      {p.desc}
                    </p>

                    <div
                      style={{
                        fontFamily: 'var(--font-geist-mono, monospace)',
                        fontSize: '0.65rem',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: p.route ? THEME_ACCENT[p.theme] : 'rgba(255,255,255,0.2)',
                        opacity: p.route ? 0.65 : 1,
                        paddingTop: '0.75rem',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {p.route ? 'play' : 'planned'}
                    </div>
                  </>
                )

                return p.route ? (
                  <Link
                    key={p.id}
                    href={p.route}
                    onMouseEnter={() => setHoveredId(p.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={cardStyle}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div
                    key={p.id}
                    onMouseEnter={() => setHoveredId(p.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={cardStyle}
                  >
                    {inner}
                  </div>
                )
              })}
            </div>

          </div>
        </div>

      </div>
    </main>
  )
}
