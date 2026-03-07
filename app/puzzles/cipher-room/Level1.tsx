'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { L1 } from './data'

const MONO  = 'var(--font-geist-mono, monospace)'
const SERIF = '"Georgia", "Times New Roman", serif'
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function applyShift(text: string, shift: number): string {
  return text.split('').map(ch => {
    const upper = ch.toUpperCase()
    const idx   = ALPHA.indexOf(upper)
    if (idx < 0) return ch
    const decoded = ALPHA[(idx - shift + 26) % 26]
    return ch === ch.toUpperCase() ? decoded : decoded.toLowerCase()
  }).join('')
}

interface Props { onSolve: () => void; solved: boolean }

export default function Level1({ onSolve, solved }: Props) {
  const [shift, setShift]     = useState(0)
  const [dragging, setDragging] = useState(false)
  const [locked,  setLocked]  = useState(solved)
  const [flash,   setFlash]   = useState(false)
  const wheelRef = useRef<SVGSVGElement>(null)
  const startAngleRef = useRef(0)
  const startShiftRef = useRef(0)

  const decoded  = applyShift(L1.ciphertext, shift)
  const isSolved = shift === L1.correctShift

  // Lock in when correct
  useEffect(() => {
    if (isSolved && !locked) {
      setFlash(true)
      const t = setTimeout(() => {
        setFlash(false)
        setLocked(true)
        onSolve()
      }, 1200)
      return () => clearTimeout(t)
    }
  }, [isSolved, locked, onSolve])

  // ── Wheel drag logic ──
  function getAngle(e: React.MouseEvent | MouseEvent): number {
    if (!wheelRef.current) return 0
    const rect = wheelRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    return Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI)
  }

  function onWheelMouseDown(e: React.MouseEvent) {
    if (locked) return
    e.preventDefault()
    startAngleRef.current = getAngle(e)
    startShiftRef.current = shift
    setDragging(true)
  }

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return
    const angleDiff = getAngle(e) - startAngleRef.current
    // Map 360° → 26 positions; snap to nearest integer shift
    const shiftDiff = Math.round(angleDiff / (360 / 26))
    const newShift  = ((startShiftRef.current - shiftDiff) % 26 + 26) % 26
    setShift(newShift)
  }, [dragging]) // eslint-disable-line react-hooks/exhaustive-deps

  const onMouseUp = useCallback(() => setDragging(false), [])

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [dragging, onMouseMove, onMouseUp])

  // ── Alphabet wheel SVG ──
  const SIZE   = 240
  const CENTER = SIZE / 2
  const OUTER  = 108
  const INNER  = 72
  const LABEL_OUTER = 94
  const LABEL_INNER = 60

  const outerAngle = (i: number) => (i / 26) * 360 - 90
  const innerAngle = (i: number) => ((i - shift + 26) % 26 / 26) * 360 - 90

  function letterPos(angle: number, r: number) {
    const rad = (angle * Math.PI) / 180
    return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) }
  }

  const solveColor   = '#4a9e6a'
  const accentColor  = locked ? solveColor : (flash ? solveColor : 'rgba(200,148,20,0.85)')
  const cipherColor  = flash || locked ? solveColor : 'rgba(200,148,20,0.7)'

  return (
    <div
      style={{
        minHeight: '100%',
        background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(40,25,5,0.6) 0%, transparent 70%), #0e0b06',
        padding: '2rem 2rem 3rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
      }}
    >
      {/* Briefing */}
      <div style={{ maxWidth: 600 }}>
        <p style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(200,148,20,0.4)', marginBottom: '0.6rem' }}>
          Act I — The Written Word
        </p>
        <p style={{ fontFamily: SERIF, fontSize: '0.9rem', lineHeight: 1.85, color: 'rgba(232,220,200,0.65)', margin: 0 }}>
          A Roman courier has been intercepted near the Rhine. The dispatch he carries is encoded —
          Caesar's standard method: shift every letter of the alphabet by a fixed number of positions.
          Rotate the outer ring until the message makes sense.
        </p>
      </div>

      {/* Main puzzle area */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', alignItems: 'flex-start' }}>

        {/* Alphabet wheel */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
          <svg
            ref={wheelRef}
            width={SIZE}
            height={SIZE}
            onMouseDown={onWheelMouseDown}
            style={{ cursor: locked ? 'default' : (dragging ? 'grabbing' : 'grab'), userSelect: 'none', touchAction: 'none' }}
          >
            {/* Outer ring background */}
            <circle cx={CENTER} cy={CENTER} r={OUTER} fill="none" stroke="rgba(200,148,20,0.18)" strokeWidth={28} />
            {/* Inner ring background */}
            <circle cx={CENTER} cy={CENTER} r={INNER} fill="none" stroke="rgba(60,40,10,0.8)" strokeWidth={24} />
            {/* Center hub */}
            <circle cx={CENTER} cy={CENTER} r={20} fill="#0e0b06" stroke={accentColor} strokeWidth={1.5} />
            {/* Shift number */}
            <text x={CENTER} y={CENTER + 5} textAnchor="middle" fontFamily={MONO} fontSize={13} fontWeight={700} fill={accentColor}>
              {shift}
            </text>

            {/* Outer ring letters (fixed — cipher alphabet) */}
            {ALPHA.split('').map((ch, i) => {
              const { x, y } = letterPos(outerAngle(i), LABEL_OUTER)
              return (
                <text key={`o${i}`} x={x} y={y} textAnchor="middle" dominantBaseline="central"
                  fontFamily={MONO} fontSize={9} fill="rgba(200,148,20,0.75)" transform={`rotate(${outerAngle(i) + 90},${x},${y})`}>
                  {ch}
                </text>
              )
            })}

            {/* Inner ring letters (rotates with shift — plain alphabet) */}
            {ALPHA.split('').map((ch, i) => {
              const ang   = innerAngle(i)
              const { x, y } = letterPos(ang, LABEL_INNER)
              return (
                <text key={`inn${i}`} x={x} y={y} textAnchor="middle" dominantBaseline="central"
                  fontFamily={MONO} fontSize={9} fill={locked ? solveColor : 'rgba(232,220,200,0.5)'}
                  transform={`rotate(${ang + 90},${x},${y})`}>
                  {ch}
                </text>
              )
            })}

            {/* Lock icon when solved */}
            {locked && (
              <circle cx={CENTER} cy={CENTER} r={20} fill="none" stroke={solveColor} strokeWidth={2}
                style={{ filter: 'drop-shadow(0 0 6px rgba(74,158,106,0.6))' }} />
            )}
          </svg>

          {/* Shift controls */}
          {!locked && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button onClick={() => setShift(s => (s - 1 + 26) % 26)} style={btnStyle}>−</button>
              <span style={{ fontFamily: MONO, fontSize: '0.72rem', color: 'rgba(200,148,20,0.6)', minWidth: 60, textAlign: 'center' }}>
                shift&nbsp;{shift}
              </span>
              <button onClick={() => setShift(s => (s + 1) % 26)} style={btnStyle}>+</button>
            </div>
          )}
          {!locked && (
            <p style={{ fontFamily: MONO, fontSize: '0.6rem', color: 'rgba(200,170,120,0.28)', margin: 0, textAlign: 'center' }}>
              drag the wheel or use the buttons
            </p>
          )}
        </div>

        {/* Cipher / decoded text */}
        <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>

          {/* Ciphertext */}
          <div>
            <p style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(200,148,20,0.35)', marginBottom: '0.5rem' }}>
              Intercepted dispatch
            </p>
            <div
              style={{
                background: 'rgba(200,148,20,0.04)',
                border: '1px solid rgba(200,148,20,0.14)',
                borderRadius: '4px',
                padding: '1rem 1.1rem',
                fontFamily: MONO,
                fontSize: '0.95rem',
                letterSpacing: '0.08em',
                lineHeight: 1.7,
                color: cipherColor,
                wordBreak: 'break-word',
              }}
            >
              {L1.ciphertext}
            </div>
          </div>

          {/* Decoded output */}
          <div>
            <p style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: locked ? 'rgba(74,158,106,0.6)' : 'rgba(200,170,120,0.3)', marginBottom: '0.5rem' }}>
              {locked ? 'Decoded message' : 'Current decoding attempt'}
            </p>
            <div
              style={{
                background: locked ? 'rgba(74,158,106,0.04)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${locked ? 'rgba(74,158,106,0.22)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '4px',
                padding: '1rem 1.1rem',
                fontFamily: SERIF,
                fontSize: '0.95rem',
                lineHeight: 1.7,
                color: locked ? 'rgba(232,220,200,0.85)' : 'rgba(232,220,200,0.38)',
                wordBreak: 'break-word',
                minHeight: '3.5rem',
                transition: 'background 0.4s, border-color 0.4s, color 0.4s',
                boxShadow: flash ? '0 0 24px rgba(74,158,106,0.25)' : 'none',
              }}
            >
              {decoded}
            </div>
          </div>

          {/* Hint */}
          {!locked && (
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(200,170,120,0.28)', margin: 0 }}>
              Hint: Caesar always used the same shift. Try a small number.
            </p>
          )}
          {locked && (
            <p style={{ fontFamily: MONO, fontSize: '0.7rem', color: 'rgba(74,158,106,0.7)', margin: 0 }}>
              Correct. Shift = {L1.correctShift}. The dispatch is from Caesar himself.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(200,148,20,0.25)',
  borderRadius: '3px',
  width: 30,
  height: 30,
  fontFamily: 'var(--font-geist-mono, monospace)',
  fontSize: '1rem',
  color: 'rgba(200,148,20,0.7)',
  cursor: 'pointer',
  lineHeight: 1,
}
