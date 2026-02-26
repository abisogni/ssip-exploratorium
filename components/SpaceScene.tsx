'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'

const PLANETS = [
  {
    slug: '/palabras',
    color: 0x1a3d8b,
    emissive: 0x050e2a,
    roughness: 0.35,
    metalness: 0.05,
    radius: 0.75,
    orbitRadius: 7.5,
    orbitSpeed: 0.00032,
    startAngle: 1.2,
    rings: false,
  },
  {
    slug: '/event_log',
    color: 0x8b2c14,
    emissive: 0x2a0800,
    roughness: 0.82,
    metalness: 0.0,
    radius: 0.92,
    orbitRadius: 11.2,
    orbitSpeed: 0.00022,
    startAngle: 2.8,
    rings: true,
  },
  {
    slug: '/afkkwpd',
    color: 0x0e5c3e,
    emissive: 0x021a0f,
    roughness: 0.55,
    metalness: 0.05,
    radius: 0.65,
    orbitRadius: 14.8,
    orbitSpeed: 0.00016,
    startAngle: 0.5,
    rings: false,
  },
  {
    slug: '/dev_branch',
    color: 0x7a5c14,
    emissive: 0x221800,
    roughness: 0.62,
    metalness: 0.15,
    radius: 0.82,
    orbitRadius: 18.8,
    orbitSpeed: 0.0001,
    startAngle: 4.2,
    rings: false,
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
    const brightStars = makeStars(280, 500, 0.6, 0xbbddff, 0.88)
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
    scene.add(astronaut)

    // --- Planets ---
    const planetMeshes: THREE.Mesh[] = []
    const angles = PLANETS.map((p) => p.startAngle)

    PLANETS.forEach((p, i) => {
      const mat = new THREE.MeshStandardMaterial({
        color: p.color,
        emissive: p.emissive,
        emissiveIntensity: 0.25,
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

      scene.add(mesh)
      planetMeshes.push(mesh)
    })

    // Faint orbit rings
    PLANETS.forEach((p) => {
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(p.orbitRadius, 0.012, 4, 180),
        new THREE.MeshBasicMaterial({ color: 0x223344, transparent: true, opacity: 0.2 })
      )
      torus.rotation.x = Math.PI / 2
      scene.add(torus)
    })

    // --- Raycaster ---
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2(-2, -2)
    let hovered: THREE.Mesh | null = null

    function onMouseMove(e: MouseEvent) {
      const rect = mount!.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }

    function onClick() {
      if (hovered) router.push(hovered.userData.slug as string)
    }

    mount.addEventListener('mousemove', onMouseMove)
    mount.addEventListener('click', onClick)

    // --- Animation loop ---
    let animId: number
    const clock = new THREE.Clock()

    function animate() {
      animId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      // Astronaut slow spin + gentle drift
      astronaut.rotation.y = t * 0.12
      astronaut.rotation.x = Math.sin(t * 0.08) * 0.04
      astronaut.position.y = Math.sin(t * 0.28) * 0.28

      // Planet orbits
      PLANETS.forEach((p, i) => {
        angles[i] += p.orbitSpeed
        const a = angles[i]
        const tilt = 0.18
        planetMeshes[i].position.x = Math.cos(a) * p.orbitRadius
        planetMeshes[i].position.z = Math.sin(a) * p.orbitRadius * Math.cos(tilt) - 2
        planetMeshes[i].position.y = Math.sin(a) * p.orbitRadius * Math.sin(tilt) * 0.55
        planetMeshes[i].rotation.y += 0.004
      })

      // Slow starfield drift
      starField.rotation.y = t * 0.003
      brightStars.rotation.y = t * 0.002

      // Raycasting
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(planetMeshes)

      planetMeshes.forEach((m) => {
        ;(m.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.25
      })

      hovered = null
      if (hits.length > 0) {
        const hit = hits[0].object as THREE.Mesh
        ;(hit.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.4
        hovered = hit
        renderer.domElement.style.cursor = 'pointer'
      } else {
        renderer.domElement.style.cursor = 'default'
      }

      renderer.render(scene, camera)
    }

    animate()

    // Resize
    function onResize() {
      const nw = mount!.clientWidth
      const nh = mount!.clientHeight
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
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
    }
  }, [router])

  return <div ref={mountRef} style={{ position: 'fixed', inset: 0 }} />
}
