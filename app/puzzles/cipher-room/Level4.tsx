'use client'

import { useEffect, useRef, useState } from 'react'
import { L4 } from './data'

const MONO  = 'var(--font-geist-mono, monospace)'
const SERIF = '"Georgia", "Times New Roman", serif'

// Generate waveform: noise + gaussian pulses at period intervals
function generateWaveform(params: typeof L4): Float32Array {
  const { totalDurationS, sampleRate, periodS, noiseAmplitude, pulseAmplitude, pulseWidthS } = params
  const n = Math.floor(totalDurationS * sampleRate)
  const data = new Float32Array(n)
  // Seeded pseudo-random (deterministic)
  let seed = 42
  function rand() {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff
    return (seed >>> 0) / 0xffffffff
  }
  function gaussNoise() {
    const u = rand() || 1e-10
    const v = rand()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
  // Fill noise
  for (let i = 0; i < n; i++) {
    data[i] = gaussNoise() * noiseAmplitude * 0.35
  }
  // Add pulses at period intervals (starting at a small offset)
  const firstPulse = 0.4
  for (let t = firstPulse; t < totalDurationS; t += periodS) {
    const pulseCenter = Math.round(t * sampleRate)
    const sigma = Math.round(pulseWidthS * sampleRate)
    for (let di = -sigma * 3; di <= sigma * 3; di++) {
      const idx = pulseCenter + di
      if (idx >= 0 && idx < n) {
        data[idx] += pulseAmplitude * Math.exp(-(di * di) / (2 * sigma * sigma))
      }
    }
  }
  return data
}

interface Props { onSolve: () => void; solved: boolean }

export default function Level4({ onSolve, solved }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const [threshold, setThreshold]  = useState(0.55)
  const [peaks,     setPeaks]      = useState<number[]>([])   // time positions in seconds
  const [locked,    setLocked]     = useState(solved)
  const [period,    setPeriod]     = useState<number | null>(null)
  const [flash,     setFlash]      = useState(false)
  const [markMode,  setMarkMode]   = useState(false)
  const waveformRef = useRef<Float32Array | null>(null)

  // Build waveform once
  useEffect(() => {
    waveformRef.current = generateWaveform(L4)
  }, [])

  const W = 800
  const H = 160
  const PADDING = 30

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current
    const data   = waveformRef.current
    if (!canvas || !data) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawW = W - PADDING * 2
    ctx.clearRect(0, 0, W, H)

    // Background
    ctx.fillStyle = '#040c18'
    ctx.fillRect(0, 0, W, H)

    const midY = H / 2
    const scaleY = (H / 2 - 12) / (L4.pulseAmplitude + L4.noiseAmplitude)

    // Waveform line
    ctx.beginPath()
    ctx.strokeStyle = locked ? 'rgba(74,158,106,0.7)' : 'rgba(56,200,120,0.6)'
    ctx.lineWidth = 1
    for (let px = 0; px < drawW; px++) {
      const sampleIdx = Math.floor((px / drawW) * data.length)
      const y = midY - data[sampleIdx] * scaleY
      if (px === 0) ctx.moveTo(px + PADDING, y)
      else ctx.lineTo(px + PADDING, y)
    }
    ctx.stroke()

    // Threshold line
    const threshY = midY - threshold * scaleY
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(200,148,20,0.55)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([6, 4])
    ctx.moveTo(PADDING, threshY)
    ctx.lineTo(W - PADDING, threshY)
    ctx.stroke()
    ctx.setLineDash([])

    // Threshold label
    ctx.fillStyle = 'rgba(200,148,20,0.5)'
    ctx.font = '10px monospace'
    ctx.fillText(`threshold ${threshold.toFixed(2)}`, PADDING + 4, threshY - 5)

    // Peak markers
    peaks.forEach(t => {
      const px = PADDING + (t / L4.totalDurationS) * drawW
      ctx.beginPath()
      ctx.strokeStyle = locked ? 'rgba(74,158,106,0.9)' : 'rgba(200,148,20,0.9)'
      ctx.lineWidth = 1.5
      ctx.moveTo(px, 8)
      ctx.lineTo(px, H - 8)
      ctx.stroke()
      // Triangle marker
      ctx.fillStyle = locked ? 'rgba(74,158,106,0.9)' : 'rgba(200,148,20,0.9)'
      ctx.beginPath()
      ctx.moveTo(px, 8)
      ctx.lineTo(px - 5, 16)
      ctx.lineTo(px + 5, 16)
      ctx.closePath()
      ctx.fill()
    })

    // Time axis labels
    ctx.fillStyle = 'rgba(200,170,120,0.25)'
    ctx.font = '9px monospace'
    for (let t = 0; t <= L4.totalDurationS; t += 5) {
      const px = PADDING + (t / L4.totalDurationS) * drawW
      ctx.fillText(`${t}s`, px, H - 2)
    }
  }, [threshold, peaks, locked, flash])

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!markMode || locked) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const px   = e.clientX - rect.left
    const t    = ((px - PADDING) / (W - PADDING * 2)) * L4.totalDurationS
    if (t < 0 || t > L4.totalDurationS) return

    // Only add if signal is above threshold at this point
    const data    = waveformRef.current
    if (!data) return
    const idx     = Math.floor((t / L4.totalDurationS) * data.length)
    const val     = data[idx] ?? 0

    if (val < threshold) return  // must click above threshold
    // Remove if clicking near existing peak (within 0.3s)
    const nearby = peaks.findIndex(p => Math.abs(p - t) < 0.3)
    if (nearby >= 0) {
      setPeaks(prev => prev.filter((_, i) => i !== nearby))
    } else {
      setPeaks(prev => [...prev, t].sort((a, b) => a - b))
    }
  }

  function calculatePeriod() {
    if (peaks.length < 2) return
    const intervals: number[] = []
    for (let i = 1; i < peaks.length; i++) intervals.push(peaks[i] - peaks[i - 1])
    const mean = intervals.reduce((a, b) => a + b) / intervals.length
    setPeriod(mean)
    const consistent = intervals.every(iv => Math.abs(iv - mean) / mean < L4.tolerancePct)
    if (consistent && peaks.length >= L4.minPeaks) {
      setFlash(true)
      setTimeout(() => { setFlash(false); setLocked(true); onSolve() }, 1400)
    }
  }

  function reset() {
    setPeaks([])
    setPeriod(null)
  }

  const intervals = peaks.length > 1
    ? peaks.slice(1).map((p, i) => p - peaks[i])
    : []

  return (
    <div
      style={{
        minHeight: '100%',
        background: 'radial-gradient(ellipse 70% 50% at 50% 20%, rgba(4,15,30,0.9) 0%, transparent 65%), #040c18',
        padding: '2rem 2rem 3rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.8rem',
      }}
    >
      {/* Briefing */}
      <div style={{ maxWidth: 640 }}>
        <p style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(56,200,140,0.4)', marginBottom: '0.6rem' }}>
          Act II — Nature's Code
        </p>
        <p style={{ fontFamily: SERIF, fontSize: '0.9rem', lineHeight: 1.85, color: 'rgba(232,220,200,0.65)', margin: 0 }}>
          The radio telescope has been recording for 26 simulated seconds. Somewhere in this data
          is a signal — a pulse repeating with inhuman regularity. Raise the threshold to filter
          noise, enter mark mode, click the peaks, then calculate the period.
        </p>
      </div>

      {/* Waveform canvas */}
      <div style={{ overflowX: 'auto' }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onClick={handleCanvasClick}
          style={{
            display: 'block',
            borderRadius: '4px',
            border: `1px solid ${flash || locked ? 'rgba(74,158,106,0.3)' : 'rgba(56,200,120,0.12)'}`,
            cursor: markMode && !locked ? 'crosshair' : 'default',
            boxShadow: flash ? '0 0 24px rgba(74,158,106,0.25)' : 'none',
            transition: 'box-shadow 0.4s',
          }}
        />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.4rem', alignItems: 'flex-start' }}>

        {/* Threshold */}
        <div>
          <p style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(200,148,20,0.4)', marginBottom: '0.5rem' }}>
            Threshold
          </p>
          <input
            type="range"
            min={0}
            max={0.9}
            step={0.01}
            value={threshold}
            disabled={locked}
            onChange={e => setThreshold(parseFloat(e.target.value))}
            style={{ width: 180, accentColor: 'rgba(200,148,20,0.8)', cursor: locked ? 'default' : 'pointer' }}
          />
          <span style={{ fontFamily: MONO, fontSize: '0.7rem', color: 'rgba(200,148,20,0.55)', marginLeft: '0.6rem' }}>
            {threshold.toFixed(2)}
          </span>
        </div>

        {/* Mark mode toggle */}
        {!locked && (
          <div>
            <p style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(200,148,20,0.4)', marginBottom: '0.5rem' }}>
              Mode
            </p>
            <button
              onClick={() => setMarkMode(m => !m)}
              style={{
                background: markMode ? 'rgba(200,148,20,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${markMode ? 'rgba(200,148,20,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '4px',
                padding: '0.4rem 0.9rem',
                fontFamily: MONO,
                fontSize: '0.72rem',
                color: markMode ? 'rgba(200,148,20,0.9)' : 'rgba(200,170,120,0.45)',
                cursor: 'pointer',
              }}
            >
              {markMode ? '▲ marking peaks' : '○ mark peaks'}
            </button>
          </div>
        )}

        {/* Calculate */}
        {peaks.length >= 2 && !locked && (
          <div>
            <p style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(200,148,20,0.4)', marginBottom: '0.5rem' }}>
              Analysis
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={calculatePeriod}
                style={actionBtn}
              >
                Calculate period
              </button>
              <button onClick={reset} style={{ ...actionBtn, borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(200,170,120,0.4)' }}>
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interval readout */}
      {intervals.length > 0 && (
        <div style={{ fontFamily: MONO, fontSize: '0.72rem', color: 'rgba(200,170,120,0.5)', display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {intervals.map((iv, i) => (
            <span key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px', padding: '0.2rem 0.5rem' }}>
              Δ{i + 1}: {iv.toFixed(3)}s
            </span>
          ))}
          {period !== null && (
            <span style={{ background: 'rgba(200,148,20,0.07)', border: '1px solid rgba(200,148,20,0.25)', borderRadius: '3px', padding: '0.2rem 0.5rem', color: 'rgba(200,148,20,0.8)' }}>
              mean: {period.toFixed(4)}s
            </span>
          )}
        </div>
      )}

      {/* Guidance */}
      {peaks.length < L4.minPeaks && !locked && (
        <p style={{ fontFamily: MONO, fontSize: '0.65rem', color: 'rgba(200,170,120,0.28)', margin: 0 }}>
          Mark at least {L4.minPeaks} peaks to calculate the period.
          {peaks.length > 0 ? ` (${peaks.length} marked)` : ''}
        </p>
      )}

      {period !== null && !locked && (
        <p style={{ fontFamily: MONO, fontSize: '0.72rem', color: intervals.every(iv => Math.abs(iv - period) / period < L4.tolerancePct) ? 'rgba(74,158,106,0.8)' : 'rgba(192,68,58,0.8)', margin: 0 }}>
          {intervals.every(iv => Math.abs(iv - period) / period < L4.tolerancePct)
            ? `Period is consistent at ${period.toFixed(4)}s — signal confirmed.`
            : 'Intervals are inconsistent. Re-check your peak positions.'}
        </p>
      )}

      {locked && (
        <div style={{ maxWidth: 520 }}>
          <p style={{ fontFamily: MONO, fontSize: '0.7rem', color: 'rgba(74,158,106,0.7)', margin: '0 0 0.5rem' }}>
            Signal confirmed — period {L4.periodS}s — PSR B1919+21
          </p>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.82rem', color: 'rgba(200,170,120,0.45)', margin: 0, lineHeight: 1.7 }}>
            This is the pulse rate of the first pulsar ever detected. The signal you have just decoded
            was found by Jocelyn Bell Burnell in 1967, buried in kilometres of paper chart output.
          </p>
        </div>
      )}
    </div>
  )
}

const actionBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(200,148,20,0.3)',
  borderRadius: '4px',
  padding: '0.4rem 0.9rem',
  fontFamily: 'var(--font-geist-mono, monospace)',
  fontSize: '0.72rem',
  color: 'rgba(200,148,20,0.75)',
  cursor: 'pointer',
}
