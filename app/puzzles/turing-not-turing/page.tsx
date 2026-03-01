'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'

// ── Palette ───────────────────────────────────────────────────────────────────
const MONO  = 'var(--font-geist-mono, monospace)'
const SERIF = '"Times New Roman", Times, serif'
const CYAN  = 'rgba(0,198,212,0.92)'
const CYAN_DIM = 'rgba(0,190,210,0.22)'
const PAGE_BG =
  'radial-gradient(ellipse 55% 50% at 80% 12%, rgba(0,160,180,0.16) 0%, transparent 55%),' +
  'radial-gradient(ellipse 50% 55% at 14% 55%, rgba(0,60,200,0.13) 0%, transparent 58%),' +
  'radial-gradient(ellipse 60% 40% at 50% 96%, rgba(0,100,130,0.14) 0%, transparent 55%),' +
  '#04060f'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Response { source: string; content: string }
interface Grouping  { id: string; title: string; prompt: string; responses: Response[] }
interface Category  { category: string; groupings: Grouping[] }
interface ScoreDoc  { category: string; correct: number; total: number }

type Screen = 'mode-select' | 'category-select' | 'playing' | 'revealed'
type Mode   = 'two-truths' | 'mix-match'

interface Panel { label: string; response: Response }

// ── Helpers ───────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function panelLabel(i: number) {
  return String.fromCharCode(65 + i) // A, B, C, …
}

function pickGrouping(cat: Category, used: Set<string>): Grouping | null {
  const available = cat.groupings.filter(g => !used.has(g.id))
  if (!available.length) return null
  return available[Math.floor(Math.random() * available.length)]
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TuringNotTuring() {
  // Content + scores
  const [categories, setCategories] = useState<Category[]>([])
  const [scores, setScores]         = useState<ScoreDoc[]>([])
  const [loading, setLoading]       = useState(true)

  // Navigation
  const [screen, setScreen]   = useState<Screen>('mode-select')
  const [mode, setMode]       = useState<Mode | null>(null)
  const [catIndex, setCatIndex] = useState<number>(0)

  // Game state
  const [panels, setPanels]             = useState<Panel[]>([])
  const [correctIndex, setCorrectIndex] = useState<number>(-1)
  const [selected, setSelected]         = useState<number | null>(null)           // Two Truths
  const [assignments, setAssignments]   = useState<Record<number, string>>({})   // Mix and Match
  const [activePanel, setActivePanel]   = useState<number | null>(null)          // Mix & Match mobile tap
  const [submittedScore, setSubmittedScore] = useState<ScoreDoc | null>(null)

  // Drag state (Mix and Match desktop)
  const [dragging, setDragging]     = useState<string | null>(null)
  const [dragOver, setDragOver]     = useState<number | null>(null)

  // Used grouping tracker (reset per category)
  const usedGroupings = useRef<Set<string>>(new Set())

  // Mobile detection
  const isMobile = useRef(false)
  useEffect(() => {
    isMobile.current = 'ontouchstart' in window
  }, [])

  // ── Load content ─────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/api/turing/content').then(r => r.json()),
      fetch('/api/turing/scores').then(r => r.json()),
    ]).then(([content, sc]) => {
      setCategories(content as Category[])
      setScores(sc as ScoreDoc[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const currentCategory = categories[catIndex] ?? null

  const scoreFor = useCallback((category: string) => {
    return scores.find(s => s.category === category) ?? null
  }, [scores])

  function buildTwoTruthsPanels(cat: Category): { panels: Panel[]; correctIdx: number } | null {
    const g = pickGrouping(cat, usedGroupings.current)
    if (!g) return null
    usedGroupings.current.add(g.id)

    const human = g.responses.find(r => r.source === 'Human')
    if (!human) return null
    const ais = g.responses.filter(r => r.source !== 'Human')
    if (ais.length < 2) return null
    const twoAis = shuffle(ais).slice(0, 2)
    const raw = shuffle([human, ...twoAis])
    const humanIdx = raw.findIndex(r => r.source === 'Human')
    const panels = raw.map((r, i) => ({ label: panelLabel(i), response: r }))
    return { panels, correctIdx: humanIdx }
  }

  function buildMixMatchPanels(cat: Category): Panel[] | null {
    const g = pickGrouping(cat, usedGroupings.current)
    if (!g) return null
    usedGroupings.current.add(g.id)
    const shuffled = shuffle(g.responses)
    return shuffled.map((r, i) => ({ label: panelLabel(i), response: r }))
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  function startGame(m: Mode, catIdx: number) {
    usedGroupings.current = new Set()
    setMode(m)
    setCatIndex(catIdx)
    setSelected(null)
    setAssignments({})
    setActivePanel(null)
    setSubmittedScore(null)

    const cat = categories[catIdx]
    if (m === 'two-truths') {
      const result = buildTwoTruthsPanels(cat)
      if (!result) return
      setPanels(result.panels)
      setCorrectIndex(result.correctIdx)
    } else {
      const p = buildMixMatchPanels(cat)
      if (!p) return
      setPanels(p)
      setCorrectIndex(-1)
    }
    setScreen('playing')
  }

  function playAgain() {
    setSelected(null)
    setAssignments({})
    setActivePanel(null)
    setSubmittedScore(null)
    setScreen('category-select')
  }

  async function submitTwoTruths() {
    if (selected === null || !currentCategory) return
    const isCorrect = selected === correctIndex
    setScreen('revealed')

    try {
      const res = await fetch('/api/turing/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: currentCategory.category, correct: isCorrect }),
      })
      const doc: ScoreDoc = await res.json()
      setSubmittedScore(doc)
      setScores(prev => {
        const next = prev.filter(s => s.category !== doc.category)
        return [...next, doc]
      })
    } catch { /* score display fails silently */ }
  }

  function submitMixMatch() {
    setScreen('revealed')
  }

  // ── Drag handlers (Mix and Match) ─────────────────────────────────────────
  function onDragStart(source: string) { setDragging(source) }
  function onDragEnd()                 { setDragging(null); setDragOver(null) }
  function onDragOverPanel(i: number, e: React.DragEvent) { e.preventDefault(); setDragOver(i) }
  function onDropPanel(i: number)      {
    if (!dragging) return
    setAssignments(prev => ({ ...prev, [i]: dragging }))
    setDragging(null)
    setDragOver(null)
  }

  // ── Mobile tap logic ──────────────────────────────────────────────────────
  function onTapPanel(i: number) {
    if (screen !== 'playing' || mode !== 'mix-match') return
    setActivePanel(prev => prev === i ? null : i)
  }

  function onTapLabel(source: string) {
    if (activePanel === null) return
    setAssignments(prev => ({ ...prev, [activePanel]: source }))
    setActivePanel(null)
  }

  const allAssigned   = panels.length > 0 && Object.keys(assignments).length === panels.length
  const canSubmitMix  = allAssigned
  const sources: string[] = panels.map(p => p.response.source)

  // ── Render helpers ────────────────────────────────────────────────────────

  function renderPanel(p: Panel, i: number) {
    const isTT       = mode === 'two-truths'
    const isMM       = mode === 'mix-match'
    const isRevealed = screen === 'revealed'
    const isSelected = isTT && selected === i
    const assignedLabel = assignments[i]

    let border = CYAN_DIM
    let glowColor = 'transparent'

    if (isRevealed && isTT) {
      if (i === correctIndex)  { border = 'rgba(0,220,100,0.6)'; glowColor = 'rgba(0,220,100,0.12)' }
      if (isSelected && i !== correctIndex) { border = 'rgba(220,60,60,0.7)'; glowColor = 'rgba(220,60,60,0.10)' }
    } else if (isRevealed && isMM) {
      const correct = p.response.source === assignedLabel
      border = correct ? 'rgba(0,220,100,0.6)' : 'rgba(220,60,60,0.7)'
      glowColor = correct ? 'rgba(0,220,100,0.10)' : 'rgba(220,60,60,0.08)'
    } else if (isTT && isSelected) {
      border = CYAN
    } else if (isMM && activePanel === i) {
      border = CYAN
    } else if (isMM && dragOver === i) {
      border = CYAN
    }

    return (
      <div
        key={p.label}
        draggable={isMM && !isMobile.current && screen === 'playing'}
        onDragOver={isMM && screen === 'playing' ? e => onDragOverPanel(i, e) : undefined}
        onDrop={isMM && screen === 'playing' ? () => onDropPanel(i) : undefined}
        onClick={
          isTT && screen === 'playing' ? () => setSelected(i)
          : isMM && isMobile.current && screen === 'playing' ? () => onTapPanel(i)
          : undefined
        }
        style={{
          position: 'relative',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${border}`,
          borderRadius: '6px',
          padding: '1.4rem 1.4rem 1.2rem',
          cursor: isTT && screen === 'playing' ? 'pointer' : 'default',
          boxShadow: glowColor !== 'transparent' ? `0 0 32px ${glowColor}` : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        {/* Panel header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.9rem' }}>
          <span
            style={{
              fontFamily: MONO,
              fontSize: '0.68rem',
              letterSpacing: '0.22em',
              color: CYAN,
              opacity: 0.8,
            }}
          >
            PANEL {p.label}
          </span>

          {/* Mix and Match: assigned chip or drop zone */}
          {isMM && (
            <span
              style={{
                fontFamily: MONO,
                fontSize: '0.62rem',
                letterSpacing: '0.12em',
                padding: '2px 8px',
                borderRadius: '4px',
                background: assignedLabel ? 'rgba(0,198,212,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${assignedLabel ? CYAN_DIM : 'rgba(255,255,255,0.08)'}`,
                color: assignedLabel ? CYAN : 'rgba(255,255,255,0.25)',
                minWidth: '60px',
                textAlign: 'center',
              }}
            >
              {assignedLabel ?? 'drop here'}
            </span>
          )}

          {/* Mix and Match revealed: check/cross */}
          {isMM && isRevealed && (
            <span
              style={{
                fontFamily: MONO,
                fontSize: '0.75rem',
                color: p.response.source === assignedLabel ? 'rgba(0,220,100,0.9)' : 'rgba(220,60,60,0.9)',
                marginLeft: '0.3rem',
              }}
            >
              {p.response.source === assignedLabel ? '✓' : '✗'}
            </span>
          )}

          {/* Mix and Match revealed: correct label */}
          {isMM && isRevealed && p.response.source !== assignedLabel && (
            <span
              style={{
                fontFamily: MONO,
                fontSize: '0.6rem',
                color: 'rgba(0,220,100,0.75)',
                letterSpacing: '0.08em',
              }}
            >
              → {p.response.source}
            </span>
          )}

          {/* Two Truths revealed: correct label */}
          {isTT && isRevealed && i === correctIndex && (
            <span
              style={{
                fontFamily: MONO,
                fontSize: '0.6rem',
                letterSpacing: '0.1em',
                color: 'rgba(0,220,100,0.85)',
              }}
            >
              HUMAN
            </span>
          )}
        </div>

        {/* Content */}
        <p
          style={{
            fontFamily: SERIF,
            fontSize: '0.95rem',
            fontStyle: 'italic',
            color: 'rgba(200,225,240,0.78)',
            lineHeight: 1.75,
            whiteSpace: 'pre-wrap',
            margin: 0,
          }}
        >
          {p.response.content}
        </p>
      </div>
    )
  }

  // ── Screen renders ────────────────────────────────────────────────────────

  function renderModeSelect() {
    return (
      <div style={{ textAlign: 'center', maxWidth: '520px', margin: '0 auto', padding: '0 1.5rem' }}>
        <p style={{ fontFamily: MONO, fontSize: '0.68rem', letterSpacing: '0.32em', color: 'rgba(0,190,210,0.45)', marginBottom: '0.7rem' }}>
          SSIP EXPLORATORIUM — AI
        </p>
        <h1
          style={{
            fontFamily: SERIF,
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontStyle: 'italic',
            fontWeight: 'bold',
            color: 'rgba(200,235,255,0.88)',
            lineHeight: 1.1,
            marginBottom: '0.7rem',
            letterSpacing: '0.02em',
          }}
        >
          Turing, Not Turing
        </h1>
        <p
          style={{
            fontFamily: SERIF,
            fontSize: '0.95rem',
            fontStyle: 'italic',
            color: 'rgba(150,200,230,0.5)',
            lineHeight: 1.65,
            marginBottom: '3.5rem',
            letterSpacing: '0.04em',
          }}
        >
          Can you tell human writing from machine-generated text?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', alignItems: 'center' }}>
          {[
            {
              id: 'two-truths' as Mode,
              title: 'Two Truths and a Lie',
              desc: 'One panel is human-written, two are AI. Identify the human.',
            },
            {
              id: 'mix-match' as Mode,
              title: 'Mix and Match',
              desc: 'All panels shown — assign the correct model to each one.',
            },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => { setMode(opt.id); setScreen('category-select') }}
              style={{
                width: '100%',
                maxWidth: '380px',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${CYAN_DIM}`,
                borderRadius: '6px',
                padding: '1.25rem 1.5rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0,198,212,0.07)'
                e.currentTarget.style.borderColor = CYAN
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.borderColor = CYAN_DIM
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: '0.85rem', color: CYAN, marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
                {opt.title}
              </div>
              <div style={{ fontFamily: SERIF, fontSize: '0.88rem', fontStyle: 'italic', color: 'rgba(160,200,225,0.55)', lineHeight: 1.5 }}>
                {opt.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  function renderCategorySelect() {
    if (loading) return (
      <p style={{ fontFamily: MONO, color: 'rgba(0,190,210,0.5)', fontSize: '0.8rem', letterSpacing: '0.15em' }}>
        LOADING…
      </p>
    )
    if (!categories.length) return (
      <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: 'rgba(180,200,220,0.5)', fontSize: '0.95rem' }}>
        No content found. Add JSON files to the <code style={{ fontFamily: MONO, fontSize: '0.8rem' }}>turing/</code> directory.
      </p>
    )
    return (
      <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto', padding: '0 1.5rem' }}>
        <p style={{ fontFamily: MONO, fontSize: '0.68rem', letterSpacing: '0.28em', color: 'rgba(0,190,210,0.4)', marginBottom: '0.6rem' }}>
          {mode === 'two-truths' ? 'TWO TRUTHS AND A LIE' : 'MIX AND MATCH'}
        </p>
        <h2
          style={{
            fontFamily: SERIF,
            fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
            fontStyle: 'italic',
            color: 'rgba(200,235,255,0.85)',
            marginBottom: '2.5rem',
          }}
        >
          Choose a category
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', alignItems: 'center' }}>
          {categories.map((cat, idx) => (
            <button
              key={cat.category}
              onClick={() => startGame(mode!, idx)}
              style={{
                width: '100%',
                maxWidth: '340px',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${CYAN_DIM}`,
                borderRadius: '6px',
                padding: '1rem 1.4rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0,198,212,0.07)'
                e.currentTarget.style.borderColor = CYAN
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.borderColor = CYAN_DIM
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: '0.82rem', color: CYAN, letterSpacing: '0.08em', textTransform: 'capitalize' }}>
                {cat.category}
              </span>
              <span style={{ fontFamily: SERIF, fontSize: '0.78rem', fontStyle: 'italic', color: 'rgba(150,195,225,0.45)', marginLeft: '0.8rem' }}>
                {cat.groupings.length} grouping{cat.groupings.length !== 1 ? 's' : ''}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setScreen('mode-select')}
          style={{
            marginTop: '2.5rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontSize: '0.88rem',
            color: 'rgba(0,190,210,0.5)',
            letterSpacing: '0.04em',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(0,210,230,0.85)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,190,210,0.5)')}
        >
          ← back
        </button>
      </div>
    )
  }

  function renderPlaying() {
    const isTT = mode === 'two-truths'
    const isMM = mode === 'mix-match'
    const canSubmit = isTT ? selected !== null : canSubmitMix

    // Unique sources (chips for Mix and Match)
    const sourceChips = [...new Set(sources)]

    return (
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.26em', color: 'rgba(0,190,210,0.4)', marginBottom: '0.4rem' }}>
            {isTT ? 'TWO TRUTHS AND A LIE' : 'MIX AND MATCH'} — {currentCategory?.category?.toUpperCase()}
          </p>
          <p
            style={{
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontSize: '0.92rem',
              color: 'rgba(180,215,235,0.55)',
              lineHeight: 1.55,
              maxWidth: '560px',
            }}
          >
            {isTT
              ? 'One of these panels was written by a human. The other two are AI-generated. Which is the human?'
              : 'Assign the correct author to each panel. Drag a label onto a panel (or tap on mobile).'}
          </p>
        </div>

        {/* Panels */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: panels.length <= 3 ? `repeat(${panels.length}, 1fr)` : 'repeat(2, 1fr)',
            gap: '1.2rem',
            marginBottom: '2rem',
          }}
          className="turing-panels"
        >
          {panels.map((p, i) => renderPanel(p, i))}
        </div>

        {/* Mix and Match label chips */}
        {isMM && (
          <div style={{ marginBottom: '1.8rem' }}>
            <p style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.22em', color: 'rgba(0,190,210,0.35)', marginBottom: '0.75rem' }}>
              {isMobile.current ? 'TAP A PANEL, THEN TAP A LABEL' : 'DRAG LABELS ONTO PANELS'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {sourceChips.map(src => (
                <div
                  key={src}
                  draggable={!isMobile.current}
                  onDragStart={!isMobile.current ? () => onDragStart(src) : undefined}
                  onDragEnd={!isMobile.current ? onDragEnd : undefined}
                  onClick={isMobile.current ? () => onTapLabel(src) : undefined}
                  style={{
                    fontFamily: MONO,
                    fontSize: '0.72rem',
                    letterSpacing: '0.1em',
                    padding: '5px 12px',
                    borderRadius: '4px',
                    background: dragging === src
                      ? 'rgba(0,198,212,0.22)'
                      : activePanel !== null && isMobile.current
                      ? 'rgba(0,198,212,0.1)'
                      : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${dragging === src ? CYAN : CYAN_DIM}`,
                    color: CYAN,
                    cursor: isMobile.current ? (activePanel !== null ? 'pointer' : 'default') : 'grab',
                    userSelect: 'none',
                    transition: 'background 0.15s, border-color 0.15s',
                    opacity: activePanel !== null && isMobile.current ? 1 : 0.85,
                  }}
                >
                  {src}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          disabled={!canSubmit}
          onClick={isTT ? submitTwoTruths : submitMixMatch}
          style={{
            fontFamily: MONO,
            fontSize: '0.75rem',
            letterSpacing: '0.2em',
            padding: '10px 28px',
            borderRadius: '5px',
            background: canSubmit ? 'rgba(0,198,212,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${canSubmit ? CYAN : 'rgba(255,255,255,0.1)'}`,
            color: canSubmit ? CYAN : 'rgba(255,255,255,0.2)',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s, border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = 'rgba(0,198,212,0.25)' }}
          onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = 'rgba(0,198,212,0.15)' }}
        >
          SUBMIT
        </button>
      </div>
    )
  }

  function renderRevealed() {
    const isTT = mode === 'two-truths'
    const isCorrect = isTT && selected === correctIndex

    // Mix and Match score tally
    const mmCorrect = mode === 'mix-match'
      ? panels.filter((p, i) => assignments[i] === p.response.source).length
      : 0

    const scoreDoc = submittedScore ?? (currentCategory ? scoreFor(currentCategory.category) : null)

    return (
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem', width: '100%' }}>
        {/* Result banner */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          {isTT ? (
            <>
              <p
                style={{
                  fontFamily: SERIF,
                  fontStyle: 'italic',
                  fontSize: 'clamp(1.4rem, 3.5vw, 2rem)',
                  color: isCorrect ? 'rgba(0,220,100,0.9)' : 'rgba(220,80,80,0.9)',
                  marginBottom: '0.4rem',
                }}
              >
                {isCorrect ? 'Correct — you found the human.' : 'Not quite — the human was elsewhere.'}
              </p>
              {scoreDoc && (
                <p style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.16em', color: 'rgba(0,190,210,0.55)' }}>
                  {scoreDoc.correct} of {scoreDoc.total} player{scoreDoc.total !== 1 ? 's' : ''} got this right in{' '}
                  <span style={{ color: CYAN }}>{currentCategory?.category}</span>
                  {scoreDoc.total > 0 && (
                    <> &mdash; {Math.round((scoreDoc.correct / scoreDoc.total) * 100)}%</>
                  )}
                </p>
              )}
            </>
          ) : (
            <p
              style={{
                fontFamily: SERIF,
                fontStyle: 'italic',
                fontSize: 'clamp(1.3rem, 3.2vw, 1.8rem)',
                color: mmCorrect === panels.length ? 'rgba(0,220,100,0.9)' : 'rgba(200,160,80,0.9)',
              }}
            >
              {mmCorrect === panels.length
                ? 'Perfect — all matched correctly.'
                : `${mmCorrect} of ${panels.length} matched correctly.`}
            </p>
          )}
        </div>

        {/* Panels */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: panels.length <= 3 ? `repeat(${panels.length}, 1fr)` : 'repeat(2, 1fr)',
            gap: '1.2rem',
            marginBottom: '2.5rem',
          }}
          className="turing-panels"
        >
          {panels.map((p, i) => renderPanel(p, i))}
        </div>

        {/* Play again */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={playAgain}
            style={{
              fontFamily: MONO,
              fontSize: '0.72rem',
              letterSpacing: '0.18em',
              padding: '9px 22px',
              borderRadius: '5px',
              background: 'rgba(0,198,212,0.12)',
              border: `1px solid ${CYAN_DIM}`,
              color: CYAN,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,198,212,0.22)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,198,212,0.12)')}
          >
            PLAY AGAIN
          </button>
          <button
            onClick={() => { setMode(null); setScreen('mode-select') }}
            style={{
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontSize: '0.88rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(0,190,210,0.45)',
              letterSpacing: '0.04em',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(0,210,230,0.85)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,190,210,0.45)')}
          >
            change mode
          </button>
        </div>
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <main
      style={{
        minHeight: '100vh',
        background: PAGE_BG,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top nav */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: '1.1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 20,
          background: 'rgba(4,6,15,0.6)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,190,210,0.08)',
        }}
      >
        <span style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.22em', color: 'rgba(0,190,210,0.4)' }}>
          TURING, NOT TURING
        </span>
        <Link
          href="/puzzles"
          style={{
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontSize: '0.9rem',
            color: 'rgba(0,190,210,0.5)',
            textDecoration: 'none',
            letterSpacing: '0.06em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(0,210,230,0.9)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,190,210,0.5)')}
        >
          <span style={{ fontSize: '1.1rem' }}>←</span> puzzles
        </Link>
      </div>

      {/* Content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: screen === 'playing' || screen === 'revealed' ? 'flex-start' : 'center',
          justifyContent: 'center',
          paddingTop: screen === 'playing' || screen === 'revealed' ? '7rem' : '0',
          paddingBottom: '4rem',
        }}
      >
        {screen === 'mode-select'     && renderModeSelect()}
        {screen === 'category-select' && renderCategorySelect()}
        {screen === 'playing'         && renderPlaying()}
        {screen === 'revealed'        && renderRevealed()}
      </div>

      {/* Responsive panels style */}
      <style>{`
        @media (max-width: 768px) {
          .turing-panels {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  )
}
