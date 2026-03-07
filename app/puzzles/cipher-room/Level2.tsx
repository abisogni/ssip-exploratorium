'use client'

import { useState, useEffect } from 'react'
import { L2_CIPHERTEXT, L2_PLAINTEXT, L2_ANCHORS, L2_LETTER_MAP, L2_SYMBOL_MAP, getUniqueSymbols } from './data'

const MONO  = 'var(--font-geist-mono, monospace)'
const SERIF = '"Georgia", "Times New Roman", serif'
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

interface Props { onSolve: () => void; solved: boolean }

export default function Level2({ onSolve, solved }: Props) {
  // mapping: symbol → player's guessed letter
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null) // selected symbol in palette
  const [locked,   setLocked]  = useState(solved)
  const [flash,    setFlash]   = useState(false)

  const uniqueSymbols = getUniqueSymbols(L2_CIPHERTEXT)

  // Pre-reveal the anchor symbols
  useEffect(() => {
    const anchorMap: Record<string, string> = {}
    L2_ANCHORS.forEach(a => {
      a.symbols.split('').forEach((sym, i) => {
        if (L2_LETTER_MAP[sym]) anchorMap[sym] = a.plain[i]
      })
    })
    setMapping(prev => ({ ...anchorMap, ...prev }))
  }, [])

  // Decode the ciphertext with current mapping
  function decodeText(text: string): React.ReactNode[] {
    return text.split('').map((ch, i) => {
      const letter = mapping[ch]
      const isSymbol = !!L2_LETTER_MAP[ch]
      const correct  = letter && letter === L2_LETTER_MAP[ch]
      const isAnchor = L2_ANCHORS.some(a => a.symbols.includes(ch))

      return (
        <span
          key={i}
          title={isSymbol ? (letter ? `${ch} = ${letter}` : `${ch} = ?`) : undefined}
          style={{
            display: 'inline',
            fontFamily: isSymbol ? 'sans-serif' : SERIF,
            fontSize: isSymbol ? '1.1rem' : '0.95rem',
            color: !isSymbol
              ? 'rgba(200,170,120,0.4)'     // punctuation / space
              : letter
                ? (correct ? 'rgba(232,220,200,0.9)' : 'rgba(200,100,60,0.85)')
                : 'rgba(200,148,20,0.6)',
            background: selected === ch ? 'rgba(200,148,20,0.14)' : isAnchor ? 'rgba(74,158,106,0.07)' : 'transparent',
            borderRadius: '2px',
            cursor: isSymbol && !locked ? 'pointer' : 'default',
            outline: selected === ch ? '1px solid rgba(200,148,20,0.35)' : 'none',
            letterSpacing: isSymbol ? '0.05em' : undefined,
            transition: 'color 0.2s',
          }}
          onClick={() => { if (isSymbol && !locked) setSelected(s => s === ch ? null : ch) }}
        >
          {isSymbol ? ch : ch}
        </span>
      )
    })
  }

  // Check if all symbols are correctly mapped
  function checkSolved(m: Record<string, string>): boolean {
    return uniqueSymbols.every(sym => m[sym] === L2_LETTER_MAP[sym])
  }

  function assignLetter(letter: string) {
    if (!selected || locked) return
    const newMapping = { ...mapping, [selected]: letter }
    setMapping(newMapping)
    setSelected(null)
    if (checkSolved(newMapping)) {
      setFlash(true)
      setTimeout(() => { setFlash(false); setLocked(true); onSolve() }, 1200)
    }
  }

  const correctCount = uniqueSymbols.filter(s => mapping[s] === L2_LETTER_MAP[s]).length

  return (
    <div
      style={{
        minHeight: '100%',
        background: 'radial-gradient(ellipse 70% 50% at 30% 20%, rgba(30,20,8,0.7) 0%, transparent 65%), #0e0b06',
        padding: '2rem 2rem 3rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.8rem',
      }}
    >
      {/* Briefing */}
      <div style={{ maxWidth: 640 }}>
        <p style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(200,148,20,0.4)', marginBottom: '0.6rem' }}>
          Act I — The Written Word
        </p>
        <p style={{ fontFamily: SERIF, fontSize: '0.9rem', lineHeight: 1.85, color: 'rgba(232,220,200,0.65)', margin: '0 0 0.6rem' }}>
          An ancient stone bears a decree written in an unknown script. A bilingual version of the
          same text has been partially translated. Two anchor words are already known — use them
          to build the symbol map, then decode the rest.
        </p>
        <p style={{ fontFamily: MONO, fontSize: '0.7rem', color: 'rgba(200,148,20,0.5)', margin: 0 }}>
          Click a symbol in the text to select it, then click the corresponding letter below.
        </p>
      </div>

      {/* Anchor clues */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {L2_ANCHORS.map(a => (
          <div
            key={a.label}
            style={{
              background: 'rgba(74,158,106,0.06)',
              border: '1px solid rgba(74,158,106,0.2)',
              borderRadius: '5px',
              padding: '0.6rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.9rem',
            }}
          >
            <span style={{ fontFamily: 'sans-serif', fontSize: '1.15rem', letterSpacing: '0.12em', color: 'rgba(200,148,20,0.8)' }}>
              {a.symbols}
            </span>
            <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: 'rgba(200,170,120,0.35)' }}>→</span>
            <span style={{ fontFamily: SERIF, fontSize: '0.9rem', color: 'rgba(232,220,200,0.7)', letterSpacing: '0.1em' }}>
              {a.plain}
            </span>
            <span style={{ fontFamily: MONO, fontSize: '0.55rem', color: 'rgba(74,158,106,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              anchor
            </span>
          </div>
        ))}
      </div>

      {/* Cipher text display */}
      <div>
        <p style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(200,148,20,0.35)', marginBottom: '0.5rem' }}>
          Unknown script (click a symbol to select it)
        </p>
        <div
          style={{
            background: 'rgba(200,148,20,0.03)',
            border: `1px solid ${flash || locked ? 'rgba(74,158,106,0.25)' : 'rgba(200,148,20,0.12)'}`,
            borderRadius: '4px',
            padding: '1.1rem 1.2rem',
            lineHeight: 2,
            wordBreak: 'break-word',
            boxShadow: flash ? '0 0 24px rgba(74,158,106,0.2)' : 'none',
            transition: 'box-shadow 0.4s, border-color 0.4s',
          }}
        >
          {decodeText(L2_CIPHERTEXT)}
        </div>
      </div>

      {/* Symbol–letter mapping palette */}
      {!locked && (
        <div>
          <p style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(200,170,120,0.3)', marginBottom: '0.7rem' }}>
            {selected
              ? `Assign letter for: ${selected}`
              : `Symbol map — ${correctCount}/${uniqueSymbols.length} solved`
            }
          </p>

          {/* Symbol map summary */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
            {uniqueSymbols.map(sym => {
              const letter   = mapping[sym]
              const correct  = letter && letter === L2_LETTER_MAP[sym]
              const isAnchor = L2_ANCHORS.some(a => a.symbols.includes(sym))
              return (
                <button
                  key={sym}
                  onClick={() => !locked && setSelected(s => s === sym ? null : sym)}
                  style={{
                    background: selected === sym ? 'rgba(200,148,20,0.14)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${correct ? 'rgba(74,158,106,0.3)' : selected === sym ? 'rgba(200,148,20,0.45)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '4px',
                    padding: '0.3rem 0.5rem',
                    cursor: isAnchor ? 'default' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    minWidth: 40,
                    opacity: isAnchor ? 0.6 : 1,
                  }}
                >
                  <span style={{ fontFamily: 'sans-serif', fontSize: '1rem', color: 'rgba(200,148,20,0.8)' }}>{sym}</span>
                  <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: correct ? '#4a9e6a' : letter ? 'rgba(200,100,60,0.8)' : 'rgba(255,255,255,0.2)' }}>
                    {letter ?? '?'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Letter picker (shown when a symbol is selected) */}
          {selected && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', maxWidth: 440 }}>
              {ALPHA.split('').map(letter => {
                const alreadyUsed = Object.values(mapping).includes(letter) && mapping[selected] !== letter
                return (
                  <button
                    key={letter}
                    onClick={() => assignLetter(letter)}
                    disabled={alreadyUsed}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(200,148,20,0.2)',
                      borderRadius: '3px',
                      width: 30,
                      height: 30,
                      fontFamily: MONO,
                      fontSize: '0.75rem',
                      color: alreadyUsed ? 'rgba(255,255,255,0.12)' : 'rgba(200,148,20,0.8)',
                      cursor: alreadyUsed ? 'default' : 'pointer',
                    }}
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Solved message */}
      {locked && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ fontFamily: MONO, fontSize: '0.7rem', color: 'rgba(74,158,106,0.7)', margin: 0 }}>
            Decoded — {uniqueSymbols.length} symbols mapped correctly.
          </p>
          <div
            style={{
              background: 'rgba(74,158,106,0.04)',
              border: '1px solid rgba(74,158,106,0.18)',
              borderRadius: '4px',
              padding: '0.9rem 1.1rem',
              fontFamily: SERIF,
              fontSize: '0.95rem',
              lineHeight: 1.7,
              color: 'rgba(232,220,200,0.8)',
            }}
          >
            {L2_PLAINTEXT}
          </div>
        </div>
      )}
    </div>
  )
}
