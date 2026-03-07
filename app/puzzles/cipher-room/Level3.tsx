'use client'

import { useState, useEffect } from 'react'
import { L3_STRAND, L3_ANSWERS, L3_PROTEIN, CODON_TABLE } from './data'

const MONO  = 'var(--font-geist-mono, monospace)'
const SERIF = '"Georgia", "Times New Roman", serif'

const BASE_COLOR: Record<string, string> = {
  A: '#4a90d9', U: '#e8743a', G: '#4aad6a', C: '#c85a8a',
}

function CodonBadge({ triplet }: { triplet: string }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: '0.85rem', letterSpacing: '0.04em' }}>
      {triplet.split('').map((ch, i) => (
        <span key={i} style={{ color: BASE_COLOR[ch] ?? 'rgba(232,220,200,0.6)' }}>{ch}</span>
      ))}
    </span>
  )
}

interface Props { onSolve: () => void; solved: boolean }

export default function Level3({ onSolve, solved }: Props) {
  const [answers,  setAnswers]  = useState<(string | null)[]>(L3_STRAND.map(() => null))
  const [active,   setActive]   = useState<number | null>(null)
  const [locked,   setLocked]   = useState(solved)
  const [flash,    setFlash]    = useState(false)
  const [wrong,    setWrong]    = useState<number | null>(null)

  // Pre-fill start codon (AUG) as a teaching hint
  useEffect(() => {
    setAnswers(prev => {
      const next = [...prev]
      if (!next[0]) next[0] = 'Met'
      return next
    })
  }, [])

  function selectCodon(abbr: string) {
    if (active === null || locked) return
    const correct = L3_ANSWERS[active]
    if (abbr === correct) {
      const next = [...answers]
      next[active] = abbr
      setAnswers(next)
      setActive(null)
      if (next.every((a, i) => a === L3_ANSWERS[i])) {
        setFlash(true)
        setTimeout(() => { setFlash(false); setLocked(true); onSolve() }, 1200)
      }
    } else {
      setWrong(active)
      setTimeout(() => setWrong(null), 600)
    }
  }

  // Codons available in the reference table (deduplicated by abbr for display)
  const tableEntries = CODON_TABLE.filter((c, i, arr) =>
    arr.findIndex(x => x.abbr === c.abbr) === i
  )

  return (
    <div
      style={{
        minHeight: '100%',
        background: 'radial-gradient(ellipse 70% 50% at 50% 20%, rgba(5,20,35,0.8) 0%, transparent 65%), #040c18',
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
        <p style={{ fontFamily: SERIF, fontSize: '0.9rem', lineHeight: 1.85, color: 'rgba(232,220,200,0.65)', margin: '0 0 0.5rem' }}>
          Every living organism on Earth uses the same code. DNA is written in a four-letter
          alphabet and read in triplets called codons. Each codon maps to one amino acid, which
          chains into proteins. Translate the strand below using the codon table.
        </p>
        <p style={{ fontFamily: MONO, fontSize: '0.7rem', color: 'rgba(56,200,140,0.45)', margin: 0 }}>
          AUG is the universal start codon (always Methionine). UAA, UAG, UGA are stop codons.
        </p>
      </div>

      {/* RNA Strand */}
      <div>
        <p style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(56,200,140,0.3)', marginBottom: '0.6rem' }}>
          RNA strand — click a codon to select it, then choose from the table
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
          {L3_STRAND.map((codon, i) => {
            const answered = answers[i]
            const isActive = active === i
            const isWrong  = wrong === i
            const isStart  = i === 0
            const isStop   = CODON_TABLE.find(c => c.triplet === codon)?.isStop

            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                <button
                  onClick={() => { if (!locked && !(isStart && answered)) setActive(isActive ? null : i) }}
                  style={{
                    background: isActive ? 'rgba(56,200,140,0.12)' : answered ? 'rgba(74,158,106,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isWrong ? 'rgba(192,68,58,0.6)' : isActive ? 'rgba(56,200,140,0.45)' : answered ? 'rgba(74,158,106,0.25)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '5px',
                    padding: '0.5rem 0.7rem',
                    cursor: (locked || (isStart && answered)) ? 'default' : 'pointer',
                    transition: 'border-color 0.2s, background 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.3rem',
                    minWidth: 52,
                  }}
                >
                  <CodonBadge triplet={codon} />
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: '0.7rem',
                      color: answered
                        ? (isStop ? '#e8743a' : isStart ? '#4a90d9' : '#4aad6a')
                        : 'rgba(255,255,255,0.18)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {answered ?? '???'}
                  </span>
                </button>
                {i < L3_STRAND.length - 1 && (
                  <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: 'rgba(255,255,255,0.12)' }}>→</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Codon reference table */}
      <div>
        <p style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(56,200,140,0.3)', marginBottom: '0.6rem' }}>
          Codon table {active !== null ? `— select the amino acid for ${L3_STRAND[active]}` : ''}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxWidth: 600 }}>
          {tableEntries.map(entry => {
            const isStop   = entry.isStop
            const isActive = active !== null && L3_ANSWERS[active] === entry.abbr
            return (
              <button
                key={entry.abbr}
                onClick={() => selectCodon(entry.abbr)}
                disabled={active === null || locked}
                style={{
                  background: isActive ? 'rgba(56,200,140,0.1)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isActive ? 'rgba(56,200,140,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '4px',
                  padding: '0.4rem 0.65rem',
                  cursor: active === null || locked ? 'default' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '2px',
                  minWidth: 80,
                  opacity: active === null ? 0.55 : 1,
                  transition: 'opacity 0.2s, border-color 0.2s',
                }}
              >
                <span style={{ fontFamily: MONO, fontSize: '0.62rem', letterSpacing: '0.1em', color: 'rgba(56,200,140,0.6)' }}>
                  {entry.triplet}
                </span>
                <span style={{ fontFamily: MONO, fontSize: '0.75rem', fontWeight: 600, color: isStop ? '#e8743a' : 'rgba(232,220,200,0.75)' }}>
                  {entry.abbr}
                </span>
                <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.62rem', color: 'rgba(200,170,120,0.35)' }}>
                  {entry.aminoAcid}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Result */}
      {locked && (
        <div style={{ maxWidth: 560 }}>
          <p style={{ fontFamily: MONO, fontSize: '0.7rem', color: 'rgba(74,158,106,0.7)', margin: '0 0 0.5rem' }}>
            Strand fully translated.
          </p>
          <div
            style={{
              background: 'rgba(74,158,106,0.04)',
              border: '1px solid rgba(74,158,106,0.18)',
              borderRadius: '4px',
              padding: '0.8rem 1.1rem',
              fontFamily: MONO,
              fontSize: '0.8rem',
              color: 'rgba(232,220,200,0.75)',
              lineHeight: 1.6,
            }}
          >
            <span style={{ color: 'rgba(56,200,140,0.5)', fontSize: '0.65rem', display: 'block', marginBottom: '0.3rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Protein
            </span>
            {L3_ANSWERS.join(' — ')}
            <br />
            <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.72rem', color: 'rgba(200,170,120,0.4)', marginTop: '0.4rem', display: 'block' }}>
              {L3_PROTEIN}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
