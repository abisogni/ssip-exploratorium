'use client'

import { useEffect, useRef, useState } from 'react'
import type { SSIPEvent } from './types'

interface Props { events: SSIPEvent[] }

// ── Pure helpers (outside component — stable references) ──────────────────────

function hexRgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

function freqLabel(p: number) {
  const g = 0.5 * Math.pow(20, p)
  return g < 1 ? `${g.toFixed(3)} GHz` : g < 4 ? `${g.toFixed(2)} GHz` : `${g.toFixed(1)} GHz`
}

const IMG_STEP = 60 // degrees per gallery image step

// ── Component ─────────────────────────────────────────────────────────────────

export default function SignalArchiveMobile({ events }: Props) {
  // ── Canvas refs ──────────────────────────────────────────────────────────────
  const specRef   = useRef<HTMLCanvasElement>(null)
  const dialRef   = useRef<HTMLCanvasElement>(null)
  const waveRef   = useRef<HTMLCanvasElement>(null)
  const gDialRef  = useRef<HTMLCanvasElement>(null)

  // ── DOM refs — imperatively updated every frame (avoids setState-per-frame) ─
  const ssFreqRef      = useRef<HTMLDivElement>(null)
  const ssStatusRef    = useRef<HTMLDivElement>(null)
  const dfrValueRef    = useRef<HTMLDivElement>(null)
  const dotsRef        = useRef<HTMLDivElement>(null)
  const hintRef        = useRef<HTMLDivElement>(null)
  const flashRef       = useRef<HTMLDivElement>(null)
  const epScrollRef    = useRef<HTMLDivElement>(null)
  const galleryReadRef = useRef<HTMLDivElement>(null)

  // ── Mutable animation state — read/written by RAF loop without re-renders ───
  const S = useRef({
    cursorPos:    0,
    dialRot:      0,
    epWavePhase:  0,
    galleryDialRot: 0,
    noiseSeeds: Array.from({ length: 500 }, () => Math.random() - 0.5),
  })

  // ── React state — drives panel visibility and event content ─────────────────
  const [lockedEvent,     setLockedEvent]     = useState<SSIPEvent | null>(null)
  const [galleryOpen,     setGalleryOpen]     = useState(false)
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0)

  // Stable refs so RAF-loop closures always see latest values
  const lockedRef      = useRef<SSIPEvent | null>(null)
  const galleryRef     = useRef(false)
  const photoIdxRef    = useRef(0)
  useEffect(() => { lockedRef.current   = lockedEvent },     [lockedEvent])
  useEffect(() => { galleryRef.current  = galleryOpen },     [galleryOpen])
  useEffect(() => { photoIdxRef.current = currentPhotoIdx }, [currentPhotoIdx])

  // Actions exposed to event handlers inside the effect
  const actionsRef = useRef({
    lock:         (_ev: SSIPEvent) => {},
    clear:        () => {},
    openGallery:  () => {},
    closeGallery: () => {},
    stepPhoto:    (_idx: number) => {},
  })

  useEffect(() => {
    actionsRef.current = {
      lock(ev) {
        S.current.cursorPos = ev.specPos
        S.current.dialRot   = ev.specPos * 720
        if (flashRef.current) {
          flashRef.current.style.opacity = '1'
          setTimeout(() => { if (flashRef.current) flashRef.current.style.opacity = '0' }, 120)
        }
        setTimeout(() => {
          setLockedEvent(ev)
          if (epScrollRef.current) epScrollRef.current.scrollTop = 0
        }, 80)
      },
      clear() {
        S.current.galleryDialRot = 0
        setLockedEvent(null)
        setGalleryOpen(false)
        setCurrentPhotoIdx(0)
      },
      openGallery() {
        S.current.galleryDialRot = 0
        setGalleryOpen(true)
        setCurrentPhotoIdx(0)
      },
      closeGallery() {
        setGalleryOpen(false)
      },
      stepPhoto(idx) {
        setCurrentPhotoIdx(idx)
        if (galleryReadRef.current) {
          const n = lockedRef.current?.photoUrls.length ?? 0
          galleryReadRef.current.textContent = n > 0 ? `${idx + 1} / ${n}` : '— / —'
        }
      },
    }
  })

  // ── Main effect: canvas setup + RAF loop + event listeners ───────────────────
  useEffect(() => {
    const specCanvas  = specRef.current!
    const dialCanvas  = dialRef.current!
    const waveCanvas  = waveRef.current!
    const gDialCanvas = gDialRef.current!
    const specCtx     = specCanvas.getContext('2d')!
    const dialCtx     = dialCanvas.getContext('2d')!
    const waveCtx     = waveCanvas.getContext('2d')!
    const gDialCtx    = gDialCanvas.getContext('2d')!

    function resize() {
      const sw = specCanvas.parentElement!.getBoundingClientRect()
      specCanvas.width  = sw.width
      specCanvas.height = sw.height

      const dw   = dialCanvas.parentElement!.getBoundingClientRect()
      const diam = Math.min(dw.width, dw.height) * 0.88
      dialCanvas.width  = diam
      dialCanvas.height = diam

      const ew = waveCanvas.parentElement!.getBoundingClientRect()
      waveCanvas.width  = ew.width
      waveCanvas.height = ew.height

      const gw    = gDialCanvas.parentElement!.getBoundingClientRect()
      const gdiam = Math.min(gw.width, gw.height) * 0.88
      gDialCanvas.width  = gdiam
      gDialCanvas.height = gdiam
    }

    window.addEventListener('resize', resize)
    resize()

    // ── Proximity helpers ─────────────────────────────────────────────────────
    function prox(ev: SSIPEvent) {
      return Math.max(0, 1 - Math.abs(S.current.cursorPos - ev.specPos) / 0.09)
    }
    function nearestEvent() {
      return events.reduce((b, ev) => prox(ev) > prox(b) ? ev : b)
    }
    function bestProx() { return prox(nearestEvent()) }

    // ── Spectrum ──────────────────────────────────────────────────────────────
    function drawSpectrum() {
      const W = specCanvas.width, H = specCanvas.height
      specCtx.clearRect(0, 0, W, H)

      specCtx.beginPath()
      specCtx.strokeStyle = 'rgba(30,80,30,0.45)'
      specCtx.lineWidth = 1
      for (let x = 0; x < W; x++) {
        const y = H - 10 - Math.abs(S.current.noiseSeeds[x % S.current.noiseSeeds.length]) * 10
        x === 0 ? specCtx.moveTo(x, y) : specCtx.lineTo(x, y)
      }
      specCtx.stroke()

      events.forEach(ev => {
        const cx   = ev.specPos * W
        const p    = prox(ev)
        const isLk = lockedRef.current === ev
        const amp  = H * 0.72 * (isLk ? 1 : 0.50 + p * 0.38)
        const sig  = W * 0.046

        const grd = specCtx.createLinearGradient(cx, H, cx, H - amp)
        grd.addColorStop(0, hexRgba(ev.waveColor, isLk ? 0.12 : 0.05))
        grd.addColorStop(1, 'transparent')
        specCtx.fillStyle = grd
        specCtx.beginPath()
        specCtx.moveTo(cx - sig * 4, H)
        for (let x = cx - sig * 4.5; x < cx + sig * 4.5; x++) {
          const g = amp * Math.exp(-((x - cx) ** 2) / (2 * sig ** 2))
          specCtx.lineTo(x, H - g)
        }
        specCtx.lineTo(cx + sig * 4, H)
        specCtx.closePath()
        specCtx.fill()

        specCtx.beginPath()
        for (let x = Math.max(0, cx - sig * 5); x < Math.min(W, cx + sig * 5); x++) {
          const g = amp * Math.exp(-((x - cx) ** 2) / (2 * sig ** 2))
          x === Math.max(0, cx - sig * 5) ? specCtx.moveTo(x, H - g) : specCtx.lineTo(x, H - g)
        }
        specCtx.strokeStyle = hexRgba(ev.waveColor, isLk ? 1 : 0.4 + p * 0.5)
        specCtx.lineWidth   = isLk ? 2 : 1.5
        specCtx.shadowBlur  = isLk ? 10 : p * 6
        specCtx.shadowColor = ev.waveColor
        specCtx.stroke()
        specCtx.shadowBlur  = 0

        const labelY = Math.max(12, H - amp - 22)
        specCtx.font      = `${isLk ? 'bold ' : ''}8px 'Courier New'`
        specCtx.fillStyle = hexRgba(ev.waveColor, isLk ? 1 : 0.35 + p * 0.5)
        specCtx.textAlign = 'center'
        specCtx.fillText(ev.name.split(' ').map(w => w[0]).join(''), cx, labelY)
        specCtx.beginPath()
        specCtx.arc(cx, H - amp, isLk ? 4 : 2.5, 0, Math.PI * 2)
        specCtx.fillStyle = hexRgba(ev.waveColor, isLk ? 1 : 0.5 + p * 0.4)
        specCtx.fill()
      })

      const cx = S.current.cursorPos * W
      const cg = specCtx.createLinearGradient(cx, 0, cx, H)
      cg.addColorStop(0, 'rgba(160,255,160,0.6)')
      cg.addColorStop(1, 'rgba(160,255,160,0)')
      specCtx.strokeStyle = cg
      specCtx.lineWidth   = 1.5
      specCtx.shadowBlur  = 0
      specCtx.beginPath()
      specCtx.moveTo(cx, 0)
      specCtx.lineTo(cx, H)
      specCtx.stroke()
      specCtx.fillStyle = 'rgba(160,255,160,0.75)'
      specCtx.beginPath()
      specCtx.moveTo(cx, 5)
      specCtx.lineTo(cx - 4, 0)
      specCtx.lineTo(cx + 4, 0)
      specCtx.closePath()
      specCtx.fill()
    }

    // ── Dial ──────────────────────────────────────────────────────────────────
    function drawDialCanvas(
      ctx: CanvasRenderingContext2D,
      size: number,
      rotation: number,
      isGallery: boolean,
    ) {
      ctx.clearRect(0, 0, size, size)
      const cx = size / 2, cy = size / 2
      const R  = size * 0.47
      const rI = R * 0.66
      const rL = R * 0.30
      const ev = lockedRef.current

      ctx.shadowBlur  = 20
      ctx.shadowColor = 'rgba(0,0,0,0.8)'
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fillStyle = '#060e06'; ctx.fill()
      ctx.shadowBlur = 0

      const NOTCHES = 72
      for (let i = 0; i < NOTCHES; i++) {
        const angle    = ((i / NOTCHES) * 360 + rotation) * Math.PI / 180
        const isMajor  = i % 6 === 0
        const r0       = R - 1
        const r1       = isMajor ? R * 0.81 : R * 0.86
        let nc         = 'rgba(30,70,30,0.6)'

        if (isGallery && ev) {
          const n = ev.photoUrls.length
          for (let pi = 0; pi < n; pi++) {
            const targetDeg = (pi * IMG_STEP) % 360
            const notchDeg  = (i / NOTCHES) * 360
            const diff      = Math.abs(((notchDeg - targetDeg + 540) % 360) - 180)
            if (diff < 8) {
              const br = Math.max(0, 1 - diff / 8)
              nc = hexRgba(ev.typeColor, isMajor ? 0.5 + br * 0.4 : 0.3 + br * 0.4)
            }
          }
        } else {
          const notchPos = ((i / NOTCHES) - (rotation / 360) % 1 + 1) % 1
          events.forEach(e => {
            const d = Math.abs(notchPos - e.specPos)
            if (d < 0.03) {
              const br = Math.max(0, 1 - d / 0.03)
              nc = hexRgba(e.waveColor, isMajor ? 0.4 + br * 0.5 : 0.2 + br * 0.4)
            }
          })
        }

        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1)
        ctx.lineTo(cx + Math.cos(angle) * r0, cy + Math.sin(angle) * r0)
        ctx.strokeStyle = nc
        ctx.lineWidth   = isMajor ? 2 : 1
        ctx.stroke()
      }

      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.strokeStyle = '#1a3a1a'; ctx.lineWidth = 1.5; ctx.stroke()
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.79, 0, Math.PI * 2)
      ctx.strokeStyle = '#0a1a0a'; ctx.lineWidth = 1; ctx.stroke()

      const dg = ctx.createRadialGradient(cx, cy - rI * 0.2, 0, cx, cy, rI)
      dg.addColorStop(0, '#0a120a'); dg.addColorStop(1, '#050a05')
      ctx.beginPath(); ctx.arc(cx, cy, rI, 0, Math.PI * 2)
      ctx.fillStyle = dg; ctx.fill()
      ctx.strokeStyle = '#122012'; ctx.lineWidth = 1; ctx.stroke()

      ctx.font      = "7px 'Courier New'"
      ctx.textAlign = 'center'

      if (isGallery && ev) {
        ctx.fillStyle = hexRgba(ev.typeColor, 0.25)
        ctx.fillText('VISUAL ARCHIVE', cx, cy - rL - 10)

        ctx.shadowBlur  = 14
        ctx.shadowColor = ev.typeColor
        const bg = ctx.createRadialGradient(cx, cy - 4, 0, cx, cy, rL)
        bg.addColorStop(0, '#0e1a0e'); bg.addColorStop(1, '#030803')
        ctx.beginPath(); ctx.arc(cx, cy, rL, 0, Math.PI * 2)
        ctx.fillStyle = bg; ctx.fill()
        ctx.strokeStyle = ev.typeColor; ctx.lineWidth = 2; ctx.stroke()
        ctx.shadowBlur = 0

        ctx.beginPath(); ctx.arc(cx, cy, rL + 5, 0, Math.PI * 2)
        ctx.strokeStyle = hexRgba(ev.typeColor, 0.15); ctx.lineWidth = 4; ctx.stroke()

        ctx.font      = `bold ${Math.round(size * 0.055)}px 'Courier New'`
        ctx.fillStyle = ev.typeColor
        ctx.fillText('BACK', cx, cy + 5)

        const n      = ev.photoUrls.length
        const curIdx = photoIdxRef.current
        ctx.font      = `${Math.round(size * 0.032)}px 'Courier New'`
        ctx.fillStyle = hexRgba(ev.typeColor, 0.55)
        ctx.fillText(n > 0 ? `${curIdx + 1} / ${n}` : '— / —', cx, cy + rL + 14)

        if (n > 1) {
          const arcFrac = curIdx / (n - 1)
          ctx.beginPath()
          ctx.arc(cx, cy, rI + 3, -Math.PI / 2, -Math.PI / 2 + arcFrac * Math.PI * 2)
          const ag = ctx.createLinearGradient(cx - rI, cy, cx + rI, cy)
          ag.addColorStop(0, hexRgba(ev.typeColor, 0.2))
          ag.addColorStop(1, hexRgba(ev.typeColor, 0.7))
          ctx.strokeStyle = ag; ctx.lineWidth = 2.5
          ctx.shadowBlur  = 8; ctx.shadowColor = ev.typeColor
          ctx.stroke(); ctx.shadowBlur = 0
        }
      } else {
        const p         = bestProx()
        const lockReady = p > 0.75
        const lockNear  = p > 0.40
        const lockColor = lockReady ? '#40c040' : lockNear ? '#c0a020' : '#1a3a1a'

        ctx.fillStyle = '#1a3a1a'
        ctx.fillText('SSIP-DSN', cx, cy - rL - 10)

        if (lockReady)     { ctx.shadowBlur = 16; ctx.shadowColor = '#40c040' }
        else if (lockNear) { ctx.shadowBlur = 6;  ctx.shadowColor = '#c0a020' }

        const bg = ctx.createRadialGradient(cx, cy - 4, 0, cx, cy, rL)
        bg.addColorStop(0, lockReady ? '#0e200e' : '#070f07')
        bg.addColorStop(1, '#030803')
        ctx.beginPath(); ctx.arc(cx, cy, rL, 0, Math.PI * 2)
        ctx.fillStyle = bg; ctx.fill()
        ctx.strokeStyle = lockColor; ctx.lineWidth = lockReady ? 2 : 1; ctx.stroke()
        ctx.shadowBlur  = 0

        ctx.beginPath(); ctx.arc(cx, cy, rL + 5, 0, Math.PI * 2)
        ctx.strokeStyle = lockReady ? 'rgba(64,192,64,0.15)' : 'rgba(20,60,20,0.3)'
        ctx.lineWidth   = 4; ctx.stroke()

        ctx.font      = `bold ${Math.round(size * 0.055)}px 'Courier New'`
        ctx.fillStyle = lockColor
        ctx.fillText('LOCK', cx, cy + 5)
        ctx.font      = `${Math.round(size * 0.032)}px 'Courier New'`
        ctx.fillStyle = lockNear ? hexRgba(lockColor, 0.6) : '#1a2a1a'
        ctx.fillText(lockReady ? 'SIGNAL STRONG' : lockNear ? 'ACQUIRING...' : 'NO SIGNAL', cx, cy + rL + 14)

        if (p > 0.05) {
          ctx.beginPath()
          ctx.arc(cx, cy, rI + 3, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2)
          const ag = ctx.createLinearGradient(cx - rI, cy, cx + rI, cy)
          ag.addColorStop(0, hexRgba(lockColor, 0.2))
          ag.addColorStop(1, hexRgba(lockColor, 0.7))
          ctx.strokeStyle = ag; ctx.lineWidth = 2.5
          ctx.shadowBlur  = lockReady ? 8 : 4; ctx.shadowColor = lockColor
          ctx.stroke(); ctx.shadowBlur = 0
        }
      }
    }

    // ── Mini waveform ─────────────────────────────────────────────────────────
    function drawWave() {
      const ev = lockedRef.current
      if (!ev) return
      const W = waveCanvas.width, H = waveCanvas.height
      waveCtx.clearRect(0, 0, W, H)
      S.current.epWavePhase += 0.025

      waveCtx.strokeStyle = hexRgba(ev.waveColor, 0.7)
      waveCtx.lineWidth   = 1.5
      waveCtx.shadowBlur  = 5
      waveCtx.shadowColor = ev.waveColor
      waveCtx.beginPath()
      for (let x = 0; x < W; x++) {
        const t = (x / W) * Math.PI * 10 + S.current.epWavePhase
        let y = H / 2
        switch (ev.waveType) {
          case 'sharp':  y += Math.sin(t) * 12 + Math.sin(t * 3.1) * 4 + Math.sin(t * 7) * 2; break
          case 'smooth': y += Math.sin(t * 0.75) * 14 + Math.sin(t * 2.1) * 5; break
          case 'burst':  { const e2 = Math.sin(x / W * Math.PI * 5) * 0.5 + 0.5; y += Math.sin(t * 1.4) * 16 * e2 + Math.sin(t * 5) * 3; break }
          case 'dense':  y += Math.sin(t) * 9 + Math.sin(t * 2.3) * 6 + Math.sin(t * 4.7) * 3 + Math.sin(t * 9.1) * 2; break
        }
        x === 0 ? waveCtx.moveTo(x, y) : waveCtx.lineTo(x, y)
      }
      waveCtx.stroke()
      waveCtx.shadowBlur = 0
    }

    // ── HUD ───────────────────────────────────────────────────────────────────
    function updateHUD() {
      const p  = bestProx()
      const fl = freqLabel(S.current.cursorPos)

      if (ssFreqRef.current)   ssFreqRef.current.textContent   = fl
      if (dfrValueRef.current) dfrValueRef.current.textContent = fl

      const dots = dotsRef.current?.children
      if (dots) {
        const lit = Math.round(p * dots.length)
        for (let i = 0; i < dots.length; i++) {
          const d = dots[i] as HTMLElement
          const on = i < lit
          d.style.background  = on ? '#40c040' : '#1a3a1a'
          d.style.boxShadow   = on ? '0 0 4px #40c040' : 'none'
        }
      }

      const locked = !!lockedRef.current
      if (ssStatusRef.current) {
        ssStatusRef.current.textContent = locked ? 'LOCKED' : p > 0.4 ? 'ACQUIRING' : 'SCANNING'
        ssStatusRef.current.style.color = locked ? '#a0ffa0' : p > 0.4 ? '#70b070' : '#2a4a2a'
      }
      if (ssFreqRef.current)   ssFreqRef.current.style.color   = locked ? '#a0ffa0' : '#70b070'
      if (dfrValueRef.current) dfrValueRef.current.style.color = locked ? '#a0ffa0' : '#70b070'

      if (hintRef.current) {
        if (locked) {
          hintRef.current.style.opacity = '0'
        } else if (p > 0.75) {
          hintRef.current.style.opacity = '1'
          hintRef.current.textContent   = 'PRESS LOCK TO ACQUIRE SIGNAL'
        } else if (p > 0.3) {
          hintRef.current.style.opacity = '1'
          hintRef.current.textContent   = 'SIGNAL DETECTED — KEEP TUNING'
        } else {
          hintRef.current.style.opacity = '0.6'
          hintRef.current.textContent   = 'ROTATE RING TO TUNE · PRESS LOCK ON STRONG SIGNAL'
        }
      }
    }

    // ── RAF loop ──────────────────────────────────────────────────────────────
    const raf = { id: 0 }
    function loop() {
      drawSpectrum()
      drawDialCanvas(dialCtx, dialCanvas.width, S.current.dialRot, false)
      drawWave()
      if (galleryRef.current) {
        drawDialCanvas(gDialCtx, gDialCanvas.width, S.current.galleryDialRot, true)
      }
      updateHUD()
      raf.id = requestAnimationFrame(loop)
    }
    raf.id = requestAnimationFrame(loop)

    // ── Touch helpers ─────────────────────────────────────────────────────────
    function dialCenter(canvas: HTMLCanvasElement) {
      const r = canvas.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    }
    function touchAngle(t: Touch, canvas: HTMLCanvasElement) {
      const c = dialCenter(canvas)
      return Math.atan2(t.clientY - c.y, t.clientX - c.x) * 180 / Math.PI
    }
    function touchDist(t: Touch, canvas: HTMLCanvasElement) {
      const c = dialCenter(canvas)
      return Math.hypot(t.clientX - c.x, t.clientY - c.y)
    }

    // ── Tuner dial touch ──────────────────────────────────────────────────────
    let dtouch: { lastAngle: number; moved: boolean } | null = null

    const onDialStart = (e: TouchEvent) => {
      e.preventDefault()
      dtouch = { lastAngle: touchAngle(e.touches[0], dialCanvas), moved: false }
    }
    const onDialMove = (e: TouchEvent) => {
      e.preventDefault()
      if (!dtouch) return
      const t    = e.touches[0]
      const dist = touchDist(t, dialCanvas)
      const rI   = (dialCanvas.width / 2) * 0.66
      if (dist < rI * 0.85) return
      const cur   = touchAngle(t, dialCanvas)
      let delta   = cur - dtouch.lastAngle
      if (delta >  180) delta -= 360
      if (delta < -180) delta += 360
      if (Math.abs(delta) > 0.3) {
        dtouch.moved     = true
        S.current.dialRot   = S.current.dialRot + delta
        S.current.cursorPos = Math.max(0, Math.min(1, S.current.dialRot / 720))
        // release lock on drift
        if (lockedRef.current) {
          lockedRef.current = null
          actionsRef.current.clear()
        }
      }
      dtouch.lastAngle = cur
    }
    const onDialEnd = (e: TouchEvent) => {
      if (!dtouch) return
      const t    = e.changedTouches[0]
      const dist = touchDist(t, dialCanvas)
      const rL   = (dialCanvas.width / 2) * 0.30
      if (!dtouch.moved && dist < rL) {
        if (bestProx() >= 0.75) actionsRef.current.lock(nearestEvent())
      }
      dtouch = null
    }

    dialCanvas.addEventListener('touchstart', onDialStart, { passive: false })
    dialCanvas.addEventListener('touchmove',  onDialMove,  { passive: false })
    dialCanvas.addEventListener('touchend',   onDialEnd)

    // ── Gallery dial touch ────────────────────────────────────────────────────
    let gtouch: { lastAngle: number; moved: boolean } | null = null

    const onGDialStart = (e: TouchEvent) => {
      e.preventDefault()
      gtouch = { lastAngle: touchAngle(e.touches[0], gDialCanvas), moved: false }
    }
    const onGDialMove = (e: TouchEvent) => {
      e.preventDefault()
      if (!gtouch || !lockedRef.current) return
      const t    = e.touches[0]
      const dist = touchDist(t, gDialCanvas)
      const rI   = (gDialCanvas.width / 2) * 0.66
      if (dist < rI * 0.85) return
      const cur   = touchAngle(t, gDialCanvas)
      let delta   = cur - gtouch.lastAngle
      if (delta >  180) delta -= 360
      if (delta < -180) delta += 360
      if (Math.abs(delta) > 0.5) {
        gtouch.moved          = true
        S.current.galleryDialRot += delta
        const n      = lockedRef.current.photoUrls.length
        if (n > 0) {
          const newIdx = ((Math.round(S.current.galleryDialRot / IMG_STEP) % n) + n) % n
          if (newIdx !== photoIdxRef.current) actionsRef.current.stepPhoto(newIdx)
        }
      }
      gtouch.lastAngle = cur
    }
    const onGDialEnd = (e: TouchEvent) => {
      if (!gtouch) return
      const t    = e.changedTouches[0]
      const dist = touchDist(t, gDialCanvas)
      const rL   = (gDialCanvas.width / 2) * 0.30
      if (!gtouch.moved && dist < rL) actionsRef.current.closeGallery()
      gtouch = null
    }

    gDialCanvas.addEventListener('touchstart', onGDialStart, { passive: false })
    gDialCanvas.addEventListener('touchmove',  onGDialMove,  { passive: false })
    gDialCanvas.addEventListener('touchend',   onGDialEnd)

    // ── Mouse support (desktop testing) ──────────────────────────────────────
    let mdown = false, mAngle = 0, mTarget: HTMLCanvasElement | null = null

    const onMouseDown = (canvas: HTMLCanvasElement) => (e: MouseEvent) => {
      mdown   = true
      mTarget = canvas
      const r = canvas.getBoundingClientRect()
      mAngle  = Math.atan2(e.clientY - r.top - canvas.height / 2, e.clientX - r.left - canvas.width / 2) * 180 / Math.PI
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!mdown || !mTarget) return
      const r   = mTarget.getBoundingClientRect()
      const ang = Math.atan2(e.clientY - r.top - mTarget.height / 2, e.clientX - r.left - mTarget.width / 2) * 180 / Math.PI
      let delta = ang - mAngle
      if (delta >  180) delta -= 360
      if (delta < -180) delta += 360
      if (mTarget === dialCanvas) {
        S.current.dialRot    += delta
        S.current.cursorPos  = Math.max(0, Math.min(1, S.current.dialRot / 720))
        if (lockedRef.current) { lockedRef.current = null; actionsRef.current.clear() }
      } else if (mTarget === gDialCanvas && lockedRef.current) {
        S.current.galleryDialRot += delta
        const n = lockedRef.current.photoUrls.length
        if (n > 0) {
          const newIdx = ((Math.round(S.current.galleryDialRot / IMG_STEP) % n) + n) % n
          if (newIdx !== photoIdxRef.current) actionsRef.current.stepPhoto(newIdx)
        }
      }
      mAngle = ang
    }
    const onMouseUp = (canvas: HTMLCanvasElement) => (e: MouseEvent) => {
      if (mTarget !== canvas) return
      const r    = canvas.getBoundingClientRect()
      const dist = Math.hypot(e.clientX - r.left - canvas.width / 2, e.clientY - r.top - canvas.height / 2)
      const rL   = canvas.width * 0.30
      if (dist < rL) {
        if (canvas === dialCanvas && bestProx() >= 0.75) actionsRef.current.lock(nearestEvent())
        if (canvas === gDialCanvas) actionsRef.current.closeGallery()
      }
      mdown = false; mTarget = null
    }

    dialCanvas.addEventListener('mousedown', onMouseDown(dialCanvas))
    dialCanvas.addEventListener('mouseup',   onMouseUp(dialCanvas))
    gDialCanvas.addEventListener('mousedown', onMouseDown(gDialCanvas))
    gDialCanvas.addEventListener('mouseup',   onMouseUp(gDialCanvas))
    window.addEventListener('mousemove', onMouseMove)

    return () => {
      cancelAnimationFrame(raf.id)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      dialCanvas.removeEventListener('touchstart', onDialStart)
      dialCanvas.removeEventListener('touchmove',  onDialMove)
      dialCanvas.removeEventListener('touchend',   onDialEnd)
      gDialCanvas.removeEventListener('touchstart', onGDialStart)
      gDialCanvas.removeEventListener('touchmove',  onGDialMove)
      gDialCanvas.removeEventListener('touchend',   onGDialEnd)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events])

  // ── Styles ───────────────────────────────────────────────────────────────────
  const C = {
    green:    '#40c040',
    greenDim: '#1a3a1a',
    greenMid: '#2a6a2a',
    bg:       '#020408',
    surface:  '#030a03',
    border:   '#0e1e0e',
    text:     '#70b070',
    textDim:  '#2a4a2a',
  } as const

  const tc = lockedEvent?.typeColor ?? C.green

  // Photo placeholder when no images
  const photoPlaceholderBg = lockedEvent
    ? `radial-gradient(ellipse at 50% 40%, ${hexRgba(lockedEvent.typeColor, 0.10)} 0%, ${hexRgba(lockedEvent.typeColor, 0.03)} 60%, #020408 100%)`
    : '#020408'

  const hasPhotos = (lockedEvent?.photoUrls?.length ?? 0) > 0

  // ── JSX ──────────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, fontFamily: "'Courier New', monospace", overflow: 'hidden', touchAction: 'none' }}>

      {/* Scanline */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,.04) 3px, rgba(0,0,0,.04) 4px)' }} />

      {/* Lock flash */}
      <div ref={flashRef} style={{ position: 'fixed', inset: 0, background: 'rgba(64,192,64,.12)', pointerEvents: 'none', zIndex: 500, opacity: 0, transition: 'opacity .1s' }} />

      {/* ── Interface (spectrum + dial) ──────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '100%',
        display: 'flex', flexDirection: 'column',
        transform: lockedEvent ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 0.65s cubic-bezier(0.4,0,0.2,1)',
        willChange: 'transform',
      }}>
        {/* Spectrum half */}
        <div style={{ flex: '0 0 47%', display: 'flex', flexDirection: 'column', borderBottom: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden' }}>
          {/* Topbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
            <a href="/" style={{ fontSize: 11, color: C.textDim, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'system-ui,sans-serif' }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M11 7H3M7 3L3 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Catalogue
            </a>
            <span style={{ fontSize: 11, letterSpacing: '.14em', color: C.textDim }}>SIGNAL ARCHIVE</span>
            <span style={{ fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#3d8fff', background: 'rgba(61,143,255,.1)', border: '1px solid rgba(61,143,255,.2)', padding: '2px 7px', borderRadius: 2, fontFamily: 'system-ui,sans-serif' }}>Event Log</span>
          </div>
          {/* Spectrum canvas */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#020804' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(20,60,20,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(20,60,20,.2) 1px,transparent 1px)', backgroundSize: '40px 30px', pointerEvents: 'none', zIndex: 1 }} />
            <canvas ref={specRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
          </div>
          {/* Status bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 14px', background: C.surface, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div style={{ fontSize: 7, letterSpacing: '.14em', color: C.textDim }}>FREQUENCY</div>
              <div ref={ssFreqRef} style={{ fontSize: 12, color: C.text, transition: 'color .3s' }}>— GHz</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
              <div style={{ fontSize: 7, letterSpacing: '.14em', color: C.textDim }}>SIGNAL</div>
              <div ref={dotsRef} style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: C.greenDim, transition: 'background .3s' }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
              <div style={{ fontSize: 7, letterSpacing: '.14em', color: C.textDim }}>STATUS</div>
              <div ref={ssStatusRef} style={{ fontSize: 12, color: C.textDim }}>SCANNING</div>
            </div>
          </div>
        </div>

        {/* Dial half */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0 12px', background: C.bg, position: 'relative', overflow: 'hidden' }}>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 8, letterSpacing: '.18em', color: C.textDim, marginBottom: 2 }}>TUNED FREQUENCY</div>
            <div ref={dfrValueRef} style={{ fontSize: 20, letterSpacing: '.06em', color: C.text, transition: 'color .3s' }}>— GHz</div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <canvas ref={dialRef} style={{ touchAction: 'none', cursor: 'grab', display: 'block' }} />
          </div>
          <div ref={hintRef} style={{ fontSize: 9, letterSpacing: '.12em', color: C.textDim, textAlign: 'center', flexShrink: 0, transition: 'opacity .4s', opacity: 0.6 }}>
            ROTATE RING TO TUNE · PRESS LOCK ON STRONG SIGNAL
          </div>
        </div>
      </div>

      {/* ── Event detail panel ────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: '100%',
        top: lockedEvent ? '0' : '100%',
        transform: galleryOpen ? 'translateX(-100%)' : 'translateX(0)',
        background: C.bg,
        display: 'flex', flexDirection: 'column',
        transition: 'top 0.65s cubic-bezier(0.4,0,0.2,1), transform 0.55s cubic-bezier(0.4,0,0.2,1)',
        willChange: 'top, transform',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '12px 16px 10px', flexShrink: 0 }}>
          <div style={{ fontSize: 9, letterSpacing: '.2em', color: C.textDim, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{lockedEvent?.ref}</span>
            <span style={{ color: C.green, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, boxShadow: `0 0 5px ${C.green}`, display: 'inline-block' }} />
              CARRIER LOCKED
            </span>
          </div>
          <div style={{ fontSize: 9, letterSpacing: '.16em', color: lockedEvent?.typeColor ?? C.textDim, marginBottom: 6 }}>{lockedEvent?.typeLabel}</div>
          <div style={{ fontSize: 20, color: '#c0e0c0', lineHeight: 1.2, letterSpacing: '-.01em' }}>{lockedEvent?.name}</div>
        </div>

        {/* Scrollable content */}
        <div ref={epScrollRef} style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 90 }}>

          {/* Mini waveform */}
          <div style={{ margin: '0 16px', padding: '10px 0', borderBottom: `1px solid ${C.border}`, height: 54, position: 'relative', overflow: 'hidden' }}>
            <canvas ref={waveRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: C.border, borderBottom: `1px solid ${C.border}` }}>
            {[
              { v: lockedEvent?.dateDisplay ?? '—',   l: 'DATE' },
              { v: lockedEvent?.venue ?? '—',         l: 'LOCATION' },
              { v: lockedEvent ? String(lockedEvent.participants) : '—', l: 'PARTICIPANTS' },
              { v: lockedEvent?.ref.slice(0, 2) === 'HX' ? 'Hackathon'
                 : lockedEvent?.ref.slice(0, 2) === 'FS' ? 'Forum'
                 : lockedEvent?.ref.slice(0, 2) === 'CW' ? 'Workshop'
                 : lockedEvent?.ref.slice(0, 2) === 'DD' ? 'Demo Day'
                 : 'Event', l: 'TYPE' },
            ].map(s => (
              <div key={s.l} style={{ background: C.bg, padding: '14px 16px' }}>
                <div style={{ fontSize: s.v.length > 8 ? 12 : 18, color: '#80c080', marginBottom: 3, lineHeight: 1.2, wordBreak: 'break-word' }}>{s.v}</div>
                <div style={{ fontSize: 8, letterSpacing: '.14em', color: C.textDim }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Key Outcomes */}
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 8, letterSpacing: '.22em', color: C.textDim, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              KEY OUTCOMES
              <span style={{ flex: 1, height: 1, background: C.border, display: 'inline-block' }} />
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.9, color: '#4a8a4a', fontFamily: 'system-ui,sans-serif' }}>
              {lockedEvent?.outcomes || '—'}
            </div>
          </div>

          {/* Details */}
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 8, letterSpacing: '.22em', color: C.textDim, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              DETAILS
              <span style={{ flex: 1, height: 1, background: C.border, display: 'inline-block' }} />
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.9, color: '#4a8a4a', fontFamily: 'system-ui,sans-serif' }}>
              {lockedEvent?.summary
                ? lockedEvent.summary.split('\n\n').map((p, i) => <p key={i} style={{ marginTop: i > 0 ? 10 : 0 }}>{p}</p>)
                : '—'}
            </div>
          </div>

          {/* Sponsors */}
          {(lockedEvent?.sponsors?.length ?? 0) > 0 && (
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 8, letterSpacing: '.22em', color: C.textDim, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                SPONSORS
                <span style={{ flex: 1, height: 1, background: C.border, display: 'inline-block' }} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {lockedEvent!.sponsors.map(s => (
                  <span key={s} style={{ fontSize: 9, padding: '4px 10px', border: `1px solid ${C.greenMid}`, borderRadius: 2, color: C.text, letterSpacing: '.08em' }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {(lockedEvent?.tags?.length ?? 0) > 0 && (
            <div style={{ padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {lockedEvent!.tags.map(t => (
                <span key={t} style={{ fontSize: 9, padding: '4px 10px', border: `1px solid ${C.greenDim}`, borderRadius: 2, color: C.textDim, letterSpacing: '.08em' }}>{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Split nav bar */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: C.border, zIndex: 50 }}>
          <button
            onClick={() => actionsRef.current.clear()}
            style={{ fontFamily: "'Courier New',monospace", fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', padding: '14px 8px', border: 'none', background: C.bg, color: lockedEvent ? C.green : C.textDim, cursor: lockedEvent ? 'pointer' : 'default', opacity: lockedEvent ? 1 : 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            &#8592; CLEAR FREQUENCY
          </button>
          <button
            onClick={() => lockedEvent && actionsRef.current.openGallery()}
            style={{ fontFamily: "'Courier New',monospace", fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', padding: '14px 8px', border: 'none', background: C.bg, color: lockedEvent ? C.green : C.textDim, cursor: lockedEvent ? 'pointer' : 'default', opacity: lockedEvent ? 1 : 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            VISUALS &#8594;
          </button>
        </div>
      </div>

      {/* ── Gallery panel ──────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '100%',
        background: C.bg,
        display: 'flex', flexDirection: 'column',
        transform: galleryOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
        willChange: 'transform',
        overflow: 'hidden',
      }}>
        {/* Gallery topbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 9, letterSpacing: '.2em', color: C.textDim }}>{lockedEvent?.ref}</div>
            <div style={{ fontSize: 11, letterSpacing: '.14em', color: C.text }}>VISUAL ARCHIVE</div>
          </div>
          <div onClick={() => actionsRef.current.closeGallery()} style={{ fontSize: 10, color: C.textDim, cursor: 'pointer', letterSpacing: '.1em', fontFamily: 'system-ui,sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M11 7H3M7 3L3 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            event detail
          </div>
        </div>

        {/* Image area */}
        <div style={{ flex: '0 0 52%', position: 'relative', overflow: 'hidden', background: '#020604' }}>
          {hasPhotos ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={currentPhotoIdx}
                src={lockedEvent!.photoUrls[currentPhotoIdx]}
                alt={`${lockedEvent!.name} — photo ${currentPhotoIdx + 1}`}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 45%,rgba(2,4,8,.9) 100%)', zIndex: 1 }} />
              <div style={{ position: 'absolute', top: 10, right: 12, fontSize: 9, letterSpacing: '.2em', color: hexRgba(tc, 0.6), zIndex: 2 }}>
                {currentPhotoIdx + 1} / {lockedEvent!.photoUrls.length}
              </div>
            </>
          ) : (
            /* Placeholder when no photos */
            <div style={{ position: 'absolute', inset: 0, background: photoPlaceholderBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect x="3" y="10" width="34" height="24" rx="3" stroke={hexRgba(tc, 0.3)} strokeWidth="1.5" />
                <circle cx="20" cy="22" r="7" stroke={hexRgba(tc, 0.3)} strokeWidth="1.5" />
                <circle cx="20" cy="22" r="3" fill={hexRgba(tc, 0.15)} />
                <path d="M14 10L16 6h8l2 4" stroke={hexRgba(tc, 0.3)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ fontSize: 9, letterSpacing: '.22em', color: hexRgba(tc, 0.35) }}>VISUAL ARCHIVE</div>
              <div style={{ fontSize: 8, letterSpacing: '.18em', color: hexRgba(tc, 0.2) }}>PHOTOS PENDING</div>
            </div>
          )}
          {/* Scanline on image */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.06) 3px,rgba(0,0,0,.06) 4px)', pointerEvents: 'none' }} />
        </div>

        {/* Gallery dial */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0 14px', background: C.bg }}>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 8, letterSpacing: '.18em', color: C.textDim, marginBottom: 2 }}>VISUAL CHANNEL</div>
            <div ref={galleryReadRef} style={{ fontSize: 16, letterSpacing: '.06em', color: C.text }}>
              {hasPhotos ? `1 / ${lockedEvent?.photoUrls.length}` : '— / —'}
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <canvas ref={gDialRef} style={{ touchAction: 'none', cursor: 'grab', display: 'block' }} />
          </div>
          <div style={{ fontSize: 9, letterSpacing: '.12em', color: C.textDim, textAlign: 'center', flexShrink: 0 }}>
            {hasPhotos ? 'ROTATE TO NAVIGATE · PRESS CENTER TO RETURN' : 'PRESS CENTER TO RETURN TO EVENT'}
          </div>
        </div>
      </div>

    </div>
  )
}
