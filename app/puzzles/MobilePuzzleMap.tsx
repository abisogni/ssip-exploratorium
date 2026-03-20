'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import 'leaflet/dist/leaflet.css'

type Theme = 'CRYPTO' | 'AI' | 'SPACE' | 'MOLECULAR'

interface PuzzlePin {
  id: string
  title: string
  titleParts?: [string, string]
  theme: Theme
  desc: string
  route?: string
  lat: number
  lng: number
}

const THEME_ACCENT: Record<Theme, string> = {
  CRYPTO:    'rgba(210,158,32,0.92)',
  AI:        'rgba(0,198,212,0.92)',
  SPACE:     'rgba(128,92,232,0.92)',
  MOLECULAR: 'rgba(32,210,140,0.92)',
}

const THEME_GLOW: Record<Theme, string> = {
  CRYPTO:    'rgba(200,148,20,0.28)',
  AI:        'rgba(0,190,210,0.28)',
  SPACE:     'rgba(110,82,220,0.28)',
  MOLECULAR: 'rgba(20,200,120,0.28)',
}

const THEME_BORDER: Record<Theme, string> = {
  CRYPTO:    'rgba(200,148,20,0.40)',
  AI:        'rgba(0,190,210,0.40)',
  SPACE:     'rgba(110,82,220,0.40)',
  MOLECULAR: 'rgba(20,200,120,0.40)',
}

const THEME_HEX: Record<Theme, string> = {
  CRYPTO:    '#c89014',
  AI:        '#00b8c8',
  SPACE:     '#7050d8',
  MOLECULAR: '#18c880',
}

// Feather-style SVG icons embedded in pin HTML
const THEME_ICON_SVG: Record<Theme, string> = {
  CRYPTO: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  AI: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>`,
  SPACE: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  MOLECULAR: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/><circle cx="12" cy="12" r="2.5"/></svg>`,
}

const PUZZLE_PINS: PuzzlePin[] = [
  // CRYPTO — spread through the Old Town
  { id: 'cipher-room',           title: 'Κρυπτός Εργαστήριο',            theme: 'CRYPTO',    desc: 'Learn and use decryption techniques to change the history of humankind.',                                    route: '/puzzles/cipher-room',          lat: 47.0516, lng: 8.3069 },
  { id: 'frequency-fingerprint', title: 'Frequency Fingerprint',           theme: 'CRYPTO',    desc: 'Break a substitution cipher by analyzing letter frequency distributions.',                                   route: '/puzzles/frequency-fingerprint', lat: 47.0572, lng: 8.3120 },
  { id: 'signal-deep-space',     title: 'Signal from Deep Space',          theme: 'CRYPTO',    desc: 'Reconstruct a binary transmission from deep space into a hidden image.',                                     route: '/puzzles/signal-deep-space',     lat: 47.0482, lng: 8.3052 },
  // AI — near the Bahnhof / KKL area
  { id: 'turing-or-not',         title: 'Turing or Not Turing',            theme: 'AI',        desc: 'Read two conversation transcripts — determine which participant is an AI.',                                   route: '/puzzles/turing-not-turing',     lat: 47.0508, lng: 8.3102 },
  { id: 'neural-paint',          title: 'Neural Paint',                    theme: 'AI',        desc: 'Draw a shape on a canvas; watch a neural network classify it in real time.',                                  route: '/puzzles/neural-paint',          lat: 47.0496, lng: 8.3148 },
  { id: 'adversarial-patch',     title: 'Adversarial Patch',               theme: 'AI',        desc: 'See how imperceptible pixel changes fool image classifiers.',                                                 route: '/puzzles/adversarial-patch',     lat: 47.0530, lng: 8.3048 },
  // SPACE — Inseli / Musegg / Schlossberg
  { id: 'exoplanet-detective',   title: 'Exoplanet Detective',             theme: 'SPACE',     desc: 'Analyze a stellar light curve to identify a transiting exoplanet.',                                          route: '/puzzles/exoplanet-detective',   lat: 47.0493, lng: 8.3086 },
  { id: 'orbital-heist',         title: 'Orbital Heist',                   theme: 'SPACE',     desc: 'Thread a spacecraft through gravity wells to reach the target zone.',                                         route: '/puzzles/orbital-heist',         lat: 47.0558, lng: 8.3142 },
  { id: 'dead-reckoning',        title: 'Dead Reckoning',                  theme: 'SPACE',     desc: 'Plan Mars rover commands 20 minutes before they reach the surface.',                                          route: '/puzzles/dead-reckoning',        lat: 47.0538, lng: 8.3092 },
  // MOLECULAR — lakeside south
  { id: 'icy-worlds',            title: 'LattICE', titleParts: ['Latt', 'ICE'], theme: 'MOLECULAR', desc: 'Navigate pressure and temperature to discover the exotic ice phases hidden inside Neptune.', route: '/puzzles/icy-worlds', lat: 47.0468, lng: 8.3112 },
]

function makePinHtml(theme: Theme): string {
  const hex = THEME_HEX[theme]
  const svg = THEME_ICON_SVG[theme]
  return `<div style="width:34px;height:44px;position:relative;cursor:pointer;">
    <div style="
      width:34px;height:34px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      background:${hex};
      border:2px solid rgba(255,255,255,0.88);
      box-shadow:0 3px 12px rgba(0,0,0,0.55),0 1px 4px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
      position:absolute;top:0;left:0;
    ">
      <span style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;">${svg}</span>
    </div>
  </div>`
}

export default function MobilePuzzleMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const [selected, setSelected] = useState<PuzzlePin | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let mounted = true

    const initMap = async () => {
      const L = (await import('leaflet')).default
      if (!mounted || !containerRef.current) return

      const map = L.map(containerRef.current, {
        center: [47.0518, 8.3096],
        zoom: 14,
        zoomControl: false,
        attributionControl: true,
      })

      // CartoDB Voyager — closest free alternative to Google Maps style
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          subdomains: 'abcd',
          maxZoom: 19,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
        }
      ).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      PUZZLE_PINS.forEach(puzzle => {
        const icon = L.divIcon({
          html: makePinHtml(puzzle.theme),
          className: '',
          iconSize:   [34, 44],
          iconAnchor: [17, 44],
        })
        L.marker([puzzle.lat, puzzle.lng], { icon })
          .addTo(map)
          .on('click', (e: any) => {
            L.DomEvent.stopPropagation(e)
            if (mounted) setSelected(puzzle)
          })
      })

      mapRef.current = map
    }

    initMap()

    return () => {
      mounted = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Leaflet map container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Expanded card overlay */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '1.25rem',
          }}
        >
          {/* Card — stopPropagation so tapping inside doesn't dismiss */}
          <div
            onClick={e => {
              e.stopPropagation()
              if (selected.route) router.push(selected.route)
            }}
            style={{
              background: 'rgba(4,6,15,0.97)',
              border: `1px solid ${THEME_BORDER[selected.theme]}`,
              borderRadius: '12px',
              padding: '1.4rem 1.3rem 1.3rem',
              cursor: selected.route ? 'pointer' : 'default',
              boxShadow: `0 -8px 40px ${THEME_GLOW[selected.theme]}, 0 0 0 1px ${THEME_BORDER[selected.theme]}`,
            }}
          >
            <div style={{ marginBottom: '0.55rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-geist-mono, monospace)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.18em',
                  color: THEME_ACCENT[selected.theme],
                }}
              >
                {selected.theme}
              </span>
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-geist-mono, monospace)',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.95)',
                lineHeight: 1.3,
                margin: '0 0 0.6rem 0',
              }}
            >
              {selected.titleParts
                ? <>{selected.titleParts[0]}<strong>{selected.titleParts[1]}</strong></>
                : selected.title}
            </h2>

            <p
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: '0.9rem',
                fontStyle: 'italic',
                color: 'rgba(180,210,230,0.55)',
                lineHeight: 1.6,
                margin: '0 0 1rem 0',
              }}
            >
              {selected.desc}
            </p>

            <div
              style={{
                fontFamily: 'var(--font-geist-mono, monospace)',
                fontSize: '0.62rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: selected.route ? THEME_ACCENT[selected.theme] : 'rgba(255,255,255,0.2)',
                paddingTop: '0.7rem',
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {selected.route ? '→ tap to play' : 'planned'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
