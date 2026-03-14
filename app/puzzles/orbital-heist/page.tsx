'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// ── Constants ──────────────────────────────────────────────────────────────────
const MONO  = 'var(--font-geist-mono, monospace)'
const SERIF = '"Times New Roman", Times, serif'

// Physics (pixel space)
const G_PIX      = 6_000_000   // px³ / (mass_unit · s²)
const DT         = 1 / 60      // seconds per simulation step
const SIM_STEPS  = 2           // sim steps per animation frame
const MAX_SPEED  = 420         // px/s maximum launch speed
const MAX_DRAG   = 130         // px; full drag = max speed

// Scene
const OOB_MARGIN     = 0.20    // off-screen fraction before "drifted"
const PREVIEW_STEPS  = 420     // steps shown in aim preview
const MAX_TRAIL      = 800

// ── Types ──────────────────────────────────────────────────────────────────────
type Phase = 'briefing' | 'aiming' | 'simulating' | 'success' | 'crashed' | 'drifted'

interface Planet {
  nx: number; ny: number       // normalized position 0–1
  mass: number                 // gravity scale
  nr: number                   // normalized crash radius
  nd: number                   // normalized display radius (visual, slightly larger)
  bodyColor: string
  glowColor: string
}

interface LevelDef {
  name: string
  subtitle: string
  story: string[]
  hint: string
  ship:   { nx: number; ny: number }
  target: { nx: number; ny: number; nr: number }
  planets: Planet[]
}

// ── Level definitions ──────────────────────────────────────────────────────────
const LEVELS: LevelDef[] = [
  {
    name: 'Level 1 — First Arc',
    subtitle: 'Use the gravity well to curve your trajectory.',
    story: [
      'A navigation beacon has been placed in high orbit on the far side of a dense world.',
      "Plot your launch vector carefully — the planet's gravity will bend your path.",
      'Arc around it, not through it.',
    ],
    hint: 'Aim toward the top-right edge of the planet — gravity will curve you the rest of the way.',
    ship:   { nx: 0.12, ny: 0.72 },
    target: { nx: 0.84, ny: 0.22, nr: 0.038 },
    planets: [{
      nx: 0.50, ny: 0.52,
      mass: 1.1, nr: 0.068, nd: 0.080,
      bodyColor: '#1a3070', glowColor: 'rgba(50,90,220,0.42)',
    }],
  },
  {
    name: 'Level 2 — The Corridor',
    subtitle: 'Thread the gap between twin gravity wells.',
    story: [
      'Two massive worlds orbit in close formation, their gravity fields overlapping.',
      'Between them lies a narrow corridor — navigable, but unforgiving.',
      'Too close to either and you will be pulled off course.',
    ],
    hint: 'Aim straight at the midpoint between the two worlds. Tiny deviations change the outcome.',
    ship:   { nx: 0.09, ny: 0.50 },
    target: { nx: 0.91, ny: 0.50, nr: 0.030 },
    planets: [
      {
        nx: 0.46, ny: 0.25,
        mass: 0.88, nr: 0.058, nd: 0.070,
        bodyColor: '#5e1818', glowColor: 'rgba(180,50,40,0.38)',
      },
      {
        nx: 0.54, ny: 0.75,
        mass: 0.88, nr: 0.058, nd: 0.070,
        bodyColor: '#165028', glowColor: 'rgba(40,160,70,0.36)',
      },
    ],
  },
  {
    name: 'Level 3 — Gravity Assist',
    subtitle: 'Slingshot around one world to reach the other.',
    story: [
      'Three worlds in alignment. The target lies behind the largest mass.',
      'A direct approach is blocked. You must use gravitational slingshot mechanics.',
      'Arc past the first body — it will bend your heading toward the extraction point.',
    ],
    hint: 'Head toward the amber planet on the left — let it curve you upward and right.',
    ship:   { nx: 0.08, ny: 0.78 },
    target: { nx: 0.85, ny: 0.14, nr: 0.028 },
    planets: [
      {
        nx: 0.30, ny: 0.60,
        mass: 0.65, nr: 0.048, nd: 0.060,
        bodyColor: '#5a4010', glowColor: 'rgba(170,130,20,0.32)',
      },
      {
        nx: 0.60, ny: 0.48,
        mass: 1.40, nr: 0.090, nd: 0.106,
        bodyColor: '#1a1238', glowColor: 'rgba(80,50,210,0.42)',
      },
      {
        nx: 0.80, ny: 0.73,
        mass: 0.52, nr: 0.042, nd: 0.053,
        bodyColor: '#164444', glowColor: 'rgba(40,160,160,0.30)',
      },
    ],
  },
]

// ── Static star field (seeded, deterministic) ──────────────────────────────────
const STARS = (() => {
  let s = 98765
  const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff }
  return Array.from({ length: 210 }, () => ({
    x: r(), y: r(), rad: r() * 1.3 + 0.22, alpha: r() * 0.52 + 0.10,
  }))
})()

// ── Physics helpers ────────────────────────────────────────────────────────────
interface SimState { x: number; y: number; vx: number; vy: number }

function integrate(s: SimState, planets: Planet[], w: number, h: number): SimState {
  let ax = 0, ay = 0
  for (const p of planets) {
    const dx = p.nx * w - s.x
    const dy = p.ny * h - s.y
    const r2 = dx * dx + dy * dy
    if (r2 < 400) continue
    const r  = Math.sqrt(r2)
    const a  = G_PIX * p.mass / r2
    ax += a * dx / r
    ay += a * dy / r
  }
  return {
    x:  s.x  + s.vx * DT + 0.5 * ax * DT * DT,
    y:  s.y  + s.vy * DT + 0.5 * ay * DT * DT,
    vx: s.vx + ax * DT,
    vy: s.vy + ay * DT,
  }
}

function hitsPlanet(x: number, y: number, planets: Planet[], w: number, h: number): boolean {
  const min = Math.min(w, h)
  for (const p of planets) {
    const dx = x - p.nx * w
    const dy = y - p.ny * h
    const r  = p.nr * min
    if (dx * dx + dy * dy < r * r) return true
  }
  return false
}

function hitsTarget(x: number, y: number, t: LevelDef['target'], w: number, h: number): boolean {
  const min = Math.min(w, h)
  const dx  = x - t.nx * w
  const dy  = y - t.ny * h
  return dx * dx + dy * dy < (t.nr * min) ** 2
}

function isOOB(x: number, y: number, w: number, h: number): boolean {
  return x < -OOB_MARGIN * w || x > (1 + OOB_MARGIN) * w ||
         y < -OOB_MARGIN * h || y > (1 + OOB_MARGIN) * h
}

// ── Color helpers ──────────────────────────────────────────────────────────────
function hexLighten(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.min(255, ((n >> 16) & 0xff) + Math.round(amt * 255))
  const g = Math.min(255, ((n >>  8) & 0xff) + Math.round(amt * 255))
  const b = Math.min(255, ( n        & 0xff) + Math.round(amt * 255))
  return `rgb(${r},${g},${b})`
}
function hexDarken(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, ((n >> 16) & 0xff) - Math.round(amt * 255))
  const g = Math.max(0, ((n >>  8) & 0xff) - Math.round(amt * 255))
  const b = Math.max(0, ( n        & 0xff) - Math.round(amt * 255))
  return `rgb(${r},${g},${b})`
}

// ── Canvas renderer ────────────────────────────────────────────────────────────
function drawScene(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  level: LevelDef,
  shipScrn: { x: number; y: number },
  aimVel: { vx: number; vy: number } | null,
  trail:   [number, number][],
  preview: [number, number][],
  phase:   Phase,
  tick:    number,
) {
  const min = Math.min(w, h)

  // Background
  ctx.fillStyle = '#04020f'
  ctx.fillRect(0, 0, w, h)

  // Stars
  for (const s of STARS) {
    const twinkle = 1 + 0.10 * Math.sin(tick * 0.035 + s.x * 60)
    ctx.beginPath()
    ctx.arc(s.x * w, s.y * h, s.rad * twinkle, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${(s.alpha * twinkle).toFixed(3)})`
    ctx.fill()
  }

  // Target
  const tx = level.target.nx * w
  const ty = level.target.ny * h
  const tr = level.target.nr * min
  const pulse = 0.65 + 0.35 * Math.sin(tick * 0.09)

  ctx.beginPath()
  ctx.arc(tx, ty, tr * (1.6 + 0.4 * pulse), 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(160,100,255,${(0.12 * pulse).toFixed(3)})`
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(tx, ty, tr, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(185,125,255,0.75)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(tx, ty, 3, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(200,155,255,0.9)'
  ctx.fill()

  ctx.fillStyle = 'rgba(180,120,255,0.50)'
  ctx.font = `9px ${MONO}`
  ctx.textAlign = 'center'
  ctx.fillText('BEACON', tx, ty - tr - 7)
  ctx.textAlign = 'left'

  // Planets
  for (const p of level.planets) {
    const px = p.nx * w
    const py = p.ny * h
    const dr = p.nd * min

    // Outer glow
    const g1 = ctx.createRadialGradient(px, py, 0, px, py, dr * 3.0)
    g1.addColorStop(0,   p.glowColor)
    g1.addColorStop(0.4, p.glowColor.replace(/[\d.]+\)$/, '0.08)'))
    g1.addColorStop(1,   'transparent')
    ctx.beginPath()
    ctx.arc(px, py, dr * 3.0, 0, Math.PI * 2)
    ctx.fillStyle = g1
    ctx.fill()

    // Body
    const g2 = ctx.createRadialGradient(px - dr * 0.28, py - dr * 0.28, 0, px, py, dr)
    g2.addColorStop(0,   hexLighten(p.bodyColor, 0.28))
    g2.addColorStop(0.6, p.bodyColor)
    g2.addColorStop(1,   hexDarken(p.bodyColor, 0.35))
    ctx.beginPath()
    ctx.arc(px, py, dr, 0, Math.PI * 2)
    ctx.fillStyle = g2
    ctx.fill()

    // Rim
    ctx.beginPath()
    ctx.arc(px, py, dr, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.09)'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Preview trajectory (aiming phase)
  if (preview.length > 1) {
    ctx.save()
    ctx.setLineDash([2, 7])
    ctx.strokeStyle = 'rgba(170,145,230,0.32)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(preview[0][0], preview[0][1])
    for (let i = 1; i < preview.length; i++) ctx.lineTo(preview[i][0], preview[i][1])
    ctx.stroke()
    ctx.restore()
  }

  // Sim trail
  if (trail.length > 1) {
    ctx.save()
    ctx.setLineDash([3, 5])
    ctx.strokeStyle = 'rgba(205,180,255,0.55)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(trail[0][0], trail[0][1])
    for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i][0], trail[i][1])
    ctx.stroke()
    ctx.restore()
  }

  // Ship glow
  const sg = ctx.createRadialGradient(shipScrn.x, shipScrn.y, 0, shipScrn.x, shipScrn.y, 22)
  sg.addColorStop(0, 'rgba(220,200,255,0.50)')
  sg.addColorStop(1, 'transparent')
  ctx.beginPath()
  ctx.arc(shipScrn.x, shipScrn.y, 22, 0, Math.PI * 2)
  ctx.fillStyle = sg
  ctx.fill()

  // Aim arrow
  if (aimVel && (aimVel.vx !== 0 || aimVel.vy !== 0)) {
    const speed  = Math.sqrt(aimVel.vx ** 2 + aimVel.vy ** 2)
    const nx     = aimVel.vx / speed
    const ny     = aimVel.vy / speed
    const alen   = Math.min(speed / MAX_SPEED, 1) * 85 + 18
    const ex     = shipScrn.x + nx * alen
    const ey     = shipScrn.y + ny * alen
    const ang    = Math.atan2(ny, nx)

    ctx.save()
    ctx.setLineDash([3, 4])
    ctx.strokeStyle = 'rgba(215,190,255,0.72)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(shipScrn.x, shipScrn.y)
    ctx.lineTo(ex, ey)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = 'rgba(215,190,255,0.80)'
    ctx.beginPath()
    ctx.moveTo(ex, ey)
    ctx.lineTo(ex - 10 * Math.cos(ang - 0.42), ey - 10 * Math.sin(ang - 0.42))
    ctx.lineTo(ex - 10 * Math.cos(ang + 0.42), ey - 10 * Math.sin(ang + 0.42))
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  // Ship body (triangle)
  const shipAngle = aimVel && (aimVel.vx !== 0 || aimVel.vy !== 0)
    ? Math.atan2(aimVel.vy, aimVel.vx)
    : -Math.PI / 2

  ctx.save()
  ctx.translate(shipScrn.x, shipScrn.y)
  ctx.rotate(shipAngle)
  ctx.beginPath()
  ctx.moveTo(9, 0)
  ctx.lineTo(-6, -4.5)
  ctx.lineTo(-6,  4.5)
  ctx.closePath()
  ctx.fillStyle = 'rgba(235,220,255,0.95)'
  ctx.fill()
  ctx.restore()

  // Drag hint (no aim set yet in aiming phase)
  if (phase === 'aiming' && (!aimVel || (aimVel.vx === 0 && aimVel.vy === 0))) {
    ctx.fillStyle = 'rgba(200,175,255,0.38)'
    ctx.font = `9px ${MONO}`
    ctx.textAlign = 'center'
    ctx.fillText('drag to aim', shipScrn.x, shipScrn.y - 22)
    ctx.textAlign = 'left'
  }
}

// ── Shared button styles ───────────────────────────────────────────────────────
const OUTLINE_BTN: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(128,92,232,0.38)',
  borderRadius: 3,
  color: '#d0c0f0',
  fontFamily: MONO,
  fontSize: '0.75rem',
  letterSpacing: '0.15em',
  padding: '0.55rem 1.2rem',
  cursor: 'pointer',
}
const FILLED_BTN: React.CSSProperties = {
  background: 'rgba(128,92,232,0.18)',
  border: '1px solid rgba(128,92,232,0.50)',
  borderRadius: 3,
  color: '#d0c0f0',
  fontFamily: MONO,
  fontSize: '0.75rem',
  letterSpacing: '0.15em',
  padding: '0.55rem 1.2rem',
  cursor: 'pointer',
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function OrbitalHeist() {
  const [phase,    setPhase]    = useState<Phase>('briefing')
  const [levelIdx, setLevelIdx] = useState(0)
  const [aimSpeed, setAimSpeed] = useState(0)        // 0–100 for display
  const [showHint, setShowHint] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>(0)
  const tickRef   = useRef(0)

  // Refs accessible from rAF loop without stale closures
  const phaseRef    = useRef<Phase>('briefing')
  const levelIdxRef = useRef(0)
  const dimsRef     = useRef({ w: 800, h: 600 })

  // Simulation state
  const simRef = useRef<SimState & { trail: [number, number][] }>({
    x: 0, y: 0, vx: 0, vy: 0, trail: [],
  })

  // Aiming state
  const aimActiveRef = useRef(false)
  const aimVelRef    = useRef({ vx: 0, vy: 0 })
  const previewRef   = useRef<[number, number][]>([])

  function syncPhase(p: Phase) {
    phaseRef.current = p
    setPhase(p)
  }

  function level() { return LEVELS[levelIdxRef.current] }

  // ── Preview computation ──────────────────────────────────────────────────────
  function computePreview(vx: number, vy: number): [number, number][] {
    const lv = level()
    const { w, h } = dimsRef.current
    const pts: [number, number][] = []
    let s: SimState = { x: lv.ship.nx * w, y: lv.ship.ny * h, vx, vy }
    for (let i = 0; i < PREVIEW_STEPS; i++) {
      pts.push([s.x, s.y])
      s = integrate(s, lv.planets, w, h)
      if (hitsPlanet(s.x, s.y, lv.planets, w, h)) break
      if (isOOB(s.x, s.y, w, h)) break
    }
    return pts
  }

  // ── Canvas resize ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect()
      canvas.width  = Math.round(rect.width)
      canvas.height = Math.round(rect.height)
      dimsRef.current = { w: canvas.width, h: canvas.height }
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  // ── Animation loop ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function loop() {
      animRef.current = requestAnimationFrame(loop)
      tickRef.current++
      const ctx = canvas!.getContext('2d')
      if (!ctx) return

      const { w, h } = dimsRef.current
      const lv    = level()
      const phase = phaseRef.current

      if (phase === 'simulating') {
        const sim = simRef.current
        for (let step = 0; step < SIM_STEPS; step++) {
          const next = integrate(sim, lv.planets, w, h)
          sim.trail.push([sim.x, sim.y])
          if (sim.trail.length > MAX_TRAIL) sim.trail.shift()
          sim.x = next.x; sim.y = next.y
          sim.vx = next.vx; sim.vy = next.vy

          if (hitsPlanet(sim.x, sim.y, lv.planets, w, h)) { syncPhase('crashed'); break }
          if (hitsTarget(sim.x, sim.y, lv.target, w, h))  { syncPhase('success'); break }
          if (isOOB(sim.x, sim.y, w, h))                   { syncPhase('drifted'); break }
        }
      }

      const inSim  = phase === 'simulating' || phase === 'success' || phase === 'crashed' || phase === 'drifted'
      const shipSc = inSim
        ? { x: simRef.current.x, y: simRef.current.y }
        : { x: lv.ship.nx * w,  y: lv.ship.ny * h }

      const aimVelForDraw = (phase === 'aiming' && (aimVelRef.current.vx !== 0 || aimVelRef.current.vy !== 0))
        ? aimVelRef.current
        : null

      drawScene(
        ctx, w, h, lv,
        shipSc,
        aimVelForDraw,
        inSim ? simRef.current.trail : [],
        phase === 'aiming' ? previewRef.current : [],
        phase,
        tickRef.current,
      )
    }

    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mouse/Touch helpers ──────────────────────────────────────────────────────
  function updateAimFromPos(clientX: number, clientY: number) {
    const lv   = level()
    const { w, h } = dimsRef.current
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx   = clientX - rect.left
    const my   = clientY - rect.top
    const dx   = mx - lv.ship.nx * w
    const dy   = my - lv.ship.ny * h
    const d    = Math.sqrt(dx * dx + dy * dy)
    if (d < 1) return
    const clamped = Math.min(d, MAX_DRAG)
    const speed   = (clamped / MAX_DRAG) * MAX_SPEED
    aimVelRef.current  = { vx: (dx / d) * speed, vy: (dy / d) * speed }
    previewRef.current = computePreview(aimVelRef.current.vx, aimVelRef.current.vy)
    setAimSpeed(Math.round((clamped / MAX_DRAG) * 100))
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (phaseRef.current !== 'aiming') return
    aimActiveRef.current = true
    updateAimFromPos(e.clientX, e.clientY)
  }
  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!aimActiveRef.current || phaseRef.current !== 'aiming') return
    updateAimFromPos(e.clientX, e.clientY)
  }
  function onMouseUp()    { aimActiveRef.current = false }

  function onTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (phaseRef.current !== 'aiming') return
    aimActiveRef.current = true
    updateAimFromPos(e.touches[0].clientX, e.touches[0].clientY)
  }
  function onTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (!aimActiveRef.current) return
    updateAimFromPos(e.touches[0].clientX, e.touches[0].clientY)
  }
  function onTouchEnd() { aimActiveRef.current = false }

  // ── Game actions ─────────────────────────────────────────────────────────────
  function initLevel(idx: number) {
    const lv = LEVELS[idx]
    const { w, h } = dimsRef.current
    simRef.current     = { x: lv.ship.nx * w, y: lv.ship.ny * h, vx: 0, vy: 0, trail: [] }
    aimVelRef.current  = { vx: 0, vy: 0 }
    previewRef.current = []
    aimActiveRef.current = false
    setAimSpeed(0)
    setShowHint(false)
  }

  function startGame() {
    levelIdxRef.current = 0
    setLevelIdx(0)
    initLevel(0)
    syncPhase('aiming')
  }

  function retry() {
    initLevel(levelIdxRef.current)
    syncPhase('aiming')
  }

  function launch() {
    if (phaseRef.current !== 'aiming') return
    const { vx, vy } = aimVelRef.current
    if (vx === 0 && vy === 0) return
    const lv = level()
    const { w, h } = dimsRef.current
    simRef.current = { x: lv.ship.nx * w, y: lv.ship.ny * h, vx, vy, trail: [] }
    previewRef.current = []
    syncPhase('simulating')
  }

  function nextLevel() {
    const next = levelIdxRef.current + 1
    levelIdxRef.current = next
    setLevelIdx(next)
    initLevel(next)
    syncPhase('aiming')
  }

  const lv          = LEVELS[levelIdx]
  const isLastLevel = levelIdx === LEVELS.length - 1

  // ── Briefing screen ──────────────────────────────────────────────────────────
  if (phase === 'briefing') {
    return (
      <main style={{ background: '#04020f', minHeight: '100vh', color: '#c8b8e8', fontFamily: MONO, position: 'relative' }}>
        <Link
          href="/puzzles"
          style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', color: 'rgba(128,92,232,0.5)', textDecoration: 'none', fontSize: '0.8rem', letterSpacing: '0.1em', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(170,130,255,0.9)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(128,92,232,0.5)')}
        >
          ← puzzles
        </Link>

        <div style={{ maxWidth: 660, margin: '0 auto', padding: '8rem 2rem 4rem' }}>
          <p style={{ fontSize: '0.68rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(128,92,232,0.8)', marginBottom: '1.5rem' }}>
            MISSION BRIEFING — SPACE / ORBITAL MECHANICS
          </p>

          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', fontWeight: 'bold', fontStyle: 'italic', color: '#e0d0ff', lineHeight: 1.1, marginBottom: '2.5rem' }}>
            Orbital Heist
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
            {[
              'Your spacecraft has one chance. Once launched, you cannot adjust your trajectory.',
              'Celestial bodies exert gravitational pull on everything that passes near them.',
              'Use this to your advantage — or it will work against you.',
            ].map((t, i) => (
              <p key={i} style={{ fontFamily: SERIF, fontSize: '1rem', fontStyle: 'italic', color: 'rgba(200,185,235,0.72)', lineHeight: 1.78, margin: 0 }}>
                {t}
              </p>
            ))}
          </div>

          <div style={{ background: 'rgba(80,50,180,0.08)', border: '1px solid rgba(128,92,232,0.16)', borderRadius: 4, padding: '1.2rem 1.5rem', marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.28em', color: 'rgba(128,92,232,0.8)', margin: '0 0 0.3rem' }}>
              HOW TO PLAY
            </p>
            {[
              ['Drag from the spacecraft', 'sets your launch direction and speed'],
              ['Dotted line',              'shows a preview of your trajectory'],
              ['LAUNCH',                   'sends the spacecraft on its path'],
              ['Reach the beacon',         'to complete each level'],
            ].map(([label, desc]) => (
              <div key={label} style={{ display: 'flex', gap: '1.4rem', alignItems: 'baseline' }}>
                <span style={{ color: '#d0c0f0', minWidth: 160, fontSize: '0.88rem' }}>{label}</span>
                <span style={{ color: 'rgba(200,185,235,0.45)', fontSize: '0.82rem', fontFamily: SERIF, fontStyle: 'italic' }}>{desc}</span>
              </div>
            ))}
          </div>

          <button
            onClick={startGame}
            style={{ background: 'rgba(128,92,232,0.14)', border: '1px solid rgba(128,92,232,0.45)', borderRadius: 4, color: '#d0c0f0', fontFamily: MONO, fontSize: '0.85rem', letterSpacing: '0.18em', padding: '0.75rem 2rem', cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(128,92,232,0.26)'; e.currentTarget.style.borderColor = 'rgba(170,130,255,0.7)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(128,92,232,0.14)'; e.currentTarget.style.borderColor = 'rgba(128,92,232,0.45)' }}
          >
            BEGIN MISSION →
          </button>
        </div>
      </main>
    )
  }

  // ── Game screen ──────────────────────────────────────────────────────────────
  return (
    <main style={{ background: '#04020f', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#c8b8e8', fontFamily: MONO }}>

      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.65rem 1.4rem', borderBottom: '1px solid rgba(128,92,232,0.12)', flexShrink: 0 }}>
        <Link
          href="/puzzles"
          style={{ color: 'rgba(128,92,232,0.5)', textDecoration: 'none', fontSize: '0.78rem', letterSpacing: '0.08em', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(170,130,255,0.9)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(128,92,232,0.5)')}
        >
          ← puzzles
        </Link>
        <span style={{ color: 'rgba(128,92,232,0.22)', fontSize: '0.7rem' }}>|</span>
        <span style={{ fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(128,92,232,0.8)' }}>
          {lv.name}
        </span>
        <span style={{ fontSize: '0.72rem', color: 'rgba(200,185,235,0.30)', fontFamily: SERIF, fontStyle: 'italic' }}>
          — {lv.subtitle}
        </span>
      </div>

      {/* Canvas area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block', cursor: phase === 'aiming' ? 'crosshair' : 'default' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />

        {/* Bottom control bar — aiming only */}
        {phase === 'aiming' && (
          <div style={{
            position: 'absolute', bottom: '1.4rem', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: '1rem',
            background: 'rgba(4,2,15,0.80)', backdropFilter: 'blur(6px)',
            border: '1px solid rgba(128,92,232,0.18)', borderRadius: 4,
            padding: '0.6rem 1rem',
          }}>
            {/* Speed indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <span style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'rgba(128,92,232,0.65)' }}>SPEED</span>
              <div style={{ width: 72, height: 4, background: 'rgba(128,92,232,0.15)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${aimSpeed}%`, height: '100%', background: 'rgba(160,120,255,0.75)', borderRadius: 2, transition: 'width 0.05s' }} />
              </div>
              <span style={{ fontSize: '0.68rem', color: 'rgba(200,185,235,0.55)', minWidth: 28, textAlign: 'right' }}>{aimSpeed}%</span>
            </div>

            <div style={{ width: 1, height: 16, background: 'rgba(128,92,232,0.18)' }} />

            {/* Hint toggle */}
            <button
              onClick={() => setShowHint(h => !h)}
              style={{ ...OUTLINE_BTN, padding: '0.35rem 0.7rem', fontSize: '0.65rem', letterSpacing: '0.12em', opacity: 0.7 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
            >
              {showHint ? 'HIDE HINT' : 'HINT'}
            </button>

            {/* Reset */}
            <button
              onClick={retry}
              style={OUTLINE_BTN}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(128,92,232,0.10)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              RESET
            </button>

            {/* Launch */}
            <button
              onClick={launch}
              disabled={aimSpeed === 0}
              style={{
                ...FILLED_BTN,
                opacity: aimSpeed === 0 ? 0.4 : 1,
                cursor: aimSpeed === 0 ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (aimSpeed > 0) e.currentTarget.style.background = 'rgba(128,92,232,0.32)' }}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(128,92,232,0.18)')}
            >
              LAUNCH →
            </button>
          </div>
        )}

        {/* Hint panel */}
        {phase === 'aiming' && showHint && (
          <div style={{
            position: 'absolute', bottom: '5.5rem', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(4,2,15,0.88)', border: '1px solid rgba(128,92,232,0.22)', borderRadius: 4,
            padding: '0.8rem 1.2rem', maxWidth: 420, textAlign: 'center',
          }}>
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.88rem', color: 'rgba(200,185,235,0.62)', margin: 0, lineHeight: 1.6 }}>
              {lv.hint}
            </p>
          </div>
        )}

        {/* Success overlay */}
        {phase === 'success' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,2,15,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.42em', color: 'rgba(140,220,120,0.85)', margin: 0 }}>STATUS: BEACON REACHED</p>
            <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem, 5vw, 3rem)', fontStyle: 'italic', color: '#e0d0ff', margin: 0 }}>Mission Complete</h2>
            <p style={{ fontFamily: SERIF, fontSize: '0.9rem', fontStyle: 'italic', color: 'rgba(200,185,235,0.45)', margin: 0 }}>
              {isLastLevel ? 'All three beacons secured.' : 'Prepare for the next objective.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.6rem' }}>
              <button
                onClick={retry}
                style={OUTLINE_BTN}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(128,92,232,0.10)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                RETRY LEVEL
              </button>
              {!isLastLevel ? (
                <button
                  onClick={nextLevel}
                  style={FILLED_BTN}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(128,92,232,0.32)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(128,92,232,0.18)')}
                >
                  NEXT LEVEL →
                </button>
              ) : (
                <Link
                  href="/puzzles"
                  style={{ ...FILLED_BTN, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                >
                  BACK TO PUZZLES
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Crashed overlay */}
        {phase === 'crashed' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,2,15,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.42em', color: 'rgba(210,80,60,0.85)', margin: 0 }}>STATUS: HULL BREACH</p>
            <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem, 5vw, 3rem)', fontStyle: 'italic', color: '#e0d0ff', margin: 0 }}>Spacecraft Lost</h2>
            <p style={{ fontFamily: SERIF, fontSize: '0.9rem', fontStyle: 'italic', color: 'rgba(200,185,235,0.45)', margin: 0 }}>
              Impact with a planetary body.
            </p>
            <button
              onClick={retry}
              style={{ ...FILLED_BTN, marginTop: '0.4rem' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(128,92,232,0.32)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(128,92,232,0.18)')}
            >
              RETRY
            </button>
          </div>
        )}

        {/* Drifted overlay */}
        {phase === 'drifted' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,2,15,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.42em', color: 'rgba(128,92,232,0.75)', margin: 0 }}>STATUS: SIGNAL LOST</p>
            <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem, 5vw, 3rem)', fontStyle: 'italic', color: '#e0d0ff', margin: 0 }}>Off Course</h2>
            <p style={{ fontFamily: SERIF, fontSize: '0.9rem', fontStyle: 'italic', color: 'rgba(200,185,235,0.45)', margin: 0 }}>
              The spacecraft drifted out of range.
            </p>
            <button
              onClick={retry}
              style={{ ...FILLED_BTN, marginTop: '0.4rem' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(128,92,232,0.32)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(128,92,232,0.18)')}
            >
              RETRY
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
