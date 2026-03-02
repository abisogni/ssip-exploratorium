'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// ── Palette ───────────────────────────────────────────────────────────────────
const MONO     = 'var(--font-geist-mono, monospace)'
const SERIF    = '"Times New Roman", Times, serif'
const CYAN     = 'rgba(0,198,212,0.92)'
const CYAN_DIM = 'rgba(0,190,210,0.22)'
const PAGE_BG  =
  'radial-gradient(ellipse 55% 50% at 80% 12%, rgba(0,160,180,0.16) 0%, transparent 55%),' +
  'radial-gradient(ellipse 50% 55% at 14% 55%, rgba(0,60,200,0.13) 0%, transparent 58%),' +
  'radial-gradient(ellipse 60% 40% at 50% 96%, rgba(0,100,130,0.14) 0%, transparent 55%),' +
  '#04060f'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Entry {
  source: string
  title: string
  content: string | string[]
}

interface CategoryPool {
  category: string
  human: Entry[]
  ai: Entry[]
}

interface Panel {
  label: string
  entry: Entry
  isHuman: boolean
}

interface ScoreDoc {
  category: string
  correct: number
  total: number
}

type Screen = 'mode-select' | 'category-select' | 'playing' | 'revealed'
type Mode   = 'two-truths' | 'mix-match'

// ── Helpers ───────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function formatContent(c: string | string[]): string {
  return Array.isArray(c) ? c.join('\n') : c
}

function panelLabel(i: number) { return String.fromCharCode(65 + i) }

function pickUnused<T>(arr: T[], used: Set<number>): { item: T; idx: number } | null {
  const avail = arr.map((_, i) => i).filter(i => !used.has(i))
  if (!avail.length) return null
  const idx = avail[Math.floor(Math.random() * avail.length)]
  return { item: arr[idx], idx }
}

function pickNUnused<T>(arr: T[], used: Set<number>, n: number): { items: T[]; indices: number[] } {
  const avail = shuffle(arr.map((_, i) => i).filter(i => !used.has(i))).slice(0, n)
  return { items: avail.map(i => arr[i]), indices: avail }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TuringNotTuring() {
  const [categories, setCategories]         = useState<CategoryPool[]>([])
  const [scores, setScores]                 = useState<ScoreDoc[]>([])
  const [loading, setLoading]               = useState(true)
  const [screen, setScreen]                 = useState<Screen>('mode-select')
  const [mode, setMode]                     = useState<Mode | null>(null)
  const [catIndex, setCatIndex]             = useState(0)
  const [panels, setPanels]                 = useState<Panel[]>([])
  const [chipOrder, setChipOrder]           = useState<string[]>([])
  const [selected, setSelected]             = useState<number | null>(null)
  const [assignments, setAssignments]       = useState<Record<number, string>>({})
  const [activePanel, setActivePanel]       = useState<number | null>(null)
  const [submittedScore, setSubmittedScore] = useState<ScoreDoc | null>(null)
  const [dragging, setDragging]             = useState<string | null>(null)
  const [dragOver, setDragOver]             = useState<number | null>(null)

  const usedHuman = useRef(new Set<number>())
  const usedAi    = useRef(new Set<number>())
  const isMobile  = useRef(false)

  useEffect(() => { isMobile.current = 'ontouchstart' in window }, [])

  // Shuffle chips once when panels change
  useEffect(() => {
    if (panels.length > 0) {
      setChipOrder(shuffle(panels.map(p => p.entry.source)))
    }
  }, [panels])

  useEffect(() => {
    Promise.all([
      fetch('/api/turing/content').then(r => r.json()),
      fetch('/api/turing/scores').then(r => r.json()),
    ]).then(([content, sc]) => {
      setCategories(content as CategoryPool[])
      setScores(sc as ScoreDoc[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const currentPool = categories[catIndex] ?? null

  function scoreFor(category: string) {
    return scores.find(s => s.category === category) ?? null
  }

  // ── Pool helpers ──────────────────────────────────────────────────────────
  function ensureHuman(p: CategoryPool) {
    if (p.human.every((_, i) => usedHuman.current.has(i))) usedHuman.current = new Set()
  }
  function ensureAi(p: CategoryPool, n: number) {
    if (p.ai.filter((_, i) => !usedAi.current.has(i)).length < n) usedAi.current = new Set()
  }

  function buildTwoTruths(p: CategoryPool): Panel[] | null {
    ensureHuman(p)
    ensureAi(p, 2)
    const h  = pickUnused(p.human, usedHuman.current)
    const ai = pickNUnused(p.ai, usedAi.current, 2)
    if (!h || ai.items.length < 2) return null
    usedHuman.current.add(h.idx)
    ai.indices.forEach(i => usedAi.current.add(i))
    const raw: Panel[] = [
      { label: '', entry: h.item, isHuman: true },
      { label: '', entry: ai.items[0], isHuman: false },
      { label: '', entry: ai.items[1], isHuman: false },
    ]
    return shuffle(raw).map((panel, i) => ({ ...panel, label: panelLabel(i) }))
  }

  function buildMixMatch(p: CategoryPool): Panel[] | null {
    const aiCount = Math.min(3, p.ai.length)
    ensureHuman(p)
    ensureAi(p, Math.min(2, aiCount))
    const h  = pickUnused(p.human, usedHuman.current)
    const ai = pickNUnused(p.ai, usedAi.current, aiCount)
    if (!h || ai.items.length < 2) return null
    usedHuman.current.add(h.idx)
    ai.indices.forEach(i => usedAi.current.add(i))
    const raw: Panel[] = [
      { label: '', entry: h.item, isHuman: true },
      ...ai.items.map(e => ({ label: '', entry: e, isHuman: false })),
    ]
    return shuffle(raw).map((panel, i) => ({ ...panel, label: panelLabel(i) }))
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  function resetRound() {
    setSelected(null)
    setAssignments({})
    setActivePanel(null)
    setSubmittedScore(null)
  }

  function startGame(m: Mode, catIdx: number) {
    usedHuman.current = new Set()
    usedAi.current    = new Set()
    setMode(m)
    setCatIndex(catIdx)
    resetRound()
    const p     = categories[catIdx]
    const built = m === 'two-truths' ? buildTwoTruths(p) : buildMixMatch(p)
    if (!built) return
    setPanels(built)
    setScreen('playing')
  }

  function playAgain() {
    resetRound()
    if (!currentPool) { setScreen('category-select'); return }
    const built = mode === 'two-truths' ? buildTwoTruths(currentPool) : buildMixMatch(currentPool)
    if (!built) { setScreen('category-select'); return }
    setPanels(built)
    setScreen('playing')
  }

  async function submitTwoTruths() {
    if (selected === null || !currentPool) return
    const isCorrect = panels[selected].isHuman
    setScreen('revealed')
    try {
      const res = await fetch('/api/turing/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: currentPool.category, correct: isCorrect }),
      })
      const doc: ScoreDoc = await res.json()
      setSubmittedScore(doc)
      setScores(prev => [...prev.filter(s => s.category !== doc.category), doc])
    } catch { /* score display fails silently */ }
  }

  function submitMixMatch() { setScreen('revealed') }

  // ── Drag handlers ─────────────────────────────────────────────────────────
  function onDragStart(source: string) { setDragging(source) }
  function onDragEnd()                  { setDragging(null); setDragOver(null) }
  function onDragOverPanel(i: number, e: React.DragEvent) { e.preventDefault(); setDragOver(i) }
  function onDropPanel(i: number) {
    if (!dragging) return
    setAssignments(prev => ({ ...prev, [i]: dragging }))
    setDragging(null); setDragOver(null)
  }

  // ── Mobile tap handlers ───────────────────────────────────────────────────
  function onTapPanel(i: number) {
    setActivePanel(prev => prev === i ? null : i)
  }
  function onTapLabel(source: string) {
    if (activePanel === null) return
    setAssignments(prev => ({ ...prev, [activePanel]: source }))
    setActivePanel(null)
  }

  const allAssigned = panels.length > 0 && Object.keys(assignments).length === panels.length

  // ── Panel render ──────────────────────────────────────────────────────────
  function renderPanel(p: Panel, i: number) {
    const isTT       = mode === 'two-truths'
    const isMM       = mode === 'mix-match'
    const isRevealed = screen === 'revealed'
    const isSelected = isTT && selected === i
    const assigned   = assignments[i]
    const mmCorrect  = isMM && isRevealed && assigned === p.entry.source

    let borderColor = CYAN_DIM
    let glowColor   = 'transparent'

    if (isRevealed && isTT) {
      if (p.isHuman)            { borderColor = 'rgba(0,220,100,0.6)'; glowColor = 'rgba(0,220,100,0.10)' }
      if (isSelected && !p.isHuman) { borderColor = 'rgba(220,60,60,0.7)'; glowColor = 'rgba(220,60,60,0.08)' }
    } else if (isRevealed && isMM) {
      borderColor = mmCorrect ? 'rgba(0,220,100,0.6)' : 'rgba(220,60,60,0.7)'
      glowColor   = mmCorrect ? 'rgba(0,220,100,0.10)' : 'rgba(220,60,60,0.08)'
    } else if (isSelected || (isMM && activePanel === i) || dragOver === i) {
      borderColor = CYAN
    }

    const clickable = (!isRevealed && isTT) || (!isRevealed && isMM && isMobile.current)

    return (
      <div
        key={p.label}
        draggable={isMM && !isMobile.current && !isRevealed}
        onDragOver={isMM && !isRevealed ? e => onDragOverPanel(i, e) : undefined}
        onDrop={isMM && !isRevealed ? () => onDropPanel(i) : undefined}
        onClick={
          isTT && !isRevealed ? () => setSelected(i)
          : isMM && isMobile.current && !isRevealed ? () => onTapPanel(i)
          : undefined
        }
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${borderColor}`,
          borderRadius: '6px',
          padding: '1.4rem 1.4rem 1.2rem',
          cursor: clickable ? 'pointer' : 'default',
          boxShadow: glowColor !== 'transparent' ? `0 0 32px ${glowColor}` : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.22em', color: CYAN, opacity: 0.75 }}>
            PANEL {p.label}
          </span>

          {/* Mix and Match: assigned chip or drop-zone hint */}
          {isMM && !isRevealed && (
            <span
              style={{
                fontFamily: MONO,
                fontSize: '0.6rem',
                letterSpacing: '0.08em',
                padding: '2px 8px',
                borderRadius: '4px',
                background: assigned ? 'rgba(0,198,212,0.14)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${assigned ? CYAN_DIM : 'rgba(255,255,255,0.08)'}`,
                color: assigned ? CYAN : 'rgba(255,255,255,0.22)',
              }}
            >
              {assigned ?? (isMobile.current ? 'tap to assign' : 'drop here')}
            </span>
          )}

          {/* Two Truths revealed: human badge */}
          {isTT && isRevealed && p.isHuman && (
            <span style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.12em', color: 'rgba(0,220,100,0.85)' }}>
              HUMAN
            </span>
          )}

          {/* Mix and Match revealed: check/cross + correct source if wrong */}
          {isMM && isRevealed && (
            <>
              <span style={{ fontFamily: MONO, fontSize: '0.72rem', color: mmCorrect ? 'rgba(0,220,100,0.9)' : 'rgba(220,60,60,0.9)' }}>
                {mmCorrect ? '✓' : '✗'}
              </span>
              {!mmCorrect && (
                <span style={{ fontFamily: MONO, fontSize: '0.58rem', color: 'rgba(0,220,100,0.7)', letterSpacing: '0.06em' }}>
                  → {p.entry.source}
                </span>
              )}
            </>
          )}
        </div>

        {/* Title */}
        {p.entry.title && (
          <p
            style={{
              fontFamily: SERIF,
              fontSize: '0.82rem',
              fontStyle: 'italic',
              color: 'rgba(150,195,225,0.45)',
              marginBottom: '0.75rem',
              letterSpacing: '0.04em',
            }}
          >
            {p.entry.title}
          </p>
        )}

        {/* Content */}
        <p
          style={{
            fontFamily: SERIF,
            fontSize: '0.94rem',
            fontStyle: 'italic',
            color: 'rgba(200,225,240,0.78)',
            lineHeight: 1.75,
            whiteSpace: 'pre-wrap',
            margin: 0,
          }}
        >
          {formatContent(p.entry.content)}
        </p>

        {/* Source revealed (both modes, after submit) */}
        {isRevealed && (
          <p
            style={{
              fontFamily: MONO,
              fontSize: '0.6rem',
              letterSpacing: '0.12em',
              color: 'rgba(0,190,210,0.45)',
              marginTop: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {p.entry.source}
          </p>
        )}
      </div>
    )
  }

  // ── Screen: mode select ───────────────────────────────────────────────────
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
          }}
        >
          Can you tell human writing from machine-generated text?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', alignItems: 'center' }}>
          {([
            { id: 'two-truths' as Mode, title: 'Two Truths and a Lie', desc: 'One panel is human-written, two are AI. Identify the human.' },
            { id: 'mix-match'  as Mode, title: 'Mix and Match',        desc: 'All panels shown — assign the correct author to each one.' },
          ]).map(opt => (
            <button
              key={opt.id}
              onClick={() => { setMode(opt.id); setScreen('category-select') }}
              style={{
                width: '100%', maxWidth: '380px',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${CYAN_DIM}`,
                borderRadius: '6px',
                padding: '1.25rem 1.5rem',
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,198,212,0.07)'; e.currentTarget.style.borderColor = CYAN }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = CYAN_DIM }}
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

  // ── Screen: category select ───────────────────────────────────────────────
  function renderCategorySelect() {
    if (loading) return (
      <p style={{ fontFamily: MONO, color: 'rgba(0,190,210,0.5)', fontSize: '0.8rem', letterSpacing: '0.15em' }}>LOADING…</p>
    )
    if (!categories.length) return (
      <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: 'rgba(180,200,220,0.5)', fontSize: '0.95rem', maxWidth: '380px', textAlign: 'center' }}>
        No content yet. Add <code style={{ fontFamily: MONO, fontSize: '0.8rem' }}>{'{category}_human.json'}</code> and <code style={{ fontFamily: MONO, fontSize: '0.8rem' }}>{'{category}_ai.json'}</code> files to the <code style={{ fontFamily: MONO, fontSize: '0.8rem' }}>turing/</code> directory.
      </p>
    )
    return (
      <div style={{ textAlign: 'center', maxWidth: '480px', margin: '0 auto', padding: '0 1.5rem' }}>
        <p style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.28em', color: 'rgba(0,190,210,0.4)', marginBottom: '0.5rem' }}>
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
                width: '100%', maxWidth: '340px',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${CYAN_DIM}`,
                borderRadius: '6px',
                padding: '1rem 1.4rem',
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,198,212,0.07)'; e.currentTarget.style.borderColor = CYAN }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = CYAN_DIM }}
            >
              <span style={{ fontFamily: MONO, fontSize: '0.82rem', color: CYAN, letterSpacing: '0.08em', textTransform: 'capitalize' }}>
                {cat.category.replace(/-/g, ' ')}
              </span>
              <span style={{ fontFamily: SERIF, fontSize: '0.78rem', fontStyle: 'italic', color: 'rgba(150,195,225,0.4)', marginLeft: '0.8rem' }}>
                {cat.human.length} human · {cat.ai.length} AI
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setScreen('mode-select')}
          style={{
            marginTop: '2.5rem', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.88rem',
            color: 'rgba(0,190,210,0.5)', letterSpacing: '0.04em', transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(0,210,230,0.85)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,190,210,0.5)')}
        >
          ← back
        </button>
      </div>
    )
  }

  // ── Screen: playing ───────────────────────────────────────────────────────
  function renderPlaying() {
    const isTT = mode === 'two-truths'
    const isMM = mode === 'mix-match'
    const canSubmit = isTT ? selected !== null : allAssigned

    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem', width: '100%' }}>
        <div style={{ marginBottom: '1.8rem' }}>
          <p style={{ fontFamily: MONO, fontSize: '0.62rem', letterSpacing: '0.26em', color: 'rgba(0,190,210,0.38)', marginBottom: '0.4rem' }}>
            {isTT ? 'TWO TRUTHS AND A LIE' : 'MIX AND MATCH'} — {currentPool?.category.replace(/-/g, ' ').toUpperCase()}
          </p>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.92rem', color: 'rgba(180,215,235,0.5)', lineHeight: 1.55, maxWidth: '560px' }}>
            {isTT
              ? 'One panel is written by a human. The other two are AI-generated. Which is the human?'
              : isMobile.current
                ? 'Tap a panel to select it, then tap an author chip to assign it.'
                : 'Drag an author chip onto the panel you think it wrote.'}
          </p>
        </div>

        {/* Panels */}
        <div
          className="turing-panels"
          style={{
            display: 'grid',
            gridTemplateColumns: panels.length <= 3 ? `repeat(${panels.length}, 1fr)` : 'repeat(2, 1fr)',
            gap: '1.2rem',
            marginBottom: '2rem',
          }}
        >
          {panels.map((p, i) => renderPanel(p, i))}
        </div>

        {/* Mix and Match: author chips */}
        {isMM && (
          <div style={{ marginBottom: '1.8rem' }}>
            <p style={{ fontFamily: MONO, fontSize: '0.58rem', letterSpacing: '0.2em', color: 'rgba(0,190,210,0.32)', marginBottom: '0.65rem' }}>
              AUTHORS
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
              {chipOrder.map(src => (
                <div
                  key={src}
                  draggable={!isMobile.current}
                  onDragStart={!isMobile.current ? () => onDragStart(src) : undefined}
                  onDragEnd={!isMobile.current ? onDragEnd : undefined}
                  onClick={isMobile.current ? () => onTapLabel(src) : undefined}
                  style={{
                    fontFamily: MONO,
                    fontSize: '0.68rem',
                    letterSpacing: '0.08em',
                    padding: '5px 12px',
                    borderRadius: '4px',
                    background: dragging === src ? 'rgba(0,198,212,0.22)'
                      : activePanel !== null ? 'rgba(0,198,212,0.10)'
                      : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${dragging === src ? CYAN : CYAN_DIM}`,
                    color: CYAN,
                    cursor: isMobile.current ? (activePanel !== null ? 'pointer' : 'default') : 'grab',
                    userSelect: 'none',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                >
                  {src}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          disabled={!canSubmit}
          onClick={isTT ? submitTwoTruths : submitMixMatch}
          style={{
            fontFamily: MONO,
            fontSize: '0.72rem',
            letterSpacing: '0.2em',
            padding: '10px 28px',
            borderRadius: '5px',
            background: canSubmit ? 'rgba(0,198,212,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${canSubmit ? CYAN : 'rgba(255,255,255,0.1)'}`,
            color: canSubmit ? CYAN : 'rgba(255,255,255,0.2)',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = 'rgba(0,198,212,0.25)' }}
          onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = 'rgba(0,198,212,0.15)' }}
        >
          SUBMIT
        </button>
      </div>
    )
  }

  // ── Screen: revealed ──────────────────────────────────────────────────────
  function renderRevealed() {
    const isTT = mode === 'two-truths'
    const isMM = mode === 'mix-match'

    const isCorrectTT = isTT && selected !== null && panels[selected]?.isHuman
    const mmCorrectCount = isMM ? panels.filter((p, i) => assignments[i] === p.entry.source).length : 0

    const scoreDoc = submittedScore ?? (currentPool ? scoreFor(currentPool.category) : null)

    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem', width: '100%' }}>
        {/* Result */}
        <div style={{ marginBottom: '2rem' }}>
          {isTT ? (
            <>
              <p
                style={{
                  fontFamily: SERIF,
                  fontStyle: 'italic',
                  fontSize: 'clamp(1.3rem, 3.5vw, 1.9rem)',
                  color: isCorrectTT ? 'rgba(0,220,100,0.9)' : 'rgba(220,80,80,0.9)',
                  marginBottom: '0.4rem',
                }}
              >
                {isCorrectTT ? 'Correct — you found the human.' : 'Not quite — the human was elsewhere.'}
              </p>
              {scoreDoc && (
                <p style={{ fontFamily: MONO, fontSize: '0.68rem', letterSpacing: '0.14em', color: 'rgba(0,190,210,0.5)' }}>
                  {scoreDoc.correct} of {scoreDoc.total} player{scoreDoc.total !== 1 ? 's' : ''} got this right
                  in <span style={{ color: CYAN }}>{currentPool?.category.replace(/-/g, ' ')}</span>
                  {scoreDoc.total > 0 && <> — {Math.round((scoreDoc.correct / scoreDoc.total) * 100)}%</>}
                </p>
              )}
            </>
          ) : (
            <p
              style={{
                fontFamily: SERIF,
                fontStyle: 'italic',
                fontSize: 'clamp(1.3rem, 3.2vw, 1.8rem)',
                color: mmCorrectCount === panels.length ? 'rgba(0,220,100,0.9)' : 'rgba(200,160,80,0.9)',
              }}
            >
              {mmCorrectCount === panels.length
                ? 'Perfect — all matched correctly.'
                : `${mmCorrectCount} of ${panels.length} matched correctly.`}
            </p>
          )}
        </div>

        {/* Panels */}
        <div
          className="turing-panels"
          style={{
            display: 'grid',
            gridTemplateColumns: panels.length <= 3 ? `repeat(${panels.length}, 1fr)` : 'repeat(2, 1fr)',
            gap: '1.2rem',
            marginBottom: '2.5rem',
          }}
        >
          {panels.map((p, i) => renderPanel(p, i))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={playAgain}
            style={{
              fontFamily: MONO, fontSize: '0.72rem', letterSpacing: '0.18em',
              padding: '9px 22px', borderRadius: '5px',
              background: 'rgba(0,198,212,0.12)', border: `1px solid ${CYAN_DIM}`,
              color: CYAN, cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,198,212,0.22)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,198,212,0.12)')}
          >
            PLAY AGAIN
          </button>
          <button
            onClick={() => setScreen('category-select')}
            style={{
              fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.88rem',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(0,190,210,0.45)', letterSpacing: '0.04em', transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(0,210,230,0.85)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,190,210,0.45)')}
          >
            change category
          </button>
          <button
            onClick={() => { setMode(null); setScreen('mode-select') }}
            style={{
              fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.88rem',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(0,190,210,0.45)', letterSpacing: '0.04em', transition: 'color 0.2s',
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

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', background: PAGE_BG, display: 'flex', flexDirection: 'column' }}>
      {/* Nav bar */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20,
          padding: '1.1rem 2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(4,6,15,0.6)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,190,210,0.08)',
        }}
      >
        <span style={{ fontFamily: MONO, fontSize: '0.68rem', letterSpacing: '0.22em', color: 'rgba(0,190,210,0.38)' }}>
          TURING, NOT TURING
        </span>
        <Link
          href="/puzzles"
          style={{
            fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.9rem',
            color: 'rgba(0,190,210,0.5)', textDecoration: 'none',
            letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.4rem',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(0,210,230,0.9)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,190,210,0.5)')}
        >
          <span style={{ fontSize: '1.1rem' }}>←</span> puzzles
        </Link>
      </div>

      {/* Content */}
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

      <style>{`
        @media (max-width: 768px) {
          .turing-panels { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  )
}
