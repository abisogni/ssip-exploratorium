'use client'

import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { IcePhase, PhaseId } from './phaseData'

// ── Lattice geometry helpers ──────────────────────────────────────────────────
// Returns a list of [x,y,z] oxygen positions (unit scale) for a given lattice
// type. We render a 2×2×2 supercell.

type Vec3 = [number, number, number]

function hexagonalLattice(s: number): Vec3[] {
  const pts: Vec3[] = []
  const a = s, c = s * 1.628
  const layers = [-c / 2, c / 2]
  for (const z of layers) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const x = i * a + j * a * 0.5
        const y = j * a * Math.sqrt(3) / 2
        pts.push([x, y, z])
      }
    }
  }
  return pts
}

function cubicBCCLattice(s: number): Vec3[] {
  const pts: Vec3[] = []
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++)
      for (let k = -1; k <= 1; k++) {
        pts.push([i * s, j * s, k * s])
        pts.push([(i + 0.5) * s, (j + 0.5) * s, (k + 0.5) * s])
      }
  return pts
}

function cubicFCCLattice(s: number): Vec3[] {
  const pts: Vec3[] = []
  const a = s
  const bases: Vec3[] = [[0,0,0],[a/2,a/2,0],[a/2,0,a/2],[0,a/2,a/2]]
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++)
      for (let k = -1; k <= 1; k++)
        for (const b of bases)
          pts.push([b[0]+i*a, b[1]+j*a, b[2]+k*a])
  return pts
}

function randomPositions(count: number, spread: number): Vec3[] {
  const pts: Vec3[] = []
  for (let i = 0; i < count; i++)
    pts.push([
      (Math.random() - 0.5) * spread * 2,
      (Math.random() - 0.5) * spread * 2,
      (Math.random() - 0.5) * spread * 2,
    ])
  return pts
}

function getLatticePositions(phase: IcePhase): Vec3[] {
  const s = phase.latticeSpacing * 2.4
  switch (phase.latticeType) {
    case 'hexagonal':   return hexagonalLattice(s)
    case 'cubic-bcc':   return cubicBCCLattice(s)
    case 'cubic-fcc':   return cubicFCCLattice(s)
    default:            return randomPositions(18, s * 1.6)
  }
}

// Place H atoms: for each O pair closer than bondThreshold, put an H between them
function computeHPositions(oPositions: Vec3[], phase: IcePhase): Vec3[] {
  if (phase.hydrogenMobile) return [] // rendered separately as particles
  const threshold = phase.latticeSpacing * 3.2
  const hPos: Vec3[] = []
  const added = new Set<string>()
  for (let i = 0; i < oPositions.length; i++) {
    for (let j = i + 1; j < oPositions.length; j++) {
      const a = oPositions[i], b = oPositions[j]
      const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2]
      const d = Math.sqrt(dx*dx+dy*dy+dz*dz)
      if (d < threshold) {
        const key = `${i}-${j}`
        if (added.has(key)) continue
        added.add(key)
        // Ice X: H exactly at midpoint; otherwise offset toward one O
        const t = phase.id === 'ice-x' ? 0.5 : (Math.random() < 0.5 ? 0.35 : 0.65)
        hPos.push([a[0]+dx*t, a[1]+dy*t, a[2]+dz*t])
      }
    }
  }
  return hPos
}

// ── Sim component ─────────────────────────────────────────────────────────────

interface Props {
  phase: IcePhase
  phaseId: PhaseId
  transitioning: boolean
}

export default function IcePhaseSim({ phase, transitioning }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    raf: number
    // mobile H particles
    hParticles: { pos: THREE.Vector3; vel: THREE.Vector3 }[]
    hMesh: THREE.InstancedMesh | null
    // lattice bond lines
    bondLines: THREE.LineSegments | null
  } | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    mount.appendChild(renderer.domElement)

    // ── Scene ──
    const scene = new THREE.Scene()

    // ── Camera ──
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200)
    camera.position.set(0, 0, 22)

    // ── Lights ──
    const ambient = new THREE.AmbientLight('#ffffff', 0.6)
    scene.add(ambient)
    const key = new THREE.PointLight(phase.glowColor, 80, 60)
    key.position.set(8, 8, 12)
    scene.add(key)
    const fill = new THREE.PointLight('#3366aa', 20, 40)
    fill.position.set(-8, -4, 6)
    scene.add(fill)

    // ── Oxygen spheres ──
    const oPositions = getLatticePositions(phase)
    const oGeo = new THREE.SphereGeometry(0.55, 20, 20)
    const oMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(phase.color),
      metalness: 0.1,
      roughness: 0.35,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transmission: 0.25,
      thickness: 1.0,
    })
    const oMesh = new THREE.InstancedMesh(oGeo, oMat, oPositions.length)
    const oColors: THREE.Color[] = oPositions.map((_, i) => new THREE.Color(
      i === 0 ? phase.glowColor : phase.color
    ))
    const dummy = new THREE.Object3D()
    oPositions.forEach((p, i) => {
      dummy.position.set(p[0], p[1], p[2])
      dummy.updateMatrix()
      oMesh.setMatrixAt(i, dummy.matrix)
      oMesh.setColorAt(i, oColors[i])
    })
    oMesh.instanceMatrix.needsUpdate = true
    if (oMesh.instanceColor) oMesh.instanceColor.needsUpdate = true
    scene.add(oMesh)

    // ── H atoms (fixed positions) ──
    const hPositions = computeHPositions(oPositions, phase)
    let hMesh: THREE.InstancedMesh | null = null
    if (hPositions.length > 0 && !phase.hydrogenMobile) {
      const hGeo = new THREE.SphereGeometry(0.22, 12, 12)
      const hMat = new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0.0,
        roughness: 0.4,
        clearcoat: 0.8,
      })
      hMesh = new THREE.InstancedMesh(hGeo, hMat, hPositions.length)
      hPositions.forEach((p, i) => {
        dummy.position.set(p[0], p[1], p[2])
        dummy.updateMatrix()
        hMesh!.setMatrixAt(i, dummy.matrix)
        hMesh!.setColorAt!(i, new THREE.Color('#eef8ff'))
      })
      hMesh.instanceMatrix.needsUpdate = true
      scene.add(hMesh)
    }

    // ── Mobile H particles (superionic) ──
    const hParticles: { pos: THREE.Vector3; vel: THREE.Vector3 }[] = []
    let hMobileMesh: THREE.InstancedMesh | null = null
    if (phase.hydrogenMobile) {
      const count = 32
      const hGeo = new THREE.SphereGeometry(0.18, 8, 8)
      const hMat = new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        emissive: new THREE.Color(phase.glowColor),
        emissiveIntensity: 1.2,
        roughness: 0.2,
      })
      hMobileMesh = new THREE.InstancedMesh(hGeo, hMat, count)
      for (let i = 0; i < count; i++) {
        hParticles.push({
          pos: new THREE.Vector3(
            (Math.random()-0.5)*12, (Math.random()-0.5)*12, (Math.random()-0.5)*6
          ),
          vel: new THREE.Vector3(
            (Math.random()-0.5)*0.12, (Math.random()-0.5)*0.12, (Math.random()-0.5)*0.06
          ),
        })
        hMobileMesh.setColorAt!(i, new THREE.Color('#ddeeff'))
      }
      hMobileMesh.instanceColor!.needsUpdate = true
      scene.add(hMobileMesh)
      hMesh = hMobileMesh
    }

    // ── Bond lines ──
    const bondThreshold = phase.latticeSpacing * 3.2
    const lineVerts: number[] = []
    if (!phase.hydrogenMobile && phase.oxygenFixed) {
      for (let i = 0; i < oPositions.length; i++) {
        for (let j = i+1; j < oPositions.length; j++) {
          const a = oPositions[i], b = oPositions[j]
          const d = Math.sqrt((b[0]-a[0])**2+(b[1]-a[1])**2+(b[2]-a[2])**2)
          if (d < bondThreshold) {
            lineVerts.push(a[0],a[1],a[2], b[0],b[1],b[2])
          }
        }
      }
    }
    let bondLines: THREE.LineSegments | null = null
    if (lineVerts.length > 0) {
      const lGeo = new THREE.BufferGeometry()
      lGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineVerts, 3))
      const lMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(phase.glowColor),
        opacity: 0.22,
        transparent: true,
      })
      bondLines = new THREE.LineSegments(lGeo, lMat)
      scene.add(bondLines)
    }

    // ── Resize ──
    const resize = () => {
      const w = mount.offsetWidth, h = mount.offsetHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(mount)
    resize()

    // ── Animation ──
    let t = 0
    function animate() {
      t += 0.005
      // Slow rotation of the whole scene
      oMesh.rotation.y = t * 0.3
      oMesh.rotation.x = Math.sin(t * 0.15) * 0.12
      if (bondLines) {
        bondLines.rotation.y = t * 0.3
        bondLines.rotation.x = Math.sin(t * 0.15) * 0.12
      }
      if (hMesh && !phase.hydrogenMobile) {
        hMesh.rotation.y = t * 0.3
        hMesh.rotation.x = Math.sin(t * 0.15) * 0.12
      }

      // Mobile H particles (superionic)
      if (phase.hydrogenMobile && hMobileMesh) {
        hMobileMesh.rotation.y = t * 0.3
        hMobileMesh.rotation.x = Math.sin(t * 0.15) * 0.12
        hParticles.forEach((p, i) => {
          p.pos.add(p.vel)
          // Bounce inside box
          const bound = 6
          if (Math.abs(p.pos.x) > bound) { p.vel.x *= -1; p.pos.x = Math.sign(p.pos.x) * bound }
          if (Math.abs(p.pos.y) > bound) { p.vel.y *= -1; p.pos.y = Math.sign(p.pos.y) * bound }
          if (Math.abs(p.pos.z) > 3) { p.vel.z *= -1; p.pos.z = Math.sign(p.pos.z) * 3 }
          dummy.position.copy(p.pos)
          dummy.updateMatrix()
          hMobileMesh!.setMatrixAt(i, dummy.matrix)
        })
        hMobileMesh.instanceMatrix.needsUpdate = true
      }

      // Oxygen pulsing glow (superionic only)
      if (phase.oxygenFixed && phase.hydrogenMobile) {
        const pulse = 0.9 + Math.sin(t * 2.1) * 0.12
        ;(oMat as THREE.MeshPhysicalMaterial).emissiveIntensity = pulse
        ;(oMat as any).emissive = new THREE.Color(phase.glowColor)
      }

      key.position.set(8 * Math.cos(t * 0.4), 6, 12)
      renderer.render(scene, camera)
      stateRef.current!.raf = requestAnimationFrame(animate)
    }
    animate()

    stateRef.current = { renderer, scene, camera, raf: 0, hParticles, hMesh: hMobileMesh, bondLines }

    return () => {
      if (stateRef.current) cancelAnimationFrame(stateRef.current.raf)
      ro.disconnect()
      renderer.dispose()
      oGeo.dispose(); oMat.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  // Re-run when phase changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.id])

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        opacity: transitioning ? 0.4 : 1,
        transition: 'opacity 0.6s ease',
      }}
    />
  )
}
