'use client'

import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'

// ── Palette ───────────────────────────────────────────────────────────────────
const PAGE_BG    = '#030212'
const ACCENT     = 'rgba(148,108,248,0.95)'
const ACCENT_MED = 'rgba(128,92,232,0.55)'
const ACCENT_DIM = 'rgba(110,82,220,0.22)'
const MONO       = 'var(--font-geist-mono, monospace)'
const SERIF      = '"Times New Roman", Times, serif'

// ── SVG chart layout ──────────────────────────────────────────────────────────
const SVG_W  = 900
const SVG_H  = 240
const PAD_L  = 72
const PAD_R  = 20
const PAD_T  = 18
const PAD_B  = 44
const PLOT_W = SVG_W - PAD_L - PAD_R   // 808
const PLOT_H = SVG_H - PAD_T - PAD_B   // 178

// ── Types ─────────────────────────────────────────────────────────────────────
type GamePhase = 'briefing' | 'playing' | 'reveal'

interface LevelDef {
  id: number
  name: string
  subtitle: string
  period: number
  depth: number
  firstTransit: number
  transitDuration: number
  totalDays: number
  noiseAmp: number
  seed: number
  hint: string
  comparisonPlanet: string
  comparisonPeriod: string
}

// ── Level definitions ─────────────────────────────────────────────────────────
const LEVELS: LevelDef[] = [
  {
    id: 1,
    name: 'Level 1 — First Contact',
    subtitle: 'Strong transit signal detected. Identify the orbital period.',
    period: 4.8,
    depth: 0.022,
    firstTransit: 1.3,
    transitDuration: 0.18,
    totalDays: 25,
    noiseAmp: 0.0008,
    seed: 42,
    hint: 'Mark the center of two or more dips. The period is the time between consecutive transits.',
    comparisonPlanet: 'Kepler-4b',
    comparisonPeriod: '3.2 days',
  },
  {
    id: 2,
    name: 'Level 2 — Distant Signal',
    subtitle: 'Faint, longer-period signal. Careful observation required.',
    period: 7.3,
    depth: 0.012,
    firstTransit: 1.0,
    transitDuration: 0.26,
    totalDays: 42,
    noiseAmp: 0.0016,
    seed: 137,
    hint: 'Shallower dips are harder to see. Watch the baseline and mark the lowest point of each dip.',
    comparisonPlanet: 'Kepler-7b',
    comparisonPeriod: '4.9 days',
  },
  {
    id: 3,
    name: 'Level 3 — Deep Survey',
    subtitle: 'Long baseline, subtle signal. Precision is everything.',
    period: 12.5,
    depth: 0.006,
    firstTransit: 3.1,
    transitDuration: 0.38,
    totalDays: 60,
    noiseAmp: 0.002,
    seed: 1729,
    hint: 'Noise may obscure the dips. The widest, deepest local minima are transits.',
    comparisonPlanet: 'Kepler-20e',
    comparisonPeriod: '6.1 days',
  },
]

// ── Light curve generator ─────────────────────────────────────────────────────
function generateCurve(lv: LevelDef): { t: number; flux: number }[] {
  const N = 900
  let rng = lv.seed | 0

  function rand(): number {
    rng = (Math.imul(rng, 1664525) + 1013904223) | 0
    return (rng >>> 0) / 0xffffffff
  }

  return Array.from({ length: N }, (_, i) => {
    const t = (i / (N - 1)) * lv.totalDays
    const n = (rand() - 0.5) * 2 * lv.noiseAmp
    let flux = 1.0 + n

    // Phase relative to nearest transit (0 = mid-transit)
    let phase = ((t - lv.firstTransit) % lv.period + lv.period) % lv.period
    if (phase > lv.period / 2) phase -= lv.period

    const h = lv.transitDuration / 2
    if (Math.abs(phase) < h) {
      const x   = Math.abs(phase) / h   // 0 = center, 1 = limb
      const ing = 0.22                  // ingress/egress fraction
      if (x <= 1 - ing) {
        flux -= lv.depth
      } else {
        flux -= lv.depth * (1 - x) / ing
      }
    }

    return { t, flux }
  })
}

// ── Decorative stars (deterministic) ──────────────────────────────────────────
const STARS: { cx: number; cy: number; r: number; opacity: number }[] = (() => {
  let s = 9999
  function rng() {
    return ((s = (Math.imul(s, 1664525) + 1013904223) | 0) >>> 0) / 0xffffffff
  }
  return Array.from({ length: 60 }, () => ({
    cx: rng() * SVG_W,
    cy: rng() * SVG_H,
    r:  rng() < 0.18 ? 1.1 : 0.55,
    opacity: 0.08 + rng() * 0.2,
  }))
})()

// ── Coordinate helpers ────────────────────────────────────────────────────────
function tX(t: number, totalDays: number): number {
  return PAD_L + (t / totalDays) * PLOT_W
}
function fY(flux: number, fMin: number, fRange: number): number {
  return PAD_T + (1 - (flux - fMin) / fRange) * PLOT_H
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ExoplanetDetective() {
  const [levelIdx,    setLevelIdx]    = useState(0)
  const [gamePhase,   setGamePhase]   = useState<GamePhase>('briefing')
  const [markers,     setMarkers]     = useState<number[]>([])
  const [cursorX,     setCursorX]     = useState<number | null>(null)
  const [submitted,   setSubmitted]   = useState(false)
  const [isCorrect,   setIsCorrect]   = useState(false)
  const [calcPeriod,  setCalcPeriod]  = useState<number | null>(null)

  const svgRef = useRef<SVGSVGElement>(null)
  const level  = LEVELS[levelIdx]

  const curve = useMemo(() => generateCurve(level), [level])

  // Flux scale
  const [fMin, fMax] = useMemo(() => {
    const vals  = curve.map(p => p.flux)
    const min   = Math.min(...vals)
    const max   = Math.max(...vals)
    const pad   = (max - min) * 0.18
    return [min - pad, max + pad]
  }, [curve])
  const fRange = fMax - fMin

  // Transit centers for snap + reveal highlights
  const transitCenters = useMemo(() => {
    const cs: number[] = []
    let t = level.firstTransit
    while (t <= level.totalDays + 0.5) {
      if (t >= 0) cs.push(t)
      t += level.period
    }
    return cs
  }, [level])

  // SVG path string
  const pathD = useMemo(() => {
    return curve.map((p, i) => {
      const x = tX(p.t, level.totalDays).toFixed(1)
      const y = fY(p.flux, fMin, fRange).toFixed(1)
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    }).join(' ')
  }, [curve, level.totalDays, fMin, fRange])

  // Measured period: average spacing across all markers
  const measuredPeriod = useMemo(() => {
    if (markers.length < 2) return null
    const sorted = [...markers].sort((a, b) => a - b)
    return (sorted[sorted.length - 1] - sorted[0]) / (sorted.length - 1)
  }, [markers])

  // SVG interaction
  const svgToSvgX = useCallback((clientX: number): number | null => {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const x = (clientX - rect.left) * (SVG_W / rect.width)
    return x >= PAD_L && x <= SVG_W - PAD_R ? x : null
  }, [])

  const svgXtoTime = useCallback((svgX: number): number => {
    return ((svgX - PAD_L) / PLOT_W) * level.totalDays
  }, [level.totalDays])

  const handleSvgMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    setCursorX(svgToSvgX(e.clientX))
  }, [svgToSvgX])

  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (submitted) return
    const svgX = svgToSvgX(e.clientX)
    if (svgX === null) return

    // Check y is within plot area
    const svg  = svgRef.current!
    const rect = svg.getBoundingClientRect()
    const svgY = (e.clientY - rect.top) * (SVG_H / rect.height)
    if (svgY < PAD_T || svgY > SVG_H - PAD_B) return

    let t = svgXtoTime(svgX)

    // Snap to nearest transit center within a comfortable radius
    // Use fixed pixel radius of 14px converted to time
    const pixPerDay  = PLOT_W / level.totalDays
    const snapRadius = Math.max(14 / pixPerDay, level.transitDuration * 0.8)
    let bestDist = snapRadius + 1
    for (const tc of transitCenters) {
      const d = Math.abs(t - tc)
      if (d < snapRadius && d < bestDist) {
        bestDist = d
        t = tc
      }
    }

    // Toggle if an existing marker is at this position
    const existingIdx = markers.findIndex(m => Math.abs(m - t) < 0.001)
    if (existingIdx !== -1) {
      setMarkers(prev => prev.filter((_, i) => i !== existingIdx))
    } else {
      setMarkers(prev => [...prev, t])
    }
  }, [submitted, svgToSvgX, svgXtoTime, level.totalDays, level.transitDuration, transitCenters, markers])

  const handleSubmit = useCallback(() => {
    if (!measuredPeriod) return
    // Accept if measured period (or a simple integer divisor of it) matches within 15%
    const candidates = [measuredPeriod, measuredPeriod / 2, measuredPeriod / 3]
    const ok = candidates.some(c => Math.abs(c - level.period) / level.period < 0.15)
    setCalcPeriod(measuredPeriod)
    setIsCorrect(ok)
    setSubmitted(true)
    setGamePhase('reveal')
  }, [measuredPeriod, level.period])

  // Planet radius estimate: r_p/r_* = sqrt(depth), assume R_* = 109.2 R_Earth (sun-like)
  const planetRadiusEarth = useMemo(() => {
    return (Math.sqrt(level.depth) * 109.2).toFixed(1)
  }, [level.depth])

  // Axis ticks
  const xTicks = useMemo(() => {
    const step = level.totalDays <= 30 ? 5 : 10
    const ts: number[] = []
    for (let t = 0; t <= level.totalDays + 0.01; t += step) ts.push(t)
    return ts
  }, [level.totalDays])

  const yTicks = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => fMin + (i / 4) * fRange)
  }, [fMin, fRange])

  // Reset state on level change
  useEffect(() => {
    setMarkers([])
    setSubmitted(false)
    setIsCorrect(false)
    setCalcPeriod(null)
    setGamePhase('briefing')
  }, [levelIdx])

  // ── Shared back link ─────────────────────────────────────────────────────────
  const backLink = (
    <Link
      href="/puzzles"
      style={{
        fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.9rem',
        color: ACCENT_MED, textDecoration: 'none',
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        transition: 'color 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
      onMouseLeave={e => (e.currentTarget.style.color = ACCENT_MED)}
    >
      ← puzzles
    </Link>
  )

  // ── Level selector buttons ────────────────────────────────────────────────────
  const levelButtons = (small: boolean) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {LEVELS.map((l, i) => (
        <button
          key={i}
          onClick={() => setLevelIdx(i)}
          style={{
            fontFamily: MONO,
            fontSize: small ? '0.65rem' : '0.7rem',
            padding: small ? '0.3rem 0.65rem' : '0.4rem 0.85rem',
            border: `1px solid ${i === levelIdx ? ACCENT_MED : ACCENT_DIM}`,
            borderRadius: 3,
            background: i === levelIdx ? 'rgba(140,100,240,0.14)' : 'transparent',
            color: i === levelIdx ? ACCENT : 'rgba(140,100,240,0.4)',
            cursor: 'pointer',
            letterSpacing: '0.06em',
          }}
        >
          {small ? `L${l.id}` : `Level ${l.id}`}
        </button>
      ))}
    </div>
  )

  // ── Briefing screen ───────────────────────────────────────────────────────────
  if (gamePhase === 'briefing') {
    const signalStr = level.depth >= 0.02 ? 'Strong' : level.depth >= 0.01 ? 'Moderate' : 'Faint'
    const noiseStr  = level.noiseAmp >= 0.002 ? 'High' : level.noiseAmp >= 0.0015 ? 'Moderate' : 'Low'
    const nTransits = Math.floor((level.totalDays - level.firstTransit) / level.period) + 1

    return (
      <main style={{
        minHeight: '100vh', background: PAGE_BG,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: MONO, padding: '2rem',
      }}>
        <div style={{ position: 'fixed', top: '1.5rem', left: '2rem' }}>{backLink}</div>

        <div style={{ maxWidth: 580, width: '100%' }}>
          <p style={{
            fontSize: '0.72rem', letterSpacing: '0.28em', textTransform: 'uppercase',
            color: ACCENT_MED, marginBottom: '1rem',
          }}>
            SSIP Exploratorium — Space
          </p>

          <h1 style={{
            fontFamily: SERIF, fontStyle: 'italic',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            color: 'rgba(210,215,255,0.92)', marginBottom: '0.3rem', fontWeight: 'bold',
          }}>
            Exoplanet Detective
          </h1>

          <p style={{
            fontSize: '0.72rem', letterSpacing: '0.22em', textTransform: 'uppercase',
            color: ACCENT_MED, marginBottom: '2.5rem',
          }}>
            {level.name}
          </p>

          <div style={{
            border: `1px solid ${ACCENT_DIM}`, borderRadius: 6,
            padding: '1.5rem 1.6rem', marginBottom: '2rem',
            background: 'rgba(140,100,240,0.04)',
          }}>
            <p style={{
              fontSize: '0.86rem', lineHeight: 1.9, color: 'rgba(200,210,255,0.72)',
              marginBottom: '1.1rem',
            }}>
              Your mission: analyze a stellar light curve — a record of a star&rsquo;s brightness over
              time. When a planet passes in front of its host star (a <em>transit</em>), it causes a
              tiny, periodic dip in brightness.
            </p>
            <p style={{ fontSize: '0.86rem', lineHeight: 1.9, color: 'rgba(200,210,255,0.72)', marginBottom: 0 }}>
              Mark the center of two or more transit dips on the chart. The game auto-calculates
              the orbital period from your markers. A measurement within 15% of the true value
              confirms the detection.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', marginBottom: '2.5rem',
          }}>
            {([
              ['Signal strength',   signalStr],
              ['Observation window', `${level.totalDays} days`],
              ['Noise level',       noiseStr],
              ['Expected transits', `~${nTransits} visible`],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} style={{ borderTop: `1px solid ${ACCENT_DIM}`, paddingTop: '0.6rem' }}>
                <p style={{
                  fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: ACCENT_MED, marginBottom: '0.25rem',
                }}>
                  {label}
                </p>
                <p style={{ fontSize: '0.88rem', color: 'rgba(210,215,255,0.82)' }}>{value}</p>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '1.8rem' }}>
            {levelButtons(false)}
          </div>

          <button
            onClick={() => setGamePhase('playing')}
            style={{
              fontFamily: MONO, fontSize: '0.78rem', letterSpacing: '0.18em',
              textTransform: 'uppercase', padding: '0.75rem 2rem',
              border: `1px solid ${ACCENT_MED}`, borderRadius: 4,
              background: 'rgba(140,100,240,0.1)', color: ACCENT,
              cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(140,100,240,0.22)'
              e.currentTarget.style.borderColor = ACCENT
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(140,100,240,0.1)'
              e.currentTarget.style.borderColor = ACCENT_MED
            }}
          >
            Begin Analysis
          </button>
        </div>
      </main>
    )
  }

  // ── Playing / Reveal screen ───────────────────────────────────────────────────
  return (
    <main style={{
      minHeight: '100vh', background: PAGE_BG,
      color: 'rgba(210,215,255,0.82)', fontFamily: MONO,
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 2rem', borderBottom: `1px solid ${ACCENT_DIM}`,
      }}>
        {backLink}
        <div style={{
          fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'rgba(140,120,220,0.45)',
        }}>
          Exoplanet Detective — {level.name}
        </div>
        {levelButtons(true)}
      </div>

      {/* Reveal panel */}
      {gamePhase === 'reveal' && (
        <div style={{
          margin: '1.4rem 2rem',
          padding: '1.2rem 1.6rem',
          border: `1px solid ${isCorrect ? 'rgba(100,220,100,0.3)' : 'rgba(220,80,80,0.3)'}`,
          borderRadius: 6,
          background: isCorrect ? 'rgba(40,180,40,0.05)' : 'rgba(200,50,50,0.05)',
        }}>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '1.5rem',
            alignItems: 'flex-start', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{
                fontSize: '0.62rem', letterSpacing: '0.22em', textTransform: 'uppercase',
                color: isCorrect ? 'rgba(100,220,100,0.8)' : 'rgba(220,80,80,0.8)',
                marginBottom: '0.55rem',
              }}>
                {isCorrect ? 'Transit Confirmed' : 'Measurement Off'}
              </p>
              <p style={{ fontSize: '0.9rem', color: 'rgba(210,215,255,0.85)', marginBottom: '0.35rem' }}>
                Your measurement:{' '}
                <strong style={{ color: 'rgba(220,200,255,0.95)' }}>
                  {calcPeriod?.toFixed(2)} days
                </strong>
              </p>
              <p style={{ fontSize: '0.9rem', color: 'rgba(210,215,255,0.85)', marginBottom: '0.35rem' }}>
                True period:{' '}
                <strong style={{ color: 'rgba(220,200,255,0.95)' }}>
                  {level.period.toFixed(1)} days
                </strong>
              </p>
              {isCorrect && (
                <p style={{
                  fontSize: '0.82rem', color: 'rgba(180,200,255,0.55)',
                  marginTop: '0.65rem', lineHeight: 1.7,
                }}>
                  Transit depth {(level.depth * 100).toFixed(2)}% →
                  estimated planet radius ≈{' '}
                  <strong style={{ color: 'rgba(200,180,255,0.8)' }}>
                    {planetRadiusEarth} R⊕
                  </strong>
                  {' '}(assuming a sun-like host star)
                </p>
              )}
              {!isCorrect && (
                <p style={{
                  fontSize: '0.82rem', color: 'rgba(180,200,255,0.45)',
                  marginTop: '0.55rem', lineHeight: 1.7,
                }}>
                  Make sure you are marking consecutive dips — the period is the
                  time between adjacent transits, not every other one.
                </p>
              )}
            </div>

            <div>
              <p style={{
                fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                color: ACCENT_MED, marginBottom: '0.4rem',
              }}>
                Real comparison
              </p>
              <p style={{ fontSize: '0.83rem', color: 'rgba(180,190,240,0.65)', lineHeight: 1.7 }}>
                {level.comparisonPlanet} has a {level.comparisonPeriod} orbital period.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: 'flex-start' }}>
              <button
                onClick={() => {
                  setMarkers([])
                  setSubmitted(false)
                  setIsCorrect(false)
                  setCalcPeriod(null)
                  setGamePhase('playing')
                }}
                style={{
                  fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.12em',
                  padding: '0.45rem 1rem',
                  border: `1px solid ${ACCENT_DIM}`, borderRadius: 3,
                  background: 'rgba(140,100,240,0.07)', color: ACCENT_MED,
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
              {isCorrect && levelIdx < LEVELS.length - 1 && (
                <button
                  onClick={() => setLevelIdx(i => i + 1)}
                  style={{
                    fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.12em',
                    padding: '0.45rem 1rem',
                    border: `1px solid ${ACCENT_MED}`, borderRadius: 3,
                    background: 'rgba(140,100,240,0.14)', color: ACCENT,
                    cursor: 'pointer',
                  }}
                >
                  Next level →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{
        display: 'flex', gap: '2rem', padding: '1.5rem 2rem',
        alignItems: 'flex-start', flexWrap: 'wrap',
      }}>

        {/* Chart column */}
        <div style={{ flex: '1 1 580px', minWidth: 0 }}>
          <p style={{
            fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase',
            color: ACCENT_MED, marginBottom: '0.75rem',
          }}>
            {level.subtitle}
          </p>

          {/* SVG chart */}
          <div style={{
            position: 'relative', width: '100%',
            background: 'rgba(10,6,30,0.5)',
            border: `1px solid ${ACCENT_DIM}`, borderRadius: 4,
          }}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              style={{
                width: '100%', display: 'block',
                cursor: submitted ? 'default' : 'crosshair',
              }}
              onClick={handleSvgClick}
              onMouseMove={handleSvgMouseMove}
              onMouseLeave={() => setCursorX(null)}
            >
              {/* Decorative stars */}
              {STARS.map((s, i) => (
                <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="white" opacity={s.opacity} />
              ))}

              {/* Plot area background */}
              <rect
                x={PAD_L} y={PAD_T} width={PLOT_W} height={PLOT_H}
                fill="rgba(6,3,22,0.7)"
              />

              {/* Horizontal grid lines */}
              {yTicks.map((f, i) => {
                const y = fY(f, fMin, fRange)
                return (
                  <line
                    key={i}
                    x1={PAD_L} y1={y} x2={PAD_L + PLOT_W} y2={y}
                    stroke="rgba(140,100,240,0.07)" strokeWidth={1}
                  />
                )
              })}

              {/* Vertical grid lines */}
              {xTicks.map((t, i) => {
                const x = tX(t, level.totalDays)
                return (
                  <line
                    key={i}
                    x1={x} y1={PAD_T} x2={x} y2={PAD_T + PLOT_H}
                    stroke="rgba(140,100,240,0.07)" strokeWidth={1}
                  />
                )
              })}

              {/* X-axis labels */}
              {xTicks.map((t, i) => (
                <text
                  key={i}
                  x={tX(t, level.totalDays)} y={SVG_H - PAD_B + 18}
                  textAnchor="middle" fill="rgba(170,180,230,0.4)"
                  fontSize={10} fontFamily="monospace"
                >
                  {t}
                </text>
              ))}

              {/* Y-axis labels */}
              {yTicks.map((f, i) => (
                <text
                  key={i}
                  x={PAD_L - 7} y={fY(f, fMin, fRange) + 4}
                  textAnchor="end" fill="rgba(170,180,230,0.4)"
                  fontSize={9} fontFamily="monospace"
                >
                  {f.toFixed(3)}
                </text>
              ))}

              {/* Axis labels */}
              <text
                x={PAD_L + PLOT_W / 2} y={SVG_H - 3}
                textAnchor="middle" fill="rgba(160,170,220,0.3)"
                fontSize={10} fontFamily="monospace" letterSpacing={2}
              >
                TIME (DAYS)
              </text>
              <text
                x={13} y={PAD_T + PLOT_H / 2}
                textAnchor="middle" fill="rgba(160,170,220,0.3)"
                fontSize={10} fontFamily="monospace" letterSpacing={2}
                transform={`rotate(-90, 13, ${PAD_T + PLOT_H / 2})`}
              >
                FLUX
              </text>

              {/* Light curve path */}
              <path
                d={pathD}
                fill="none"
                stroke="rgba(190,215,255,0.85)"
                strokeWidth={1.4}
                strokeLinejoin="round"
              />

              {/* Reveal: true transit positions (green dashed) */}
              {gamePhase === 'reveal' && isCorrect && transitCenters.map((tc, i) =>
                tc >= 0 && tc <= level.totalDays ? (
                  <line
                    key={i}
                    x1={tX(tc, level.totalDays)} y1={PAD_T}
                    x2={tX(tc, level.totalDays)} y2={PAD_T + PLOT_H}
                    stroke="rgba(100,220,100,0.18)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                ) : null
              )}

              {/* User markers */}
              {markers.map((t, i) => {
                const x = tX(t, level.totalDays)
                return (
                  <g key={i}>
                    <line
                      x1={x} y1={PAD_T} x2={x} y2={PAD_T + PLOT_H}
                      stroke="rgba(190,140,255,0.65)" strokeWidth={1.5}
                    />
                    <circle cx={x} cy={PAD_T + 9} r={6} fill="rgba(148,108,248,0.85)" />
                    <text
                      x={x} y={PAD_T + 13} textAnchor="middle"
                      fill="white" fontSize={8} fontFamily="monospace" fontWeight="bold"
                    >
                      {i + 1}
                    </text>
                  </g>
                )
              })}

              {/* Crosshair */}
              {cursorX !== null && !submitted && (
                <line
                  x1={cursorX} y1={PAD_T} x2={cursorX} y2={PAD_T + PLOT_H}
                  stroke="rgba(200,180,255,0.2)" strokeWidth={1} strokeDasharray="3 3"
                />
              )}

              {/* Plot border */}
              <rect
                x={PAD_L} y={PAD_T} width={PLOT_W} height={PLOT_H}
                fill="none" stroke="rgba(140,100,240,0.18)" strokeWidth={1}
              />
            </svg>
          </div>

          {/* Instructions below chart */}
          {!submitted && (
            <p style={{
              fontSize: '0.71rem', color: 'rgba(150,160,210,0.45)',
              marginTop: '0.65rem', fontStyle: 'italic', lineHeight: 1.8,
            }}>
              Click on transit dips to place numbered markers. Click an existing marker to remove it.
              Mark at least 2 transits, then submit.
            </p>
          )}
          <p style={{
            fontSize: '0.7rem', color: 'rgba(140,120,220,0.5)',
            marginTop: '0.4rem', lineHeight: 1.7,
          }}>
            Hint: {level.hint}
          </p>
        </div>

        {/* Sidebar */}
        <div style={{
          width: 210, flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: '1.3rem',
        }}>

          {/* Markers list */}
          <div>
            <p style={{
              fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase',
              color: ACCENT_MED, marginBottom: '0.65rem',
            }}>
              Markers placed
            </p>
            {markers.length === 0 ? (
              <p style={{ fontSize: '0.78rem', color: 'rgba(150,160,210,0.3)', fontStyle: 'italic' }}>
                None yet
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
                {[...markers].sort((a, b) => a - b).map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: 15, height: 15, borderRadius: '50%',
                      background: 'rgba(148,108,248,0.85)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, color: 'white', fontWeight: 700, flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(200,210,255,0.72)' }}>
                      Day {t.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Period measurement */}
          <div style={{ borderTop: `1px solid ${ACCENT_DIM}`, paddingTop: '1rem' }}>
            <p style={{
              fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase',
              color: ACCENT_MED, marginBottom: '0.5rem',
            }}>
              Measured period
            </p>
            {measuredPeriod ? (
              <>
                <p style={{
                  fontSize: '1.35rem', fontWeight: 700,
                  color: 'rgba(200,160,255,0.92)', letterSpacing: '0.02em',
                }}>
                  {measuredPeriod.toFixed(2)}
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 400, marginLeft: '0.4rem', color: ACCENT_MED,
                  }}>
                    days
                  </span>
                </p>
                {markers.length >= 3 && (
                  <p style={{
                    fontSize: '0.65rem', color: 'rgba(150,160,210,0.38)',
                    marginTop: '0.3rem', lineHeight: 1.6,
                  }}>
                    avg. of {markers.length - 1} spacing{markers.length > 2 ? 's' : ''}
                  </p>
                )}
              </>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'rgba(150,160,210,0.3)', fontStyle: 'italic' }}>
                {markers.length === 1 ? 'Add 1 more marker' : '—'}
              </p>
            )}
          </div>

          {/* Submit */}
          {!submitted && (
            <button
              onClick={handleSubmit}
              disabled={!measuredPeriod}
              style={{
                fontFamily: MONO, fontSize: '0.72rem', letterSpacing: '0.16em',
                textTransform: 'uppercase', padding: '0.65rem 1rem',
                border: `1px solid ${measuredPeriod ? ACCENT_MED : ACCENT_DIM}`,
                borderRadius: 4,
                background: measuredPeriod ? 'rgba(140,100,240,0.12)' : 'transparent',
                color: measuredPeriod ? ACCENT : 'rgba(140,100,240,0.3)',
                cursor: measuredPeriod ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                if (!measuredPeriod) return
                e.currentTarget.style.background = 'rgba(140,100,240,0.22)'
                e.currentTarget.style.borderColor = ACCENT
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = measuredPeriod ? 'rgba(140,100,240,0.12)' : 'transparent'
                e.currentTarget.style.borderColor = measuredPeriod ? ACCENT_MED : ACCENT_DIM
              }}
            >
              Submit period
            </button>
          )}

          {/* Formula note */}
          {markers.length >= 2 && !submitted && (
            <div style={{ borderTop: `1px solid ${ACCENT_DIM}`, paddingTop: '0.8rem' }}>
              <p style={{
                fontSize: '0.63rem', color: 'rgba(150,160,210,0.35)', lineHeight: 1.7,
              }}>
                P = (t<sub>last</sub> − t<sub>first</sub>) ÷ (n − 1)
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
