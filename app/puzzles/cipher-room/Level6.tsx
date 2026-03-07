'use client'

import { useState } from 'react'
import { L6, extractKeyFragment } from './data'

const MONO  = 'var(--font-geist-mono, monospace)'
const SERIF = '"Georgia", "Times New Roman", serif'

interface Props { onSolve: () => void; solved: boolean }

export default function Level6({ onSolve, solved }: Props) {
  const [cribPos,  setCribPos]  = useState(0)
  const [locked,   setLocked]   = useState(solved)
  const [flash,    setFlash]    = useState(false)
  const [error,    setError]    = useState('')
  const [decoded,  setDecoded]  = useState('')

  const cipher = L6.cipherLetters
  const crib   = L6.crib
  const maxPos = cipher.length - crib.length

  const fragment = extractKeyFragment(cipher, crib, cribPos)

  // Check if fragment looks like the repeating key
  function fragmentLooksValid(frag: string): boolean {
    // Fragment should be consistent with a 6-letter repeating key
    // We just check: does the fragment contain "BLETCH" or any 6-length rotation?
    const key = L6.key
    for (let start = 0; start < key.length; start++) {
      let match = true
      for (let i = 0; i < frag.length; i++) {
        if (frag[i] !== key[(start + i) % key.length]) { match = false; break }
      }
      if (match) return true
    }
    return false
  }

  function attemptDecode() {
    if (locked) return
    if (cribPos === L6.cribPosition) {
      const result = L6.decode(L6.cipherFull)
      setDecoded(result)
      setError('')
      setFlash(true)
      setTimeout(() => { setFlash(false); setLocked(true); onSolve() }, 1400)
    } else {
      setError(`Key fragment "${fragment}" is inconsistent — this is not the right position. Try another.`)
    }
  }

  // Build display: cipher string split into chars, crib aligned below
  const displayLen = Math.min(cipher.length, 60)

  return (
    <div
      style={{
        minHeight: '100%',
        background: 'radial-gradient(ellipse 70% 50% at 40% 25%, rgba(25,18,8,0.8) 0%, transparent 65%), #100a06',
        padding: '2rem 2rem 3rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.8rem',
      }}
    >
      {/* Briefing */}
      <div style={{ maxWidth: 640 }}>
        <p style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(180,100,220,0.4)', marginBottom: '0.6rem' }}>
          Act III — The Logic of Secrets
        </p>
        <p style={{ fontFamily: SERIF, fontSize: '0.9rem', lineHeight: 1.85, color: 'rgba(232,220,200,0.65)', margin: '0 0 0.5rem' }}>
          This cipher changes with every letter — frequency analysis is useless. But German radio
          operators always included predictable words. Weather reports always contained one word.
          Drag the crib word under the ciphertext. At the right position, the implied key fragment
          will reveal a repeating pattern. That pattern is the key.
        </p>
        <div style={{ display: 'flex', gap: '1.4rem', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(200,148,20,0.35)' }}>
              Known crib:&nbsp;
            </span>
            <span style={{ fontFamily: MONO, fontSize: '0.85rem', letterSpacing: '0.12em', color: 'rgba(200,148,20,0.85)' }}>
              {crib}
            </span>
          </div>
          <div>
            <span style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(200,148,20,0.35)' }}>
              Key length:&nbsp;
            </span>
            <span style={{ fontFamily: MONO, fontSize: '0.85rem', color: 'rgba(200,148,20,0.7)' }}>
              6 letters
            </span>
          </div>
        </div>
      </div>

      {/* Crib-drag display */}
      <div>
        <p style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(200,148,20,0.35)', marginBottom: '0.7rem' }}>
          Slide the crib — position {cribPos}
        </p>

        <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {/* Cipher row */}
          <div style={{ display: 'flex', fontFamily: MONO, fontSize: '0.9rem', letterSpacing: '0.04em', marginBottom: '2px', minWidth: 'max-content' }}>
            {cipher.slice(0, displayLen).split('').map((ch, i) => {
              const inCrib = i >= cribPos && i < cribPos + crib.length
              return (
                <span
                  key={i}
                  style={{
                    width: 18,
                    textAlign: 'center',
                    color: inCrib ? 'rgba(200,148,20,0.95)' : 'rgba(200,170,120,0.4)',
                    background: inCrib ? 'rgba(200,148,20,0.08)' : 'transparent',
                    borderBottom: inCrib ? '1px solid rgba(200,148,20,0.3)' : 'none',
                    display: 'inline-block',
                    paddingBottom: 2,
                  }}
                >
                  {ch}
                </span>
              )
            })}
          </div>

          {/* Crib row (offset by cribPos) */}
          <div style={{ display: 'flex', fontFamily: MONO, fontSize: '0.9rem', letterSpacing: '0.04em', marginBottom: '2px', minWidth: 'max-content' }}>
            {Array.from({ length: displayLen }, (_, i) => {
              const cribIdx = i - cribPos
              const ch = cribIdx >= 0 && cribIdx < crib.length ? crib[cribIdx] : null
              return (
                <span
                  key={i}
                  style={{
                    width: 18,
                    textAlign: 'center',
                    color: ch ? 'rgba(56,200,140,0.85)' : 'transparent',
                    display: 'inline-block',
                  }}
                >
                  {ch ?? '.'}
                </span>
              )
            })}
          </div>

          {/* Key fragment row */}
          <div style={{ display: 'flex', fontFamily: MONO, fontSize: '0.75rem', letterSpacing: '0.04em', minWidth: 'max-content' }}>
            {Array.from({ length: displayLen }, (_, i) => {
              const fragIdx = i - cribPos
              const ch = fragIdx >= 0 && fragIdx < fragment.length ? fragment[fragIdx] : null
              const looksGood = ch !== null && fragmentLooksValid(fragment)
              return (
                <span
                  key={i}
                  style={{
                    width: 18,
                    textAlign: 'center',
                    color: ch
                      ? looksGood ? 'rgba(74,158,106,0.9)' : 'rgba(200,170,120,0.35)'
                      : 'transparent',
                    display: 'inline-block',
                    fontSize: '0.65rem',
                  }}
                >
                  {ch ?? '.'}
                </span>
              )
            })}
          </div>

          {/* Row labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '0.3rem' }}>
            {[
              { label: 'cipher',   color: 'rgba(200,148,20,0.4)' },
              { label: 'crib',     color: 'rgba(56,200,140,0.4)' },
              { label: 'key frag', color: 'rgba(200,170,120,0.3)' },
            ].map(r => (
              <span key={r.label} style={{ fontFamily: MONO, fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: r.color }}>
                {r.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Slider */}
      {!locked && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <input
              type="range"
              min={0}
              max={maxPos}
              value={cribPos}
              onChange={e => { setCribPos(parseInt(e.target.value)); setError('') }}
              style={{ width: 260, accentColor: 'rgba(200,148,20,0.8)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 260 }}>
              <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: 'rgba(200,170,120,0.3)' }}>pos 0</span>
              <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: 'rgba(200,170,120,0.3)' }}>pos {maxPos}</span>
            </div>
          </div>

          {/* Key fragment display */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(200,148,20,0.35)' }}>
              Implied key fragment
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: '1.1rem',
                letterSpacing: '0.12em',
                color: fragmentLooksValid(fragment) ? 'rgba(74,158,106,0.9)' : 'rgba(200,148,20,0.55)',
                transition: 'color 0.2s',
              }}
            >
              {fragment}
            </span>
            {fragmentLooksValid(fragment) && (
              <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: 'rgba(74,158,106,0.6)' }}>
                Pattern detected — this looks like a repeating key fragment
              </span>
            )}
          </div>
        </div>
      )}

      {/* Manual step buttons */}
      {!locked && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => { setCribPos(p => Math.max(0, p - 1)); setError('') }}
            style={navBtn}
          >
            ← prev
          </button>
          <button
            onClick={() => { setCribPos(p => Math.min(maxPos, p + 1)); setError('') }}
            style={navBtn}
          >
            next →
          </button>
          <button
            onClick={attemptDecode}
            style={{
              ...navBtn,
              borderColor: 'rgba(200,148,20,0.4)',
              color: 'rgba(200,148,20,0.85)',
              padding: '0.4rem 1.1rem',
            }}
          >
            Decrypt at position {cribPos}
          </button>
        </div>
      )}

      {error && (
        <p style={{ fontFamily: MONO, fontSize: '0.72rem', color: 'rgba(192,80,60,0.8)', margin: 0 }}>
          {error}
        </p>
      )}

      {/* Decoded message */}
      {locked && (
        <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <p style={{ fontFamily: MONO, fontSize: '0.7rem', color: 'rgba(74,158,106,0.7)', margin: 0 }}>
            Key recovered: {L6.key} — message decrypted.
          </p>
          <div
            style={{
              background: 'rgba(74,158,106,0.04)',
              border: '1px solid rgba(74,158,106,0.18)',
              borderRadius: '4px',
              padding: '1rem 1.2rem',
              fontFamily: MONO,
              fontSize: '0.85rem',
              letterSpacing: '0.06em',
              lineHeight: 1.7,
              color: 'rgba(232,220,200,0.82)',
              wordBreak: 'break-word',
            }}
          >
            {decoded || L6.decode(L6.cipherFull)}
          </div>
        </div>
      )}
    </div>
  )
}

const navBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(200,170,120,0.18)',
  borderRadius: '3px',
  padding: '0.4rem 0.7rem',
  fontFamily: 'var(--font-geist-mono, monospace)',
  fontSize: '0.7rem',
  color: 'rgba(200,170,120,0.5)',
  cursor: 'pointer',
}
