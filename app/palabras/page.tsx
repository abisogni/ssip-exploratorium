'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { DesktopGrid, MobileView } from './TarotTable'
import BlogView from './BlogView'

const WORDS = ['parabolé', 'parabola', 'parable', 'palabras']
const SCRAMBLE_POOL = 'abcdefghijklmnopqrstuvwxyzàáâãäçèéêëìíïñòóôùúûüý'

export type Topic = { id: string; label: string }

export const TOPICS: Topic[] = [
  { id: 'space-news',      label: 'Space News' },
  { id: 'life-sciences',   label: 'Life Sciences' },
  { id: 'ai-ml',           label: 'AI & ML News' },
  { id: 'space-agencies',  label: 'Space Agencies' },
  { id: 'cybersecurity',   label: 'Cybersecurity News' },
  { id: 'materials',       label: 'Materials Science' },
  { id: 'space-station',   label: 'Space Station News' },
  { id: 'swiss-uni',       label: 'Local Discoveries' },
  { id: 'ssip',            label: 'SSIP News' },
  { id: 'pharmaceuticals', label: 'Pharmaceutical Science' },
]

// ── Medieval fortune-teller background ───────────────────────────────────────
// Dark base (#09060c) with rich jewel-tone glow pools:
//   top-right  → deep crimson  (like red velvet draping)
//   left-mid   → dark emerald  (like shadowed foliage)
//   bottom-ctr → warm amber    (like candlelight rising)
//   btm-left   → deep violet   (like draped shadow)
//   btm-right  → dark wine     (like aged leather)
//   top-ctr    → cold teal     (like candlesmoke)
const MEDIEVAL_BG =
  'radial-gradient(ellipse 65% 55% at 86% 18%, rgba(122,16,30,0.22) 0%, transparent 58%),' +
  'radial-gradient(ellipse 55% 65% at 16% 54%, rgba(8,58,30,0.18) 0%, transparent 60%),' +
  'radial-gradient(ellipse 62% 52% at 50% 92%, rgba(98,56,6,0.26) 0%, transparent 58%),' +
  'radial-gradient(ellipse 50% 58% at 8%  88%, rgba(58,6,80,0.20) 0%, transparent 54%),' +
  'radial-gradient(ellipse 46% 42% at 92% 82%, rgba(82,8,24,0.18) 0%, transparent 50%),' +
  'radial-gradient(ellipse 70% 38% at 50% 12%, rgba(10,40,55,0.16) 0%, transparent 55%),' +
  '#09060c'

const GRAIN_URI =
  "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"

// ── Component ─────────────────────────────────────────────────────────────────

export default function Palabras() {
  const [display, setDisplay]   = useState(WORDS[0])
  const [animDone, setAnimDone] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Blog overlay state
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [blogMounted, setBlogMounted]     = useState(false)
  const [blogVisible, setBlogVisible]     = useState(false)

  // Mobile card view state
  const [mobileCardsVisible, setMobileCardsVisible] = useState(false)

  // Desktop scroll refs
  const scrollRef   = useRef<HTMLDivElement>(null)
  const section2Ref = useRef<HTMLDivElement>(null)
  const animRef     = useRef(true)

  // Detect mobile
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  // Intro scramble animation
  useEffect(() => {
    let holdTimer: ReturnType<typeof setTimeout>
    let scrambleInterval: ReturnType<typeof setInterval>
    let wordIdx = 0

    function scrambleTo(target: string, onDone: () => void) {
      let step = 0
      const STEPS = 16
      scrambleInterval = setInterval(() => {
        step++
        if (step >= STEPS) {
          clearInterval(scrambleInterval)
          setDisplay(target)
          onDone()
          return
        }
        const reveal = Math.floor((step / STEPS) * target.length)
        let result = target.slice(0, reveal)
        for (let i = reveal; i < target.length; i++) {
          result += SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)]
        }
        setDisplay(result)
      }, 45)
    }

    function advance() {
      if (wordIdx >= WORDS.length - 1) {
        // "palabras" has settled — mark animation done after 1.2 s hold
        holdTimer = setTimeout(() => {
          if (animRef.current) setAnimDone(true)
        }, 1200)
        return
      }
      holdTimer = setTimeout(() => {
        scrambleTo(WORDS[wordIdx + 1], () => {
          wordIdx++
          advance()
        })
      }, 1700)
    }

    advance()

    return () => {
      animRef.current = false
      clearTimeout(holdTimer)
      clearInterval(scrambleInterval)
    }
  }, [])

  // After animation: scroll (desktop) or reveal cards (mobile)
  useEffect(() => {
    if (!animDone) return

    if (isMobile) {
      const t = setTimeout(() => setMobileCardsVisible(true), 200)
      return () => clearTimeout(t)
    }

    // Desktop: scroll smoothly to section 2
    const t = setTimeout(() => {
      const top = section2Ref.current?.offsetTop ?? window.innerHeight
      scrollRef.current?.scrollTo({ top, behavior: 'smooth' })
    }, 300)
    return () => clearTimeout(t)
  }, [animDone, isMobile])

  // Blog handlers
  function handleSelectTopic(topic: Topic) {
    setSelectedTopic(topic)
    setBlogMounted(true)
    setTimeout(() => setBlogVisible(true), 50)
  }

  function handleBack() {
    setBlogVisible(false)
    setTimeout(() => {
      setBlogMounted(false)
      setSelectedTopic(null)
    }, 500)
  }

  // ── Mobile layout ───────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <main className="relative w-screen h-screen overflow-hidden bg-black">
        {/* Intro */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            opacity: mobileCardsVisible ? 0 : 1,
            transition: 'opacity 0.8s',
            pointerEvents: mobileCardsVisible ? 'none' : 'auto',
            background: '#09060c',
          }}
        >
          <p className="text-xs tracking-[0.4em] uppercase mb-5" style={{ color: 'rgba(100,160,255,0.45)' }}>
            SSIP &mdash; Exploratorium
          </p>
          <h1 className="font-mono font-bold text-white" style={{ fontSize: 'clamp(2.8rem, 8vw, 5rem)' }}>
            {display}
          </h1>
        </div>

        {/* Cards */}
        {mobileCardsVisible && (
          <div
            className="absolute inset-0"
            style={{ opacity: mobileCardsVisible ? 1 : 0, transition: 'opacity 0.8s' }}
          >
            {/* Back link - mobile */}
            <Link
              href="/"
              style={{
                position: 'fixed',
                top: '1.5rem',
                right: '1.5rem',
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: '0.7rem',
                letterSpacing: '0.08em',
                color: 'rgba(218,180,80,0.8)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                zIndex: 20,
              }}
            >
              <span style={{ fontSize: '1rem' }}>←</span>
              <span>back</span>
            </Link>
            <MobileView topics={TOPICS} onSelectTopic={handleSelectTopic} />
          </div>
        )}

        {/* Blog overlay */}
        {blogMounted && selectedTopic && (
          <div
            className="absolute inset-0"
            style={{ zIndex: 50, opacity: blogVisible ? 1 : 0, transition: 'opacity 0.5s', pointerEvents: blogVisible ? 'auto' : 'none' }}
          >
            <BlogView topic={selectedTopic} onBack={handleBack} />
          </div>
        )}
      </main>
    )
  }

  // ── Desktop layout ──────────────────────────────────────────────────────────
  return (
    <main className="relative w-screen h-screen overflow-hidden" style={{ background: '#09060c' }}>

      {/* Scrollable container — hides scrollbar */}
      <div
        ref={scrollRef}
        className="hide-scrollbar"
        style={{ position: 'absolute', inset: 0, overflowY: 'scroll' }}
      >

        {/* ── Section 1: Intro animation ── */}
        <div
          style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#09060c',
          }}
        >
          <p className="text-xs tracking-[0.4em] uppercase mb-5" style={{ color: 'rgba(100,160,255,0.45)' }}>
            SSIP &mdash; Exploratorium
          </p>
          <h1
            className="font-mono font-bold text-white"
            style={{ fontSize: 'clamp(2.8rem, 8vw, 5rem)', minHeight: '1.3em' }}
          >
            {display}
          </h1>
        </div>

        {/* ── Section 2: Header + cards ── */}
        <div
          ref={section2Ref}
          style={{ position: 'relative', minHeight: '100vh', background: MEDIEVAL_BG, paddingBottom: '7vh' }}
        >
          {/* Grain overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url("${GRAIN_URI}")`,
              backgroundSize: '200px 200px',
              opacity: 0.13,
              mixBlendMode: 'overlay',
            }}
          />
          {/* Edge vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 90% 85% at 50% 50%, transparent 42%, rgba(3,1,4,0.88) 100%)',
            }}
          />

          {/* Content sits above background layers */}
          <div style={{ position: 'relative', zIndex: 2 }}>

            {/* Back link - upper right corner */}
            <Link
              href="/"
              style={{
                position: 'absolute',
                top: '2rem',
                right: '2rem',
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: '0.8rem',
                letterSpacing: '0.08em',
                color: 'rgba(218,180,80,0.7)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'color 0.2s ease, font-weight 0.2s ease',
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'rgba(255,220,120,1)'
                e.currentTarget.style.fontWeight = 'bold'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(218,180,80,0.7)'
                e.currentTarget.style.fontWeight = 'normal'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>←</span>
              <span>back to Exploratorium space</span>
            </Link>

            {/* Page header */}
            <div style={{ textAlign: 'center', paddingTop: '5vh', paddingBottom: '4vh' }}>
              <p
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '0.58rem',
                  letterSpacing: '0.32em',
                  textTransform: 'uppercase',
                  color: 'rgba(190,140,42,0.38)',
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
                  color: 'rgba(218,180,80,0.88)',
                  lineHeight: 1,
                  marginBottom: '0.85rem',
                  letterSpacing: '0.04em',
                }}
              >
                palabras
              </h1>
              <p
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '0.8rem',
                  fontStyle: 'italic',
                  color: 'rgba(190,148,60,0.48)',
                  letterSpacing: '0.06em',
                  marginBottom: '2.5vh',
                }}
              >
                a collection of news from around the ecosystem
              </p>
              <div
                style={{
                  width: '120px',
                  height: '1px',
                  background: 'rgba(180,130,40,0.2)',
                  margin: '0 auto',
                }}
              />
            </div>

            {/* Cards grid */}
            <DesktopGrid topics={TOPICS} onSelectTopic={handleSelectTopic} />

          </div>
        </div>

      </div>

      {/* ── Blog overlay ── */}
      {blogMounted && selectedTopic && (
        <div
          className="absolute inset-0"
          style={{
            zIndex: 50,
            opacity: blogVisible ? 1 : 0,
            transition: 'opacity 0.5s',
            pointerEvents: blogVisible ? 'auto' : 'none',
          }}
        >
          <BlogView topic={selectedTopic} onBack={handleBack} />
        </div>
      )}

    </main>
  )
}
