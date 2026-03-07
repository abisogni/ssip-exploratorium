'use client'

import { useState, useEffect } from 'react'
import { L5 } from './data'

const MONO  = 'var(--font-geist-mono, monospace)'
const SERIF = '"Georgia", "Times New Roman", serif'
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

// Count letter frequencies in a string (letters only)
function letterFrequencies(text: string): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const ch of text.toUpperCase()) {
    if (/[A-Z]/.test(ch)) counts[ch] = (counts[ch] ?? 0) + 1
  }
  return counts
}

// English expected frequency order (most to least common)
const EN_ORDER = 'ETAOINSHRDLCUMWFGYPBVKJXQZ'

interface Props { onSolve: () => void; solved: boolean }

export default function Level5({ onSolve, solved }: Props) {
  // mapping: cipher letter → player's guessed plain letter
  const [mapping,  setMapping]  = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [locked,   setLocked]   = useState(solved)
  const [flash,    setFlash]    = useState(false)
  const [hints,    setHints]    = useState(0)

  const cipherFreq  = letterFrequencies(L5.ciphertext)
  const sortedCipher = Object.entries(cipherFreq).sort((a, b) => b[1] - a[1]).map(([ch]) => ch)

  // Compute decoded text with current mapping
  function decodeChar(ch: string): { text: string; correct: boolean | null } {
    if (!/[A-Z]/i.test(ch)) return { text: ch, correct: null }
    const upper  = ch.toUpperCase()
    const guess  = mapping[upper]
    if (!guess) return { text: '_', correct: null }
    const actual = L5.plainAlpha[L5.cipherAlpha.indexOf(upper)]
    return { text: guess, correct: guess === actual }
  }

  // Check all correct
  function checkSolved(m: Record<string, string>): boolean {
    return ALPHA.split('').every(cipher => {
      const plain = L5.plainAlpha[L5.cipherAlpha.indexOf(cipher)]
      return m[cipher] === plain
    })
  }

  function assignMapping(cipherLetter: string, plainLetter: string) {
    if (locked) return
    // Remove any existing mapping to this plain letter (one-to-one)
    const cleaned = Object.fromEntries(
      Object.entries(mapping).filter(([, v]) => v !== plainLetter)
    )
    const next = { ...cleaned, [cipherLetter]: plainLetter }
    setMapping(next)
    setSelected(null)
    if (checkSolved(next)) {
      setFlash(true)
      setTimeout(() => { setFlash(false); setLocked(true); onSolve() }, 1200)
    }
  }

  function useHint() {
    if (hints >= 3 || locked) return
    // Find the most frequent unmapped cipher letter and reveal it
    const unmapped = sortedCipher.find(ch => !mapping[ch])
    if (!unmapped) return
    const idx   = L5.cipherAlpha.indexOf(unmapped)
    const plain = L5.plainAlpha[idx]
    assignMapping(unmapped, plain)
    setHints(h => h + 1)
  }

  const solvedLetters = Object.entries(mapping).filter(([cipher, plain]) => {
    const correct = L5.plainAlpha[L5.cipherAlpha.indexOf(cipher)]
    return plain === correct
  }).length

  const maxFreq = Math.max(...Object.values(cipherFreq))

  return (
    <div
      style={{
        minHeight: '100%',
        background: 'radial-gradient(ellipse 70% 50% at 60% 20%, rgba(25,10,40,0.7) 0%, transparent 65%), #100a14',
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
          This cipher uses a completely different alphabet — every letter replaced by a different
          letter. Brute force is impossible. But languages have patterns. In English, E appears
          most often. Then T, then A. Match the frequencies — decode the message.
        </p>
        <p style={{ fontFamily: MONO, fontSize: '0.7rem', color: 'rgba(180,100,220,0.45)', margin: 0 }}>
          Click a cipher letter in the chart, then assign it a plain letter.
          Up to 3 hints available.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>

        {/* Frequency chart */}
        <div style={{ minWidth: 260 }}>
          <p style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(180,100,220,0.35)', marginBottom: '0.6rem' }}>
            Cipher letter frequencies
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {sortedCipher.map((ch, rank) => {
              const count  = cipherFreq[ch]
              const barPct = (count / maxFreq) * 100
              const guess  = mapping[ch]
              const actual = L5.plainAlpha[L5.cipherAlpha.indexOf(ch)]
              const correct = guess === actual
              const isSelected = selected === ch
              const enHint = EN_ORDER[rank]  // most likely English equivalent

              return (
                <div
                  key={ch}
                  onClick={() => !locked && setSelected(s => s === ch ? null : ch)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: locked ? 'default' : 'pointer' }}
                >
                  {/* Cipher letter */}
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: '0.8rem',
                      width: 18,
                      textAlign: 'right',
                      color: isSelected ? 'rgba(180,100,220,0.9)' : 'rgba(200,148,20,0.7)',
                      flexShrink: 0,
                    }}
                  >
                    {ch}
                  </span>
                  {/* Bar */}
                  <div style={{ flex: 1, maxWidth: 160, position: 'relative', height: 14 }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: 0, top: 2, bottom: 2,
                        width: `${barPct}%`,
                        background: correct
                          ? 'rgba(74,158,106,0.55)'
                          : isSelected
                            ? 'rgba(180,100,220,0.5)'
                            : 'rgba(200,148,20,0.28)',
                        borderRadius: '2px',
                        transition: 'background 0.25s',
                      }}
                    />
                    {/* English ghost bar */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0, top: 4, bottom: 4,
                        width: `${(ALPHA.indexOf(enHint) < 0 ? 0 : (1 - ALPHA.indexOf(enHint) / 25)) * 60}%`,
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: '2px',
                      }}
                    />
                  </div>
                  {/* Count */}
                  <span style={{ fontFamily: MONO, fontSize: '0.62rem', color: 'rgba(200,170,120,0.3)', width: 20, textAlign: 'right', flexShrink: 0 }}>
                    {count}
                  </span>
                  {/* Mapped letter */}
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: '0.78rem',
                      width: 18,
                      color: correct ? '#4a9e6a' : guess ? 'rgba(192,120,80,0.8)' : 'rgba(255,255,255,0.15)',
                      flexShrink: 0,
                    }}
                  >
                    {guess ?? '_'}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Hint button */}
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <button
              onClick={useHint}
              disabled={hints >= 3 || locked}
              style={{
                background: 'transparent',
                border: '1px solid rgba(180,100,220,0.25)',
                borderRadius: '3px',
                padding: '0.35rem 0.8rem',
                fontFamily: MONO,
                fontSize: '0.65rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: hints >= 3 || locked ? 'rgba(200,170,120,0.2)' : 'rgba(180,100,220,0.6)',
                cursor: hints >= 3 || locked ? 'default' : 'pointer',
              }}
            >
              Reveal one letter
            </button>
            <span style={{ fontFamily: MONO, fontSize: '0.62rem', color: 'rgba(200,170,120,0.3)' }}>
              {3 - hints} hints left
            </span>
          </div>
        </div>

        {/* Plain letter assignment */}
        {selected && !locked && (
          <div>
            <p style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(180,100,220,0.4)', marginBottom: '0.6rem' }}>
              Assign plain letter for cipher "{selected}"
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxWidth: 320 }}>
              {ALPHA.split('').map(letter => {
                const taken = Object.values(mapping).includes(letter) && mapping[selected] !== letter
                return (
                  <button
                    key={letter}
                    onClick={() => assignMapping(selected, letter)}
                    disabled={taken}
                    style={{
                      background: mapping[selected] === letter ? 'rgba(180,100,220,0.14)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${mapping[selected] === letter ? 'rgba(180,100,220,0.45)' : taken ? 'rgba(255,255,255,0.04)' : 'rgba(200,148,20,0.18)'}`,
                      borderRadius: '3px',
                      width: 30, height: 30,
                      fontFamily: MONO,
                      fontSize: '0.75rem',
                      color: taken ? 'rgba(255,255,255,0.1)' : 'rgba(200,148,20,0.75)',
                      cursor: taken ? 'default' : 'pointer',
                    }}
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Decoded text */}
      <div style={{ maxWidth: 720 }}>
        <p style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: locked ? 'rgba(74,158,106,0.5)' : 'rgba(200,170,120,0.3)', marginBottom: '0.5rem' }}>
          Decoded text — {solvedLetters} / {sortedCipher.length} letters solved
        </p>
        <div
          style={{
            background: locked ? 'rgba(74,158,106,0.03)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${flash || locked ? 'rgba(74,158,106,0.2)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '4px',
            padding: '1rem 1.1rem',
            fontFamily: locked ? SERIF : MONO,
            fontSize: '0.88rem',
            lineHeight: 1.75,
            color: 'rgba(232,220,200,0.75)',
            wordBreak: 'break-word',
            boxShadow: flash ? '0 0 24px rgba(74,158,106,0.2)' : 'none',
            transition: 'box-shadow 0.4s',
          }}
        >
          {L5.ciphertext.split('').map((ch, i) => {
            const upper = ch.toUpperCase()
            if (!/[A-Z]/.test(upper)) return <span key={i} style={{ color: 'rgba(200,170,120,0.25)' }}>{ch}</span>
            const { text, correct } = decodeChar(upper)
            return (
              <span
                key={i}
                style={{
                  color: text === '_'
                    ? 'rgba(200,148,20,0.25)'
                    : correct === true
                      ? locked ? 'rgba(232,220,200,0.85)' : 'rgba(200,220,200,0.7)'
                      : correct === false
                        ? 'rgba(192,100,80,0.7)'
                        : 'rgba(200,170,120,0.45)',
                }}
              >
                {text}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
