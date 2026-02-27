'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Topic } from './page'

// ── Card definitions ─────────────────────────────────────────────────────────

export interface Card {
  id: string
  file: string
  title: string
  topicId: string
}

const ALL_CARDS: Card[] = [
  { id: 'alchemist',    file: 'tarot-the_alchemist.jpg',    title: 'The Alchemist',    topicId: 'pharmaceuticals' },
  { id: 'astronaut',    file: 'tarot-the_astronaut.jpg',    title: 'The Astronaut',    topicId: 'space-news' },
  { id: 'botanist',     file: 'tarot-the_botanist.jpg',     title: 'The Botanist',     topicId: 'life-sciences' },
  { id: 'enlightened',  file: 'tarot-the_enlightened.jpg',  title: 'The Enlightened',  topicId: 'swiss-uni' },
  { id: 'entities',     file: 'tarot-the_entities.jpg',     title: 'The Entities',     topicId: 'space-agencies' },
  { id: 'ghost',        file: 'tarot-the_ghost.jpg',        title: 'The Ghost',        topicId: 'cybersecurity' },
  { id: 'habitat',      file: 'tarot-the_habitat.jpg',      title: 'The Habitat',      topicId: 'space-station' },
  { id: 'intelligence', file: 'tarot-the_intelligence.jpg', title: 'The Intelligence', topicId: 'ai-ml' },
  { id: 'maker',        file: 'tarot-the_maker.jpg',        title: 'The Maker',        topicId: 'materials' },
  { id: 'platform',     file: 'tarot-the_platform.jpg',     title: 'The Platform',     topicId: 'ssip' },
]

// Fixed scrambled order + per-position rotations
const SCRAMBLED_IDS = [
  'intelligence', 'habitat',   'ghost',    'platform',  'astronaut',
  'enlightened',  'alchemist', 'botanist', 'maker',     'entities',
]
const ROTATIONS = [-2.2, 1.8, -3.1, 2.6, -1.4, 3.2, -2.8, 1.2, -3.5, 2.0]

export const ORDERED_CARDS = SCRAMBLED_IDS.map(id => ALL_CARDS.find(c => c.id === id)!)

// ── Shared noise grain URI ────────────────────────────────────────────────────

const GRAIN_URI =
  "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"

// ── Single desktop card ───────────────────────────────────────────────────────

interface CardItemProps {
  card: Card
  rotation: number
  hovered: boolean
  topicLabel: string
  onHover: () => void
  onLeave: () => void
  onClick: () => void
}

function CardItem({ card, rotation, hovered, topicLabel, onHover, onLeave, onClick }: CardItemProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: '12%',
        flexShrink: 0,
        cursor: 'pointer',
        transform: hovered
          ? 'rotate(0deg) translateY(-18px) scale(1.06)'
          : `rotate(${rotation}deg) translateY(0) scale(1)`,
        transition: 'transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.28s ease',
        filter: hovered
          ? 'drop-shadow(0 24px 50px rgba(0,0,0,0.98)) drop-shadow(0 0 32px rgba(218,150,22,0.72)) drop-shadow(0 0 80px rgba(180,110,10,0.42))'
          : 'drop-shadow(0 8px 22px rgba(0,0,0,0.82)) drop-shadow(0 3px 8px rgba(0,0,0,0.55))',
        zIndex: hovered ? 10 : 1,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '2 / 3',
          borderRadius: '7px',
          overflow: 'hidden',
        }}
      >
        <Image
          src={`/tarot/${card.file}`}
          alt={card.title}
          fill
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 1600px) 16vw, 230px"
        />
      </div>

      {/* Topic label — fades in on hover */}
      <p
        style={{
          position: 'absolute',
          bottom: '-2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: '0.85rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: hovered ? 'rgba(255,200,60,1)' : 'rgba(222,148,18,0.97)',
          fontWeight: hovered ? 'bold' : 'normal',
          textShadow: hovered ? '0 2px 12px rgba(255,180,30,0.6), 0 0 20px rgba(255,160,20,0.4)' : 'none',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s ease, color 0.2s ease, font-weight 0.2s ease, text-shadow 0.2s ease',
          pointerEvents: 'none',
        }}
      >
        {topicLabel}
      </p>
    </div>
  )
}

// ── Desktop grid (no background — parent provides it) ─────────────────────────

interface GridProps {
  topics: Topic[]
  onSelectTopic: (topic: Topic) => void
}

export function DesktopGrid({ topics, onSelectTopic }: GridProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  function renderRow(cards: Card[], offset: number) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '4%',
          width: '100%',
          paddingBottom: '4.5rem', // breathing room for hover label
        }}
      >
        {cards.map((card, i) => {
          const idx = offset + i
          return (
            <CardItem
              key={card.id}
              card={card}
              rotation={ROTATIONS[idx]}
              hovered={hoveredIdx === idx}
              topicLabel={topics.find(t => t.id === card.topicId)?.label ?? ''}
              onHover={() => setHoveredIdx(idx)}
              onLeave={() => setHoveredIdx(null)}
              onClick={() => onSelectTopic(topics.find(t => t.id === card.topicId)!)}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ width: '100%', padding: '0 3%' }}>
      {renderRow(ORDERED_CARDS.slice(0, 5), 0)}
      {renderRow(ORDERED_CARDS.slice(5), 5)}
    </div>
  )
}

// ── Mobile scroll-snap view (self-contained) ──────────────────────────────────

interface MobileProps {
  topics: Topic[]
  onSelectTopic: (topic: Topic) => void
}

export function MobileView({ topics, onSelectTopic }: MobileProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#09060c',
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Grain */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("${GRAIN_URI}")`,
          backgroundSize: '200px 200px',
          opacity: 0.12,
          mixBlendMode: 'overlay',
          zIndex: 1,
        }}
      />
      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 88% 82% at 50% 50%, transparent 35%, rgba(3,1,4,0.92) 100%)',
          zIndex: 1,
        }}
      />

      {ORDERED_CARDS.map((card, i) => {
        const topic = topics.find(t => t.id === card.topicId)
        const isLast = i === ORDERED_CARDS.length - 1
        return (
          <div
            key={card.id}
            style={{
              position: 'relative',
              scrollSnapAlign: 'start',
              height: '100svh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.4rem',
              padding: '8% 12%',
              zIndex: 2,
            }}
            onClick={() => topic && onSelectTopic(topic)}
          >
            <div
              style={{
                position: 'relative',
                width: 'min(62vw, 290px)',
                aspectRatio: '2 / 3',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 16px 50px rgba(0,0,0,0.9), 0 0 30px rgba(200,140,20,0.15)',
              }}
            >
              <Image
                src={`/tarot/${card.file}`}
                alt={card.title}
                fill
                style={{ objectFit: 'cover' }}
                sizes="62vw"
              />
            </div>
            <p
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: '0.65rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'rgba(222,148,18,0.75)',
              }}
            >
              {topic?.label ?? ''}
            </p>
            {!isLast && (
              <p
                style={{
                  position: 'absolute',
                  bottom: '5%',
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '0.5rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.1)',
                }}
              >
                scroll
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
