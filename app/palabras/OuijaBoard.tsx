'use client'

import { useEffect, useRef, useState } from 'react'
import { Topic } from './page'

// Topic positions as % of board width / height
// Layout: 4 – 3 – 2
const TOPIC_POSITIONS: Record<string, { x: number; y: number }> = {
  'space-news':     { x: 18, y: 42 },
  'life-sciences':  { x: 34, y: 42 },
  'ai-ml':          { x: 52, y: 42 },
  'space-agencies': { x: 68, y: 42 },
  'cybersecurity':  { x: 26, y: 59 },
  'materials':      { x: 44, y: 59 },
  'space-station':  { x: 62, y: 59 },
  'swiss-uni':      { x: 35, y: 74 },
  'ssip':           { x: 55, y: 74 },
}

const SNAP_RADIUS_PX = 110

// ── Inline SVG icons (black stroke, 40×40 viewBox) ──────────────────────────

function IconSpaceNews() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
      <path d="M20 5 C20 5 13 14 13 23 L15 23 L15 31 L17.5 34 L20 36 L22.5 34 L25 31 L25 23 L27 23 C27 14 20 5 20 5Z"/>
      <circle cx="20" cy="18" r="3"/>
      <path d="M13 25 L9 30 L13 27Z"/>
      <path d="M27 25 L31 30 L27 27Z"/>
    </svg>
  )
}

function IconLifeSciences() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-9 h-9">
      <path d="M15 5 Q23 12 15 20 Q7 28 15 35"/>
      <path d="M25 5 Q17 12 25 20 Q33 28 25 35"/>
      <line x1="15" y1="10" x2="25" y2="10"/>
      <line x1="15" y1="20" x2="25" y2="20"/>
      <line x1="15" y1="30" x2="25" y2="30"/>
    </svg>
  )
}

function IconAI() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-9 h-9">
      <circle cx="20" cy="20" r="12"/>
      <circle cx="20" cy="20" r="4"/>
      <line x1="20" y1="8"  x2="20" y2="16"/>
      <line x1="20" y1="24" x2="20" y2="32"/>
      <line x1="8"  y1="20" x2="16" y2="20"/>
      <line x1="24" y1="20" x2="32" y2="20"/>
      <line x1="11.5" y1="11.5" x2="17" y2="17"/>
      <line x1="23"   y1="23"   x2="28.5" y2="28.5"/>
      <line x1="28.5" y1="11.5" x2="23" y2="17"/>
      <line x1="17"   y1="23"   x2="11.5" y2="28.5"/>
    </svg>
  )
}

function IconSpaceAgencies() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-9 h-9">
      <circle cx="20" cy="20" r="7"/>
      <ellipse cx="20" cy="20" rx="18" ry="6"/>
      <ellipse cx="20" cy="20" rx="18" ry="6" transform="rotate(30 20 20)"/>
    </svg>
  )
}

function IconCyber() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
      <path d="M20 4 L34 10 L34 22 C34 30 27 36 20 38 C13 36 6 30 6 22 L6 10 Z"/>
      <rect x="15" y="20" width="10" height="9" rx="1"/>
      <path d="M16 20 L16 17 C16 13.5 24 13.5 24 17 L24 20"/>
      <circle cx="20" cy="24.5" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function IconMaterials() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-9 h-9">
      <circle cx="20" cy="20" r="3" fill="currentColor" stroke="none"/>
      <ellipse cx="20" cy="20" rx="16" ry="5.5"/>
      <ellipse cx="20" cy="20" rx="16" ry="5.5" transform="rotate(60 20 20)"/>
      <ellipse cx="20" cy="20" rx="16" ry="5.5" transform="rotate(-60 20 20)"/>
    </svg>
  )
}

function IconSpaceStation() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
      <rect x="17" y="15" width="6" height="10" rx="1"/>
      <line x1="4"  y1="20" x2="17" y2="20"/>
      <line x1="23" y1="20" x2="36" y2="20"/>
      <rect x="4"  y="16" width="7" height="8" rx="1"/>
      <rect x="29" y="16" width="7" height="8" rx="1"/>
      <circle cx="20" cy="20" r="2" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function IconSwissUni() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
      <polygon points="20,5 36,15 20,21 4,15"/>
      <path d="M10 18 L10 28 C10 28 14 33 20 33 C26 33 30 28 30 28 L30 18"/>
      <line x1="36" y1="15" x2="36" y2="26"/>
      <circle cx="36" cy="27.5" r="2" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function IconSSIP() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
      <polygon points="20,3 23.5,13.5 34.5,13.5 25.5,20 28.5,30.5 20,24 11.5,30.5 14.5,20 5.5,13.5 16.5,13.5"/>
    </svg>
  )
}

const ICONS: Record<string, () => React.ReactElement> = {
  'space-news':     IconSpaceNews,
  'life-sciences':  IconLifeSciences,
  'ai-ml':          IconAI,
  'space-agencies': IconSpaceAgencies,
  'cybersecurity':  IconCyber,
  'materials':      IconMaterials,
  'space-station':  IconSpaceStation,
  'swiss-uni':      IconSwissUni,
  'ssip':           IconSSIP,
}

// ── Sun rays helper ──────────────────────────────────────────────────────────

function SunDecoration({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const rays = Array.from({ length: 12 }, (_, i) => i * 30)
  return (
    <g>
      <circle cx={cx} cy={cy} r={r * 0.55} stroke="rgba(40,20,5,0.45)" strokeWidth="1.2" fill="none"/>
      <circle cx={cx} cy={cy} r={r * 0.85} stroke="rgba(40,20,5,0.3)"  strokeWidth="1"   fill="none"/>
      {rays.map((deg) => {
        const rad = (deg * Math.PI) / 180
        return (
          <line
            key={deg}
            x1={cx + Math.cos(rad) * r * 0.6}
            y1={cy + Math.sin(rad) * r * 0.6}
            x2={cx + Math.cos(rad) * r}
            y2={cy + Math.sin(rad) * r}
            stroke="rgba(40,20,5,0.45)"
            strokeWidth="1.2"
          />
        )
      })}
    </g>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  topics: Topic[]
  onSelectTopic: (topic: Topic) => void
}

export default function OuijaBoard({ topics, onSelectTopic }: Props) {
  const boardRef                        = useRef<HTMLDivElement>(null)
  const posRef                          = useRef({ x: 50, y: 60 })
  const targetRef                       = useRef({ x: 50, y: 60 })
  const rafRef                          = useRef<number>(0)
  const [planchettePos, setPlanchettePos] = useState({ x: 50, y: 60 })
  const [hoveredTopic, setHoveredTopic]   = useState<string | null>(null)
  const [boardVisible, setBoardVisible]   = useState(false)

  // Fade the board in after mount
  useEffect(() => {
    const t = setTimeout(() => setBoardVisible(true), 30)
    return () => clearTimeout(t)
  }, [])

  // Planchette mouse tracking + RAF animation
  useEffect(() => {
    const board = boardRef.current
    if (!board) return

    function handleMouseMove(e: MouseEvent) {
      const rect = board!.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      let nearestId: string | null = null
      let minDist = SNAP_RADIUS_PX

      for (const [id, pos] of Object.entries(TOPIC_POSITIONS)) {
        const tx = (pos.x / 100) * rect.width
        const ty = (pos.y / 100) * rect.height
        const dist = Math.sqrt((mx - tx) ** 2 + (my - ty) ** 2)
        if (dist < minDist) {
          minDist = dist
          nearestId = id
        }
      }

      setHoveredTopic(nearestId)

      if (nearestId) {
        const tp = TOPIC_POSITIONS[nearestId]
        const tx = (tp.x / 100) * rect.width
        const ty = (tp.y / 100) * rect.height
        const snapFactor = (1 - minDist / SNAP_RADIUS_PX) * 0.85
        targetRef.current = {
          x: ((mx + (tx - mx) * snapFactor) / rect.width)  * 100,
          y: ((my + (ty - my) * snapFactor) / rect.height) * 100,
        }
      } else {
        targetRef.current = {
          x: (mx / rect.width)  * 100,
          y: (my / rect.height) * 100,
        }
      }
    }

    board.addEventListener('mousemove', handleMouseMove)

    function animate() {
      const cur = posRef.current
      const tgt = targetRef.current
      cur.x += (tgt.x - cur.x) * 0.12
      cur.y += (tgt.y - cur.y) * 0.12
      setPlanchettePos({ x: cur.x, y: cur.y })
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      board.removeEventListener('mousemove', handleMouseMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      ref={boardRef}
      className="w-full h-full relative overflow-hidden select-none"
      style={{ cursor: 'none', background: 'linear-gradient(145deg, #c9985c 0%, #b8834a 35%, #c4975a 65%, #ae7a3c 100%)' }}
    >
      {/* Wood grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(88deg, transparent 0px, transparent 5px, rgba(80,44,15,0.04) 5px, rgba(80,44,15,0.04) 6px), ' +
            'repeating-linear-gradient(92deg, transparent 0px, transparent 9px, rgba(80,44,15,0.03) 9px, rgba(80,44,15,0.03) 10px)',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 82% 78% at 50% 50%, transparent 35%, rgba(20,8,2,0.72) 100%)' }}
      />

      {/* Outer border */}
      <div
        className="absolute pointer-events-none"
        style={{ inset: '1.5%', border: '2.5px solid rgba(50,22,6,0.55)', borderRadius: '10px' }}
      />
      {/* Inner border */}
      <div
        className="absolute pointer-events-none"
        style={{ inset: '2.8%', border: '1px solid rgba(50,22,6,0.25)', borderRadius: '8px' }}
      />

      {/* ── Decorative SVG overlay ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1000 580"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* "WHATYA READING" arching text */}
        <defs>
          <path id="ouija-arch" d="M 170 170 Q 500 55 830 170"/>
        </defs>
        <text
          fill="rgba(35,15,3,0.82)"
          fontSize="46"
          fontWeight="bold"
          fontStyle="italic"
          fontFamily="'Times New Roman', Times, serif"
          letterSpacing="7"
        >
          <textPath href="#ouija-arch" startOffset="50%" textAnchor="middle">
            WHATYA READING
          </textPath>
        </text>

        {/* YES */}
        <text x="110" y="215" fontSize="34" fontWeight="bold" fontStyle="italic"
          fill="rgba(35,15,3,0.78)" fontFamily="'Times New Roman', Times, serif" letterSpacing="3">
          YES
        </text>

        {/* NO */}
        <text x="846" y="215" fontSize="34" fontWeight="bold" fontStyle="italic"
          fill="rgba(35,15,3,0.78)" fontFamily="'Times New Roman', Times, serif" letterSpacing="3">
          NO
        </text>

        {/* Sun */}
        <SunDecoration cx={72} cy={135} r={36}/>

        {/* Moon — crescent */}
        <g transform="translate(928, 135)">
          <path
            d="M 12 -30 A 30 30 0 1 0 12 30 A 22 22 0 1 1 12 -30 Z"
            stroke="rgba(40,20,5,0.45)" strokeWidth="1.2" fill="none"
          />
        </g>

        {/* Horizontal rules */}
        <line x1="80" y1="238" x2="920" y2="238" stroke="rgba(40,20,5,0.2)" strokeWidth="1"/>
        <line x1="80" y1="490" x2="920" y2="490" stroke="rgba(40,20,5,0.2)" strokeWidth="1"/>

        {/* Decorative small stars */}
        {([[500,530],[175,430],[825,430],[320,530],[680,530]] as [number,number][]).map(([x,y],i) => (
          <text key={i} x={x} y={y} fontSize="14" fill="rgba(40,20,5,0.35)"
            textAnchor="middle" dominantBaseline="middle"
            fontFamily="'Times New Roman', Times, serif">
            ✦
          </text>
        ))}

        {/* GOODBYE */}
        <text x="500" y="556" fontSize="30" fontWeight="bold" fontStyle="italic"
          fill="rgba(35,15,3,0.7)" fontFamily="'Times New Roman', Times, serif"
          textAnchor="middle" letterSpacing="6">
          GOODBYE
        </text>
      </svg>

      {/* ── Topic icons ── */}
      {topics.map((topic) => {
        const pos = TOPIC_POSITIONS[topic.id]
        if (!pos) return null
        const Icon = ICONS[topic.id]
        const hovered = hoveredTopic === topic.id
        return (
          <div
            key={topic.id}
            className="absolute flex flex-col items-center gap-1"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: hovered
                ? 'translate(-50%, -50%) scale(1.18)'
                : 'translate(-50%, -50%) scale(1)',
              color: hovered ? 'rgba(25,8,0,1)' : 'rgba(35,15,3,0.72)',
              transition: 'transform 0.15s ease, color 0.15s ease',
              cursor: 'none',
            }}
            onClick={() => onSelectTopic(topic)}
          >
            <div style={{ filter: hovered ? 'drop-shadow(0 0 6px rgba(35,15,3,0.45))' : 'none', transition: 'filter 0.15s' }}>
              {Icon && <Icon />}
            </div>
            <span
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: '0.6rem',
                fontWeight: 'bold',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textAlign: 'center',
                maxWidth: '80px',
                lineHeight: 1.3,
                color: hovered ? 'rgba(25,8,0,0.95)' : 'rgba(35,15,3,0.65)',
                transition: 'color 0.15s',
              }}
            >
              {topic.label}
            </span>
          </div>
        )
      })}

      {/* ── Planchette ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${planchettePos.x}%`,
          top:  `${planchettePos.y}%`,
          // Offset so the window/eye of the planchette sits at the tracked position
          // Eye is at y≈38 in a 120px SVG → -31.7% of height = -38px
          transform: 'translate(-50%, -31.7%)',
          width:  '80px',
          height: '120px',
          filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.45))',
          zIndex: 20,
          opacity: boardVisible ? 1 : 0,
          transition: 'opacity 0.6s',
        }}
      >
        <svg viewBox="0 0 80 120" width="80" height="120" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="pg" cx="42%" cy="28%" r="65%">
              <stop offset="0%"   stopColor="#ecdcba"/>
              <stop offset="100%" stopColor="#b07840"/>
            </radialGradient>
          </defs>
          {/* Body — teardrop, pointed tip at bottom */}
          <path
            d="M40 8 C18 8 4 24 4 44 C4 68 16 90 40 116 C64 90 76 68 76 44 C76 24 62 8 40 8 Z"
            fill="url(#pg)" stroke="#5a3018" strokeWidth="2"
          />
          {/* Window */}
          <circle cx="40" cy="38" r="13" fill="rgba(100,55,15,0.12)" stroke="#5a3018" strokeWidth="1.5"/>
          {/* Centre dot */}
          <circle cx="40" cy="38" r="2.5" fill="#5a3018" opacity="0.6"/>
          {/* Decorative vein lines */}
          <path d="M40 53 C29 60 23 80 25 98" stroke="#5a3018" strokeWidth="0.9" fill="none" opacity="0.35"/>
          <path d="M40 53 C51 60 57 80 55 98" stroke="#5a3018" strokeWidth="0.9" fill="none" opacity="0.35"/>
          {/* Felt pads */}
          <circle cx="22"  cy="97"  r="3.5" fill="#3a1c06" opacity="0.55"/>
          <circle cx="58"  cy="97"  r="3.5" fill="#3a1c06" opacity="0.55"/>
          <circle cx="40"  cy="111" r="3.5" fill="#3a1c06" opacity="0.55"/>
        </svg>
      </div>
    </div>
  )
}
