// ── Cipher utilities ─────────────────────────────────────────────────────────

/** Simple LCG seeded PRNG */
function lcg(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 0x100000000
  }
}

/** Build a substitution encode key from a seed.
 *  encodeKey[i] = the letter that (A + i) maps TO. */
function buildEncodeKey(seed: number): string {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const rand = lcg(seed)
  for (let i = 25; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[alpha[i], alpha[j]] = [alpha[j], alpha[i]]
  }
  return alpha.join('')
}

/** Encrypt plaintext using an encode key (non-alpha chars pass through). */
function encrypt(plain: string, encodeKey: string): string {
  return plain
    .toUpperCase()
    .split('')
    .map(c => {
      const i = c.charCodeAt(0) - 65
      return i >= 0 && i < 26 ? encodeKey[i] : c
    })
    .join('')
}

/** Build the decode key (inverse of encode key). */
export function buildDecodeKey(encodeKey: string): string {
  const decode = new Array<string>(26).fill('')
  for (let i = 0; i < 26; i++) {
    const j = encodeKey.charCodeAt(i) - 65
    decode[j] = String.fromCharCode(65 + i)
  }
  return decode.join('')
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PersonData {
  name: string
  years: string
  field: string
  bio: string
}

export interface CoordData {
  locationName: string
  lat: number
  lng: number
  description: string
}

export interface CipherEntry {
  id: string
  type: 'quote' | 'coordinates'
  plainText: string
  cipherText: string
  encodeKey: string
  person?: PersonData
  coord?: CoordData
}

// ── Builder ───────────────────────────────────────────────────────────────────

function makeEntry(
  id: string,
  type: 'quote' | 'coordinates',
  seed: number,
  plainText: string,
  meta: { person?: PersonData; coord?: CoordData },
): CipherEntry {
  const encodeKey = buildEncodeKey(seed)
  return {
    id,
    type,
    plainText: plainText.toUpperCase(),
    cipherText: encrypt(plainText, encodeKey),
    encodeKey,
    ...meta,
  }
}

// ── Entries ───────────────────────────────────────────────────────────────────

export const ENTRIES: CipherEntry[] = [
  // ── Quotes ──────────────────────────────────────────────────────────────────

  makeEntry('nicollier', 'quote', 42,
    'FROM ORBIT THE BEAUTY OF OUR PLANET STRIKES YOU WITH FULL FORCE AND EVERY ASTRONAUT RETURNS CHANGED BY THE SIGHT OF THAT THIN BLUE LINE',
    {
      person: {
        name: 'Claude Nicollier',
        years: '1944 –',
        field: 'Astronaut · Astrophysicist',
        bio: "Switzerland's only ESA astronaut, Nicollier flew four Space Shuttle missions. In December 1999 he conducted a spacewalk to service the Hubble Space Telescope — one of the most technically demanding EVAs ever performed.",
      },
    }
  ),

  makeEntry('altwegg', 'quote', 137,
    'COMETS ARE TIME CAPSULES FROM THE BIRTH OF OUR SOLAR SYSTEM WHAT WE FOUND AT COMET SIXTY SEVEN P REWROTE OUR UNDERSTANDING OF WHERE LIFE BEGINS',
    {
      person: {
        name: 'Kathrin Altwegg',
        years: '1951 –',
        field: 'Astrophysicist · Comet Scientist',
        bio: 'Professor at the University of Bern and principal investigator of the ROSINA mass spectrometer aboard ESA\'s Rosetta mission. Her instrument made the first in-situ chemical analysis of a comet, detecting amino acid glycine and the building blocks of life at comet 67P/Churyumov–Gerasimenko.',
      },
    }
  ),

  makeEntry('piccard', 'quote', 256,
    'TO ASCEND INTO THE STRATOSPHERE WAS TO TOUCH THE BOUNDARY BETWEEN WORLD AND COSMOS THE SILENCE UP THERE WAS UNLIKE ANYTHING I HAD EVER KNOWN',
    {
      person: {
        name: 'Auguste Piccard',
        years: '1884 – 1962',
        field: 'Physicist · Explorer',
        bio: "A Basel-born physicist who reached the stratosphere in a pressurised gondola of his own design in 1931, becoming the first person to observe the curvature of the Earth directly. He later pioneered the bathyscaphe for deep-sea exploration. His grandson Bertrand co-piloted Solar Impulse around the world.",
      },
    }
  ),

  makeEntry('euler', 'quote', 73,
    'NOTHING AT ALL TAKES PLACE IN THE UNIVERSE IN WHICH SOME RULE OF MAXIMUM OR MINIMUM DOES NOT APPEAR',
    {
      person: {
        name: 'Leonhard Euler',
        years: '1707 – 1783',
        field: 'Mathematics · Physics',
        bio: "Born in Basel, Euler is among the most prolific mathematicians in history. His work spans analysis, number theory, graph theory, mechanics, and optics. The number e, Euler's identity, and countless theorems bear his legacy. He continued producing mathematics after losing his sight entirely.",
      },
    }
  ),

  makeEntry('heimvoegtlin', 'quote', 188,
    'THE HEALING ART BELONGS TO ALL OF HUMANITY NO BARRIER OF SEX SHOULD STAND BETWEEN A PATIENT IN PAIN AND THE PHYSICIAN WHO CAN HELP THEM',
    {
      person: {
        name: 'Marie Heim-Vögtlin',
        years: '1845 – 1916',
        field: 'Medicine · Pioneer',
        bio: "The first woman to receive a medical doctorate in Switzerland, Heim-Vögtlin overcame fierce institutional resistance to complete her degree in Zurich. She later co-founded the Schweizerische Pflegerinnenschule and the first maternity hospital in Zurich, fundamentally shaping Swiss women's medicine.",
      },
    }
  ),

  makeEntry('keller', 'quote', 321,
    'ULTRAFAST LASERS OPEN A WINDOW ONTO PROCESSES THAT HAPPEN IN FEMTOSECONDS WE CAN NOW WATCH CHEMISTRY UNFOLD IN REAL TIME',
    {
      person: {
        name: 'Ursula Keller',
        years: '1959 –',
        field: 'Photonics · Ultrafast Science',
        bio: "Professor at ETH Zürich and inventor of the semiconductor saturable absorber mirror (SESAM), which enabled reliable mode-locked ultrafast pulsed lasers. Her technology is now embedded in laser systems used in ophthalmology, materials processing, and fundamental physics research worldwide.",
      },
    }
  ),

  // ── Coordinates ─────────────────────────────────────────────────────────────

  makeEntry('technopark', 'coordinates', 99,
    'INNOVATION CAMPUS LATITUDE FORTY SEVEN POINT ZERO FIVE ZERO TWO NORTH LONGITUDE EIGHT POINT THREE ZERO NINE THREE EAST',
    {
      coord: {
        locationName: 'Technopark Luzern',
        lat: 47.0502,
        lng: 8.3093,
        description: 'A hub for technology startups and innovation in the heart of Lucerne, Technopark connects researchers, entrepreneurs, and industry to accelerate deep-tech ventures.',
      },
    }
  ),

  makeEntry('hslu', 'coordinates', 155,
    'UNIVERSITY OF APPLIED SCIENCES LATITUDE FORTY SEVEN POINT ZERO FOUR SEVEN EIGHT NORTH LONGITUDE EIGHT POINT THREE ZERO ONE FOUR EAST',
    {
      coord: {
        locationName: 'HSLU – Hochschule Luzern',
        lat: 47.0478,
        lng: 8.3014,
        description: 'Hochschule Luzern is a University of Applied Sciences and Arts spanning design, engineering, business, social work, and music — one of the largest universities of applied sciences in Switzerland.',
      },
    }
  ),

  makeEntry('cern', 'coordinates', 212,
    'PARTICLE PHYSICS LABORATORY LATITUDE FORTY SIX POINT TWO THREE THREE ZERO NORTH LONGITUDE SIX POINT ZERO FIVE FIVE NINE EAST',
    {
      coord: {
        locationName: 'CERN',
        lat: 46.2330,
        lng: 6.0559,
        description: 'The European Organization for Nuclear Research operates the world\'s largest particle physics laboratory on the Franco-Swiss border near Geneva, home to the Large Hadron Collider.',
      },
    }
  ),

  makeEntry('etherlaken', 'coordinates', 288,
    'MYSTERY PARK REBORN LATITUDE FORTY SIX POINT SIX EIGHT FOUR SEVEN NORTH LONGITUDE SEVEN POINT EIGHT SIX TWO EIGHT EAST',
    {
      coord: {
        locationName: 'Etherlaken',
        lat: 46.6847,
        lng: 7.8628,
        description: "Once known as Mystery Park, this site in Interlaken explored ancient civilisations and unexplained phenomena. Reborn as Etherlaken, it blends the spirit of curiosity with contemporary technology and experience.",
      },
    }
  ),
]

// ── English reference frequencies (%) ────────────────────────────────────────

export const ENGLISH_FREQ: Record<string, number> = {
  E: 12.70, T: 9.06, A: 8.17, O: 7.51, I: 6.97, N: 6.75, S: 6.33, H: 6.09,
  R: 5.99, D: 4.25, L: 4.03, C: 2.78, U: 2.76, M: 2.41, W: 2.36, F: 2.23,
  G: 2.02, Y: 1.97, P: 1.93, B: 1.49, V: 0.98, K: 0.77, J: 0.15, X: 0.15,
  Q: 0.10, Z: 0.07,
}
