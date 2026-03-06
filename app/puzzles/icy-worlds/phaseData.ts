// ── Ice Phase Science Data ────────────────────────────────────────────────────
// Phase boundary coordinates from published literature (Prompt 1 response).
// Pressure in GPa (log scale recommended), Temperature in Kelvin.

export type PhaseId =
  | 'liquid'
  | 'vapor'
  | 'ice-ih'
  | 'ice-iii'
  | 'ice-v'
  | 'ice-vi'
  | 'ice-vii'
  | 'ice-x'
  | 'superionic-bcc'
  | 'superionic-fcc'

export interface IcePhase {
  id: PhaseId
  label: string
  sublabel?: string
  // Center point for diagram label (log10(P_GPa), T_K)
  labelLogP: number
  labelT: number
  // Visual properties for the simulation
  color: string          // primary sphere/atom color
  glowColor: string      // emission / glow
  background: string     // scene background tint
  oxygenFixed: boolean   // oxygens locked to lattice
  hydrogenMobile: boolean // protons diffuse freely
  latticeType: 'none' | 'hexagonal' | 'tetragonal' | 'cubic-bcc' | 'cubic-fcc'
  latticeSpacing: number // relative O-O spacing for rendering (normalised, Ih=1.0)
  // Discovery moment text (from Prompt 3 response)
  discoveryTitle: string
  discoveryBody: string
  discoveryFact: string
}

export const PHASES: Record<PhaseId, IcePhase> = {
  vapor: {
    id: 'vapor',
    label: 'Vapor',
    labelLogP: -3.3,
    labelT: 400,
    color: '#aaddff',
    glowColor: '#88ccee',
    background: 'rgba(5,10,30,1)',
    oxygenFixed: false,
    hydrogenMobile: true,
    latticeType: 'none',
    latticeSpacing: 3.0,
    discoveryTitle: 'Water Vapor',
    discoveryBody: 'At low pressure and high temperature, water molecules fly freely through space, rarely colliding.',
    discoveryFact: 'Even at sea level, about 1% of the atmosphere is water vapor — invisible, but always present.',
  },
  liquid: {
    id: 'liquid',
    label: 'Liquid',
    labelLogP: -1.3,
    labelT: 350,
    color: '#4488ff',
    glowColor: '#2266dd',
    background: 'rgba(5,8,28,1)',
    oxygenFixed: false,
    hydrogenMobile: true,
    latticeType: 'none',
    latticeSpacing: 1.5,
    discoveryTitle: 'Liquid Water',
    discoveryBody: 'Molecules tumble past each other freely, held loosely by hydrogen bonds that constantly break and reform.',
    discoveryFact: 'Liquid water is denser than ice Ih — one of the very few substances where the solid floats on its own liquid.',
  },
  'ice-ih': {
    id: 'ice-ih',
    label: 'Ice Ih',
    sublabel: 'hexagonal',
    labelLogP: -1.3,
    labelT: 240,
    color: '#c8e8ff',
    glowColor: '#90c8f0',
    background: 'rgba(4,8,24,1)',
    oxygenFixed: true,
    hydrogenMobile: false,
    latticeType: 'hexagonal',
    latticeSpacing: 1.0,
    // O-O: 2.752 Å, hexagonal, 4 molecules/cell
    discoveryTitle: 'Ice Ih — Familiar Ice',
    discoveryBody: 'Oxygen atoms lock into a hexagonal lattice with open, ring-shaped gaps. The structure is surprisingly spacious — that\'s why ice floats.',
    discoveryFact: 'Normal ice is 9% less dense than liquid water because its hexagonal rings leave air-pocket-sized gaps. Pressure says "stop leaving gaps" — and the ice collapses into denser forms.',
  },
  'ice-iii': {
    id: 'ice-iii',
    label: 'Ice III',
    labelLogP: -0.55,
    labelT: 248,
    color: '#a0c8e8',
    glowColor: '#70a8cc',
    background: 'rgba(4,7,22,1)',
    oxygenFixed: true,
    hydrogenMobile: false,
    latticeType: 'tetragonal',
    latticeSpacing: 0.92,
    discoveryTitle: 'Ice III',
    discoveryBody: 'The open hexagonal rings collapse inward under pressure, forcing water into a denser, less symmetric arrangement with bent hydrogen bonds.',
    discoveryFact: 'Like squashing a loosely woven basket into a tighter crumpled ball — same molecules, completely different geometry.',
  },
  'ice-v': {
    id: 'ice-v',
    label: 'Ice V',
    labelLogP: -0.30,
    labelT: 235,
    color: '#90b8d8',
    glowColor: '#6090b8',
    background: 'rgba(4,7,20,1)',
    oxygenFixed: true,
    hydrogenMobile: false,
    latticeType: 'tetragonal',
    latticeSpacing: 0.88,
    discoveryTitle: 'Ice V',
    discoveryBody: 'A monoclinic crystal with 28 molecules per unit cell — one of the most complex ice structures, yet still composed entirely of ordinary H₂O.',
    discoveryFact: 'Ice V is the most complicated ice phase that forms from ordinary liquid water under pressure. Its unit cell has more atoms than many protein crystals.',
  },
  'ice-vi': {
    id: 'ice-vi',
    label: 'Ice VI',
    sublabel: 'self-clathrate',
    labelLogP: 0.08,
    labelT: 280,
    color: '#78a8cc',
    glowColor: '#5088b0',
    background: 'rgba(4,6,20,1)',
    oxygenFixed: true,
    hydrogenMobile: false,
    latticeType: 'tetragonal',
    latticeSpacing: 0.85,
    // O-O: 2.810 Å intra-network, 3.51 Å inter-network — two interpenetrating networks
    discoveryTitle: 'Ice VI — Two Crystals in One',
    discoveryBody: 'Two completely independent hydrogen-bond networks occupy the same space without ever connecting to each other. No molecule from one network ever bonds with the other.',
    discoveryFact: 'Ice VI is a self-clathrate — if you could walk through it, you\'d be inside one crystal while a second, completely separate crystal passes through you. This is ice at the bottom of the deep ocean.',
  },
  'ice-vii': {
    id: 'ice-vii',
    label: 'Ice VII',
    sublabel: 'cubic BCC',
    labelLogP: 0.90,
    labelT: 500,
    color: '#5888b8',
    glowColor: '#3868a0',
    background: 'rgba(3,5,18,1)',
    oxygenFixed: true,
    hydrogenMobile: false,
    latticeType: 'cubic-bcc',
    latticeSpacing: 0.76,
    // O-O: 2.860 Å, BCC, 2 molecules/cell
    discoveryTitle: 'Ice VII — Cubic Ice',
    discoveryBody: 'Oxygens pack into a body-centered cubic lattice — one atom in the center of a cube of eight others. The structure is elegant, dense, and stable across an enormous range of conditions.',
    discoveryFact: 'Ice VII has the largest stability field of any molecular ice phase — it exists from 2 GPa all the way past 60 GPa. Diamonds have been found with Ice VII inclusions, proving it forms inside Earth.',
  },
  'ice-x': {
    id: 'ice-x',
    label: 'Ice X',
    sublabel: 'symmetric H',
    labelLogP: 1.78,
    labelT: 600,
    color: '#3060a0',
    glowColor: '#184080',
    background: 'rgba(2,4,16,1)',
    oxygenFixed: true,
    hydrogenMobile: false,
    latticeType: 'cubic-bcc',
    latticeSpacing: 0.64,
    // O-O: 2.407 Å, H sits exactly at midpoint (1.204 Å from each O)
    discoveryTitle: 'Ice X — The End of Water',
    discoveryBody: 'Pressure squeezes the hydrogen to the exact midpoint between two oxygens. It no longer belongs to either. Individual water molecules no longer exist — only a lattice of oxygens with hydrogens pinned between them.',
    discoveryFact: 'At 500,000 atmospheres, water stops being a chemical compound and becomes something closer to a mineral. There are no H₂O molecules left — just atoms.',
  },
  'superionic-bcc': {
    id: 'superionic-bcc',
    label: 'Superionic',
    sublabel: 'Ice XVIII · BCC',
    labelLogP: 1.40,
    labelT: 2500,
    color: '#ff9933',
    glowColor: '#ffbb44',
    background: 'rgba(12,4,2,1)',
    oxygenFixed: true,
    hydrogenMobile: true,
    latticeType: 'cubic-bcc',
    latticeSpacing: 0.60,
    // O-O: 2.330 Å, O locked BCC, H freely diffuses
    discoveryTitle: 'Superionic Ice — Neptune\'s Secret',
    discoveryBody: 'Oxygens lock into a rigid crystal. Hydrogens absorb so much heat they break free entirely and flow like liquid through the lattice. Solid and liquid are happening simultaneously, in the same material.',
    discoveryFact: 'This conducts electricity like a metal (mobile protons), stays rigid like a crystal (fixed oxygens), and is hotter than the surface of the Sun. This is what Neptune\'s interior is made of right now.',
  },
  'superionic-fcc': {
    id: 'superionic-fcc',
    label: 'Superionic',
    sublabel: 'Ice XX · FCC',
    labelLogP: 1.90,
    labelT: 3500,
    color: '#ffaa22',
    glowColor: '#ffcc55',
    background: 'rgba(14,5,2,1)',
    oxygenFixed: true,
    hydrogenMobile: true,
    latticeType: 'cubic-fcc',
    latticeSpacing: 0.55,
    discoveryTitle: 'Superionic FCC — Deeper Still',
    discoveryBody: 'Even the oxygen cage restructures — from body-centered cubic to face-centered cubic, packing tighter. The hydrogen soup flowing through it doesn\'t notice; it keeps diffusing through the new geometry.',
    discoveryFact: 'This material changed its crystal structure while its atoms were already melted. There is no everyday experience to compare this to — it simply does not happen at human-scale conditions.',
  },
}

// ── Phase boundary polylines ──────────────────────────────────────────────────
// Each boundary: array of [logP, T] points (logP = log10(P_GPa))
// Drawn on the diagram SVG.

export interface PhaseBoundary {
  id: string
  points: [number, number][]  // [log10(GPa), Kelvin]
  style: 'solid' | 'dashed'
}

const l = Math.log10

export const BOUNDARIES: PhaseBoundary[] = [
  // Liquid ↔ Ice Ih (negative slope — water anomaly)
  { id: 'liq-ih', style: 'solid', points: [
    [l(0.001), 273.15], [l(0.05), 269.0], [l(0.1), 263.15], [l(0.2), 251.0],
  ]},
  // Liquid ↔ Ice III
  { id: 'liq-iii', style: 'solid', points: [
    [l(0.2076), 251.2], [l(0.25), 254.0], [l(0.30), 256.0], [l(0.35), 257.5],
  ]},
  // Liquid ↔ Ice V
  { id: 'liq-v', style: 'solid', points: [
    [l(0.3504), 256.5], [l(0.40), 260.0], [l(0.50), 268.0], [l(0.60), 274.0], [l(0.625), 273.31],
  ]},
  // Liquid ↔ Ice VI
  { id: 'liq-vi', style: 'solid', points: [
    [l(0.625), 273.31], [l(1.0), 295.0], [l(1.5), 318.0], [l(2.0), 340.0], [l(2.2), 347.0],
  ]},
  // Liquid ↔ Ice VII (extends to very high P)
  { id: 'liq-vii', style: 'solid', points: [
    [l(2.216), 355.0], [l(5.0), 430.0], [l(10.0), 570.0], [l(20.0), 780.0],
    [l(40.0), 1100.0], [l(60.0), 1400.0], [l(100.0), 2000.0], [l(150.0), 2600.0],
  ]},
  // Ice Ih ↔ Ice III
  { id: 'ih-iii', style: 'solid', points: [
    [l(0.2076), 251.2], [l(0.250), 240.0], [l(0.300), 228.0], [l(0.350), 215.0],
  ]},
  // Ice III ↔ Ice V
  { id: 'iii-v', style: 'solid', points: [
    [l(0.3504), 256.5], [l(0.380), 245.0], [l(0.410), 232.0], [l(0.430), 218.0], [l(0.450), 205.0],
  ]},
  // Ice V ↔ Ice VI
  { id: 'v-vi', style: 'solid', points: [
    [l(0.625), 273.31], [l(0.650), 265.0], [l(0.700), 248.0], [l(0.800), 230.0], [l(0.900), 213.0],
  ]},
  // Ice VI ↔ Ice VII
  { id: 'vi-vii', style: 'solid', points: [
    [l(2.216), 355.0], [l(2.5), 320.0], [l(3.0), 280.0], [l(4.0), 250.0], [l(5.0), 240.0],
  ]},
  // Ice VII ↔ Ice X (diffuse — dashed)
  { id: 'vii-x', style: 'dashed', points: [
    [l(30.0), 300.0], [l(50.0), 500.0], [l(70.0), 800.0], [l(80.0), 1000.0], [l(100.0), 1500.0],
  ]},
  // Ice VII/X ↔ Superionic BCC
  { id: 'x-si-bcc', style: 'solid', points: [
    [l(10.0), 1300.0], [l(20.0), 1700.0], [l(30.0), 2100.0], [l(50.0), 2900.0], [l(100.0), 4200.0],
  ]},
  // Superionic BCC ↔ FCC
  { id: 'si-bcc-fcc', style: 'dashed', points: [
    [l(30.0), 2200.0], [l(50.0), 2800.0], [l(100.0), 3600.0], [l(150.0), 4200.0], [l(200.0), 4700.0],
  ]},
  // Liquid ↔ Superionic (upper melt boundary)
  { id: 'liq-si', style: 'dashed', points: [
    [l(30.0), 3000.0], [l(50.0), 3800.0], [l(100.0), 5000.0],
  ]},
]

// ── Phase detection ───────────────────────────────────────────────────────────
// Given P (GPa) and T (K), return which phase the user is in.
// This is an approximation based on the boundary data above.

export function detectPhase(P: number, T: number): PhaseId {
  // Superionic first (high P, high T)
  if (P >= 100 && T >= 3600) return 'superionic-fcc'
  if (P >= 30 && T >= 2200) {
    // rough BCC/FCC split
    if (P >= 80 && T >= 3200) return 'superionic-fcc'
    return 'superionic-bcc'
  }
  // Superionic BCC lower bound
  if (P >= 10 && T >= 1300) {
    const tBound = 1300 + (P - 10) * (2900 - 1300) / (50 - 10)
    if (T >= tBound) return 'superionic-bcc'
  }

  // Ice X (diffuse boundary from VII ~30-80 GPa)
  if (P >= 50 && T < 1500 && T >= 200) return 'ice-x'
  if (P >= 30 && T < 800) return 'ice-x'

  // High P liquid above Ice VII melt curve
  if (P >= 2.216) {
    const tMelt = 355 + (Math.log10(P) - Math.log10(2.216)) * 2000
    if (T > tMelt) return 'liquid'
    return 'ice-vii'
  }

  // Low-P liquid above melting curves
  if (P < 0.001) return T > 273 ? 'vapor' : 'ice-ih'

  // Ice VI/VII boundary around 2.2 GPa
  if (P >= 0.625 && P < 2.216) {
    const tMelt = 273.31 + (P - 0.625) * (347 - 273.31) / (2.2 - 0.625)
    if (T > tMelt) return 'liquid'
    return 'ice-vi'
  }

  // Ice III / V / VI below melt
  if (P >= 0.35 && P < 0.625) {
    const tMelt = 256.5 + (P - 0.35) * (273.31 - 256.5) / (0.625 - 0.35)
    if (T > tMelt) return 'liquid'
    if (P < 0.45) return 'ice-v'
    return 'ice-vi'
  }
  if (P >= 0.2076 && P < 0.35) {
    const tMelt = 251.2 + (P - 0.2076) * (257.5 - 251.2) / (0.35 - 0.2076)
    if (T > tMelt) return 'liquid'
    return 'ice-iii'
  }

  // Ice Ih / liquid boundary (negative slope)
  if (P < 0.2076) {
    const tMelt = 273.15 - P * (273.15 - 251.0) / 0.2
    if (T > Math.max(tMelt, 200)) return 'liquid'
    return 'ice-ih'
  }

  return 'liquid'
}

// ── Neptune context points ────────────────────────────────────────────────────
export const NEPTUNE_LAYERS = [
  { label: 'outer ocean', logP: Math.log10(10), T: 3500, desc: 'ionic fluid' },
  { label: 'superionic mantle', logP: Math.log10(100), T: 6000, desc: 'BCC → FCC superionic' },
]

// The "target" the player is searching for in challenge mode
export const NEPTUNE_TARGET: { P: number; T: number } = { P: 50, T: 3000 }
