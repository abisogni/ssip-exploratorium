'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LEVELS } from './data'
import RevealPanel from './RevealPanel'
import Level1 from './Level1'
import Level2 from './Level2'
import Level3 from './Level3'
import Level4 from './Level4'
import Level5 from './Level5'
import Level6 from './Level6'

const MONO  = 'var(--font-geist-mono, monospace)'
const SERIF = '"Georgia", "Times New Roman", serif'
const LS_KEY = 'cipher-room-progress'

function loadProgress(): Set<number> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set()
  } catch { return new Set() }
}

function saveProgress(completed: Set<number>) {
  localStorage.setItem(LS_KEY, JSON.stringify([...completed]))
}

export default function CipherRoom() {
  const [activeLevel, setActiveLevel] = useState(1)
  const [completed,   setCompleted]   = useState<Set<number>>(new Set())
  const [showReveal,  setShowReveal]  = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Load progress from localStorage on mount
  useEffect(() => {
    setCompleted(loadProgress())
  }, [])

  function handleSolve() {
    setShowReveal(true)
  }

  function handleContinue() {
    setShowReveal(false)
    setCompleted(prev => {
      const next = new Set(prev)
      next.add(activeLevel)
      saveProgress(next)
      return next
    })
    if (activeLevel < 6) {
      setActiveLevel(activeLevel + 1)
    }
  }

  const act = LEVELS[activeLevel - 1].act
  const actColors: Record<number, { accent: string; border: string; bg: string }> = {
    1: { accent: 'rgba(200,148,20,0.9)',   border: 'rgba(200,148,20,0.22)',  bg: '#12100a' },
    2: { accent: 'rgba(56,200,140,0.9)',   border: 'rgba(56,200,140,0.22)', bg: '#0a1210' },
    3: { accent: 'rgba(180,100,220,0.9)',  border: 'rgba(180,100,220,0.22)', bg: '#100a14' },
  }
  const colors = actColors[act]

  const allDone = completed.size === 6

  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',
        background: '#0a0806',
        display: 'flex',
        overflow: 'hidden',
        fontFamily: MONO,
      }}
    >
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: sidebarOpen ? 230 : 0,
          minWidth: sidebarOpen ? 230 : 0,
          overflow: 'hidden',
          background: '#080604',
          borderRight: '1px solid rgba(200,148,20,0.12)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s ease, min-width 0.3s ease',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '1.6rem 1.2rem 1rem', borderBottom: '1px solid rgba(200,148,20,0.1)' }}>
          <Link
            href="/puzzles"
            style={{
              fontFamily: MONO,
              fontSize: '0.65rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(200,148,20,0.45)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '1.2rem',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(200,148,20,0.85)')}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(200,148,20,0.45)')}
          >
            ← puzzles
          </Link>
          <h1
            style={{
              fontFamily: MONO,
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(232,220,200,0.7)',
              margin: '0 0 0.3rem',
            }}
          >
            Kryptos Lab
          </h1>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.72rem', color: 'rgba(200,170,120,0.38)', margin: 0 }}>
            The Cipher Room
          </p>
        </div>

        {/* Level list grouped by act */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.8rem 0' }}>
          {[1, 2, 3].map(actNum => {
            const actLevels = LEVELS.filter(l => l.act === actNum)
            const actTitles = ['The Written Word', "Nature's Code", 'The Logic of Secrets']
            return (
              <div key={actNum} style={{ marginBottom: '0.5rem' }}>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: '0.6rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'rgba(200,148,20,0.3)',
                    padding: '0.5rem 1.2rem 0.3rem',
                  }}
                >
                  Act {actNum} — {actTitles[actNum - 1]}
                </div>
                {actLevels.map(l => {
                  const done    = completed.has(l.id)
                  const active  = activeLevel === l.id
                  return (
                    <button
                      key={l.id}
                      onClick={() => { setActiveLevel(l.id); setShowReveal(false) }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: active ? 'rgba(200,148,20,0.07)' : 'transparent',
                        border: 'none',
                        borderLeft: active ? '2px solid rgba(200,148,20,0.7)' : '2px solid transparent',
                        padding: '0.55rem 1.2rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)' }}
                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                    >
                      {/* Completion indicator */}
                      <span style={{ fontSize: '0.6rem', color: done ? '#4a9e6a' : 'rgba(255,255,255,0.15)', flexShrink: 0 }}>
                        {done ? '✦' : `${l.id}.`}
                      </span>
                      <span
                        style={{
                          fontFamily: MONO,
                          fontSize: '0.7rem',
                          color: active ? 'rgba(200,148,20,0.9)' : done ? 'rgba(232,220,200,0.5)' : 'rgba(232,220,200,0.35)',
                          lineHeight: 1.3,
                        }}
                      >
                        {l.title}
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Progress footer */}
        <div style={{ padding: '1rem 1.2rem', borderTop: '1px solid rgba(200,148,20,0.1)' }}>
          <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.5rem' }}>
            {LEVELS.map(l => (
              <div
                key={l.id}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  background: completed.has(l.id) ? '#4a9e6a' : 'rgba(255,255,255,0.1)',
                  transition: 'background 0.4s',
                }}
              />
            ))}
          </div>
          <p style={{ fontFamily: MONO, fontSize: '0.62rem', color: 'rgba(200,148,20,0.4)', margin: 0 }}>
            {completed.size} / 6 decoded
          </p>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {/* Top bar */}
        <div
          style={{
            height: 44,
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 1.4rem',
            gap: '1rem',
            background: colors.bg,
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setSidebarOpen(o => !o)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: MONO,
              fontSize: '0.7rem',
              color: 'rgba(200,170,120,0.4)',
              padding: '0 0.4rem',
              lineHeight: 1,
            }}
            title="Toggle case file"
          >
            {sidebarOpen ? '‹' : '›'}
          </button>
          <span style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.14em', color: 'rgba(200,170,120,0.35)', textTransform: 'uppercase' }}>
            Level {activeLevel}
          </span>
          <span style={{ fontFamily: MONO, fontSize: '0.75rem', color: colors.accent, flex: 1 }}>
            {LEVELS[activeLevel - 1].title}
          </span>
          <span style={{ fontFamily: MONO, fontSize: '0.62rem', color: 'rgba(200,170,120,0.3)', letterSpacing: '0.06em' }}>
            {LEVELS[activeLevel - 1].subtitle}
          </span>
        </div>

        {/* Level content */}
        <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          {activeLevel === 1 && <Level1 onSolve={handleSolve} solved={completed.has(1)} />}
          {activeLevel === 2 && <Level2 onSolve={handleSolve} solved={completed.has(2)} />}
          {activeLevel === 3 && <Level3 onSolve={handleSolve} solved={completed.has(3)} />}
          {activeLevel === 4 && <Level4 onSolve={handleSolve} solved={completed.has(4)} />}
          {activeLevel === 5 && <Level5 onSolve={handleSolve} solved={completed.has(5)} />}
          {activeLevel === 6 && <Level6 onSolve={handleSolve} solved={completed.has(6)} />}
        </div>

        {/* All-done banner */}
        {allDone && (
          <div
            style={{
              position: 'absolute',
              bottom: '1.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(10,8,6,0.96)',
              border: '1px solid rgba(74,158,106,0.35)',
              borderRadius: '6px',
              padding: '1rem 1.8rem',
              maxWidth: 580,
              width: 'calc(100% - 3rem)',
              textAlign: 'center',
              zIndex: 10,
            }}
          >
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.88rem', color: 'rgba(232,220,200,0.7)', margin: 0, lineHeight: 1.8 }}>
              You have decoded a Roman dispatch, unlocked 3,000 years of Egyptian history, read a
              strand of living DNA, identified a cosmic lighthouse in noise, cracked a 9th-century
              cipher, and broken an encryption that protected a world war.
            </p>
            <p style={{ fontFamily: MONO, fontSize: '0.7rem', color: '#4a9e6a', margin: '0.8rem 0 0', letterSpacing: '0.06em' }}>
              None of these were acts of hacking. All of them were acts of understanding.
            </p>
          </div>
        )}
      </div>

      {/* Reveal panel — rendered over everything */}
      {showReveal && (
        <RevealPanel level={activeLevel} onContinue={handleContinue} />
      )}
    </main>
  )
}
