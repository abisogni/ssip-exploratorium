'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ── Palette ───────────────────────────────────────────────────────────────────
const PAGE_BG    = '#04060f'
const ACCENT     = 'rgba(0,198,212,0.92)'
const ACCENT_DIM = 'rgba(0,190,210,0.45)'
const TEXT_MAIN  = 'rgba(180,230,240,0.88)'
const TEXT_DIM   = 'rgba(100,170,195,0.50)'
const MONO       = 'var(--font-geist-mono, monospace)'
const SERIF      = '"Times New Roman", Times, serif'

// ── Types ─────────────────────────────────────────────────────────────────────
type Phase    = 'briefing' | 'gallery'
type ViewMode = 'original' | 'perturbed'

interface Pair {
  id:               string
  originalLabel:    string
  perturbedLabel:   string
  origConf:         number
  pertConf:         number
  noiseKey:         number
  explanation:      string
  draw:             (ctx: CanvasRenderingContext2D, s: number) => void
}

// ── Seeded pixel noise (LCG) ──────────────────────────────────────────────────
// Simulates a real FGSM perturbation: every pixel shifts by a tiny signed
// amount computed via gradient descent — imperceptible to humans, devastating
// to the classifier.
function addNoise(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
  strength: number,
) {
  const d  = ctx.getImageData(0, 0, w, h)
  const px = d.data
  let s = seed
  for (let i = 0; i < px.length; i += 4) {
    s = (Math.imul(s, 1664525) + 1013904223) | 0
    const v = ((s >>> 0) / 0xffffffff - 0.5) * 2 * strength * 255
    px[i]   = Math.max(0, Math.min(255, px[i]   + v))
    px[i+1] = Math.max(0, Math.min(255, px[i+1] + v))
    px[i+2] = Math.max(0, Math.min(255, px[i+2] + v))
  }
  ctx.putImageData(d, 0, 0)
}

// ── Drawing functions ─────────────────────────────────────────────────────────

function drawPanda(ctx: CanvasRenderingContext2D, s: number) {
  const cx = s / 2, cy = s / 2
  ctx.fillStyle = '#eef2f0'; ctx.fillRect(0, 0, s, s)
  // Body
  ctx.fillStyle = '#111'
  ctx.beginPath(); ctx.ellipse(cx, cy + s * .25, s * .22, s * .2, 0, 0, Math.PI * 2); ctx.fill()
  // Ears
  for (const ex of [cx - s * .18, cx + s * .18]) {
    ctx.beginPath(); ctx.arc(ex, cy - s * .22, s * .1, 0, Math.PI * 2); ctx.fill()
  }
  // Head
  ctx.fillStyle = '#fff'
  ctx.beginPath(); ctx.arc(cx, cy - s * .05, s * .2, 0, Math.PI * 2); ctx.fill()
  // Eye patches
  ctx.fillStyle = '#111'
  for (const [ex, ey, ang] of [
    [cx - s * .09, cy - s * .07, -.35],
    [cx + s * .09, cy - s * .07,  .35],
  ] as [number, number, number][]) {
    ctx.beginPath(); ctx.ellipse(ex, ey, s * .062, s * .052, ang, 0, Math.PI * 2); ctx.fill()
  }
  // White inner eyes
  ctx.fillStyle = '#fff'
  for (const ex of [cx - s * .09, cx + s * .09]) {
    ctx.beginPath(); ctx.arc(ex, cy - s * .075, s * .028, 0, Math.PI * 2); ctx.fill()
  }
  // Pupils
  ctx.fillStyle = '#111'
  for (const ex of [cx - s * .09, cx + s * .09]) {
    ctx.beginPath(); ctx.arc(ex, cy - s * .075, s * .014, 0, Math.PI * 2); ctx.fill()
  }
  // Nose
  ctx.fillStyle = '#333'
  ctx.beginPath(); ctx.ellipse(cx, cy - s * .01, s * .022, s * .016, 0, 0, Math.PI * 2); ctx.fill()
  // Mouth
  ctx.strokeStyle = '#333'; ctx.lineWidth = s * .011; ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - s * .035, cy + s * .025)
  ctx.quadraticCurveTo(cx, cy + s * .05, cx + s * .035, cy + s * .025)
  ctx.stroke()
}

function drawSchoolBus(ctx: CanvasRenderingContext2D, s: number) {
  const cx = s / 2
  const t  = s * .28, h = s * .28, l = s * .08, r = s * .88
  // Sky
  ctx.fillStyle = '#dae8f5'; ctx.fillRect(0, 0, s, s)
  // Ground
  ctx.fillStyle = '#b8c8a0'; ctx.fillRect(0, s * .7, s, s * .3)
  // Body gradient
  const grad = ctx.createLinearGradient(0, t, 0, t + h)
  grad.addColorStop(0, '#f5c400'); grad.addColorStop(1, '#d4a900')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.rect(l, t, r - l, h)
  ctx.fill()
  // Cab bump (front right)
  ctx.fillStyle = '#e6b800'
  ctx.beginPath()
  ctx.moveTo(r, t + h * .15)
  ctx.lineTo(r + s * .04, t + h * .35)
  ctx.lineTo(r + s * .04, t + h)
  ctx.lineTo(r, t + h)
  ctx.closePath()
  ctx.fill()
  // Outline
  ctx.strokeStyle = '#222'; ctx.lineWidth = s * .012
  ctx.strokeRect(l, t, r - l, h)
  // Windows
  ctx.fillStyle = '#a8d8f0'
  const winW = s * .09, winH = s * .082, winT = t + s * .04
  for (let i = 0; i < 4; i++) {
    const wx = l + s * .04 + i * (winW + s * .038)
    ctx.fillRect(wx, winT, winW, winH)
    ctx.strokeStyle = '#333'; ctx.lineWidth = s * .007
    ctx.strokeRect(wx, winT, winW, winH)
  }
  // Stripe
  ctx.fillStyle = '#111'; ctx.fillRect(l, t + h * .48, r - l, s * .024)
  // Wheels
  for (const wx of [l + s * .12, r - s * .08]) {
    ctx.fillStyle = '#222'
    ctx.beginPath(); ctx.arc(wx, t + h + s * .02, s * .07, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#555'
    ctx.beginPath(); ctx.arc(wx, t + h + s * .02, s * .032, 0, Math.PI * 2); ctx.fill()
  }
  // "SCHOOL BUS" text
  ctx.fillStyle = '#111'
  ctx.font = `bold ${s * .042}px monospace`
  ctx.textAlign = 'center'
  ctx.fillText('SCHOOL BUS', cx, t + h * .78)
}

function drawCat(ctx: CanvasRenderingContext2D, s: number) {
  const cx = s / 2, cy = s * .52
  ctx.fillStyle = '#f0ede8'; ctx.fillRect(0, 0, s, s)
  // Ears
  ctx.fillStyle = '#c8a888'
  ctx.beginPath(); ctx.moveTo(cx - s * .18, cy - s * .22); ctx.lineTo(cx - s * .06, cy - s * .12); ctx.lineTo(cx - s * .25, cy - s * .06); ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.moveTo(cx + s * .18, cy - s * .22); ctx.lineTo(cx + s * .06, cy - s * .12); ctx.lineTo(cx + s * .25, cy - s * .06); ctx.closePath(); ctx.fill()
  // Inner ears
  ctx.fillStyle = '#e8a0a0'
  ctx.beginPath(); ctx.moveTo(cx - s * .16, cy - s * .19); ctx.lineTo(cx - s * .08, cy - s * .13); ctx.lineTo(cx - s * .22, cy - s * .09); ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.moveTo(cx + s * .16, cy - s * .19); ctx.lineTo(cx + s * .08, cy - s * .13); ctx.lineTo(cx + s * .22, cy - s * .09); ctx.closePath(); ctx.fill()
  // Head
  ctx.fillStyle = '#d4b896'
  ctx.beginPath(); ctx.ellipse(cx, cy, s * .22, s * .2, 0, 0, Math.PI * 2); ctx.fill()
  // Eyes
  ctx.fillStyle = '#6dbb55'
  for (const ex of [cx - s * .09, cx + s * .09]) {
    ctx.beginPath(); ctx.ellipse(ex, cy - s * .04, s * .045, s * .05, 0, 0, Math.PI * 2); ctx.fill()
  }
  // Pupils (vertical slits)
  ctx.fillStyle = '#111'
  for (const ex of [cx - s * .09, cx + s * .09]) {
    ctx.beginPath(); ctx.ellipse(ex, cy - s * .04, s * .016, s * .04, 0, 0, Math.PI * 2); ctx.fill()
  }
  // Eye shine
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  for (const ex of [cx - s * .09, cx + s * .09]) {
    ctx.beginPath(); ctx.arc(ex - s * .01, cy - s * .055, s * .01, 0, Math.PI * 2); ctx.fill()
  }
  // Nose
  ctx.fillStyle = '#d47080'
  ctx.beginPath(); ctx.moveTo(cx, cy + s * .02); ctx.lineTo(cx - s * .02, cy + s * .04); ctx.lineTo(cx + s * .02, cy + s * .04); ctx.closePath(); ctx.fill()
  // Whiskers
  ctx.strokeStyle = '#888'; ctx.lineWidth = s * .006; ctx.lineCap = 'round'
  for (const [x1, y1, x2, y2] of [
    [cx - s * .04, cy + s * .05, cx - s * .28, cy + s * .03],
    [cx - s * .04, cy + s * .065, cx - s * .28, cy + s * .075],
    [cx + s * .04, cy + s * .05, cx + s * .28, cy + s * .03],
    [cx + s * .04, cy + s * .065, cx + s * .28, cy + s * .075],
  ] as [number, number, number, number][]) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  }
  // Mouth
  ctx.strokeStyle = '#b06070'; ctx.lineWidth = s * .01
  ctx.beginPath(); ctx.moveTo(cx, cy + s * .04); ctx.quadraticCurveTo(cx - s * .04, cy + s * .09, cx - s * .06, cy + s * .075); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, cy + s * .04); ctx.quadraticCurveTo(cx + s * .04, cy + s * .09, cx + s * .06, cy + s * .075); ctx.stroke()
}

function drawBanana(ctx: CanvasRenderingContext2D, s: number) {
  ctx.fillStyle = '#fffbe6'; ctx.fillRect(0, 0, s, s)
  // Body (thick curved stroke)
  const g = ctx.createLinearGradient(s * .2, s * .7, s * .8, s * .3)
  g.addColorStop(0, '#f5dd00'); g.addColorStop(.5, '#f0c800'); g.addColorStop(1, '#c8a400')
  ctx.strokeStyle = g; ctx.lineWidth = s * .155; ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(s * .18, s * .72)
  ctx.bezierCurveTo(s * .12, s * .3, s * .48, s * .08, s * .82, s * .28)
  ctx.stroke()
  // Tips
  ctx.strokeStyle = '#7a5000'; ctx.lineWidth = s * .055; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(s * .18, s * .72); ctx.lineTo(s * .155, s * .79); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(s * .82, s * .28); ctx.lineTo(s * .855, s * .23); ctx.stroke()
  // Highlight
  ctx.strokeStyle = 'rgba(255,255,200,0.55)'; ctx.lineWidth = s * .04
  ctx.beginPath()
  ctx.moveTo(s * .22, s * .65)
  ctx.bezierCurveTo(s * .18, s * .35, s * .5, s * .15, s * .78, s * .33)
  ctx.stroke()
}

function drawDog(ctx: CanvasRenderingContext2D, s: number) {
  const cx = s / 2, cy = s * .5
  ctx.fillStyle = '#f2ede8'; ctx.fillRect(0, 0, s, s)
  // Floppy ears
  ctx.fillStyle = '#c8905a'
  ctx.beginPath(); ctx.ellipse(cx - s * .2, cy + s * .01, s * .1, s * .18, -.25, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(cx + s * .2, cy + s * .01, s * .1, s * .18,  .25, 0, Math.PI * 2); ctx.fill()
  // Head
  ctx.fillStyle = '#dda870'
  ctx.beginPath(); ctx.ellipse(cx, cy - s * .02, s * .22, s * .21, 0, 0, Math.PI * 2); ctx.fill()
  // Snout
  ctx.fillStyle = '#c8906a'
  ctx.beginPath(); ctx.ellipse(cx, cy + s * .07, s * .12, s * .08, 0, 0, Math.PI * 2); ctx.fill()
  // Eyes
  ctx.fillStyle = '#3a2010'
  for (const ex of [cx - s * .1, cx + s * .1]) {
    ctx.beginPath(); ctx.arc(ex, cy - s * .07, s * .04, 0, Math.PI * 2); ctx.fill()
  }
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  for (const ex of [cx - s * .1, cx + s * .1]) {
    ctx.beginPath(); ctx.arc(ex - s * .015, cy - s * .085, s * .012, 0, Math.PI * 2); ctx.fill()
  }
  // Nose
  ctx.fillStyle = '#1a0a05'
  ctx.beginPath(); ctx.ellipse(cx, cy + s * .04, s * .045, s * .035, 0, 0, Math.PI * 2); ctx.fill()
  // Tongue
  ctx.fillStyle = '#e87090'
  ctx.beginPath(); ctx.ellipse(cx, cy + s * .14, s * .04, s * .055, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#d05070'
  ctx.fillRect(cx - s * .005, cy + s * .1, s * .01, s * .04)
}

// ── Pair definitions ──────────────────────────────────────────────────────────
const PAIRS: Pair[] = [
  {
    id:             'panda',
    originalLabel:  'giant panda',
    perturbedLabel: 'gibbon',
    origConf:       0.997,
    pertConf:       0.993,
    noiseKey:       42,
    explanation:    'In 2014, Goodfellow et al. showed that adding imperceptible noise — computed by gradient descent to maximize misclassification — could reliably fool deep networks. This panda → gibbon example became iconic in adversarial ML. The perturbation changes fewer than 1% of pixel values by more than 8/255.',
    draw:           drawPanda,
  },
  {
    id:             'bus',
    originalLabel:  'school bus',
    perturbedLabel: 'ostrich',
    origConf:       0.994,
    pertConf:       0.986,
    noiseKey:       137,
    explanation:    'Image classifiers trained on ImageNet have learned statistical shortcuts. The ostrich perturbation emphasises mottled textures and elongated shapes the model associates with long necks — patterns present in the noise that are invisible to human eyes looking at the bus.',
    draw:           drawSchoolBus,
  },
  {
    id:             'cat',
    originalLabel:  'tabby cat',
    perturbedLabel: 'guacamole',
    origConf:       0.988,
    pertConf:       0.978,
    noiseKey:       255,
    explanation:    'Neural networks classify largely by texture, not shape. The guacamole perturbation shifts the texture statistics toward the greenish, mottled patterns the model learned to associate with avocado — even though no green is visible to human observers.',
    draw:           drawCat,
  },
  {
    id:             'banana',
    originalLabel:  'banana',
    perturbedLabel: 'toaster',
    origConf:       0.999,
    pertConf:       0.941,
    noiseKey:       888,
    explanation:    'A banana classifier is extremely confident (99.9%). Adversarial attacks exploit this certainty — gradients pointing away from "banana" and toward "toaster" are amplified until they tip the softmax output, even when the human-visible image is unchanged.',
    draw:           drawBanana,
  },
  {
    id:             'dog',
    originalLabel:  'golden retriever',
    perturbedLabel: 'broccoli',
    origConf:       0.982,
    pertConf:       0.967,
    noiseKey:       1234,
    explanation:    'This highlights a real AI safety concern. Adversarial stickers on stop signs have fooled self-driving systems in research settings. In medical imaging, a subtle perturbation could flip a benign diagnosis to malignant. Adversarial robustness is an active open problem in AI safety.',
    draw:           drawDog,
  },
]

// ── Button styles ─────────────────────────────────────────────────────────────
const OUTLINE_BTN: React.CSSProperties = {
  background:    'transparent',
  border:        `1px solid ${ACCENT_DIM}`,
  borderRadius:  3,
  color:         TEXT_MAIN,
  fontFamily:    MONO,
  fontSize:      '0.75rem',
  letterSpacing: '0.15em',
  padding:       '0.6rem 1.2rem',
  cursor:        'pointer',
  transition:    'background 0.2s',
}

const FILLED_BTN: React.CSSProperties = {
  background:    'rgba(0,190,210,0.12)',
  border:        `1px solid ${ACCENT_DIM}`,
  borderRadius:  3,
  color:         TEXT_MAIN,
  fontFamily:    MONO,
  fontSize:      '0.75rem',
  letterSpacing: '0.15em',
  padding:       '0.6rem 1.2rem',
  cursor:        'pointer',
  transition:    'background 0.2s',
}

// ── Canvas component ──────────────────────────────────────────────────────────
function PairCanvas({ pair, mode, size }: { pair: Pair; mode: ViewMode; size: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, size, size)
    pair.draw(ctx, size)
    if (mode === 'perturbed') {
      addNoise(ctx, size, size, pair.noiseKey, 0.055)
    }
  }, [pair, mode, size])

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      style={{ borderRadius: 6, display: 'block' }}
    />
  )
}

// ── Label badge ───────────────────────────────────────────────────────────────
function LabelBadge({
  label,
  confidence,
  changed,
}: {
  label:      string
  confidence: number
  changed:    boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div
        style={{
          fontFamily:    MONO,
          fontSize:      '0.62rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color:         ACCENT_DIM,
        }}
      >
        classifier output
      </div>
      <div
        style={{
          fontFamily:    MONO,
          fontSize:      '1.12rem',
          fontWeight:    600,
          color:         changed ? 'rgba(220,80,60,0.95)' : TEXT_MAIN,
          transition:    'color 0.4s',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div
          style={{
            width:        120,
            height:       4,
            background:   'rgba(255,255,255,0.08)',
            borderRadius: 2,
            overflow:     'hidden',
          }}
        >
          <div
            style={{
              width:        `${Math.round(confidence * 100)}%`,
              height:       '100%',
              background:   changed ? 'rgba(220,80,60,0.7)' : ACCENT,
              borderRadius: 2,
              transition:   'width 0.5s ease, background 0.4s',
            }}
          />
        </div>
        <span
          style={{
            fontFamily: MONO,
            fontSize:   '0.7rem',
            color:      changed ? 'rgba(220,80,60,0.85)' : ACCENT_DIM,
            transition: 'color 0.4s',
          }}
        >
          {(confidence * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdversarialPatch() {
  const [phase,    setPhase]    = useState<Phase>('briefing')
  const [pairIdx,  setPairIdx]  = useState(0)
  const [mode,     setMode]     = useState<ViewMode>('original')
  const [revealed, setRevealed] = useState(false)
  const [seenAll,  setSeenAll]  = useState(false)

  const pair        = PAIRS[pairIdx]
  const isPerturbed = mode === 'perturbed'
  const label       = isPerturbed ? pair.perturbedLabel : pair.originalLabel
  const confidence  = isPerturbed ? pair.pertConf       : pair.origConf

  function goNext() {
    if (pairIdx < PAIRS.length - 1) {
      setPairIdx(pairIdx + 1)
      setMode('original')
      setRevealed(false)
    } else {
      setSeenAll(true)
    }
  }

  function goPrev() {
    if (pairIdx > 0) {
      setPairIdx(pairIdx - 1)
      setMode('original')
      setRevealed(false)
    }
  }

  // ── Briefing ─────────────────────────────────────────────────────────────
  if (phase === 'briefing') {
    return (
      <main
        style={{
          background: PAGE_BG,
          minHeight:  '100vh',
          color:      TEXT_MAIN,
          fontFamily: MONO,
          position:   'relative',
        }}
      >
        <Link
          href="/puzzles"
          style={{
            position:      'absolute',
            top:           '1.5rem',
            left:          '1.5rem',
            color:         ACCENT_DIM,
            textDecoration:'none',
            fontSize:      '0.8rem',
            letterSpacing: '0.1em',
            transition:    'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={e => (e.currentTarget.style.color = ACCENT_DIM)}
        >
          ← puzzles
        </Link>

        <div style={{ maxWidth: 680, margin: '0 auto', padding: '8rem 2rem 4rem' }}>
          <p
            style={{
              fontSize:      '0.68rem',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color:         ACCENT_DIM,
              marginBottom:  '1.5rem',
            }}
          >
            MISSION BRIEFING — AI / ADVERSARIAL EXAMPLES
          </p>

          <h1
            style={{
              fontFamily:   SERIF,
              fontSize:     'clamp(2.2rem, 5vw, 3.2rem)',
              fontWeight:   'bold',
              fontStyle:    'italic',
              color:        TEXT_MAIN,
              lineHeight:   1.1,
              marginBottom: '2.5rem',
            }}
          >
            Adversarial Patch
          </h1>

          <div
            style={{
              display:       'flex',
              flexDirection: 'column',
              gap:           '1.1rem',
              marginBottom:  '2.5rem',
            }}
          >
            {[
              'Image classifiers can be fooled — not by blurring or distorting the image, but by adding mathematically crafted noise so small you cannot see it.',
              "An attacker computes the exact pixel changes that maximise the model's confidence in a wrong class, using the same gradient machinery that trains the network.",
              'The result: two images that look identical to human eyes but produce completely different labels from the classifier.',
              'Each pair below shows an original image alongside its adversarially perturbed twin. Toggle between them and watch the label change.',
            ].map((text, i) => (
              <p
                key={i}
                style={{
                  fontFamily: SERIF,
                  fontSize:   '1rem',
                  fontStyle:  'italic',
                  color:      'rgba(180,230,240,0.65)',
                  lineHeight: 1.75,
                  margin:     0,
                }}
              >
                {text}
              </p>
            ))}
          </div>

          <div
            style={{
              background:    'rgba(0,140,160,0.07)',
              border:        '1px solid rgba(0,180,200,0.14)',
              borderRadius:  4,
              padding:       '1.2rem 1.5rem',
              marginBottom:  '3rem',
            }}
          >
            <p
              style={{
                fontSize:      '0.65rem',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color:         ACCENT,
                margin:        '0 0 0.55rem',
              }}
            >
              How to play
            </p>
            {(
              [
                ['Toggle',  'Switch between original and perturbed image'],
                ['Observe', 'Watch the classifier label and confidence change'],
                ['Reveal',  'Read the explanation for each pair'],
              ] as [string, string][]
            ).map(([cmd, desc]) => (
              <div
                key={cmd}
                style={{
                  display:    'flex',
                  gap:        '1.5rem',
                  alignItems: 'baseline',
                  marginTop:  '0.45rem',
                }}
              >
                <span style={{ color: TEXT_MAIN, minWidth: 80, fontSize: '0.88rem' }}>
                  {cmd}
                </span>
                <span
                  style={{
                    color:      'rgba(180,230,240,0.45)',
                    fontSize:   '0.82rem',
                    fontFamily: SERIF,
                    fontStyle:  'italic',
                  }}
                >
                  {desc}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setPhase('gallery')}
            style={{
              background:    'rgba(0,190,210,0.1)',
              border:        '1px solid rgba(0,190,210,0.4)',
              borderRadius:  4,
              color:         TEXT_MAIN,
              fontFamily:    MONO,
              fontSize:      '0.85rem',
              letterSpacing: '0.18em',
              padding:       '0.75rem 2rem',
              cursor:        'pointer',
              transition:    'background 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background   = 'rgba(0,190,210,0.2)'
              e.currentTarget.style.borderColor  = ACCENT
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background   = 'rgba(0,190,210,0.1)'
              e.currentTarget.style.borderColor  = 'rgba(0,190,210,0.4)'
            }}
          >
            BEGIN →
          </button>
        </div>
      </main>
    )
  }

  // ── Gallery ───────────────────────────────────────────────────────────────
  return (
    <main
      style={{
        background:    PAGE_BG,
        height:        '100vh',
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
        color:         TEXT_MAIN,
        fontFamily:    MONO,
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '1rem',
          padding:      '0.7rem 1.5rem',
          borderBottom: '1px solid rgba(0,190,210,0.1)',
          flexShrink:   0,
        }}
      >
        <Link
          href="/puzzles"
          style={{
            color:          ACCENT_DIM,
            textDecoration: 'none',
            fontSize:       '0.78rem',
            letterSpacing:  '0.08em',
            transition:     'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={e => (e.currentTarget.style.color = ACCENT_DIM)}
        >
          ← puzzles
        </Link>
        <span style={{ color: 'rgba(0,190,210,0.2)', fontSize: '0.7rem' }}>|</span>
        <span
          style={{
            fontSize:      '0.7rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color:         ACCENT,
          }}
        >
          Adversarial Patch
        </span>
        <span
          style={{
            fontSize:   '0.7rem',
            color:      TEXT_DIM,
            fontFamily: SERIF,
            fontStyle:  'italic',
          }}
        >
          — pair {pairIdx + 1} of {PAIRS.length}
        </span>
      </div>

      {/* Body: two columns */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* ── Left: canvas + controls ── */}
        <div
          style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            flex:           1,
            padding:        '2rem',
            gap:            '1.5rem',
          }}
        >
          {/* Canvas with mode badge */}
          <div style={{ position: 'relative' }}>
            <PairCanvas pair={pair} mode={mode} size={300} />
            <div
              style={{
                position:      'absolute',
                top:           8,
                right:         8,
                fontFamily:    MONO,
                fontSize:      '0.58rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                padding:       '0.25rem 0.5rem',
                borderRadius:  2,
                background:    isPerturbed
                  ? 'rgba(200,60,40,0.75)'
                  : 'rgba(0,190,210,0.22)',
                color:      isPerturbed ? '#ffd0c0' : TEXT_MAIN,
                transition: 'background 0.3s, color 0.3s',
              }}
            >
              {isPerturbed ? 'PERTURBED' : 'ORIGINAL'}
            </div>
          </div>

          {/* Toggle */}
          <button
            onClick={() => setMode(m => m === 'original' ? 'perturbed' : 'original')}
            style={{
              background:    isPerturbed
                ? 'rgba(200,60,40,0.1)'
                : 'rgba(0,190,210,0.1)',
              border:        `1px solid ${isPerturbed
                ? 'rgba(200,60,40,0.45)'
                : 'rgba(0,190,210,0.45)'}`,
              borderRadius:  4,
              color:         TEXT_MAIN,
              fontFamily:    MONO,
              fontSize:      '0.78rem',
              letterSpacing: '0.14em',
              padding:       '0.6rem 0',
              cursor:        'pointer',
              transition:    'all 0.3s',
              width:         230,
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.75' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            {isPerturbed ? '← SHOW ORIGINAL' : 'ADD PERTURBATION →'}
          </button>

          {/* Pair indicator dots */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {PAIRS.map((_, i) => (
              <div
                key={i}
                style={{
                  width:        7,
                  height:       7,
                  borderRadius: '50%',
                  background:   i === pairIdx ? ACCENT : 'rgba(0,190,210,0.2)',
                  transition:   'background 0.2s',
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Right: label + explanation + nav ── */}
        <div
          style={{
            width:         340,
            flexShrink:    0,
            borderLeft:    '1px solid rgba(0,190,210,0.1)',
            display:       'flex',
            flexDirection: 'column',
            padding:       '2rem 1.5rem',
            gap:           '1.4rem',
            overflowY:     'auto',
          }}
        >
          <LabelBadge
            label={label}
            confidence={confidence}
            changed={isPerturbed}
          />

          <div style={{ height: 1, background: 'rgba(0,190,210,0.1)' }} />

          {/* Noise delta indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div
              style={{
                fontFamily:    MONO,
                fontSize:      '0.62rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color:         ACCENT_DIM,
              }}
            >
              pixel delta (L∞ norm)
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontSize:   '0.85rem',
                color:      isPerturbed ? 'rgba(220,80,60,0.9)' : TEXT_DIM,
                transition: 'color 0.4s',
              }}
            >
              {isPerturbed ? 'ε = 8 / 255  ≈  0.031' : 'ε = 0'}
            </div>
            <div
              style={{
                fontFamily: SERIF,
                fontSize:   '0.8rem',
                fontStyle:  'italic',
                color:      TEXT_DIM,
                lineHeight: 1.55,
              }}
            >
              {isPerturbed
                ? 'Max per-channel change. Invisible at this scale — 8 levels on a 0–255 range.'
                : 'Unmodified image. The classifier is correct.'}
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(0,190,210,0.1)' }} />

          {/* Reveal explanation */}
          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              style={{ ...OUTLINE_BTN, alignSelf: 'flex-start' }}
              onMouseEnter={e =>
                (e.currentTarget.style.background = 'rgba(0,190,210,0.08)')
              }
              onMouseLeave={e =>
                (e.currentTarget.style.background = 'transparent')
              }
            >
              REVEAL EXPLANATION
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <p
                style={{
                  fontSize:      '0.62rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color:         ACCENT_DIM,
                  margin:        0,
                }}
              >
                What happened
              </p>
              <p
                style={{
                  fontFamily: SERIF,
                  fontSize:   '0.92rem',
                  fontStyle:  'italic',
                  color:      'rgba(180,230,240,0.72)',
                  lineHeight: 1.7,
                  margin:     0,
                }}
              >
                {pair.explanation}
              </p>
            </div>
          )}

          <div style={{ height: 1, background: 'rgba(0,190,210,0.1)' }} />

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {pairIdx > 0 && (
              <button
                onClick={goPrev}
                style={OUTLINE_BTN}
                onMouseEnter={e =>
                  (e.currentTarget.style.background = 'rgba(0,190,210,0.08)')
                }
                onMouseLeave={e =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                ← PREV
              </button>
            )}
            {pairIdx < PAIRS.length - 1 ? (
              <button
                onClick={goNext}
                style={FILLED_BTN}
                onMouseEnter={e =>
                  (e.currentTarget.style.background = 'rgba(0,190,210,0.24)')
                }
                onMouseLeave={e =>
                  (e.currentTarget.style.background = 'rgba(0,190,210,0.12)')
                }
              >
                NEXT PAIR →
              </button>
            ) : (
              <button
                onClick={() => setSeenAll(true)}
                style={FILLED_BTN}
                onMouseEnter={e =>
                  (e.currentTarget.style.background = 'rgba(0,190,210,0.24)')
                }
                onMouseLeave={e =>
                  (e.currentTarget.style.background = 'rgba(0,190,210,0.12)')
                }
              >
                FINISH →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Completed overlay ── */}
      {seenAll && (
        <div
          style={{
            position:       'fixed',
            inset:          0,
            background:     'rgba(4,6,15,0.92)',
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '1rem',
            zIndex:         50,
          }}
        >
          <p
            style={{
              fontSize:      '0.62rem',
              letterSpacing: '0.42em',
              color:         'rgba(0,210,180,0.8)',
              margin:        0,
            }}
          >
            STATUS: COMPLETE
          </p>
          <h2
            style={{
              fontFamily: SERIF,
              fontSize:   'clamp(2rem, 5vw, 3rem)',
              fontStyle:  'italic',
              color:      TEXT_MAIN,
              margin:     0,
            }}
          >
            All Pairs Reviewed
          </h2>
          <p
            style={{
              fontFamily: SERIF,
              fontSize:   '0.9rem',
              fontStyle:  'italic',
              color:      TEXT_DIM,
              margin:     0,
              textAlign:  'center',
              maxWidth:   460,
              lineHeight: 1.7,
            }}
          >
            Adversarial robustness is one of the open problems in AI safety research.
            The gradient machinery that enables learning also enables exploitation —
            and building defences is an unsolved challenge.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button
              onClick={() => {
                setPairIdx(0)
                setMode('original')
                setRevealed(false)
                setSeenAll(false)
              }}
              style={OUTLINE_BTN}
              onMouseEnter={e =>
                (e.currentTarget.style.background = 'rgba(0,190,210,0.08)')
              }
              onMouseLeave={e =>
                (e.currentTarget.style.background = 'transparent')
              }
            >
              REVIEW AGAIN
            </button>
            <Link
              href="/puzzles"
              style={{
                ...FILLED_BTN,
                textDecoration: 'none',
                display:        'inline-flex',
                alignItems:     'center',
              }}
            >
              BACK TO PUZZLES
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
