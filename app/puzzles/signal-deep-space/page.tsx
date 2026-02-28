'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'

// 1679 = 23 × 73  (both prime — unique factorisation)
const TOTAL_BITS  = 1679
const COLS        = 23
const ROWS        = 73
const CELL        = 9   // px per cell

// ── Payload ───────────────────────────────────────────────────────────────────
// Generates a 23×73 image inspired by the 1974 Arecibo message structure.
function generatePayload(): number[] {
  const b = new Array(TOTAL_BITS).fill(0)

  const set = (r: number, c: number) => {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) b[r * COLS + c] = 1
  }
  const fill = (r: number, c1: number, c2: number) => {
    for (let c = c1; c <= c2; c++) set(r, c)
  }

  // Numbers 1–5 (rows 0–2): regular marks
  for (let i = 0; i < 5; i++) set(1, i * 4 + 1)
  for (let i = 0; i < 5; i++) { set(0, i * 4); set(2, i * 4) }

  // Atomic numbers H=1 C=6 N=7 O=8 P=15 in 4-bit binary (rows 5–8)
  const elements = [1, 6, 7, 8, 15]
  elements.forEach((el, e) => {
    const c = e * 4
    for (let bit = 0; bit < 4; bit++) {
      if ((el >> (3 - bit)) & 1) set(5 + bit, c)
    }
  })

  // Double helix (rows 12–38, 4 full cycles)
  for (let r = 12; r <= 38; r++) {
    const phase = ((r - 12) / 26) * Math.PI * 4
    const lc = Math.round(11 + 9 * Math.sin(phase))
    const rc = Math.round(11 - 9 * Math.sin(phase))
    set(r, lc)
    set(r, rc)
    // Cross-links every 4 rows
    if ((r - 12) % 4 === 2) fill(r, Math.min(lc, rc), Math.max(lc, rc))
  }

  // Human figure (rows 42–58)
  fill(42, 10, 12)
  set(43, 9); set(43, 13)
  fill(44, 10, 12)
  set(45, 11)
  fill(46, 8, 14)
  for (let r = 47; r <= 50; r++) { set(r, 8); set(r, 14); set(r, 11) }
  fill(51, 8, 14)
  for (let r = 52; r <= 57; r++) { set(r, 9); set(r, 13) }
  set(58, 8); set(58, 14)

  // Solar system row 61: Sun + 8 planets; Earth double-marked row 62
  fill(61, 0, 2)
  set(61, 4)
  set(61, 6)
  set(61, 8); set(61, 9)   // Earth
  set(61, 11)
  set(61, 14)
  set(61, 17)
  set(61, 19)
  set(61, 21)
  set(62, 8); set(62, 9)   // Earth indicator

  // Telescope dish (rows 65–72)
  set(65, 11)
  set(66, 10); set(66, 12)
  set(67, 9);  set(67, 13)
  set(68, 8);  set(68, 14)
  fill(69, 5, 17)
  fill(70, 3, 19)
  fill(71, 1, 21)
  fill(72, 0, 22)

  return b
}

// ── Canvas renderer ───────────────────────────────────────────────────────────
function drawGrid(
  canvas: HTMLCanvasElement,
  bits: number[],
  width: number,
  height: number,
  glowing: boolean,
) {
  canvas.width  = width  * CELL
  canvas.height = height * CELL
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (glowing) {
    ctx.shadowColor = 'rgba(0,220,255,0.65)'
    ctx.shadowBlur  = 4
  }

  for (let i = 0; i < bits.length; i++) {
    const row = Math.floor(i / width)
    const col = i % width
    ctx.fillStyle = bits[i]
      ? glowing ? 'rgba(50,245,255,1)' : 'rgba(0,220,255,0.95)'
      : 'rgba(4,12,24,0.95)'
    ctx.fillRect(col * CELL, row * CELL, CELL - 1, CELL - 1)
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────
const PAGE_BG  = '#02050e'
const MONO     = 'var(--font-geist-mono, monospace)'
const SERIF    = "'Times New Roman', Times, serif"
const GRAIN_URI =
  "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"

// ── Component ─────────────────────────────────────────────────────────────────
type Stage = 'incoming' | 'decode' | 'solved'

export default function SignalFromDeepSpace() {
  const bits = useMemo(generatePayload, [])

  const [stage,       setStage]       = useState<Stage>('incoming')
  const [widthInput,  setWidthInput]  = useState('')
  const [renderWidth, setRenderWidth] = useState<number | null>(null)
  const [error,       setError]       = useState('')
  const [hintVisible, setHintVisible] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hint appears after 60 s on decode stage
  useEffect(() => {
    if (stage !== 'decode') return
    hintTimer.current = setTimeout(() => setHintVisible(true), 60_000)
    return () => { if (hintTimer.current) clearTimeout(hintTimer.current) }
  }, [stage])

  // Redraw canvas when renderWidth or solved state changes
  useEffect(() => {
    if (!renderWidth || !canvasRef.current) return
    const h = TOTAL_BITS / renderWidth
    drawGrid(canvasRef.current, bits, renderWidth, h, stage === 'solved')
  }, [bits, renderWidth, stage])

  const renderHeight = renderWidth ? TOTAL_BITS / renderWidth : null
  // Only show canvas when dimensions produce a sensible grid (≤ 300 in each axis)
  const canvasVisible = renderWidth !== null && renderWidth <= 300 && (renderHeight ?? 9999) <= 300

  function handleRender() {
    const w = parseInt(widthInput, 10)
    if (isNaN(w) || w < 1 || w > TOTAL_BITS) {
      setError('Enter a positive integer between 1 and 1679')
      return
    }
    if (TOTAL_BITS % w !== 0) {
      setError(`1,679 bits cannot be divided evenly into rows of ${w}`)
      return
    }
    setError('')
    setRenderWidth(w)
    if (w === COLS) setStage('solved')
  }

  // ── INCOMING ──────────────────────────────────────────────────────────────
  if (stage === 'incoming') {
    return (
      <main style={{
        minHeight: '100vh', background: PAGE_BG,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', position: 'relative',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${GRAIN_URI}")`, backgroundSize: '200px', opacity: 0.09, pointerEvents: 'none' }} />

        <Link
          href="/puzzles"
          style={{ position: 'absolute', top: '1.8rem', left: '2rem', fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.15em', color: 'rgba(0,190,210,0.5)', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(0,215,235,1)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,190,210,0.5)')}
        >
          ← puzzles
        </Link>

        <div style={{ maxWidth: '540px', width: '100%', border: '1px solid rgba(0,190,210,0.16)', borderRadius: '4px', padding: '2.5rem 2.4rem 2.2rem', background: 'rgba(0,30,50,0.28)' }}>
          <p style={{ fontFamily: MONO, fontSize: '0.52rem', letterSpacing: '0.34em', color: 'rgba(0,190,210,0.4)', marginBottom: '0.5rem' }}>
            SSIP EXPLORATORIUM
          </p>
          <h1 style={{ fontFamily: MONO, fontSize: 'clamp(1.1rem, 3vw, 1.55rem)', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
            SIGNAL DETECTED
          </h1>
          <div style={{ height: '1px', background: 'rgba(0,190,210,0.18)', margin: '0.8rem 0 1.4rem' }} />

          {/* Raw bit preview */}
          <div style={{ background: 'rgba(0,10,20,0.75)', border: '1px solid rgba(0,190,210,0.1)', borderRadius: '3px', padding: '0.8rem 1rem', marginBottom: '1.5rem' }}>
            <pre style={{ fontFamily: MONO, fontSize: '0.56rem', color: 'rgba(0,190,210,0.45)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {bits.slice(0, 280).join('')}<span style={{ color: 'rgba(0,190,210,0.18)' }}>…</span>
            </pre>
          </div>

          {/* Metadata table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
            {([
              ['PAYLOAD',  '1,679 bits'],
              ['SOURCE',   'Undetermined'],
              ['ENCODING', 'Binary'],
              ['STATUS',   'Awaiting decode'],
            ] as const).map(([k, v]) => (
              <tr key={k}>
                <td style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.12em', color: 'rgba(0,190,210,0.45)', paddingBottom: '0.5rem', paddingRight: '2rem', whiteSpace: 'nowrap' }}>{k}</td>
                <td style={{ fontFamily: MONO, fontSize: '0.6rem', color: 'rgba(255,255,255,0.65)', paddingBottom: '0.5rem' }}>{v}</td>
              </tr>
            ))}
          </table>

          <button
            onClick={() => setStage('decode')}
            style={{ width: '100%', padding: '0.85rem', fontFamily: MONO, fontSize: '0.63rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(0,210,230,0.9)', background: 'transparent', border: '1px solid rgba(0,190,210,0.4)', borderRadius: '3px', cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,190,210,0.09)'; e.currentTarget.style.borderColor = 'rgba(0,210,230,0.75)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(0,190,210,0.4)' }}
          >
            Decode Transmission
          </button>
        </div>
      </main>
    )
  }

  // ── DECODE / SOLVED ────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', background: PAGE_BG, padding: '2rem 2.5rem', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${GRAIN_URI}")`, backgroundSize: '200px', opacity: 0.09, pointerEvents: 'none' }} />

      <Link
        href="/puzzles"
        style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.15em', color: 'rgba(0,190,210,0.5)', textDecoration: 'none', display: 'inline-block', marginBottom: '2.5rem', position: 'relative' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(0,215,235,1)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,190,210,0.5)')}
      >
        ← puzzles
      </Link>

      <div style={{ display: 'flex', gap: '3.5rem', alignItems: 'flex-start', flexWrap: 'wrap', position: 'relative' }}>

        {/* ── LEFT: Controls ── */}
        <div style={{ flex: '0 0 280px', minWidth: '230px' }}>
          <p style={{ fontFamily: MONO, fontSize: '0.52rem', letterSpacing: '0.3em', color: 'rgba(0,190,210,0.38)', marginBottom: '0.4rem' }}>SIGNAL DECODE</p>
          <h2 style={{ fontFamily: MONO, fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: '0.25rem', letterSpacing: '0.04em' }}>
            Signal from Deep Space
          </h2>
          <div style={{ height: '1px', background: 'rgba(0,190,210,0.16)', margin: '0.7rem 0 1.3rem' }} />

          <p style={{ fontFamily: SERIF, fontSize: '0.82rem', fontStyle: 'italic', color: 'rgba(180,210,230,0.55)', lineHeight: 1.75, marginBottom: '1.5rem' }}>
            The binary sequence can be arranged into a 2D grid. The correct dimensions will reveal a hidden image.
          </p>

          <p style={{ fontFamily: MONO, fontSize: '0.55rem', letterSpacing: '0.12em', color: 'rgba(0,190,210,0.4)', marginBottom: '0.3rem' }}>PAYLOAD</p>
          <p style={{ fontFamily: MONO, fontSize: '1.15rem', fontWeight: 700, color: 'rgba(255,255,255,0.78)', letterSpacing: '0.06em', marginBottom: '1.6rem' }}>
            1,679 bits
          </p>

          <label style={{ fontFamily: MONO, fontSize: '0.56rem', letterSpacing: '0.16em', color: 'rgba(0,190,210,0.45)', display: 'block', marginBottom: '0.45rem' }}>
            COLUMNS (WIDTH)
          </label>
          <div style={{ display: 'flex', gap: '0.55rem', marginBottom: '0.55rem' }}>
            <input
              type="number"
              min="1"
              max="1679"
              value={widthInput}
              onChange={e => setWidthInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRender()}
              placeholder="e.g. 23"
              style={{ flex: 1, fontFamily: MONO, fontSize: '0.9rem', background: 'rgba(0,18,32,0.8)', border: '1px solid rgba(0,190,210,0.28)', borderRadius: '3px', color: 'rgba(255,255,255,0.9)', padding: '0.5rem 0.7rem', outline: 'none', minWidth: 0 }}
            />
            <button
              onClick={handleRender}
              style={{ padding: '0.5rem 1rem', fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(0,210,230,0.88)', background: 'transparent', border: '1px solid rgba(0,190,210,0.38)', borderRadius: '3px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,190,210,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              Render
            </button>
          </div>

          {renderHeight !== null && (
            <p style={{ fontFamily: MONO, fontSize: '0.57rem', color: 'rgba(0,190,210,0.45)', marginBottom: '0.55rem', letterSpacing: '0.1em' }}>
              → {renderWidth} × {renderHeight} grid
            </p>
          )}

          {error && (
            <p style={{ fontFamily: MONO, fontSize: '0.58rem', color: 'rgba(255,90,90,0.82)', lineHeight: 1.55, marginBottom: '0.6rem' }}>
              {error}
            </p>
          )}

          {/* Hint — appears after 60 s */}
          {hintVisible && stage !== 'solved' && (
            <div style={{ marginTop: '1.6rem', padding: '0.9rem 1rem', background: 'rgba(0,100,120,0.1)', border: '1px solid rgba(0,190,210,0.14)', borderRadius: '3px' }}>
              <p style={{ fontFamily: MONO, fontSize: '0.52rem', letterSpacing: '0.18em', color: 'rgba(0,190,210,0.45)', marginBottom: '0.45rem' }}>HINT</p>
              <p style={{ fontFamily: SERIF, fontSize: '0.78rem', fontStyle: 'italic', color: 'rgba(180,210,230,0.6)', lineHeight: 1.65, margin: 0 }}>
                1,679 is not arbitrary. Try expressing it as a product of two prime numbers.
              </p>
            </div>
          )}

          {/* Solve reveal */}
          {stage === 'solved' && (
            <div style={{ marginTop: '1.8rem', padding: '1.1rem 1rem', background: 'rgba(0,120,140,0.1)', border: '1px solid rgba(0,190,210,0.22)', borderRadius: '3px' }}>
              <p style={{ fontFamily: MONO, fontSize: '0.52rem', letterSpacing: '0.2em', color: 'rgba(0,220,255,0.65)', marginBottom: '0.65rem' }}>
                SIGNAL DECODED
              </p>
              <p style={{ fontFamily: SERIF, fontSize: '0.8rem', fontStyle: 'italic', color: 'rgba(200,235,255,0.7)', lineHeight: 1.8, margin: 0 }}>
                This image is inspired by the{' '}
                <strong style={{ fontStyle: 'normal', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Arecibo Message</strong>
                , broadcast from Earth in 1974 toward the globular cluster M13, 25,000 light-years away.
                Its 1,679 bits were chosen because 1,679 = 23 × 73 — both prime — making the grid dimensions
                unique. The image encodes binary counting, atomic elements, a DNA double helix, a human figure,
                our solar system, and the radio telescope that sent it.
              </p>
            </div>
          )}
        </div>

        {/* ── RIGHT: Grid ── */}
        <div style={{ flex: '1 1 200px', position: 'relative' }}>
          {canvasVisible && (
            <>
              <p style={{ fontFamily: MONO, fontSize: '0.52rem', letterSpacing: '0.2em', color: stage === 'solved' ? 'rgba(0,220,255,0.65)' : 'rgba(255,255,255,0.22)', marginBottom: '0.7rem', transition: 'color 0.6s' }}>
                {stage === 'solved' ? 'PATTERN IDENTIFIED' : `${renderWidth} \u00d7 ${renderHeight}`}
              </p>
              <div style={{
                display: 'inline-block',
                padding: '8px',
                background: 'rgba(0,8,18,0.9)',
                border: `1px solid ${stage === 'solved' ? 'rgba(0,210,255,0.32)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '4px',
                boxShadow: stage === 'solved' ? '0 0 32px rgba(0,180,210,0.14)' : 'none',
                transition: 'border-color 0.6s, box-shadow 0.6s',
              }}>
                <canvas ref={canvasRef} style={{ display: 'block' }} />
              </div>
            </>
          )}

          {renderWidth !== null && !canvasVisible && (
            <div style={{ padding: '1.2rem', background: 'rgba(0,10,20,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', maxWidth: '340px' }}>
              <p style={{ fontFamily: MONO, fontSize: '0.6rem', color: 'rgba(255,200,80,0.65)', lineHeight: 1.7, margin: 0 }}>
                At {renderWidth} × {renderHeight}, the arrangement is too elongated to show a meaningful pattern.
                Try a different width.
              </p>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
