'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { PHASES, detectPhase, PhaseId, NEPTUNE_TARGET } from './phaseData'

const IcePhaseSim  = dynamic(() => import('./IcePhaseSim'),  { ssr: false })
const PhaseDiagram = dynamic(() => import('./PhaseDiagram'), { ssr: false })

// ── Constants ─────────────────────────────────────────────────────────────────
const MONO  = 'var(--font-geist-mono, monospace)'
const SERIF = '"Times New Roman", Times, serif'

const P_MIN_GPa = 0.001
const P_MAX_GPa = 200
const T_MIN_K   = 200
const T_MAX_K   = 5000

// log scale slider helpers
function pToSlider(P: number) { return (Math.log10(P) - Math.log10(P_MIN_GPa)) / (Math.log10(P_MAX_GPa) - Math.log10(P_MIN_GPa)) * 100 }
function sliderToP(v: number) { return P_MIN_GPa * Math.pow(P_MAX_GPa / P_MIN_GPa, v / 100) }

type AppPhase = 'briefing' | 'explore' | 'challenge' | 'won'

// ── Discovery panel ───────────────────────────────────────────────────────────
function DiscoveryPanel({ phaseId, onClose }: { phaseId: PhaseId; onClose: () => void }) {
  const ph = PHASES[phaseId]
  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 30,
        background: 'rgba(2,4,12,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)',
        padding: '2rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: 480, width: '100%',
          background: 'rgba(4,8,20,0.95)',
          border: `1px solid ${ph.glowColor}40`,
          borderRadius: 6,
          padding: '2rem 2.2rem',
          boxShadow: `0 0 40px ${ph.glowColor}22`,
        }}
        onClick={e => e.stopPropagation()}
      >
        <p style={{ fontFamily: MONO, fontSize: '0.62rem', letterSpacing: '0.28em', color: ph.glowColor, marginBottom: '0.8rem' }}>
          DISCOVERY
        </p>
        <h2 style={{ fontFamily: SERIF, fontSize: '1.55rem', fontStyle: 'italic', color: 'rgba(220,240,255,0.9)', marginBottom: '1.1rem', lineHeight: 1.2 }}>
          {ph.discoveryTitle}
        </h2>
        <p style={{ fontFamily: SERIF, fontSize: '0.96rem', fontStyle: 'italic', color: 'rgba(180,215,240,0.7)', lineHeight: 1.7, marginBottom: '1.2rem' }}>
          {ph.discoveryBody}
        </p>
        <div style={{ borderLeft: `2px solid ${ph.glowColor}55`, paddingLeft: '1rem', marginBottom: '1.5rem' }}>
          <p style={{ fontFamily: SERIF, fontSize: '0.88rem', fontStyle: 'italic', color: 'rgba(200,230,255,0.55)', lineHeight: 1.7 }}>
            {ph.discoveryFact}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.18em',
            color: ph.glowColor, background: 'transparent',
            border: `1px solid ${ph.glowColor}44`, borderRadius: 3,
            padding: '0.5rem 1.2rem', cursor: 'pointer',
          }}
        >
          CONTINUE →
        </button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function IcyWorlds() {
  const [appPhase, setAppPhase]         = useState<AppPhase>('briefing')
  const [pressureGPa, setPressure]      = useState(0.001)
  const [tempK, setTemp]                = useState(273)
  const [currentPhaseId, setPhaseId]    = useState<PhaseId>('ice-ih')
  const [prevPhaseId, setPrevPhaseId]   = useState<PhaseId>('ice-ih')
  const [transitioning, setTransitioning] = useState(false)
  const [showDiscovery, setShowDiscovery] = useState(false)
  const [seenPhases, setSeenPhases]     = useState<Set<PhaseId>>(new Set(['ice-ih']))
  const [won, setWon]                   = useState(false)
  const [neptunePath, setNeptunePath]   = useState(false)

  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Recalculate phase when P or T changes
  useEffect(() => {
    const newId = detectPhase(pressureGPa, tempK)
    if (newId === currentPhaseId) return

    // Transition animation
    if (transitionTimer.current) clearTimeout(transitionTimer.current)
    setTransitioning(true)
    setPrevPhaseId(currentPhaseId)

    transitionTimer.current = setTimeout(() => {
      setPhaseId(newId)
      setTransitioning(false)

      // Discovery panel for new phases
      if (!seenPhases.has(newId)) {
        setSeenPhases(prev => new Set([...prev, newId]))
        setShowDiscovery(true)
      }

      // Challenge win condition
      if (appPhase === 'challenge') {
        const dLogP = Math.abs(Math.log10(pressureGPa) - Math.log10(NEPTUNE_TARGET.P))
        const dT = Math.abs(tempK - NEPTUNE_TARGET.T) / NEPTUNE_TARGET.T
        if ((newId === 'superionic-bcc' || newId === 'superionic-fcc') && dLogP < 0.5 && dT < 0.4) {
          setWon(true)
          setAppPhase('won')
        }
      }
    }, 500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressureGPa, tempK])

  // Handle diagram click/drag
  const handleDiagramMove = useCallback((logP: number, T: number) => {
    setPressure(Math.pow(10, logP))
    setTemp(Math.round(T))
  }, [])

  const phase = PHASES[transitioning ? prevPhaseId : currentPhaseId]

  // ── Briefing ──
  if (appPhase === 'briefing') {
    return (
      <main style={{ background: '#020408', minHeight: '100vh', color: 'rgba(200,230,255,0.85)', fontFamily: MONO, position: 'relative' }}>
        <Link href="/puzzles" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', color: 'rgba(100,180,240,0.5)', textDecoration: 'none', fontSize: '0.8rem', letterSpacing: '0.1em', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(100,200,255,1)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(100,180,240,0.5)')}
        >
          ← puzzles
        </Link>

        <div style={{ maxWidth: 680, margin: '0 auto', padding: '8rem 2rem 4rem' }}>
          <p style={{ fontSize: '0.68rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(100,180,240,0.6)', marginBottom: '1.5rem' }}>
            MISSION BRIEFING — SPACE / MATERIALS
          </p>

          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', fontStyle: 'italic', color: 'rgba(200,235,255,0.92)', lineHeight: 1.1, marginBottom: '2.5rem', fontWeight: 'bold' }}>
            Icy Worlds
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '2.5rem' }}>
            {[
              'Water is the most studied molecule on Earth — and scientists are still discovering new forms of it.',
              'Under extreme pressure and temperature, water transforms into phases that bear no resemblance to the ice in your freezer.',
              'Deep inside Neptune and Uranus, right now, there exists a material that is simultaneously solid and liquid — a crystal where the oxygen atoms are locked in place while hydrogen atoms stream freely between them like ions in a battery.',
              "Scientists call it superionic ice. It generates the planets' bizarre, off-axis magnetic fields. Experiments on Earth only recently confirmed its existence.",
              'Navigate the pressure-temperature diagram. Discover the phase transitions. Find Neptune\'s ice.',
            ].map((text, i) => (
              <p key={i} style={{ fontFamily: SERIF, fontSize: '1rem', fontStyle: 'italic', color: 'rgba(180,215,240,0.72)', lineHeight: 1.8, margin: 0 }}>
                {text}
              </p>
            ))}
          </div>

          <div style={{ background: 'rgba(10,20,40,0.5)', border: '1px solid rgba(100,180,240,0.12)', borderRadius: 4, padding: '1.2rem 1.5rem', marginBottom: '3rem' }}>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.28em', color: 'rgba(100,180,240,0.7)', marginBottom: '0.8rem' }}>CONTROLS</p>
            {[
              ['Temperature slider', '200 K → 5,000 K'],
              ['Pressure slider', '0.001 GPa → 200 GPa (log scale)'],
              ['Phase diagram', 'Click or drag to set conditions directly'],
              ['Discovery panels', 'Appear when you enter a new phase'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: '1.5rem', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                <span style={{ color: 'rgba(200,230,255,0.7)', minWidth: 160, fontSize: '0.82rem' }}>{k}</span>
                <span style={{ color: 'rgba(150,190,220,0.45)', fontSize: '0.78rem', fontFamily: SERIF, fontStyle: 'italic' }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setAppPhase('explore')}
              style={{ background: 'rgba(100,180,240,0.1)', border: '1px solid rgba(100,180,240,0.35)', borderRadius: 4, color: 'rgba(200,235,255,0.9)', fontFamily: MONO, fontSize: '0.82rem', letterSpacing: '0.15em', padding: '0.75rem 1.8rem', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(100,180,240,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(100,180,240,0.1)')}
            >
              FREE EXPLORE →
            </button>
            <button
              onClick={() => { setAppPhase('challenge'); setNeptunePath(true) }}
              style={{ background: 'rgba(60,120,200,0.15)', border: '1px solid rgba(100,180,240,0.5)', borderRadius: 4, color: 'rgba(200,235,255,0.9)', fontFamily: MONO, fontSize: '0.82rem', letterSpacing: '0.15em', padding: '0.75rem 1.8rem', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(60,120,200,0.28)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(60,120,200,0.15)')}
            >
              FIND NEPTUNE'S ICE →
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── Won overlay ──
  const wonOverlay = won && (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'rgba(2,4,12,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', backdropFilter: 'blur(8px)' }}>
      <p style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.42em', color: 'rgba(100,220,180,0.8)', margin: 0 }}>STATUS: FOUND</p>
      <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem, 5vw, 3rem)', fontStyle: 'italic', color: 'rgba(200,235,255,0.92)', margin: 0 }}>
        Neptune's Ice
      </h2>
      <p style={{ fontFamily: SERIF, fontSize: '0.95rem', fontStyle: 'italic', color: 'rgba(160,210,230,0.55)', margin: 0, textAlign: 'center', maxWidth: 420, lineHeight: 1.7 }}>
        You've found superionic ice at conditions matching Neptune's deep interior. The mobile protons in this material generate the planet's tilted, multipolar magnetic field.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
        <button onClick={() => { setWon(false); setAppPhase('explore') }}
          style={{ background: 'transparent', border: '1px solid rgba(100,180,240,0.3)', borderRadius: 3, color: 'rgba(200,235,255,0.8)', fontFamily: MONO, fontSize: '0.72rem', letterSpacing: '0.15em', padding: '0.6rem 1.2rem', cursor: 'pointer' }}>
          KEEP EXPLORING
        </button>
        <Link href="/puzzles" style={{ background: 'rgba(100,180,240,0.15)', border: '1px solid rgba(100,180,240,0.45)', borderRadius: 3, color: 'rgba(200,235,255,0.9)', fontFamily: MONO, fontSize: '0.72rem', letterSpacing: '0.15em', padding: '0.6rem 1.2rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
          BACK TO PUZZLES
        </Link>
      </div>
    </div>
  )

  const pSlider = pToSlider(pressureGPa)
  const tSlider = ((tempK - T_MIN_K) / (T_MAX_K - T_MIN_K)) * 100

  // ── Main explorer UI ──
  return (
    <main style={{
      background: phase.background,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      color: 'rgba(200,230,255,0.85)',
      fontFamily: MONO,
      position: 'relative',
      transition: 'background 0.8s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.65rem 1.5rem', borderBottom: '1px solid rgba(100,180,240,0.1)', flexShrink: 0 }}>
        <Link href="/puzzles" style={{ color: 'rgba(100,180,240,0.45)', textDecoration: 'none', fontSize: '0.75rem', letterSpacing: '0.08em', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(100,200,255,0.9)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(100,180,240,0.45)')}
        >← puzzles</Link>
        <span style={{ color: 'rgba(100,180,240,0.2)', fontSize: '0.7rem' }}>|</span>
        <span style={{ fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: phase.glowColor, transition: 'color 0.6s' }}>
          {phase.label}{phase.sublabel ? ` — ${phase.sublabel}` : ''}
        </span>
        {appPhase === 'challenge' && (
          <>
            <span style={{ color: 'rgba(100,180,240,0.2)', fontSize: '0.7rem', marginLeft: 'auto' }}>|</span>
            <span style={{ fontSize: '0.65rem', letterSpacing: '0.12em', color: 'rgba(100,200,255,0.4)' }}>
              CHALLENGE: find Neptune's ice
            </span>
          </>
        )}
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* ── Left: simulation ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <IcePhaseSim phase={phase} phaseId={currentPhaseId} transitioning={transitioning} />

          {/* Phase overlay label */}
          <div style={{ position: 'absolute', top: '1.2rem', left: '1.5rem', pointerEvents: 'none' }}>
            <p style={{ fontFamily: MONO, fontSize: '0.62rem', letterSpacing: '0.28em', color: phase.glowColor, opacity: 0.7, marginBottom: '0.2rem' }}>
              CURRENT PHASE
            </p>
            <p style={{ fontFamily: SERIF, fontSize: '1.35rem', fontStyle: 'italic', color: 'rgba(220,240,255,0.85)', margin: 0, transition: 'all 0.5s' }}>
              {phase.discoveryTitle.split('—')[0].trim()}
            </p>
          </div>

          {/* Seen phases indicator */}
          <div style={{ position: 'absolute', bottom: '1rem', left: '1.5rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', maxWidth: 280, pointerEvents: 'none' }}>
            {Object.values(PHASES).map(ph => (
              <span key={ph.id} style={{
                fontFamily: MONO, fontSize: '0.58rem', letterSpacing: '0.1em',
                padding: '0.18rem 0.5rem', borderRadius: 2,
                background: seenPhases.has(ph.id) ? `${ph.glowColor}22` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${seenPhases.has(ph.id) ? ph.glowColor + '55' : 'rgba(255,255,255,0.08)'}`,
                color: seenPhases.has(ph.id) ? ph.glowColor : 'rgba(255,255,255,0.2)',
                transition: 'all 0.4s',
              }}>
                {ph.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div style={{ width: 360, flexShrink: 0, borderLeft: '1px solid rgba(100,180,240,0.1)', display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'rgba(2,5,14,0.6)' }}>

          {/* Phase diagram */}
          <div style={{ padding: '1rem 1rem 0', flexShrink: 0 }}>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.25em', color: 'rgba(100,180,240,0.38)', marginBottom: '0.5rem' }}>PHASE DIAGRAM — click to navigate</p>
            <div style={{ width: '100%', aspectRatio: '480/340', background: 'rgba(3,6,16,0.8)', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(100,180,240,0.1)' }}>
              <PhaseDiagram
                logP={Math.log10(pressureGPa)}
                T={tempK}
                currentPhase={currentPhaseId}
                neptunePath={neptunePath}
                onCursorMove={handleDiagramMove}
              />
            </div>
          </div>

          {/* Sliders */}
          <div style={{ padding: '1.2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {/* Temperature */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'rgba(100,180,240,0.5)' }}>TEMPERATURE</span>
                <span style={{ fontSize: '0.7rem', color: 'rgba(200,230,255,0.7)', fontFamily: SERIF, fontStyle: 'italic' }}>{tempK.toLocaleString()} K</span>
              </div>
              <input type="range" min={0} max={100} step={0.1} value={tSlider}
                onChange={e => setTemp(Math.round(T_MIN_K + (parseFloat(e.target.value) / 100) * (T_MAX_K - T_MIN_K)))}
                style={{ width: '100%', accentColor: phase.glowColor, cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '0.58rem', color: 'rgba(180,210,240,0.25)' }}>200 K</span>
                <span style={{ fontSize: '0.58rem', color: 'rgba(180,210,240,0.25)' }}>5,000 K</span>
              </div>
            </div>

            {/* Pressure */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'rgba(100,180,240,0.5)' }}>PRESSURE</span>
                <span style={{ fontSize: '0.7rem', color: 'rgba(200,230,255,0.7)', fontFamily: SERIF, fontStyle: 'italic' }}>
                  {pressureGPa < 0.1 ? pressureGPa.toFixed(4) : pressureGPa < 10 ? pressureGPa.toFixed(2) : pressureGPa.toFixed(0)} GPa
                </span>
              </div>
              <input type="range" min={0} max={100} step={0.05} value={pSlider}
                onChange={e => setPressure(sliderToP(parseFloat(e.target.value)))}
                style={{ width: '100%', accentColor: phase.glowColor, cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '0.58rem', color: 'rgba(180,210,240,0.25)' }}>0.001 GPa</span>
                <span style={{ fontSize: '0.58rem', color: 'rgba(180,210,240,0.25)' }}>200 GPa</span>
              </div>
            </div>

            {/* Current conditions readout */}
            <div style={{ background: 'rgba(10,20,40,0.5)', border: '1px solid rgba(100,180,240,0.1)', borderRadius: 4, padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {[
                ['Phase', `${phase.label}${phase.sublabel ? ' · ' + phase.sublabel : ''}`],
                ['O lattice', phase.oxygenFixed ? 'locked' : 'free'],
                ['H behavior', phase.hydrogenMobile ? 'freely diffusing (superionic)' : phase.id === 'ice-x' ? 'symmetric midpoint' : 'bonded (disordered)'],
                ['Structure', phase.latticeType === 'none' ? 'amorphous' : phase.latticeType],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: '0.8rem', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: 'rgba(100,180,240,0.38)', flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(200,230,255,0.6)', fontFamily: SERIF, fontStyle: 'italic', textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => { setAppPhase('explore'); setNeptunePath(false) }}
                style={{ flex: 1, fontFamily: MONO, fontSize: '0.62rem', letterSpacing: '0.12em', padding: '0.5rem', background: appPhase === 'explore' ? 'rgba(100,180,240,0.15)' : 'transparent', border: '1px solid rgba(100,180,240,0.25)', borderRadius: 3, color: 'rgba(180,215,240,0.7)', cursor: 'pointer' }}
              >
                EXPLORE
              </button>
              <button
                onClick={() => { setAppPhase('challenge'); setNeptunePath(true) }}
                style={{ flex: 1, fontFamily: MONO, fontSize: '0.62rem', letterSpacing: '0.12em', padding: '0.5rem', background: appPhase === 'challenge' ? 'rgba(100,180,240,0.15)' : 'transparent', border: '1px solid rgba(100,180,240,0.25)', borderRadius: 3, color: 'rgba(180,215,240,0.7)', cursor: 'pointer' }}
              >
                CHALLENGE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Discovery overlay */}
      {showDiscovery && !won && (
        <DiscoveryPanel phaseId={currentPhaseId} onClose={() => setShowDiscovery(false)} />
      )}

      {/* Win overlay */}
      {wonOverlay}
    </main>
  )
}
