'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'

const PLANETS = [
  {
    slug: '/palabras',
    color: 0x2255cc,
    emissive: 0x0a1a60,
    roughness: 0.35,
    metalness: 0.05,
    radius: 0.75,
    orbitRadius: 8.5,
    orbitSpeed: 0.00038,
    startAngle: 0.0,
    rings: false,
    orbitIncl: 0.08,  // ~4.6°
    orbitNode: 0.0,
  },
  {
    slug: '/event_log',
    color: 0xb03318,
    emissive: 0x4a0e00,
    roughness: 0.82,
    metalness: 0.0,
    radius: 0.45,  // Orange Saturn - smaller size
    orbitRadius: 12.8,
    orbitSpeed: 0.00019,
    startAngle: 3.14,
    rings: true,
    orbitIncl: 0.25,  // ~14.3°
    orbitNode: 2.1,
  },
  {
    slug: '/afkkwpd',
    color: 0x148c54,
    emissive: 0x043318,
    roughness: 0.55,
    metalness: 0.05,
    radius: 0.65,
    orbitRadius: 15.2,
    orbitSpeed: 0.00013,
    startAngle: 1.57,
    rings: false,
    orbitIncl: -0.15, // ~-8.6° (slight opposite dip)
    orbitNode: 4.2,
  },
  {
    slug: '/dev_branch',
    color: 0xa87820,
    emissive: 0x3d2400,
    roughness: 0.62,
    metalness: 0.15,
    radius: 0.92,
    orbitRadius: 19.5,
    orbitSpeed: 0.000085,
    startAngle: 4.71,
    rings: false,
    orbitIncl: 0.18,  // ~10.3°
    orbitNode: 5.5,
  },
]

function buildAstronaut(): THREE.Group {
  const suit = new THREE.MeshPhongMaterial({
    color: 0xdde8f5,
    specular: 0x334455,
    shininess: 70,
  })
  const visorMat = new THREE.MeshPhongMaterial({
    color: 0x5599dd,
    transparent: true,
    opacity: 0.8,
    shininess: 250,
  })
  const bootMat = new THREE.MeshPhongMaterial({ color: 0xaabbcc, shininess: 40 })

  const g = new THREE.Group()

  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 16), suit)
  helm.position.y = 1.18

  const vis = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 16), visorMat)
  vis.position.set(0.05, 1.2, 0.34)

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.21, 0.14, 10), suit)
  neck.position.y = 0.6

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.41, 0.72, 4, 10), suit)
  torso.position.y = 0.1

  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.18), suit)
  pack.position.set(0, 0.1, -0.46)

  const lArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.52, 4, 8), suit)
  lArm.position.set(-0.6, 0.14, 0.04)
  lArm.rotation.z = 0.58

  const rArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.52, 4, 8), suit)
  rArm.position.set(0.6, 0.2, -0.06)
  rArm.rotation.z = -0.42

  const lGlove = new THREE.Mesh(new THREE.SphereGeometry(0.135, 10, 8), bootMat)
  lGlove.position.set(-0.88, -0.12, 0.1)

  const rGlove = new THREE.Mesh(new THREE.SphereGeometry(0.135, 10, 8), bootMat)
  rGlove.position.set(0.84, -0.06, -0.16)

  const lLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.145, 0.6, 4, 8), suit)
  lLeg.position.set(-0.21, -1.06, 0)
  lLeg.rotation.z = 0.1

  const rLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.145, 0.6, 4, 8), suit)
  rLeg.position.set(0.21, -1.06, 0.05)
  rLeg.rotation.z = -0.12

  const lBoot = new THREE.Mesh(new THREE.CapsuleGeometry(0.155, 0.22, 4, 8), bootMat)
  lBoot.position.set(-0.22, -1.62, 0.05)

  const rBoot = new THREE.Mesh(new THREE.CapsuleGeometry(0.155, 0.22, 4, 8), bootMat)
  rBoot.position.set(0.22, -1.62, 0.07)

  g.add(helm, vis, neck, torso, pack, lArm, rArm, lGlove, rGlove, lLeg, rLeg, lBoot, rBoot)
  return g
}

function buildSatellite(): THREE.Group {
  const g = new THREE.Group()

  // Main body - cylindrical
  const bodyMat = new THREE.MeshPhongMaterial({
    color: 0xcccccc,
    specular: 0x444444,
    shininess: 60,
  })
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.4, 8), bodyMat)
  body.rotation.z = Math.PI / 2

  // Solar panels
  const panelMat = new THREE.MeshPhongMaterial({
    color: 0x1a3d5c,
    specular: 0x6699cc,
    shininess: 100,
    emissive: 0x0a1a2d,
  })

  const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.4), panelMat)
  leftPanel.position.x = -0.35

  const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.4), panelMat)
  rightPanel.position.x = 0.35

  // Antenna
  const antennaMat = new THREE.MeshPhongMaterial({ color: 0x888888, shininess: 80 })
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6), antennaMat)
  antenna.position.set(0, 0.35, 0)

  g.add(body, leftPanel, rightPanel, antenna)
  return g
}

export default function SpaceScene() {
  const mountRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const w = mount.clientWidth
    const h = mount.clientHeight

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h)
    renderer.setClearColor(0x00000a)
    mount.appendChild(renderer.domElement)

    // Label renderer for planet names
    const labelRenderer = new CSS2DRenderer()
    labelRenderer.setSize(w, h)
    labelRenderer.domElement.style.position = 'absolute'
    labelRenderer.domElement.style.top = '0'
    labelRenderer.domElement.style.pointerEvents = 'none'
    mount.appendChild(labelRenderer.domElement)

    // Scene + Camera
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(58, w / h, 0.1, 1000)
    camera.position.set(0, 1.5, 24)
    camera.lookAt(0, 0, 0)

    // Lights
    scene.add(new THREE.AmbientLight(0x101525, 0.9))
    const sun = new THREE.DirectionalLight(0xfff8f0, 1.6)
    sun.position.set(12, 18, 8)
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0x2244aa, 0.35)
    fill.position.set(-10, -5, 15)
    scene.add(fill)

    // --- Starfield ---
    function makeStars(
      count: number,
      spread: number,
      size: number,
      color: number,
      opacity: number
    ) {
      const geo = new THREE.BufferGeometry()
      const pos = new Float32Array(count * 3)
      for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * spread
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      return new THREE.Points(
        geo,
        new THREE.PointsMaterial({
          size,
          color,
          transparent: true,
          opacity,
          sizeAttenuation: true,
        })
      )
    }

    const starField = makeStars(8000, 500, 0.22, 0xffffff, 0.72)
    const brightStars = makeStars(280, 500, 0.32, 0xbbddff, 0.88)
    scene.add(starField, brightStars)

    // Nebula background blobs
    function makeNebula(count: number, color: number, spread: number) {
      const geo = new THREE.BufferGeometry()
      const pos = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * spread
        pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.4
        pos[i * 3 + 2] = -160 + (Math.random() - 0.5) * 60
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      return new THREE.Points(
        geo,
        new THREE.PointsMaterial({
          size: 3.5,
          color,
          transparent: true,
          opacity: 0.12,
          sizeAttenuation: false,
        })
      )
    }

    scene.add(makeNebula(1000, 0x2244bb, 200))
    scene.add(makeNebula(600, 0x882299, 150))
    scene.add(makeNebula(400, 0x114422, 120))

    // --- Astronaut ---
    const astronaut = buildAstronaut()
    astronaut.position.set(0, 0, 0)
    astronaut.userData = { slug: 'https://ssip-pl.ch/', isAstronaut: true }
    scene.add(astronaut)

    // --- Satellite ---
    const satellite = buildSatellite()
    satellite.scale.setScalar(1.2)
    scene.add(satellite)
    const satelliteOrbitRadius = 5.5
    const satelliteOrbitSpeed = 0.00065
    let satelliteAngle = 0.8

    // --- Planets ---
    const planetMeshes: THREE.Mesh[] = []
    const angles = PLANETS.map((p) => p.startAngle)

    PLANETS.forEach((p, i) => {
      const mat = new THREE.MeshStandardMaterial({
        color: p.color,
        emissive: p.emissive,
        emissiveIntensity: 0.55,
        roughness: p.roughness,
        metalness: p.metalness,
      })
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.radius, 36, 36), mat)
      mesh.userData = { slug: p.slug, index: i }

      if (p.rings) {
        const ringGeo = new THREE.RingGeometry(p.radius * 1.35, p.radius * 1.9, 56)
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x8b4422,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.38,
        })
        const ring = new THREE.Mesh(ringGeo, ringMat)
        ring.rotation.x = 1.1
        mesh.add(ring)
      }

      // Create label for this planet
      const labelDiv = document.createElement('div')
      labelDiv.textContent = p.slug.replace('/', '')
      labelDiv.style.color = 'rgba(255, 255, 255, 0.9)'
      labelDiv.style.fontFamily = "'Courier New', monospace"
      labelDiv.style.fontSize = '14px'
      labelDiv.style.padding = '4px 8px'
      labelDiv.style.background = 'rgba(0, 0, 0, 0.6)'
      labelDiv.style.borderRadius = '4px'
      labelDiv.style.border = '1px solid rgba(255, 255, 255, 0.3)'
      labelDiv.style.visibility = 'hidden'
      const label = new CSS2DObject(labelDiv)
      label.position.set(0, -p.radius - 0.8, 0)
      mesh.add(label)
      mesh.userData.label = labelDiv

      scene.add(mesh)
      planetMeshes.push(mesh)
    })

    // Faint orbit rings — each oriented to match its planet's orbit plane
    PLANETS.forEach((p) => {
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(p.orbitRadius, 0.012, 4, 180),
        new THREE.MeshBasicMaterial({ color: 0x223344, transparent: true, opacity: 0.2 })
      )
      // Compute orbit plane normal: R_Y(node) * R_X(incl) * Y_hat
      const n = new THREE.Vector3(0, 1, 0)
      n.applyAxisAngle(new THREE.Vector3(1, 0, 0), p.orbitIncl)
      n.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.orbitNode)
      // Torus default lies in XY plane, normal = Z. Rotate Z → n.
      torus.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n)
      scene.add(torus)
    })

    // --- Raycaster ---
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2(-2, -2)
    let hovered: THREE.Object3D | null = null

    function onMouseMove(e: MouseEvent) {
      const rect = mount!.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }

    function onClick() {
      if (hovered) {
        const url = hovered.userData.slug as string
        if (url.startsWith('http')) {
          window.location.href = url
        } else {
          router.push(url)
        }
      }
    }

    mount.addEventListener('mousemove', onMouseMove)
    mount.addEventListener('click', onClick)

    // --- Animation loop ---
    let animId: number
    const clock = new THREE.Clock()

    function animate() {
      animId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      // Astronaut full 3D tumble — steady rotation on all axes simulates zero-g drift
      astronaut.rotation.y = t * 0.12
      astronaut.rotation.x = t * 0.05
      astronaut.rotation.z = t * 0.035
      astronaut.position.y = Math.sin(t * 0.28) * 0.28

      // Satellite orbit — fast, close orbit
      satelliteAngle += satelliteOrbitSpeed
      satellite.position.x = Math.cos(satelliteAngle) * satelliteOrbitRadius
      satellite.position.z = Math.sin(satelliteAngle) * satelliteOrbitRadius - 2
      satellite.position.y = Math.sin(satelliteAngle * 2.3) * 0.6
      satellite.rotation.y = t * 0.3
      satellite.rotation.z = Math.sin(t * 0.4) * 0.15

      // Planet orbits — each in its own inclined plane
      PLANETS.forEach((p, i) => {
        angles[i] += p.orbitSpeed
        const a = angles[i]
        const incl = p.orbitIncl
        const node = p.orbitNode
        // Start in XZ plane
        const xOrb = Math.cos(a) * p.orbitRadius
        const zOrb = Math.sin(a) * p.orbitRadius
        // Apply inclination around X axis
        const yInc = -zOrb * Math.sin(incl)
        const zInc = zOrb * Math.cos(incl)
        // Apply ascending node rotation around Y axis
        planetMeshes[i].position.x = xOrb * Math.cos(node) + zInc * Math.sin(node)
        planetMeshes[i].position.y = yInc
        planetMeshes[i].position.z = -xOrb * Math.sin(node) + zInc * Math.cos(node) - 2
        planetMeshes[i].rotation.y += 0.004
      })

      // Slow starfield drift
      starField.rotation.y = t * 0.003
      brightStars.rotation.y = t * 0.002

      // Raycasting
      raycaster.setFromCamera(mouse, camera)
      const clickableObjects = [...planetMeshes, ...astronaut.children]
      const hits = raycaster.intersectObjects(clickableObjects, false)

      planetMeshes.forEach((m) => {
        ;(m.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.55
        if (m.userData.label) {
          m.userData.label.style.visibility = 'hidden'
        }
      })

      hovered = null
      if (hits.length > 0) {
        const hit = hits[0].object
        // Check if it's a planet
        if (planetMeshes.includes(hit as THREE.Mesh)) {
          ;((hit as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity = 2.0
          hovered = hit
          // Show label for hovered planet
          if ((hit as THREE.Mesh).userData.label) {
            ;(hit as THREE.Mesh).userData.label.style.visibility = 'visible'
          }
        } else {
          // It's part of the astronaut
          hovered = astronaut
        }
        renderer.domElement.style.cursor = 'pointer'
      } else {
        renderer.domElement.style.cursor = 'default'
      }

      renderer.render(scene, camera)
      labelRenderer.render(scene, camera)
    }

    animate()

    // Resize
    function onResize() {
      const nw = mount!.clientWidth
      const nh = mount!.clientHeight
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
      labelRenderer.setSize(nw, nh)
    }

    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      mount.removeEventListener('mousemove', onMouseMove)
      mount.removeEventListener('click', onClick)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
      if (mount.contains(labelRenderer.domElement)) {
        mount.removeChild(labelRenderer.domElement)
      }
    }
  }, [router])

  return <div ref={mountRef} style={{ position: 'fixed', inset: 0 }} />
}
