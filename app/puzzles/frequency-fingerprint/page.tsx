'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ENTRIES, ENGLISH_FREQ, buildDecodeKey, CipherEntry } from './data'

// ── Palette ───────────────────────────────────────────────────────────────────
const MONO  = 'var(--font-geist-mono, monospace)'
const SERIF = '"Times New Roman", Times, serif'
const GOLD  = 'rgba(210,158,32,0.92)'
const GOLD_DIM  = 'rgba(200,148,20,0.22)'
const GOLD_GLOW = 'rgba(200,148,20,0.13)'
const GREEN = 'rgba(80,210,120,0.9)'
const RED   = 'rgba(220,80,60,0.85)'
const PAGE_BG =
  'radial-gradient(ellipse 60% 50% at 85% 10%, rgba(160,110,10,0.13) 0%, transparent 55%),' +
  'radial-gradient(ellipse 55% 60% at 10% 55%, rgba(80,50,10,0.12) 0%, transparent 58%),' +
  'radial-gradient(ellipse 65% 40% at 50% 96%, rgba(120,80,10,0.14) 0%, transparent 55%),' +
  '#05040a'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Compute letter frequencies (%) from a ciphertext string. */
function computeFreq(text: string): Record<string, number> {
  const counts: Record<string, number> = {}
  let total = 0
  for (const ch of text) {
    if (ch >= 'A' && ch <= 'Z') { counts[ch] = (counts[ch] ?? 0) + 1; total++ }
  }
  const freq: Record<string, number> = {}
  for (const ch in counts) freq[ch] = (counts[ch] / total) * 100
  return freq
}

/** Apply a partial mapping (cipherLetter → plainLetter) to a ciphertext. */
function applyMapping(cipher: string, mapping: Record<string, string>): string {
  return cipher.split('').map(c => {
    if (c >= 'A' && c <= 'Z') return mapping[c] ?? '·'
    return c
  }).join('')
}

/** Check if the user mapping fully solves the entry. */
function isSolved(entry: CipherEntry, mapping: Record<string, string>): boolean {
  const decoded = applyMapping(entry.cipherText, mapping)
  const clean = (s: string) => s.replace(/[^A-Z·]/g, '')
  return clean(decoded) === clean(entry.plainText)
}

// ── MiniMap ───────────────────────────────────────────────────────────────────

function MiniMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const pad = 0.025
  const bbox = `${lng - pad},${lat - pad * 0.7},${lng + pad},${lat + pad * 0.7}`
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
  return (
    <div style={{ borderRadius: 4, overflow: 'hidden', border: `1px solid ${GOLD_DIM}` }}>
      <iframe
        src={src}
        width="100%"
        height="260"
        style={{ display: 'block', border: 'none' }}
        title={name}
        loading="lazy"
      />
    </div>
  )
}

// ── FreqChart ─────────────────────────────────────────────────────────────────

function FreqChart({
  cipherFreq,
  sortedLetters,
  mapping,
}: {
  cipherFreq: Record<string, number>
  sortedLetters: string[]
  mapping: Record<string, string>
}) {
  const maxPct = Math.max(...Object.values(cipherFreq), 13)

  return (
    <div>
      <p style={{ fontFamily: MONO, fontSize: '0.58rem', letterSpacing: '0.22em', color: 'rgba(210,158,32,0.45)', marginBottom: '0.5rem' }}>
        FREQUENCY CHART — cipher (bar) vs English reference (dot)
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: 90, paddingBottom: 4 }}>
        {sortedLetters.map(cl => {
          const pct = cipherFreq[cl] ?? 0
          const barH = Math.round((pct / maxPct) * 80)
          const pl = mapping[cl]
          const engPct = pl ? (ENGLISH_FREQ[pl] ?? 0) : 0
          const dotH = Math.round((engPct / maxPct) * 80)
          const hasMapping = !!pl

          return (
            <div key={cl} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
              {/* English reference dot */}
              {hasMapping && dotH > 0 && (
                <div style={{
                  position: 'absolute',
                  bottom: dotH + 4,
                  width: 4, height: 4,
                  borderRadius: '50%',
                  background: GREEN,
                  opacity: 0.7,
                  zIndex: 2,
                }} />
              )}
              {/* Cipher frequency bar */}
              <div style={{
                width: '100%',
                height: barH,
                background: hasMapping ? `rgba(80,210,120,0.35)` : GOLD_GLOW,
                border: `1px solid ${hasMapping ? 'rgba(80,210,120,0.45)' : GOLD_DIM}`,
                borderRadius: '2px 2px 0 0',
                transition: 'background 0.2s, border-color 0.2s',
                alignSelf: 'flex-end',
              }} />
              {/* Cipher letter label */}
              <span style={{
                fontFamily: MONO,
                fontSize: '0.5rem',
                color: hasMapping ? GREEN : 'rgba(210,158,32,0.6)',
                marginTop: 2,
                transition: 'color 0.2s',
              }}>{cl}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── MappingGrid ───────────────────────────────────────────────────────────────

function MappingGrid({
  sortedLetters,
  mapping,
  onChange,
}: {
  sortedLetters: string[]
  mapping: Record<string, string>
  onChange: (cl: string, pl: string) => void
}) {
  // detect conflicts: two cipher letters mapped to same plain letter
  const usedPlain = new Set<string>()
  const conflicts = new Set<string>()
  for (const cl of sortedLetters) {
    const pl = mapping[cl]
    if (pl) {
      if (usedPlain.has(pl)) conflicts.add(pl)
      else usedPlain.add(pl)
    }
  }
  const conflictCipher = new Set<string>()
  for (const cl of sortedLetters) {
    if (mapping[cl] && conflicts.has(mapping[cl])) conflictCipher.add(cl)
  }

  return (
    <div>
      <p style={{ fontFamily: MONO, fontSize: '0.58rem', letterSpacing: '0.22em', color: 'rgba(210,158,32,0.45)', marginBottom: '0.5rem' }}>
        SUBSTITUTION MAP — cipher → plain
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: '4px' }}>
        {sortedLetters.map(cl => {
          const val = mapping[cl] ?? ''
          const isConflict = conflictCipher.has(cl)
          return (
            <div key={cl} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontFamily: MONO, fontSize: '0.58rem', color: 'rgba(210,158,32,0.55)' }}>{cl}</span>
              <input
                type="text"
                maxLength={1}
                value={val}
                onChange={e => onChange(cl, e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                style={{
                  width: '100%',
                  textAlign: 'center',
                  fontFamily: MONO,
                  fontSize: '0.75rem',
                  background: val
                    ? isConflict ? 'rgba(220,80,60,0.12)' : 'rgba(80,210,120,0.1)'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${
                    val
                      ? isConflict ? 'rgba(220,80,60,0.45)' : 'rgba(80,210,120,0.4)'
                      : GOLD_DIM
                  }`,
                  borderRadius: 3,
                  color: val
                    ? isConflict ? RED : GREEN
                    : 'rgba(240,220,170,0.7)',
                  padding: '3px 0',
                  outline: 'none',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── DecodedText ───────────────────────────────────────────────────────────────

function DecodedText({ entry, mapping, solved }: { entry: CipherEntry; mapping: Record<string, string>; solved: boolean }) {
  const decoded = applyMapping(entry.cipherText, mapping)

  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: `1px solid ${solved ? 'rgba(80,210,120,0.3)' : GOLD_DIM}`,
      borderRadius: 4,
      padding: '1rem 1.1rem',
      transition: 'border-color 0.4s',
    }}>
      <p style={{ fontFamily: MONO, fontSize: '0.55rem', letterSpacing: '0.22em', color: solved ? GREEN : 'rgba(210,158,32,0.4)', marginBottom: '0.5rem', transition: 'color 0.4s' }}>
        {solved ? 'DECODED' : 'PARTIAL DECODE'}
      </p>
      <p style={{
        fontFamily: SERIF,
        fontSize: '0.88rem',
        fontStyle: 'italic',
        color: solved ? 'rgba(220,240,200,0.88)' : 'rgba(210,190,140,0.72)',
        lineHeight: 1.8,
        wordBreak: 'break-word',
        letterSpacing: '0.04em',
        transition: 'color 0.4s',
      }}>
        {decoded.split('').map((c, i) => {
          if (c === '·') return <span key={i} style={{ color: 'rgba(210,158,32,0.35)' }}>·</span>
          return <span key={i}>{c}</span>
        })}
      </p>
      <p style={{ fontFamily: MONO, fontSize: '0.55rem', letterSpacing: '0.18em', color: 'rgba(210,158,32,0.28)', marginTop: '0.65rem' }}>
        CIPHER  ·  {entry.cipherText}
      </p>
    </div>
  )
}

// ── RevealPanel ───────────────────────────────────────────────────────────────

function RevealPanel({ entry, onBack }: { entry: CipherEntry; onBack: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {entry.type === 'quote' && entry.person && (
        <>
          <div>
            <p style={{ fontFamily: MONO, fontSize: '0.58rem', letterSpacing: '0.3em', color: GREEN, marginBottom: '0.4rem' }}>
              DECODED — QUOTE
            </p>
            <p style={{ fontFamily: SERIF, fontSize: '1.05rem', fontStyle: 'italic', color: 'rgba(230,255,210,0.88)', lineHeight: 1.8, marginBottom: '1.2rem' }}>
              "{entry.plainText.charAt(0) + entry.plainText.slice(1).toLowerCase()}"
            </p>
            <div style={{ borderLeft: `2px solid ${GOLD_DIM}`, paddingLeft: '1rem' }}>
              <p style={{ fontFamily: MONO, fontSize: '0.72rem', color: GOLD, marginBottom: '0.2rem' }}>
                {entry.person.name}
              </p>
              <p style={{ fontFamily: MONO, fontSize: '0.62rem', color: 'rgba(210,158,32,0.5)', marginBottom: '0.7rem', letterSpacing: '0.08em' }}>
                {entry.person.years} · {entry.person.field}
              </p>
              <p style={{ fontFamily: SERIF, fontSize: '0.9rem', fontStyle: 'italic', color: 'rgba(210,190,150,0.65)', lineHeight: 1.75 }}>
                {entry.person.bio}
              </p>
            </div>
          </div>
        </>
      )}

      {entry.type === 'coordinates' && entry.coord && (
        <>
          <div>
            <p style={{ fontFamily: MONO, fontSize: '0.58rem', letterSpacing: '0.3em', color: GREEN, marginBottom: '0.4rem' }}>
              COORDINATES DECODED
            </p>
            <p style={{ fontFamily: MONO, fontSize: '0.85rem', color: GOLD, marginBottom: '0.2rem' }}>
              {entry.coord.locationName}
            </p>
            <p style={{ fontFamily: MONO, fontSize: '0.7rem', color: 'rgba(210,158,32,0.55)', marginBottom: '0.9rem', letterSpacing: '0.06em' }}>
              {entry.coord.lat.toFixed(4)}° N, {entry.coord.lng.toFixed(4)}° E
            </p>
            <p style={{ fontFamily: SERIF, fontSize: '0.9rem', fontStyle: 'italic', color: 'rgba(210,190,150,0.6)', lineHeight: 1.75, marginBottom: '1rem' }}>
              {entry.coord.description}
            </p>
            <MiniMap lat={entry.coord.lat} lng={entry.coord.lng} name={entry.coord.locationName} />
          </div>
        </>
      )}

      <button
        onClick={onBack}
        style={{
          alignSelf: 'flex-start',
          fontFamily: MONO,
          fontSize: '0.68rem',
          letterSpacing: '0.18em',
          color: 'rgba(210,158,32,0.6)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(210,158,32,0.6)')}
      >
        ← back to gallery
      </button>
    </div>
  )
}

// ── DecodeView ────────────────────────────────────────────────────────────────

function DecodeView({
  entry,
  mapping,
  solved,
  onMappingChange,
  onBack,
}: {
  entry: CipherEntry
  mapping: Record<string, string>
  solved: boolean
  onMappingChange: (cl: string, pl: string) => void
  onBack: () => void
}) {
  const cipherFreq = useMemo(() => computeFreq(entry.cipherText), [entry])

  // Letters sorted by frequency descending (only those appearing in the text)
  const sortedLetters = useMemo(() =>
    Object.keys(cipherFreq).sort((a, b) => (cipherFreq[b] ?? 0) - (cipherFreq[a] ?? 0)),
    [cipherFreq]
  )

  const filledCount = Object.values(mapping).filter(v => v !== '').length
  const totalCipherLetters = sortedLetters.length

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.65rem 1.5rem',
        borderBottom: `1px solid ${GOLD_DIM}`,
        flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: '0.75rem', letterSpacing: '0.08em', color: 'rgba(210,158,32,0.45)', padding: 0, transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(210,158,32,0.45)')}
        >
          ← gallery
        </button>
        <span style={{ color: 'rgba(210,158,32,0.2)', fontSize: '0.7rem' }}>|</span>
        <span style={{ fontFamily: MONO, fontSize: '0.68rem', letterSpacing: '0.14em', color: GOLD }}>
          {entry.type === 'quote'
            ? entry.person?.name
            : 'UNDISCOVERED LOCATION'}
        </span>
        <span style={{ fontFamily: MONO, fontSize: '0.62rem', color: 'rgba(210,158,32,0.35)', marginLeft: 'auto' }}>
          {filledCount} / {totalCipherLetters} letters mapped
        </span>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Left: controls */}
        <div style={{
          width: 320,
          flexShrink: 0,
          borderRight: `1px solid ${GOLD_DIM}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.2rem',
          padding: '1.2rem',
          overflowY: 'auto',
        }}>
          <FreqChart cipherFreq={cipherFreq} sortedLetters={sortedLetters} mapping={mapping} />
          <MappingGrid sortedLetters={sortedLetters} mapping={mapping} onChange={onMappingChange} />
          {solved && (
            <div style={{
              padding: '0.7rem 0.9rem',
              background: 'rgba(80,210,120,0.07)',
              border: `1px solid rgba(80,210,120,0.3)`,
              borderRadius: 4,
            }}>
              <p style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.2em', color: GREEN }}>
                CIPHER BROKEN ✓
              </p>
            </div>
          )}
        </div>

        {/* Right: text + reveal */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {!solved ? (
            <>
              <div>
                <p style={{ fontFamily: MONO, fontSize: '0.58rem', letterSpacing: '0.22em', color: 'rgba(210,158,32,0.4)', marginBottom: '0.5rem' }}>
                  {entry.type === 'quote' ? 'ENCRYPTED QUOTE' : 'ENCRYPTED COORDINATES'}
                </p>
                <p style={{ fontFamily: SERIF, fontSize: '0.85rem', fontStyle: 'italic', color: 'rgba(210,180,100,0.35)', lineHeight: 1.9, letterSpacing: '0.1em', wordBreak: 'break-word' }}>
                  {entry.cipherText}
                </p>
              </div>
              <DecodedText entry={entry} mapping={mapping} solved={false} />
              <div style={{
                padding: '0.8rem 1rem',
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid rgba(210,158,32,0.1)`,
                borderRadius: 4,
              }}>
                <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.82rem', color: 'rgba(210,180,120,0.4)', lineHeight: 1.7 }}>
                  Match the frequency bars above to the English reference dots. The most common cipher letter likely encodes <strong style={{ fontStyle: 'normal', color: 'rgba(210,180,120,0.65)' }}>E</strong>, <strong style={{ fontStyle: 'normal', color: 'rgba(210,180,120,0.65)' }}>T</strong>, or <strong style={{ fontStyle: 'normal', color: 'rgba(210,180,120,0.65)' }}>A</strong>. Use word patterns to confirm guesses.
                </p>
              </div>
            </>
          ) : (
            <RevealPanel entry={entry} onBack={onBack} />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Gallery ───────────────────────────────────────────────────────────────────

function Gallery({
  solvedIds,
  onSelect,
}: {
  solvedIds: Set<string>
  onSelect: (id: string) => void
}) {
  const quotes = ENTRIES.filter(e => e.type === 'quote')
  const coords = ENTRIES.filter(e => e.type === 'coordinates')

  function EntryCard({ entry }: { entry: CipherEntry }) {
    const solved = solvedIds.has(entry.id)
    const [hovered, setHovered] = useState(false)

    return (
      <div
        onClick={() => onSelect(entry.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.022)',
          border: `1px solid ${solved ? 'rgba(80,210,120,0.3)' : hovered ? GOLD_DIM : 'rgba(255,255,255,0.06)'}`,
          borderRadius: 6,
          padding: '1.2rem 1.3rem',
          cursor: 'pointer',
          transition: 'background 0.2s, border-color 0.2s, transform 0.2s, box-shadow 0.2s',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: hovered ? `0 6px 24px ${GOLD_GLOW}` : 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.55rem' }}>
          <span style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.2em', color: solved ? GREEN : GOLD, opacity: hovered ? 1 : 0.7, transition: 'opacity 0.2s' }}>
            {entry.type === 'quote' ? 'QUOTE' : 'COORDINATES'}
          </span>
          {solved && (
            <span style={{ fontFamily: MONO, fontSize: '0.58rem', color: GREEN, letterSpacing: '0.12em' }}>SOLVED</span>
          )}
        </div>

        <p style={{ fontFamily: MONO, fontSize: '0.82rem', color: hovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)', marginBottom: '0.45rem', transition: 'color 0.2s', lineHeight: 1.35 }}>
          {solved
            ? entry.type === 'quote' ? entry.person?.name : entry.coord?.locationName
            : entry.type === 'quote' ? '??? ??? ???' : 'UNDISCOVERED LOCATION'}
        </p>

        <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(210,180,130,0.38)', lineHeight: 1.55 }}>
          {solved
            ? entry.type === 'quote'
              ? `${entry.person?.years} · ${entry.person?.field}`
              : `${entry.coord?.lat.toFixed(4)}° N, ${entry.coord?.lng.toFixed(4)}° E`
            : entry.cipherText.slice(0, 42) + '…'}
        </p>

        <div style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.18em', color: solved ? GREEN : GOLD, opacity: solved ? 1 : 0.55, paddingTop: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.7rem' }}>
          {solved ? 'view' : 'decode'}
        </div>
      </div>
    )
  }

  return (
    <div style={{ overflowY: 'auto', flex: 1, padding: '0 2rem 6vh' }}>

      {/* Page header */}
      <div style={{ textAlign: 'center', paddingTop: '5vh', paddingBottom: '4vh' }}>
        <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.72rem', letterSpacing: '0.3em', color: 'rgba(210,158,32,0.32)', marginBottom: '0.6rem' }}>
          SSIP Exploratorium · CRYPTO
        </p>
        <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 'bold', fontStyle: 'italic', color: 'rgba(240,220,170,0.85)', lineHeight: 1, marginBottom: '0.8rem', letterSpacing: '0.03em' }}>
          Frequency Fingerprint
        </h1>
        <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.95rem', color: 'rgba(210,180,130,0.42)', letterSpacing: '0.06em', marginBottom: '2vh' }}>
          every language leaves a trace — find it
        </p>
        <div style={{ width: 100, height: 1, background: GOLD_DIM, margin: '0 auto' }} />
      </div>

      {/* Quotes section */}
      <div style={{ maxWidth: 860, margin: '0 auto 3vh' }}>
        <p style={{ fontFamily: MONO, fontSize: '0.62rem', letterSpacing: '0.28em', color: 'rgba(210,158,32,0.35)', marginBottom: '1rem' }}>
          SWISS SCIENTISTS — {quotes.filter(e => solvedIds.has(e.id)).length} of {quotes.length} decoded
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {quotes.map(e => <EntryCard key={e.id} entry={e} />)}
        </div>
      </div>

      {/* Coordinates section */}
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <p style={{ fontFamily: MONO, fontSize: '0.62rem', letterSpacing: '0.28em', color: 'rgba(210,158,32,0.35)', marginBottom: '1rem' }}>
          HIDDEN COORDINATES — {coords.filter(e => solvedIds.has(e.id)).length} of {coords.length} located
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {coords.map(e => <EntryCard key={e.id} entry={e} />)}
        </div>
      </div>

    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FrequencyFingerprint() {
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  // mappings[entryId][cipherLetter] = userGuessPlainLetter
  const [mappings, setMappings]       = useState<Record<string, Record<string, string>>>({})
  const [solvedIds, setSolvedIds]     = useState<Set<string>>(new Set())

  const selectedEntry = selectedId ? ENTRIES.find(e => e.id === selectedId) ?? null : null

  const currentMapping: Record<string, string> = selectedId
    ? (mappings[selectedId] ?? {})
    : {}

  function handleMappingChange(cipherLetter: string, plainLetter: string) {
    if (!selectedId || !selectedEntry) return
    const updated = { ...currentMapping, [cipherLetter]: plainLetter }
    setMappings(prev => ({ ...prev, [selectedId]: updated }))

    // Auto-check solve
    if (isSolved(selectedEntry, updated)) {
      setSolvedIds(prev => new Set([...prev, selectedId]))
    }
  }

  function handleSelect(id: string) {
    setSelectedId(id)
  }

  function handleBack() {
    setSelectedId(null)
  }

  return (
    <main style={{
      background: PAGE_BG,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      color: 'rgba(240,220,170,0.85)',
      fontFamily: MONO,
    }}>

      {/* Top nav */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.6rem 1.5rem',
        borderBottom: `1px solid ${GOLD_DIM}`,
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.22em', color: 'rgba(210,158,32,0.35)' }}>
          FREQUENCY FINGERPRINT
        </span>
        <Link
          href="/puzzles"
          style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.88rem', color: 'rgba(210,158,32,0.45)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(210,158,32,0.45)')}
        >
          <span style={{ fontSize: '1.1rem' }}>←</span> puzzles
        </Link>
      </div>

      {/* Content */}
      {!selectedEntry ? (
        <Gallery solvedIds={solvedIds} onSelect={handleSelect} />
      ) : (
        <DecodeView
          entry={selectedEntry}
          mapping={currentMapping}
          solved={solvedIds.has(selectedEntry.id)}
          onMappingChange={handleMappingChange}
          onBack={handleBack}
        />
      )}

    </main>
  )
}
