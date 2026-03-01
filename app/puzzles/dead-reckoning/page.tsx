'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ── Palette ───────────────────────────────────────────────────────────────────
const PAGE_BG    = '#0e0400'
const CELL_EMPTY = '#3a1505'
const CELL_ROCK  = '#1c0802'
const ROVER_CLR  = 'rgba(255,220,120,0.95)'
const TRAIL_CLR  = 'rgba(80,40,15,0.6)'
const ACCENT     = 'rgba(210,120,40,0.9)'
const MONO       = 'var(--font-geist-mono, monospace)'
const SERIF      = '"Times New Roman", Times, serif'

// ── Types ─────────────────────────────────────────────────────────────────────
type Cell  = 'empty' | 'rock' | 'goal'
type Dir   = 'N' | 'E' | 'S' | 'W'
type Cmd   = 'FORWARD' | 'LEFT' | 'RIGHT'
type Phase = 'briefing' | 'planning' | 'transmitting' | 'executing' | 'success' | 'fail'

interface RoverPos { row: number; col: number; dir: Dir }

interface LevelDef {
  name: string
  subtitle: string
  grid: Cell[][]
  start: RoverPos
  maxCommands: number
  cellSize: number
}

// ── Direction tables ──────────────────────────────────────────────────────────
const TURN_L: Record<Dir, Dir>       = { N: 'W', W: 'S', S: 'E', E: 'N' }
const TURN_R: Record<Dir, Dir>       = { N: 'E', E: 'S', S: 'W', W: 'N' }
const DIR_ARROW: Record<Dir, string> = { N: '↑', E: '→', S: '↓', W: '←' }

function stepForward(r: number, c: number, dir: Dir): [number, number] {
  if (dir === 'N') return [r - 1, c]
  if (dir === 'S') return [r + 1, c]
  if (dir === 'E') return [r, c + 1]
  return [r, c - 1]
}

function applyCmd(
  pos: RoverPos,
  cmd: Cmd,
  grid: Cell[][]
): { pos: RoverPos; outcome: 'ok' | 'wall' | 'goal' } {
  if (cmd === 'LEFT')  return { pos: { ...pos, dir: TURN_L[pos.dir] }, outcome: 'ok' }
  if (cmd === 'RIGHT') return { pos: { ...pos, dir: TURN_R[pos.dir] }, outcome: 'ok' }
  const [nr, nc] = stepForward(pos.row, pos.col, pos.dir)
  if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0].length)
    return { pos, outcome: 'wall' }
  const cell = grid[nr][nc]
  if (cell === 'rock') return { pos, outcome: 'wall' }
  return { pos: { ...pos, row: nr, col: nc }, outcome: cell === 'goal' ? 'goal' : 'ok' }
}

// ── Grid parser ───────────────────────────────────────────────────────────────
function parseGrid(s: string): Cell[][] {
  return s.trim().split('\n')
    .map(row => row.trim())
    .filter(row => row.length > 0)
    .map(row =>
      row.split(/\s+/).map(c =>
        c === '#' ? 'rock' : c === 'G' ? 'goal' : 'empty'
      )
    )
}

// ── Level definitions ─────────────────────────────────────────────────────────
// Level 1: 7×7 — Start (6,0) E, Goal (0,6)
// Solution: F×6, L, F×6 = 13 commands
const LEVELS: LevelDef[] = [
  {
    name: 'Level 1 — First Contact',
    subtitle: 'Plot a course through the landing zone.',
    grid: parseGrid(`
      . . . . . . G
      . . . # . . .
      . . . . . . .
      . # . . . . .
      . . . . # . .
      . . . . . . .
      . . . . . . .
    `),
    start: { row: 6, col: 0, dir: 'E' },
    maxCommands: 16,
    cellSize: 54,
  },

  // Level 2: 9×9 — Start (8,0) E, Goal (0,8)
  // Solution: F×8, L, F×8 = 17 commands (direct path via col 8 / row 0)
  {
    name: 'Level 2 — Dust Storm',
    subtitle: 'Visibility is low. Navigate the debris field.',
    grid: parseGrid(`
      . . . . . . . . G
      . . # . . . . . .
      . . . . . . # . .
      . # . . . . . . .
      . . . . # . . . .
      . . . . . . . # .
      . # . . . . . . .
      . . . . # . . . .
      . . . . . . . . .
    `),
    start: { row: 8, col: 0, dir: 'E' },
    maxCommands: 20,
    cellSize: 44,
  },

  // Level 3: 11×11 — Start (10,0) E, Goal (0,10)
  // Rocks block direct E+N paths; solution: F×6, L, F×10, R, F×4 = 22 commands
  {
    name: 'Level 3 — Canyon Run',
    subtitle: 'Thread the canyon walls. No margin for error.',
    grid: parseGrid(`
      . . . . . . . . . . G
      . . . . . . . . # . .
      . . . . . # . . . . .
      . . . . . . . . . . .
      . . # . . . . . . . .
      . . . . . . . . . . #
      . . . . . . . . . . .
      . . . # . . . . . . .
      . . . . . . . # . . .
      . # . . . . . . . . .
      . . . . . . . . . . .
    `),
    start: { row: 10, col: 0, dir: 'E' },
    maxCommands: 24,
    cellSize: 36,
  },
]

// ── Shared button styles ──────────────────────────────────────────────────────
const OUTLINE_BTN: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(210,120,40,0.35)',
  borderRadius: 3,
  color: '#f0d4a0',
  fontFamily: MONO,
  fontSize: '0.75rem',
  letterSpacing: '0.15em',
  padding: '0.6rem 1.2rem',
  cursor: 'pointer',
  transition: 'background 0.2s',
}

const FILLED_BTN: React.CSSProperties = {
  background: 'rgba(210,120,40,0.18)',
  border: '1px solid rgba(210,120,40,0.45)',
  borderRadius: 3,
  color: '#f0d4a0',
  fontFamily: MONO,
  fontSize: '0.75rem',
  letterSpacing: '0.15em',
  padding: '0.6rem 1.2rem',
  cursor: 'pointer',
  transition: 'background 0.2s',
}

// ── Grid renderer ─────────────────────────────────────────────────────────────
function GridView({
  level,
  roverPos,
  trail,
}: {
  level: LevelDef
  roverPos: RoverPos
  trail: Set<string>
}) {
  const { grid, start, cellSize } = level
  const cols = grid[0].length

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gap: '2px',
        padding: '14px',
        background: 'rgba(18,6,2,0.55)',
        borderRadius: 4,
        border: '1px solid rgba(210,120,40,0.1)',
      }}
    >
      {grid.flatMap((row, ri) =>
        row.map((cell, ci) => {
          const key = `${ri},${ci}`
          const isRover  = roverPos.row === ri && roverPos.col === ci
          const isTrail  = trail.has(key) && !isRover
          const isStart  = start.row === ri && start.col === ci && !isRover && !isTrail
          const isGoal   = cell === 'goal'

          let bg: string
          if (isRover)       bg = ROVER_CLR
          else if (isTrail)  bg = TRAIL_CLR
          else if (cell === 'rock') bg = CELL_ROCK
          else if (isGoal)   bg = 'rgba(200,130,20,0.22)'
          else               bg = CELL_EMPTY

          return (
            <div
              key={key}
              style={{
                width: cellSize,
                height: cellSize,
                background: bg,
                border: isGoal
                  ? '1px solid rgba(200,140,20,0.55)'
                  : '1px solid rgba(0,0,0,0.3)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isGoal
                  ? '0 0 10px rgba(200,140,20,0.35), inset 0 0 8px rgba(200,140,20,0.12)'
                  : isRover
                  ? '0 0 12px rgba(255,220,120,0.45)'
                  : 'none',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              {isRover && (
                <span
                  style={{
                    fontSize: Math.round(cellSize * 0.48),
                    color: '#1c0802',
                    fontWeight: 'bold',
                    lineHeight: 1,
                    userSelect: 'none',
                  }}
                >
                  {DIR_ARROW[roverPos.dir]}
                </span>
              )}
              {isGoal && !isRover && (
                <span
                  style={{
                    fontSize: Math.round(cellSize * 0.42),
                    color: 'rgba(215,155,20,0.75)',
                    lineHeight: 1,
                    userSelect: 'none',
                  }}
                >
                  ◎
                </span>
              )}
              {cell === 'rock' && (
                <span
                  style={{
                    fontSize: Math.round(cellSize * 0.44),
                    color: 'rgba(80,40,25,0.5)',
                    lineHeight: 1,
                    userSelect: 'none',
                  }}
                >
                  ▪
                </span>
              )}
              {isStart && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 3,
                    fontSize: Math.round(cellSize * 0.22),
                    color: 'rgba(210,120,40,0.32)',
                    userSelect: 'none',
                    fontFamily: MONO,
                  }}
                >
                  S
                </span>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DeadReckoning() {
  const [phase, setPhase]             = useState<Phase>('briefing')
  const [levelIdx, setLevelIdx]       = useState(0)
  const [queue, setQueue]             = useState<Cmd[]>([])
  const [roverPos, setRoverPos]       = useState<RoverPos>(LEVELS[0].start)
  const [trail, setTrail]             = useState<Set<string>>(new Set<string>())
  const [activeCmd, setActiveCmd]     = useState(-1)
  const [failCmdIdx, setFailCmdIdx]   = useState(-1)
  const [countdown, setCountdown]     = useState(3)

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const level = LEVELS[levelIdx]

  function clearTimers() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  function resetToPlanning() {
    clearTimers()
    setRoverPos(LEVELS[levelIdx].start)
    setTrail(new Set())
    setActiveCmd(-1)
    setFailCmdIdx(-1)
    setQueue([])
    setCountdown(3)
    setPhase('planning')
  }

  function addCmd(cmd: Cmd) {
    setQueue(q => q.length >= level.maxCommands ? q : [...q, cmd])
  }

  function removeCmd(idx: number) {
    setQueue(q => q.filter((_, i) => i !== idx))
  }

  function sendTransmission() {
    if (queue.length === 0) return
    const capturedQueue = [...queue]
    setCountdown(3)
    setPhase('transmitting')
    const t1 = setTimeout(() => setCountdown(2), 833)
    const t2 = setTimeout(() => setCountdown(1), 1666)
    const t3 = setTimeout(() => {
      setCountdown(0)
      setPhase('executing')
      runExecution(capturedQueue, LEVELS[levelIdx])
    }, 2500)
    timersRef.current.push(t1, t2, t3)
  }

  function runExecution(cmds: Cmd[], lvl: LevelDef) {
    let pos: RoverPos = { ...lvl.start }
    let trailSet = new Set<string>()
    let stopped = false

    cmds.forEach((cmd, i) => {
      const t = setTimeout(() => {
        if (stopped) return

        // Add current cell to trail before moving forward
        if (cmd === 'FORWARD') {
          trailSet = new Set([...trailSet, `${pos.row},${pos.col}`])
        }

        const result = applyCmd(pos, cmd, lvl.grid)
        pos = result.pos

        setActiveCmd(i)
        setRoverPos({ ...pos })
        setTrail(new Set(trailSet))

        if (result.outcome === 'wall') {
          stopped = true
          const fi = i
          setTimeout(() => { setFailCmdIdx(fi); setPhase('fail') }, 400)
        } else if (result.outcome === 'goal') {
          stopped = true
          // Add goal cell to trail for visual effect
          trailSet = new Set([...trailSet, `${pos.row},${pos.col}`])
          setTrail(new Set(trailSet))
          setTimeout(() => setPhase('success'), 400)
        } else if (i === cmds.length - 1) {
          stopped = true
          setTimeout(() => { setFailCmdIdx(-2); setPhase('fail') }, 400)
        }
      }, (i + 1) * 550)
      timersRef.current.push(t)
    })
  }

  function goNextLevel() {
    clearTimers()
    const next = levelIdx + 1
    setLevelIdx(next)
    setRoverPos(LEVELS[next].start)
    setTrail(new Set())
    setActiveCmd(-1)
    setFailCmdIdx(-1)
    setQueue([])
    setCountdown(3)
    setPhase('planning')
  }

  // Cleanup on unmount
  useEffect(() => () => clearTimers(), []) // eslint-disable-line react-hooks/exhaustive-deps

  const failMsg =
    failCmdIdx === -2
      ? 'Rover did not reach target — mission aborted.'
      : failCmdIdx >= 0
      ? `Command ${failCmdIdx + 1} caused a collision.`
      : ''

  // ── Briefing screen ─────────────────────────────────────────────────────────
  if (phase === 'briefing') {
    return (
      <main
        style={{
          background: PAGE_BG,
          minHeight: '100vh',
          color: '#e8c89a',
          fontFamily: MONO,
          position: 'relative',
        }}
      >
        <Link
          href="/puzzles"
          style={{
            position: 'absolute',
            top: '1.5rem',
            left: '1.5rem',
            color: 'rgba(210,120,40,0.5)',
            textDecoration: 'none',
            fontSize: '0.8rem',
            letterSpacing: '0.1em',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(210,120,40,0.5)')}
        >
          ← puzzles
        </Link>

        <div style={{ maxWidth: 680, margin: '0 auto', padding: '8rem 2rem 4rem' }}>
          <p
            style={{
              fontSize: '0.68rem',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: ACCENT,
              marginBottom: '1.5rem',
            }}
          >
            MISSION BRIEFING — SPACE / NAVIGATION
          </p>

          <h1
            style={{
              fontFamily: SERIF,
              fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
              fontWeight: 'bold',
              fontStyle: 'italic',
              color: '#f0d4a0',
              lineHeight: 1.1,
              marginBottom: '2.5rem',
            }}
          >
            Dead Reckoning
          </h1>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.1rem',
              marginBottom: '2.5rem',
            }}
          >
            {[
              'Your rover has landed 140 million kilometers from Earth.',
              'At this distance, radio signals take approximately 20 minutes each way.',
              'You cannot steer the rover in real time. Instead, you must plan every move before transmission — then watch the sequence execute, unable to intervene.',
              "This is dead reckoning: navigating by known rules alone, with no feedback until it's too late to correct course.",
            ].map((text, i) => (
              <p
                key={i}
                style={{
                  fontFamily: SERIF,
                  fontSize: '1rem',
                  fontStyle: 'italic',
                  color: 'rgba(232,200,154,0.72)',
                  lineHeight: 1.75,
                  margin: 0,
                }}
              >
                {text}
              </p>
            ))}
          </div>

          <div
            style={{
              background: 'rgba(60,25,10,0.5)',
              border: '1px solid rgba(210,120,40,0.15)',
              borderRadius: 4,
              padding: '1.2rem 1.5rem',
              marginBottom: '3rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.55rem',
            }}
          >
            <p
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.28em',
                color: ACCENT,
                margin: '0 0 0.4rem',
              }}
            >
              COMMAND SET
            </p>
            {(
              [
                ['↑ FORWARD', 'Move one cell in current heading'],
                ['← LEFT',    'Rotate 90° counter-clockwise'],
                ['→ RIGHT',   'Rotate 90° clockwise'],
              ] as [string, string][]
            ).map(([cmd, desc]) => (
              <div
                key={cmd}
                style={{ display: 'flex', gap: '1.5rem', alignItems: 'baseline' }}
              >
                <span
                  style={{ color: '#f0d4a0', minWidth: 110, fontSize: '0.88rem' }}
                >
                  {cmd}
                </span>
                <span
                  style={{
                    color: 'rgba(232,200,154,0.45)',
                    fontSize: '0.82rem',
                    fontFamily: SERIF,
                    fontStyle: 'italic',
                  }}
                >
                  {desc}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setPhase('planning')}
            style={{
              background: 'rgba(210,120,40,0.12)',
              border: '1px solid rgba(210,120,40,0.4)',
              borderRadius: 4,
              color: '#f0d4a0',
              fontFamily: MONO,
              fontSize: '0.85rem',
              letterSpacing: '0.18em',
              padding: '0.75rem 2rem',
              cursor: 'pointer',
              transition: 'background 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(210,120,40,0.22)'
              e.currentTarget.style.borderColor = ACCENT
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(210,120,40,0.12)'
              e.currentTarget.style.borderColor = 'rgba(210,120,40,0.4)'
            }}
          >
            BEGIN MISSION →
          </button>
        </div>
      </main>
    )
  }

  // ── Planning / Transmitting / Executing / Success / Fail ───────────────────
  const isPlannable = phase === 'planning'
  const isLastLevel = levelIdx === LEVELS.length - 1

  return (
    <main
      style={{
        background: PAGE_BG,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#e8c89a',
        fontFamily: MONO,
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.7rem 1.5rem',
          borderBottom: '1px solid rgba(210,120,40,0.12)',
          flexShrink: 0,
        }}
      >
        <Link
          href="/puzzles"
          style={{
            color: 'rgba(210,120,40,0.5)',
            textDecoration: 'none',
            fontSize: '0.78rem',
            letterSpacing: '0.08em',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(210,120,40,0.5)')}
        >
          ← puzzles
        </Link>
        <span style={{ color: 'rgba(210,120,40,0.25)', fontSize: '0.7rem' }}>|</span>
        <span
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: ACCENT,
          }}
        >
          {level.name}
        </span>
        <span
          style={{
            fontSize: '0.72rem',
            color: 'rgba(232,200,154,0.3)',
            fontFamily: SERIF,
            fontStyle: 'italic',
          }}
        >
          — {level.subtitle}
        </span>
      </div>

      {/* Body: two columns */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* ── Left panel ── */}
        <div
          style={{
            width: 290,
            flexShrink: 0,
            borderRight: '1px solid rgba(210,120,40,0.1)',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.25rem',
            gap: '1rem',
            overflowY: 'auto',
          }}
        >
          {/* Command palette (planning only) */}
          {isPlannable && (
            <div>
              <p
                style={{
                  fontSize: '0.62rem',
                  letterSpacing: '0.28em',
                  color: ACCENT,
                  marginBottom: '0.6rem',
                }}
              >
                COMMAND PALETTE
              </p>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {(['LEFT', 'FORWARD', 'RIGHT'] as Cmd[]).map(cmd => {
                  const label =
                    cmd === 'FORWARD' ? '↑ FWD'
                    : cmd === 'LEFT'  ? '← LEFT'
                    :                   '→ RIGHT'
                  const disabled = queue.length >= level.maxCommands
                  return (
                    <button
                      key={cmd}
                      onClick={() => addCmd(cmd)}
                      disabled={disabled}
                      style={{
                        flex: 1,
                        background: disabled ? 'rgba(40,15,5,0.4)' : 'rgba(60,25,10,0.65)',
                        border: '1px solid rgba(210,120,40,0.2)',
                        borderRadius: 3,
                        color: disabled ? 'rgba(232,200,154,0.22)' : '#f0d4a0',
                        fontFamily: MONO,
                        fontSize: '0.7rem',
                        padding: '0.5rem 0.2rem',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        letterSpacing: '0.04em',
                        transition: 'border-color 0.15s, background 0.15s',
                      }}
                      onMouseEnter={e => {
                        if (!disabled)
                          e.currentTarget.style.borderColor = 'rgba(210,120,40,0.55)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(210,120,40,0.2)'
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Queue header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <p
              style={{
                fontSize: '0.62rem',
                letterSpacing: '0.28em',
                color: ACCENT,
                margin: 0,
              }}
            >
              COMMAND QUEUE
            </p>
            <span
              style={{
                fontSize: '0.62rem',
                color:
                  queue.length >= level.maxCommands
                    ? 'rgba(210,80,40,0.8)'
                    : 'rgba(232,200,154,0.38)',
              }}
            >
              {queue.length} / {level.maxCommands}
            </span>
          </div>

          {/* Queue list */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.18rem',
              minHeight: 0,
            }}
          >
            {queue.length === 0 ? (
              <p
                style={{
                  color: 'rgba(232,200,154,0.2)',
                  fontSize: '0.78rem',
                  fontFamily: SERIF,
                  fontStyle: 'italic',
                  margin: 0,
                }}
              >
                No commands queued.
              </p>
            ) : (
              queue.map((cmd, i) => {
                const isActive = i === activeCmd && phase === 'executing'
                const isFailed = phase === 'fail' && i === failCmdIdx
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.28rem 0.5rem',
                      borderRadius: 2,
                      background: isFailed
                        ? 'rgba(180,40,20,0.22)'
                        : isActive
                        ? 'rgba(210,120,40,0.16)'
                        : 'transparent',
                      border: isFailed
                        ? '1px solid rgba(180,40,20,0.38)'
                        : isActive
                        ? '1px solid rgba(210,120,40,0.22)'
                        : '1px solid transparent',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.55rem',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.58rem',
                          color: 'rgba(232,200,154,0.28)',
                          minWidth: 18,
                          textAlign: 'right',
                        }}
                      >
                        {i + 1}.
                      </span>
                      <span
                        style={{
                          fontSize: '0.76rem',
                          color: isFailed
                            ? 'rgba(220,100,80,0.9)'
                            : isActive
                            ? '#f0d4a0'
                            : 'rgba(232,200,154,0.62)',
                        }}
                      >
                        {cmd === 'FORWARD'
                          ? '↑ FORWARD'
                          : cmd === 'LEFT'
                          ? '← LEFT'
                          : '→ RIGHT'}
                      </span>
                    </div>
                    {isPlannable && (
                      <button
                        onClick={() => removeCmd(i)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'rgba(232,200,154,0.28)',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          padding: '0 0.2rem',
                          lineHeight: 1,
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={e =>
                          (e.currentTarget.style.color = 'rgba(210,80,40,0.85)')
                        }
                        onMouseLeave={e =>
                          (e.currentTarget.style.color = 'rgba(232,200,154,0.28)')
                        }
                      >
                        ×
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Send Transmission button */}
          {isPlannable && (
            <button
              onClick={sendTransmission}
              disabled={queue.length === 0}
              style={{
                background:
                  queue.length === 0
                    ? 'rgba(40,15,5,0.4)'
                    : 'rgba(210,120,40,0.15)',
                border: `1px solid ${
                  queue.length === 0
                    ? 'rgba(210,120,40,0.1)'
                    : 'rgba(210,120,40,0.5)'
                }`,
                borderRadius: 3,
                color: queue.length === 0 ? 'rgba(232,200,154,0.22)' : '#f0d4a0',
                fontFamily: MONO,
                fontSize: '0.76rem',
                letterSpacing: '0.15em',
                padding: '0.65rem',
                cursor: queue.length === 0 ? 'not-allowed' : 'pointer',
                flexShrink: 0,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => {
                if (queue.length > 0)
                  e.currentTarget.style.background = 'rgba(210,120,40,0.26)'
              }}
              onMouseLeave={e => {
                if (queue.length > 0)
                  e.currentTarget.style.background = 'rgba(210,120,40,0.15)'
              }}
            >
              SEND TRANSMISSION
            </button>
          )}
        </div>

        {/* ── Right panel: grid + overlays ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <GridView level={level} roverPos={roverPos} trail={trail} />

          {/* Transmitting overlay */}
          {phase === 'transmitting' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(14,4,0,0.84)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.8rem',
              }}
            >
              <p
                style={{
                  fontFamily: MONO,
                  fontSize: '0.72rem',
                  letterSpacing: '0.42em',
                  color: ACCENT,
                  margin: 0,
                  opacity: 0.9,
                }}
              >
                TRANSMITTING...
              </p>
              {countdown > 0 && (
                <p
                  style={{
                    fontFamily: SERIF,
                    fontSize: 'clamp(3.5rem, 8vw, 5.5rem)',
                    fontStyle: 'italic',
                    color: '#f0d4a0',
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {countdown}
                </p>
              )}
            </div>
          )}

          {/* Success overlay */}
          {phase === 'success' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(14,4,0,0.88)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
              }}
            >
              <p
                style={{
                  fontSize: '0.62rem',
                  letterSpacing: '0.42em',
                  color: 'rgba(160,210,100,0.8)',
                  margin: 0,
                }}
              >
                STATUS: COMPLETE
              </p>
              <h2
                style={{
                  fontFamily: SERIF,
                  fontSize: 'clamp(2rem, 5vw, 3rem)',
                  fontStyle: 'italic',
                  color: '#f0d4a0',
                  margin: 0,
                }}
              >
                Mission Complete
              </h2>
              <p
                style={{
                  fontFamily: SERIF,
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                  color: 'rgba(232,200,154,0.5)',
                  margin: 0,
                }}
              >
                Rover reached target coordinates.
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginTop: '0.75rem',
                }}
              >
                <button
                  onClick={resetToPlanning}
                  style={OUTLINE_BTN}
                  onMouseEnter={e =>
                    (e.currentTarget.style.background = 'rgba(210,120,40,0.1)')
                  }
                  onMouseLeave={e =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  RETRY LEVEL
                </button>
                {!isLastLevel ? (
                  <button
                    onClick={goNextLevel}
                    style={FILLED_BTN}
                    onMouseEnter={e =>
                      (e.currentTarget.style.background = 'rgba(210,120,40,0.32)')
                    }
                    onMouseLeave={e =>
                      (e.currentTarget.style.background = 'rgba(210,120,40,0.18)')
                    }
                  >
                    NEXT LEVEL →
                  </button>
                ) : (
                  <Link
                    href="/puzzles"
                    style={{
                      ...FILLED_BTN,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    BACK TO PUZZLES
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Fail overlay */}
          {phase === 'fail' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(14,4,0,0.88)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
              }}
            >
              <p
                style={{
                  fontSize: '0.62rem',
                  letterSpacing: '0.42em',
                  color: 'rgba(210,80,40,0.85)',
                  margin: 0,
                }}
              >
                STATUS: SIGNAL LOST
              </p>
              <h2
                style={{
                  fontFamily: SERIF,
                  fontSize: 'clamp(2rem, 5vw, 3rem)',
                  fontStyle: 'italic',
                  color: '#f0d4a0',
                  margin: 0,
                }}
              >
                Mission Failed
              </h2>
              {failMsg && (
                <p
                  style={{
                    fontFamily: SERIF,
                    fontSize: '0.9rem',
                    fontStyle: 'italic',
                    color: 'rgba(232,200,154,0.5)',
                    margin: 0,
                    textAlign: 'center',
                    maxWidth: 340,
                  }}
                >
                  {failMsg}
                </p>
              )}
              <button
                onClick={resetToPlanning}
                style={{ ...FILLED_BTN, marginTop: '0.5rem' }}
                onMouseEnter={e =>
                  (e.currentTarget.style.background = 'rgba(210,120,40,0.32)')
                }
                onMouseLeave={e =>
                  (e.currentTarget.style.background = 'rgba(210,120,40,0.18)')
                }
              >
                RETRY LEVEL
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
