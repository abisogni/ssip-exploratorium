'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Script from 'next/script'

// ── Palette ───────────────────────────────────────────────────────────────────
const PAGE_BG    = '#04060f'
const ACCENT     = 'rgba(0,198,212,0.92)'
const ACCENT_DIM = 'rgba(0,190,210,0.45)'
const TEXT_MAIN  = 'rgba(180,230,240,0.88)'
const TEXT_DIM   = 'rgba(100,170,195,0.50)'
const MONO       = 'var(--font-geist-mono, monospace)'
const SERIF      = '"Times New Roman", Times, serif'

// ── Constants ─────────────────────────────────────────────────────────────────
const ML5_CDN     = 'https://unpkg.com/ml5@0.12.2/dist/ml5.min.js'
const CANVAS_SIZE = 280
const BRUSH_SIZE  = 14
const DEBOUNCE_MS = 250
const TOP_N       = 20   // fetch more results so filters have enough to work with

// ── Types ─────────────────────────────────────────────────────────────────────
type Mode           = 'explore' | 'challenge'
type Phase          = 'briefing' | 'playing'
type LoadState      = 'idle' | 'loading' | 'ready' | 'error'
type CategoryFilter = 'all' | 'shape' | 'animal' | 'object'

interface Prediction { label: string; confidence: number }

interface ChallengeSpec {
  target:          string
  threshold:       number
  hint:            string
  suggestedFilter: CategoryFilter
}

// ── Category label sets ───────────────────────────────────────────────────────
// Labels must match what DoodleNet / QuickDraw returns exactly.
const CATEGORY_SETS: Record<Exclude<CategoryFilter, 'all'>, Set<string>> = {
  shape: new Set([
    'circle', 'square', 'triangle', 'star', 'hexagon', 'zigzag', 'squiggle',
    'line', 'diamond', 'lightning', 'tornado', 'moon', 'sun', 'rainbow',
    'snowflake', 'crown', 'boomerang', 'spiral',
  ]),
  animal: new Set([
    'cat', 'dog', 'fish', 'bird', 'butterfly', 'elephant', 'lion', 'tiger',
    'bear', 'rabbit', 'snake', 'octopus', 'crab', 'lobster', 'penguin',
    'flamingo', 'parrot', 'owl', 'frog', 'whale', 'dolphin', 'shark',
    'horse', 'cow', 'pig', 'sheep', 'duck', 'hedgehog', 'monkey', 'panda',
    'zebra', 'kangaroo', 'raccoon', 'squirrel', 'camel', 'mosquito',
    'spider', 'scorpion', 'ant', 'bee', 'snail', 'mermaid', 'dragon',
    'sea turtle', 'crocodile',
  ]),
  object: new Set([
    'house', 'car', 'guitar', 'piano', 'bicycle', 'chair', 'table',
    'floor lamp', 'clock', 'book', 'telephone', 'computer', 'television',
    'airplane', 'helicopter', 'train', 'bus', 'truck', 'speedboat', 'submarine',
    'umbrella', 'hat', 'shoe', 'sock', 'pants', 't-shirt', 'jacket', 'sweater',
    'key', 'scissors', 'knife', 'fork', 'spoon', 'cup', 'mug', 'wine glass',
    'pizza', 'hamburger', 'hot dog', 'apple', 'banana', 'strawberry', 'grapes',
    'pineapple', 'camera', 'microphone', 'headphones', 'violin', 'drums',
    'hammer', 'screwdriver', 'saw', 'drill', 'basketball', 'baseball',
    'soccer ball', 'tennis racket', 'door', 'mailbox', 'fire hydrant',
    'traffic light', 'lighthouse', 'windmill', 'castle', 'bridge', 'hospital',
    'ladder', 'candle', 'lantern', 'compass', 'hourglass', 'radio',
  ]),
}

// After raw results come back, filter to category and renormalize so bars
// show relative confidence within the chosen group.
function applyFilter(raw: Prediction[], filter: CategoryFilter): Prediction[] {
  if (filter === 'all') return raw
  const allowed  = CATEGORY_SETS[filter]
  const filtered = raw.filter(p => allowed.has(p.label))
  if (filtered.length === 0) return []
  const total    = filtered.reduce((s, p) => s + p.confidence, 0)
  return filtered.map(p => ({ ...p, confidence: total > 0 ? p.confidence / total : 0 }))
}

// ── Challenges ────────────────────────────────────────────────────────────────
const CHALLENGES: ChallengeSpec[] = [
  {
    target: 'circle', threshold: 0.70,
    hint: 'One smooth closed loop — not too small.',
    suggestedFilter: 'shape',
  },
  {
    target: 'star', threshold: 0.65,
    hint: 'Five sharp points radiating from the centre.',
    suggestedFilter: 'shape',
  },
  {
    target: 'lightning', threshold: 0.60,
    hint: 'A large jagged bolt — one big zig, then zag downward.',
    suggestedFilter: 'shape',
  },
  {
    target: 'moon', threshold: 0.55,
    hint: 'A crescent facing right. Leave the inner arc empty.',
    suggestedFilter: 'shape',
  },
  {
    target: 'cat', threshold: 0.50,
    hint: 'Round face, pointy ears, whiskers. The model finds this hard.',
    suggestedFilter: 'animal',
  },
]

// ── Button styles ─────────────────────────────────────────────────────────────
const OUTLINE_BTN: React.CSSProperties = {
  background: 'transparent',
  border: `1px solid ${ACCENT_DIM}`,
  borderRadius: 3,
  color: TEXT_MAIN,
  fontFamily: MONO,
  fontSize: '0.75rem',
  letterSpacing: '0.15em',
  padding: '0.6rem 1.2rem',
  cursor: 'pointer',
  transition: 'background 0.2s',
}

const FILLED_BTN: React.CSSProperties = {
  background: 'rgba(0,190,210,0.12)',
  border: `1px solid ${ACCENT_DIM}`,
  borderRadius: 3,
  color: TEXT_MAIN,
  fontFamily: MONO,
  fontSize: '0.75rem',
  letterSpacing: '0.15em',
  padding: '0.6rem 1.2rem',
  cursor: 'pointer',
  transition: 'background 0.2s',
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function NeuralPaint() {
  const [phase,              setPhase]             = useState<Phase>('briefing')
  const [mode,               setMode]              = useState<Mode>('explore')
  const [loadState,          setLoadState]         = useState<LoadState>('idle')
  const [predictions,        setPredictions]       = useState<Prediction[]>([])
  const [categoryFilter,     setCategoryFilter]    = useState<CategoryFilter>('all')
  const [challengeIdx,       setChallengeIdx]      = useState(0)
  const [challengeComplete,  setChallengeComplete] = useState(false)
  const [allComplete,        setAllComplete]       = useState(false)
  const [isEmpty,            setIsEmpty]           = useState(true)

  const canvasRef              = useRef<HTMLCanvasElement>(null)
  const classifierRef          = useRef<any>(null)
  const isDrawingRef           = useRef(false)
  const lastPosRef             = useRef<{ x: number; y: number } | null>(null)
  const debounceRef            = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ml5LoadedRef           = useRef(false)
  const isEmptyRef             = useRef(true)

  // Refs synced to state each render — safe inside stable event callbacks
  const modeRef                = useRef<Mode>('explore')
  const categoryFilterRef      = useRef<CategoryFilter>('all')
  const challengeIdxRef        = useRef(0)
  const challengeCompleteRef   = useRef(false)
  modeRef.current              = mode
  categoryFilterRef.current    = categoryFilter
  challengeIdxRef.current      = challengeIdx
  challengeCompleteRef.current = challengeComplete
  isEmptyRef.current           = isEmpty

  const challenge = CHALLENGES[challengeIdx]

  // ── Canvas helpers ────────────────────────────────────────────────────────

  function initCtx(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle   = '#fff'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    ctx.strokeStyle = '#111'
    ctx.lineWidth   = BRUSH_SIZE
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    initCtx(canvas.getContext('2d')!)
    setPredictions([])
    setIsEmpty(true)
    setChallengeComplete(false)
  }

  function getPos(e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) {
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const t = e.touches[0]
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY }
    }
    const m = e as MouseEvent
    return { x: (m.clientX - rect.left) * scaleX, y: (m.clientY - rect.top) * scaleY }
  }

  // ── Inference ─────────────────────────────────────────────────────────────

  function scheduleInference() {
    if (isEmptyRef.current) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(runInference, DEBOUNCE_MS)
  }

  async function runInference() {
    const classifier = classifierRef.current
    const canvas     = canvasRef.current
    if (!classifier || !canvas || isEmptyRef.current) return

    try {
      const raw: { label: string; confidence: number }[] =
        await classifier.classify(canvas, TOP_N)

      const allPreds: Prediction[] = raw.map(r => ({ label: r.label, confidence: r.confidence }))
      const filtered = applyFilter(allPreds, categoryFilterRef.current)
      const display  = filtered.slice(0, 3)

      setPredictions(display)

      // Challenge success — uses renormalized confidence so the filter genuinely helps
      if (modeRef.current === 'challenge' && !challengeCompleteRef.current) {
        const current = CHALLENGES[challengeIdxRef.current]
        const match   = filtered.find(p => p.label === current.target)
        if (match && match.confidence >= current.threshold) {
          setChallengeComplete(true)
        }
      }
    } catch {
      // silent — canvas may be cleared mid-inference
    }
  }

  // ── Model loading ─────────────────────────────────────────────────────────

  async function loadModel() {
    const ml5 = (window as any).ml5
    if (!ml5 || ml5LoadedRef.current) return
    ml5LoadedRef.current = true
    setLoadState('loading')
    try {
      classifierRef.current = await ml5.imageClassifier('DoodleNet')
      setLoadState('ready')
    } catch {
      setLoadState('error')
    }
  }

  // ── Canvas init ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing' || !canvasRef.current) return
    initCtx(canvasRef.current.getContext('2d')!)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drawing events ────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing') return
    const canvas = canvasRef.current
    if (!canvas) return

    function onDown(e: MouseEvent | TouchEvent) {
      e.preventDefault()
      isDrawingRef.current = true
      const pos = getPos(e, canvas!)
      lastPosRef.current = pos
      const ctx = canvas!.getContext('2d')!
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, BRUSH_SIZE / 2, 0, Math.PI * 2)
      ctx.fillStyle = '#111'
      ctx.fill()
      setIsEmpty(false)
      scheduleInference()
    }

    function onMove(e: MouseEvent | TouchEvent) {
      e.preventDefault()
      if (!isDrawingRef.current || !lastPosRef.current) return
      const pos = getPos(e, canvas!)
      const ctx = canvas!.getContext('2d')!
      ctx.beginPath()
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      lastPosRef.current = pos
      setIsEmpty(false)
      scheduleInference()
    }

    function onUp() {
      isDrawingRef.current = false
      lastPosRef.current   = null
    }

    canvas.addEventListener('mousedown',  onDown)
    canvas.addEventListener('mousemove',  onMove)
    canvas.addEventListener('mouseup',    onUp)
    canvas.addEventListener('mouseleave', onUp)
    canvas.addEventListener('touchstart', onDown as EventListener, { passive: false })
    canvas.addEventListener('touchmove',  onMove as EventListener, { passive: false })
    canvas.addEventListener('touchend',   onUp)

    return () => {
      canvas.removeEventListener('mousedown',  onDown)
      canvas.removeEventListener('mousemove',  onMove)
      canvas.removeEventListener('mouseup',    onUp)
      canvas.removeEventListener('mouseleave', onUp)
      canvas.removeEventListener('touchstart', onDown as EventListener)
      canvas.removeEventListener('touchmove',  onMove as EventListener)
      canvas.removeEventListener('touchend',   onUp)
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  // ── Actions ───────────────────────────────────────────────────────────────

  function nextChallenge() {
    if (challengeIdx + 1 >= CHALLENGES.length) {
      setAllComplete(true)
    } else {
      setChallengeIdx(i => i + 1)
      setChallengeComplete(false)
    }
    clearCanvas()
  }

  function switchMode(newMode: Mode) {
    setMode(newMode)
    setChallengeIdx(0)
    setChallengeComplete(false)
    setAllComplete(false)
    setCategoryFilter('all')
    clearCanvas()
  }

  const topPred = predictions[0]
  const filterActive = categoryFilter !== 'all'

  // ── Briefing ──────────────────────────────────────────────────────────────
  if (phase === 'briefing') {
    return (
      <main style={{ background: PAGE_BG, minHeight: '100vh', color: TEXT_MAIN, fontFamily: MONO, position: 'relative' }}>
        <Script src={ML5_CDN} onLoad={loadModel} />

        <Link
          href="/puzzles"
          style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', color: ACCENT_DIM, textDecoration: 'none', fontSize: '0.8rem', letterSpacing: '0.1em', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={e => (e.currentTarget.style.color = ACCENT_DIM)}
        >
          ← puzzles
        </Link>

        <div style={{ maxWidth: 680, margin: '0 auto', padding: '8rem 2rem 4rem' }}>
          <p style={{ fontSize: '0.68rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: ACCENT, marginBottom: '1.5rem' }}>
            SYSTEM BRIEFING — AI / MACHINE LEARNING
          </p>

          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', fontWeight: 'bold', fontStyle: 'italic', color: TEXT_MAIN, lineHeight: 1.1, marginBottom: '2.5rem' }}>
            Neural Paint
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '2.5rem' }}>
            {[
              'Inside this system lives a neural network trained on 50 million doodles drawn by people around the world — cats, stars, lightning bolts, crabs, and 340 other sketched concepts.',
              "It has never seen your hand. It doesn't know what you intend. It only sees the strokes you make, and tries to map them to what it has learned.",
              'Use the category filter to focus its attention — narrowing from 345 possibilities down to shapes, animals, or objects. Scores are renormalized within the group, so the signal becomes clearer.',
            ].map((text, i) => (
              <p key={i} style={{ fontFamily: SERIF, fontSize: '1rem', fontStyle: 'italic', color: TEXT_DIM, lineHeight: 1.75, margin: 0 }}>
                {text}
              </p>
            ))}
          </div>

          <div style={{ background: 'rgba(0,30,40,0.5)', border: '1px solid rgba(0,190,210,0.12)', borderRadius: 4, padding: '1.2rem 1.5rem', marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.28em', color: ACCENT, margin: '0 0 0.4rem' }}>
              MODES
            </p>
            {([
              ['EXPLORE',   'Draw anything. Filter by category. See what the model says.'],
              ['CHALLENGE', 'Draw a target to a confidence threshold to advance. Use the filter to focus.'],
            ] as [string, string][]).map(([label, desc]) => (
              <div key={label} style={{ display: 'flex', gap: '1.5rem', alignItems: 'baseline' }}>
                <span style={{ color: TEXT_MAIN, minWidth: 110, fontSize: '0.88rem' }}>{label}</span>
                <span style={{ color: TEXT_DIM, fontSize: '0.82rem', fontFamily: SERIF, fontStyle: 'italic' }}>{desc}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setPhase('playing')}
            style={{ background: 'rgba(0,190,210,0.10)', border: `1px solid ${ACCENT_DIM}`, borderRadius: 4, color: TEXT_MAIN, fontFamily: MONO, fontSize: '0.85rem', letterSpacing: '0.18em', padding: '0.75rem 2rem', cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,190,210,0.20)'; e.currentTarget.style.borderColor = ACCENT }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,190,210,0.10)'; e.currentTarget.style.borderColor = ACCENT_DIM }}
          >
            BEGIN →
          </button>
        </div>
      </main>
    )
  }

  // ── Playing ───────────────────────────────────────────────────────────────
  return (
    <main style={{ background: PAGE_BG, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: TEXT_MAIN, fontFamily: MONO }}>
      <Script src={ML5_CDN} onLoad={loadModel} />

      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.7rem 1.5rem', borderBottom: `1px solid rgba(0,190,210,0.12)`, flexShrink: 0 }}>
        <Link
          href="/puzzles"
          style={{ color: ACCENT_DIM, textDecoration: 'none', fontSize: '0.78rem', letterSpacing: '0.08em', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={e => (e.currentTarget.style.color = ACCENT_DIM)}
        >
          ← puzzles
        </Link>
        <span style={{ color: 'rgba(0,190,210,0.25)', fontSize: '0.7rem' }}>|</span>
        <span style={{ fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: ACCENT }}>
          Neural Paint
        </span>
        <span style={{ fontSize: '0.72rem', color: TEXT_DIM, fontFamily: SERIF, fontStyle: 'italic' }}>
          {mode === 'explore'
            ? '— explore mode'
            : `— challenge ${challengeIdx + 1} of ${CHALLENGES.length}`}
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: '0.62rem',
          letterSpacing: '0.18em',
          color: loadState === 'ready' ? 'rgba(100,210,150,0.7)'
               : loadState === 'error' ? 'rgba(210,80,60,0.7)'
               : ACCENT_DIM,
        }}>
          {loadState === 'idle'    ? 'MODEL: PENDING'
         : loadState === 'loading' ? 'MODEL: LOADING...'
         : loadState === 'ready'   ? 'MODEL: READY'
         :                           'MODEL: ERROR'}
        </span>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Left panel */}
        <div style={{ width: 290, flexShrink: 0, borderRight: `1px solid rgba(0,190,210,0.10)`, display: 'flex', flexDirection: 'column', padding: '1.25rem', gap: '1rem', overflowY: 'auto' }}>

          {/* Mode toggle */}
          <div>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.28em', color: ACCENT, marginBottom: '0.6rem' }}>MODE</p>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {(['explore', 'challenge'] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  style={{
                    flex: 1,
                    background: mode === m ? 'rgba(0,190,210,0.14)' : 'rgba(0,20,30,0.45)',
                    border: `1px solid ${mode === m ? ACCENT_DIM : 'rgba(0,190,210,0.12)'}`,
                    borderRadius: 3,
                    color: mode === m ? TEXT_MAIN : TEXT_DIM,
                    fontFamily: MONO,
                    fontSize: '0.68rem',
                    letterSpacing: '0.1em',
                    padding: '0.45rem 0.2rem',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.28em', color: ACCENT, marginBottom: '0.6rem' }}>
              CATEGORY FILTER
              {filterActive && (
                <span style={{ marginLeft: '0.5rem', color: 'rgba(100,210,150,0.7)', letterSpacing: '0.1em' }}>
                  — active
                </span>
              )}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
              {(['all', 'shape', 'animal', 'object'] as CategoryFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setCategoryFilter(f)}
                  style={{
                    background: categoryFilter === f ? 'rgba(0,190,210,0.14)' : 'rgba(0,20,30,0.45)',
                    border: `1px solid ${categoryFilter === f ? ACCENT_DIM : 'rgba(0,190,210,0.12)'}`,
                    borderRadius: 3,
                    color: categoryFilter === f ? TEXT_MAIN : TEXT_DIM,
                    fontFamily: MONO,
                    fontSize: '0.65rem',
                    letterSpacing: '0.08em',
                    padding: '0.4rem 0.2rem',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
            {filterActive && (
              <p style={{ fontSize: '0.68rem', fontFamily: SERIF, fontStyle: 'italic', color: TEXT_DIM, margin: '0.5rem 0 0', lineHeight: 1.45 }}>
                Scores renormalized within {categoryFilter}s.
              </p>
            )}
          </div>

          {/* Challenge target */}
          {mode === 'challenge' && !allComplete && (
            <div style={{ background: 'rgba(0,20,30,0.5)', border: `1px solid rgba(0,190,210,0.10)`, borderRadius: 4, padding: '1rem' }}>
              <p style={{ fontSize: '0.62rem', letterSpacing: '0.28em', color: ACCENT, margin: '0 0 0.6rem' }}>TARGET</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.65rem' }}>
                <span style={{ fontFamily: SERIF, fontSize: '2rem', fontStyle: 'italic', color: TEXT_MAIN, lineHeight: 1 }}>
                  {challenge.target}
                </span>
                <div>
                  <p style={{ fontSize: '0.7rem', color: TEXT_DIM, margin: '0 0 0.15rem', fontFamily: SERIF, fontStyle: 'italic' }}>confidence needed</p>
                  <p style={{ fontSize: '0.88rem', color: ACCENT, margin: 0, letterSpacing: '0.06em' }}>
                    {Math.round(challenge.threshold * 100)}%
                  </p>
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', fontFamily: SERIF, fontStyle: 'italic', color: TEXT_DIM, margin: '0 0 0.5rem', lineHeight: 1.5 }}>
                {challenge.hint}
              </p>
              {categoryFilter !== challenge.suggestedFilter && (
                <p style={{ fontSize: '0.65rem', letterSpacing: '0.08em', color: 'rgba(0,190,210,0.55)', margin: 0 }}>
                  Tip — try the {challenge.suggestedFilter.toUpperCase()} filter
                </p>
              )}
            </div>
          )}

          {/* Predictions */}
          <div>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.28em', color: ACCENT, marginBottom: '0.6rem' }}>
              {predictions.length === 0 ? 'WAITING FOR INPUT' : 'TOP PREDICTIONS'}
            </p>
            {predictions.length === 0 ? (
              <p style={{ color: TEXT_DIM, fontSize: '0.78rem', fontFamily: SERIF, fontStyle: 'italic', margin: 0 }}>
                {loadState === 'ready' ? 'Start drawing to see predictions.' : 'Waiting for model…'}
              </p>
            ) : filterActive && predictions.length === 0 ? (
              <p style={{ color: TEXT_DIM, fontSize: '0.78rem', fontFamily: SERIF, fontStyle: 'italic', margin: 0 }}>
                No {categoryFilter} predictions yet — keep drawing.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {predictions.map((pred, i) => {
                  const pct      = Math.round(pred.confidence * 100)
                  const isTarget = mode === 'challenge' && pred.label === challenge.target
                  const barColor = isTarget
                    ? ACCENT
                    : i === 0
                    ? 'rgba(140,200,220,0.65)'
                    : 'rgba(70,130,160,0.38)'
                  return (
                    <div key={pred.label + i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.78rem', color: isTarget ? ACCENT : TEXT_MAIN, letterSpacing: '0.04em' }}>
                          {pred.label}{isTarget ? ' ✓' : ''}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: TEXT_DIM }}>{pct}%</span>
                      </div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 2, transition: 'width 0.15s ease-out' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div style={{ flex: 1 }} />

          <button
            onClick={clearCanvas}
            style={{ ...OUTLINE_BTN, width: '100%', textAlign: 'center' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,190,210,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            CLEAR CANVAS
          </button>
        </div>

        {/* Right panel: canvas + overlays */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>

          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={{
              display: 'block',
              cursor: 'crosshair',
              borderRadius: 4,
              border: `1px solid rgba(0,190,210,0.18)`,
              boxShadow: '0 0 60px rgba(0,10,20,0.8)',
              backgroundColor: '#fff',
              width:  'min(65vh, 100%)',
              height: 'min(65vh, 100%)',
              aspectRatio: '1',
            }}
          />

          {/* Empty hint */}
          {isEmpty && loadState === 'ready' && (
            <div style={{ position: 'absolute', pointerEvents: 'none', textAlign: 'center' }}>
              <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: 'rgba(0,0,0,0.18)', fontSize: '1.1rem', margin: 0 }}>
                draw here
              </p>
            </div>
          )}

          {/* Loading overlay */}
          {loadState === 'loading' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,6,15,0.78)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
              <p style={{ fontFamily: MONO, fontSize: '0.72rem', letterSpacing: '0.42em', color: ACCENT, margin: 0 }}>
                LOADING MODEL...
              </p>
              <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: TEXT_DIM, fontSize: '0.85rem', margin: 0 }}>
                Fetching DoodleNet weights — 345 sketch categories
              </p>
            </div>
          )}

          {/* Error overlay */}
          {loadState === 'error' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,6,15,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
              <p style={{ fontSize: '0.62rem', letterSpacing: '0.42em', color: 'rgba(210,80,60,0.85)', margin: 0 }}>
                STATUS: MODEL ERROR
              </p>
              <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: TEXT_DIM, fontSize: '0.9rem', margin: 0, textAlign: 'center', maxWidth: 320 }}>
                Failed to load DoodleNet. Check your connection and reload.
              </p>
            </div>
          )}

          {/* Challenge success overlay */}
          {mode === 'challenge' && challengeComplete && !allComplete && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,6,15,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
              <p style={{ fontSize: '0.62rem', letterSpacing: '0.42em', color: 'rgba(100,210,150,0.8)', margin: 0 }}>
                STATUS: CLASSIFIED
              </p>
              <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem, 5vw, 3rem)', fontStyle: 'italic', color: TEXT_MAIN, margin: 0 }}>
                Challenge {challengeIdx + 1} Complete
              </h2>
              <p style={{ fontFamily: SERIF, fontSize: '0.9rem', fontStyle: 'italic', color: TEXT_DIM, margin: 0 }}>
                The model recognised your {challenge.target} with {topPred ? Math.round(topPred.confidence * 100) : 0}% confidence.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  onClick={() => { setChallengeComplete(false); clearCanvas() }}
                  style={OUTLINE_BTN}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,190,210,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  RETRY
                </button>
                <button
                  onClick={nextChallenge}
                  style={FILLED_BTN}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,190,210,0.24)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,190,210,0.12)')}
                >
                  NEXT CHALLENGE →
                </button>
              </div>
            </div>
          )}

          {/* All complete overlay */}
          {mode === 'challenge' && allComplete && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,6,15,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
              <p style={{ fontSize: '0.62rem', letterSpacing: '0.42em', color: 'rgba(100,210,150,0.8)', margin: 0 }}>
                STATUS: ALL COMPLETE
              </p>
              <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem, 5vw, 3rem)', fontStyle: 'italic', color: TEXT_MAIN, margin: 0 }}>
                Neural Paint Solved
              </h2>
              <p style={{ fontFamily: SERIF, fontSize: '0.9rem', fontStyle: 'italic', color: TEXT_DIM, margin: 0, textAlign: 'center', maxWidth: 380 }}>
                You&apos;ve learned to speak in a language the model understands. Switch to explore mode — there are 340 more categories to discover.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  onClick={() => switchMode('explore')}
                  style={OUTLINE_BTN}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,190,210,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  EXPLORE MODE
                </button>
                <Link
                  href="/puzzles"
                  style={{ ...FILLED_BTN, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                >
                  BACK TO PUZZLES
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}
