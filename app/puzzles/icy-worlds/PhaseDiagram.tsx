'use client'

import { useMemo, useRef, useCallback } from 'react'
import { BOUNDARIES, PHASES, PhaseId, detectPhase } from './phaseData'

// ── Diagram coordinate space ──────────────────────────────────────────────────
// X axis: log10(P/GPa), range: -3 to 2.3  (0.001 GPa → 200 GPa)
// Y axis: Temperature K, range: 200 to 5000

const LOG_P_MIN = -3
const LOG_P_MAX = 2.3
const T_MIN = 200
const T_MAX = 5000

const W = 480
const H = 340
const PAD = { top: 18, right: 14, bottom: 40, left: 52 }
const INNER_W = W - PAD.left - PAD.right
const INNER_H = H - PAD.top - PAD.bottom

function toSvgX(logP: number) {
  return PAD.left + ((logP - LOG_P_MIN) / (LOG_P_MAX - LOG_P_MIN)) * INNER_W
}
function toSvgY(T: number) {
  return PAD.top + (1 - (T - T_MIN) / (T_MAX - T_MIN)) * INNER_H
}
function fromSvgX(sx: number): number {
  return LOG_P_MIN + ((sx - PAD.left) / INNER_W) * (LOG_P_MAX - LOG_P_MIN)
}
function fromSvgY(sy: number): number {
  return T_MIN + (1 - (sy - PAD.top) / INNER_H) * (T_MAX - T_MIN)
}

function polyline(pts: [number, number][]): string {
  return pts.map(([lp, T]) => `${toSvgX(lp).toFixed(1)},${toSvgY(T).toFixed(1)}`).join(' ')
}

// ── X axis tick labels ────────────────────────────────────────────────────────
const X_TICKS: { logP: number; label: string }[] = [
  { logP: -3,  label: '0.001' },
  { logP: -2,  label: '0.01' },
  { logP: -1,  label: '0.1' },
  { logP:  0,  label: '1' },
  { logP:  1,  label: '10' },
  { logP:  2,  label: '100' },
]
const Y_TICKS = [200, 500, 1000, 2000, 3000, 5000]

interface Props {
  logP: number  // current log10(GPa)
  T: number     // current T in K
  currentPhase: PhaseId
  neptunePath?: boolean  // show Neptune layer markers
  onCursorMove?: (logP: number, T: number) => void
}

export default function PhaseDiagram({ logP, T, currentPhase, neptunePath, onCursorMove }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  const cx = toSvgX(logP)
  const cy = toSvgY(T)

  const phaseColor = PHASES[currentPhase]?.glowColor ?? '#4488ff'

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!onCursorMove) return
    const rect = svgRef.current!.getBoundingClientRect()
    const sx = (e.clientX - rect.left) * (W / rect.width)
    const sy = (e.clientY - rect.top) * (H / rect.height)
    const lp = Math.max(LOG_P_MIN, Math.min(LOG_P_MAX, fromSvgX(sx)))
    const t  = Math.max(T_MIN, Math.min(T_MAX, fromSvgY(sy)))
    onCursorMove(lp, t)
  }, [onCursorMove])

  // Phase region background fills — simplified colored polygons
  const regions = useMemo(() => buildRegions(), [])

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: '100%', cursor: onCursorMove ? 'crosshair' : 'default', userSelect: 'none' }}
      onPointerMove={handlePointerMove}
    >
      <defs>
        <clipPath id="diagram-clip">
          <rect x={PAD.left} y={PAD.top} width={INNER_W} height={INNER_H} />
        </clipPath>
        {/* Cursor glow filter */}
        <filter id="cursor-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="label-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ── Background ── */}
      <rect x={0} y={0} width={W} height={H} fill="#020408" />
      <rect x={PAD.left} y={PAD.top} width={INNER_W} height={INNER_H} fill="#050a12" />

      {/* ── Phase region fills ── */}
      <g clipPath="url(#diagram-clip)">
        {regions.map(r => (
          <polygon key={r.id} points={r.points} fill={r.fill} opacity={r.highlighted && r.id === currentPhase ? 0.38 : 0.18} />
        ))}
      </g>

      {/* ── Grid lines ── */}
      <g clipPath="url(#diagram-clip)" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5">
        {X_TICKS.map(({ logP: lp }) => (
          <line key={lp} x1={toSvgX(lp)} y1={PAD.top} x2={toSvgX(lp)} y2={PAD.top + INNER_H} />
        ))}
        {Y_TICKS.map(t => (
          <line key={t} x1={PAD.left} y1={toSvgY(t)} x2={PAD.left + INNER_W} y2={toSvgY(t)} />
        ))}
      </g>

      {/* ── Phase boundaries ── */}
      <g clipPath="url(#diagram-clip)">
        {BOUNDARIES.map(b => (
          <polyline
            key={b.id}
            points={polyline(b.points)}
            fill="none"
            stroke="rgba(180,220,255,0.45)"
            strokeWidth={1.2}
            strokeDasharray={b.style === 'dashed' ? '4 3' : undefined}
          />
        ))}
      </g>

      {/* ── Phase region labels ── */}
      <g clipPath="url(#diagram-clip)">
        {Object.values(PHASES).map(ph => {
          const sx = toSvgX(ph.labelLogP)
          const sy = toSvgY(ph.labelT)
          if (sx < PAD.left || sx > PAD.left + INNER_W || sy < PAD.top || sy > PAD.top + INNER_H) return null
          const active = ph.id === currentPhase
          return (
            <g key={ph.id} filter={active ? 'url(#label-glow)' : undefined}>
              <text
                x={sx} y={sy}
                textAnchor="middle"
                fontSize={active ? 8.5 : 7.5}
                fontFamily="var(--font-geist-mono, monospace)"
                fill={active ? ph.glowColor : 'rgba(180,210,240,0.38)'}
                fontWeight={active ? '700' : '400'}
              >
                {ph.label}
              </text>
              {ph.sublabel && (
                <text
                  x={sx} y={sy + 9}
                  textAnchor="middle"
                  fontSize={6}
                  fontFamily="var(--font-geist-mono, monospace)"
                  fill={active ? ph.glowColor : 'rgba(180,210,240,0.22)'}
                >
                  {ph.sublabel}
                </text>
              )}
            </g>
          )
        })}
      </g>

      {/* ── Neptune target marker ── */}
      {neptunePath && (
        <g clipPath="url(#diagram-clip)">
          <circle
            cx={toSvgX(Math.log10(50))}
            cy={toSvgY(3000)}
            r={14}
            fill="none"
            stroke="rgba(100,200,255,0.22)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <text
            x={toSvgX(Math.log10(50))}
            y={toSvgY(3000) - 17}
            textAnchor="middle"
            fontSize={6.5}
            fontFamily="var(--font-geist-mono, monospace)"
            fill="rgba(100,200,255,0.45)"
          >
            Neptune interior
          </text>
        </g>
      )}

      {/* ── Cursor crosshair ── */}
      <g clipPath="url(#diagram-clip)">
        <line x1={cx} y1={PAD.top} x2={cx} y2={PAD.top + INNER_H}
          stroke={phaseColor} strokeWidth={0.6} opacity={0.35} />
        <line x1={PAD.left} y1={cy} x2={PAD.left + INNER_W} y2={cy}
          stroke={phaseColor} strokeWidth={0.6} opacity={0.35} />
        <circle cx={cx} cy={cy} r={5} fill={phaseColor} opacity={0.9} filter="url(#cursor-glow)" />
        <circle cx={cx} cy={cy} r={2.5} fill="white" opacity={0.95} />
      </g>

      {/* ── Axes ── */}
      <line x1={PAD.left} y1={PAD.top + INNER_H} x2={PAD.left + INNER_W} y2={PAD.top + INNER_H}
        stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + INNER_H}
        stroke="rgba(255,255,255,0.2)" strokeWidth={1} />

      {/* ── X tick labels ── */}
      {X_TICKS.map(({ logP: lp, label }) => (
        <text key={lp} x={toSvgX(lp)} y={PAD.top + INNER_H + 12}
          textAnchor="middle" fontSize={7}
          fontFamily="var(--font-geist-mono, monospace)"
          fill="rgba(180,210,240,0.35)"
        >
          {label}
        </text>
      ))}

      {/* ── Y tick labels ── */}
      {Y_TICKS.map(t => (
        <text key={t} x={PAD.left - 5} y={toSvgY(t) + 2.5}
          textAnchor="end" fontSize={7}
          fontFamily="var(--font-geist-mono, monospace)"
          fill="rgba(180,210,240,0.35)"
        >
          {t >= 1000 ? `${t / 1000}k` : t}
        </text>
      ))}

      {/* ── Axis labels ── */}
      <text x={PAD.left + INNER_W / 2} y={H - 4}
        textAnchor="middle" fontSize={7.5}
        fontFamily="var(--font-geist-mono, monospace)"
        fill="rgba(180,210,240,0.4)"
      >
        Pressure (GPa)
      </text>
      <text
        x={10} y={PAD.top + INNER_H / 2}
        textAnchor="middle" fontSize={7.5}
        fontFamily="var(--font-geist-mono, monospace)"
        fill="rgba(180,210,240,0.4)"
        transform={`rotate(-90, 10, ${PAD.top + INNER_H / 2})`}
      >
        Temperature (K)
      </text>
    </svg>
  )
}

// ── Region polygon builder ────────────────────────────────────────────────────
// Approximate colored region fills for major phases.
// These are simplified bounding polygons — not exact thermodynamic boundaries.
function buildRegions() {
  const x0 = PAD.left, x1 = PAD.left + INNER_W
  const y0 = PAD.top,  y1 = PAD.top + INNER_H

  const p = (logP: number, T: number) => `${toSvgX(logP).toFixed(1)},${toSvgY(T).toFixed(1)}`

  return [
    // Ice Ih — low P, low T left zone
    { id: 'ice-ih', fill: '#c8e8ff', highlighted: true, points: [
      p(-3, 273), p(LOG_P_MIN, T_MIN), p(Math.log10(0.21), T_MIN),
      p(Math.log10(0.21), 251), p(-3, 273),
    ].join(' ')},
    // Liquid — above ice Ih melt, low P
    { id: 'liquid', fill: '#4488ff', highlighted: true, points: [
      p(LOG_P_MIN, 273), p(LOG_P_MIN, T_MAX), p(Math.log10(0.2), T_MAX),
      p(Math.log10(2.2), 355), p(Math.log10(0.21), 251), p(LOG_P_MIN, 273),
    ].join(' ')},
    // Ice VI — moderate P, ~200-350 K
    { id: 'ice-vi', fill: '#78a8cc', highlighted: true, points: [
      p(Math.log10(0.625), 273), p(Math.log10(2.2), 347), p(Math.log10(2.2), T_MIN),
      p(Math.log10(0.45), T_MIN), p(Math.log10(0.625), 213), p(Math.log10(0.625), 273),
    ].join(' ')},
    // Ice VII — 2-30 GPa, low to moderate T
    { id: 'ice-vii', fill: '#5888b8', highlighted: true, points: [
      p(Math.log10(2.2), 355), p(Math.log10(10), 1300), p(Math.log10(30), 2100),
      p(Math.log10(30), T_MIN), p(Math.log10(2.2), T_MIN), p(Math.log10(2.2), 355),
    ].join(' ')},
    // Ice X — 30-100 GPa, low T
    { id: 'ice-x', fill: '#3060a0', highlighted: true, points: [
      p(Math.log10(30), T_MIN), p(Math.log10(30), 800), p(Math.log10(100), 1500),
      p(Math.log10(100), T_MIN),
    ].join(' ')},
    // Superionic BCC
    { id: 'superionic-bcc', fill: '#ff9933', highlighted: true, points: [
      p(Math.log10(10), 1300), p(Math.log10(10), T_MAX),
      p(Math.log10(80), T_MAX), p(Math.log10(80), 3200),
      p(Math.log10(30), 2200), p(Math.log10(30), 2100),
    ].join(' ')},
    // Superionic FCC
    { id: 'superionic-fcc', fill: '#ffaa22', highlighted: true, points: [
      p(Math.log10(80), 3200), p(Math.log10(80), T_MAX),
      p(LOG_P_MAX, T_MAX), p(LOG_P_MAX, 3600), p(Math.log10(80), 3200),
    ].join(' ')},
  ]
}
