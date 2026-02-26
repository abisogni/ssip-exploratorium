'use client'

import { useEffect, useState } from 'react'

const WORDS = ['parabolé', 'parabola', 'parable', 'palabras']
// Characters drawn from Latin-extended set to feel like language morphing
const SCRAMBLE_POOL = 'abcdefghijklmnopqrstuvwxyzàáâãäçèéêëìíïñòóôùúûüý'

export default function Palabras() {
  const [display, setDisplay] = useState(WORDS[0])
  const [showSub, setShowSub] = useState(false)

  useEffect(() => {
    let holdTimer: ReturnType<typeof setTimeout>
    let scrambleInterval: ReturnType<typeof setInterval>
    let wordIdx = 0

    function scrambleTo(target: string, onDone: () => void) {
      let step = 0
      const STEPS = 16
      scrambleInterval = setInterval(() => {
        step++
        if (step >= STEPS) {
          clearInterval(scrambleInterval)
          setDisplay(target)
          onDone()
          return
        }
        // Gradually reveal left-to-right, scramble the rest
        const revealCount = Math.floor((step / STEPS) * target.length)
        let result = target.slice(0, revealCount)
        for (let i = revealCount; i < target.length; i++) {
          result += SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)]
        }
        setDisplay(result)
      }, 45)
    }

    function advance() {
      if (wordIdx >= WORDS.length - 1) {
        holdTimer = setTimeout(() => setShowSub(true), 700)
        return
      }
      holdTimer = setTimeout(() => {
        scrambleTo(WORDS[wordIdx + 1], () => {
          wordIdx++
          advance()
        })
      }, 1700)
    }

    advance()

    return () => {
      clearTimeout(holdTimer)
      clearInterval(scrambleInterval)
    }
  }, [])

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-xl w-full text-center space-y-5">
        <p
          className="text-xs tracking-[0.4em] uppercase"
          style={{ color: 'rgba(100,160,255,0.5)' }}
        >
          SSIP &mdash; Exploratorium
        </p>

        {/* Animated word — mono font keeps width stable during scramble */}
        <h1
          className="font-mono font-bold"
          style={{ fontSize: 'clamp(2.8rem, 8vw, 5rem)', minHeight: '1.3em' }}
        >
          {display}
        </h1>

        {/* Subtitle fades in once "palabras" settles */}
        <p
          className="text-sm transition-opacity duration-1000"
          style={{
            color: 'rgba(255,255,255,0.45)',
            opacity: showSub ? 1 : 0,
            transitionDelay: showSub ? '0ms' : '0ms',
          }}
        >
          a collection of blogs and news&hellip; you know, words
        </p>

        <a
          href="/"
          className="inline-block text-xs tracking-widest uppercase transition-colors text-white/25 hover:text-white"
        >
          &larr; return
        </a>
      </div>
    </main>
  )
}
