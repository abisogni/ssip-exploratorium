// ── Kryptos Lab — Puzzle Data ───────────────────────────────────────────────
// All puzzle content, ciphertexts, and reveal panel copy for The Cipher Room.

// ── Level metadata ──────────────────────────────────────────────────────────

export interface LevelMeta {
  id: number
  title: string
  subtitle: string
  act: 1 | 2 | 3
  actTitle: string
}

export const LEVELS: LevelMeta[] = [
  { id: 1, title: 'The Roman Dispatch',      subtitle: 'Julius Caesar · Gaul, ~50 BC',                    act: 1, actTitle: 'The Written Word'      },
  { id: 2, title: 'The Rosetta Key',          subtitle: 'Jean-François Champollion · Paris, 1822',          act: 1, actTitle: 'The Written Word'      },
  { id: 3, title: 'The Codon Table',          subtitle: 'Marshall Nirenberg · Bethesda, 1961',              act: 2, actTitle: "Nature's Code"          },
  { id: 4, title: 'Signal in the Noise',      subtitle: 'Jocelyn Bell Burnell · Cambridge, 1967',           act: 2, actTitle: "Nature's Code"          },
  { id: 5, title: "Al-Kindi's Method",        subtitle: 'Abu Yusuf Al-Kindi · Baghdad, ~850 AD',            act: 3, actTitle: 'The Logic of Secrets'   },
  { id: 6, title: 'The Unbreakable Machine',  subtitle: 'Alan Turing · Bletchley Park, 1941',               act: 3, actTitle: 'The Logic of Secrets'   },
]

// ── Reveal panel copy ───────────────────────────────────────────────────────

export interface Reveal {
  title: string
  location: string
  impact: string
  body: string[]
}

export const REVEALS: Record<number, Reveal> = {
  1: {
    title: 'Julius Caesar',
    location: 'Gaul, ~50 BC',
    impact: 'A shift of three letters commanded an empire — and became the foundation of all cipher theory.',
    body: [
      'The Roman general Julius Caesar used this cipher to protect military communications across his campaigns. The historian Suetonius documented it in The Twelve Caesars: "If he had anything confidential to say, he wrote it in cipher — the fourth letter of the alphabet, D, being substituted for A, and so with the others."',
      "Caesar's cipher worked because most of his enemies could not read at all. Once literacy spread, the cipher became trivial to break — yet ROT13, a shift-of-13 variant, is still used today in online communities to hide spoilers.",
      'Every technique in this room builds on what you learned here. The shift cipher is not a relic — it is a root.',
    ],
  },
  2: {
    title: 'Jean-François Champollion',
    location: 'Paris, September 14, 1822',
    impact: 'Unlocked 3,000 years of Egyptian history, literature, medicine, and law.',
    body: [
      'For fourteen centuries, Egyptian hieroglyphics were unreadable. Scholars assumed they were purely symbolic — pictures representing ideas, not sounds. Champollion suspected otherwise.',
      'The Rosetta Stone, discovered by Napoleonic troops in 1799, bore the same priestly decree in three scripts. Champollion knew Ancient Greek. By matching the Greek royal name "Ptolemy" to its corresponding cartouche in the hieroglyphic text, he deduced that cartouches enclosed phonetic spellings of names. From there, he reconstructed the full alphabet.',
      'On the morning of September 14, 1822, he burst into his brother\'s office, threw his notes on the desk, shouted "I\'ve got it!" — and collapsed. He was bedridden for five days from the excitement. He was 31 years old.',
    ],
  },
  3: {
    title: 'Marshall Nirenberg & Heinrich Matthaei',
    location: 'Bethesda, Maryland, May 22, 1961',
    impact: 'The genetic code: the deepest shared language on Earth, used by nearly every living organism.',
    body: [
      'By 1961, scientists knew DNA contained the instructions for life — but not how to read them. Nirenberg and Matthaei built a simple experiment: they synthesised an artificial RNA strand made entirely of one letter — poly-U (UUUUUU...) — and dropped it into a cell extract. The cell machinery read it and produced a protein made entirely of one amino acid: phenylalanine. UUU = Phe. The first codon was cracked.',
      "Over the following years, Nirenberg's team and competing labs deciphered all 64 codons in the table. Nirenberg received the Nobel Prize in Physiology or Medicine in 1968.",
      'The genetic code is nearly universal — almost every organism on Earth uses the same 64-codon table you just read. This discovery is the foundation of every genetic medicine, mRNA vaccine, and CRISPR therapy that exists today.',
    ],
  },
  4: {
    title: 'Jocelyn Bell Burnell',
    location: 'Cambridge, England, November 28, 1967',
    impact: 'Discovered pulsars — the most accurate natural clocks in the universe, now used to detect gravitational waves.',
    body: [
      'Jocelyn Bell Burnell was a 24-year-old PhD student when she noticed something strange in the data from a radio telescope she had helped build by hand — literally hammering posts into the ground. In kilometres of paper chart output, she spotted a faint, repeating signal: a pulse every 1.3373 seconds, precise to within a millionth of a second.',
      'Her supervisor initially called it "LGM-1" — Little Green Men — as a joke, because nothing natural was known to pulse so regularly. It was briefly considered a genuine alien signal. It was a pulsar: a rapidly rotating neutron star the size of a city, sweeping a beam of radio waves across space like a lighthouse.',
      "Bell Burnell's supervisor, Antony Hewish, received the Nobel Prize for the discovery in 1974. She did not — a decision that remains one of the most criticised omissions in Nobel history. Gravitational waves — ripples in spacetime — can be detected by the minute delays they cause in pulsar timing. The signal you just decoded was the first one ever found.",
    ],
  },
  5: {
    title: 'Abu Yusuf Al-Kindi',
    location: 'Baghdad, ~850 AD',
    impact: 'Invented frequency analysis — the primary tool for breaking ciphers for nearly 1,000 years.',
    body: [
      "In the golden age of Islamic scholarship, the polymath Abu Yusuf Al-Kindi wrote Risalah fi Istikhraj al-Mu'amma — \"A Manuscript on Deciphering Cryptographic Messages.\" It is the oldest known work on cryptanalysis in human history.",
      "Al-Kindi's insight was statistical. Every language has a characteristic letter distribution — and any cipher that merely substitutes one letter for another preserves that distribution. Count the letters. The most common cipher letter is probably E. The second most common is probably T. Work from there.",
      'Al-Kindi was also a philosopher, mathematician, physician, and music theorist who wrote over 260 treatises. His method of frequency analysis remained the primary tool for breaking ciphers for nearly 1,000 years — until polyalphabetic ciphers were invented. Or so people thought. Frequency analysis still underlies much of modern cryptanalysis.',
    ],
  },
  6: {
    title: 'Alan Turing and the Bletchley Park Team',
    location: 'Buckinghamshire, England, 1940–41',
    impact: 'Shortened WWII by an estimated 2–4 years, saving approximately 14 million lives.',
    body: [
      "The Enigma machine was considered unbreakable — 158 quintillion possible settings, changed every midnight. Alan Turing's approach was not to try every key. It was to use the enemy's own habits against them. German operators followed rigid formats. Weather reports always included predictable words. These known fragments — cribs — let Turing build the Bombe: a device that eliminated impossible settings by testing contradictions.",
      "The work at Bletchley Park is estimated to have shortened the Second World War by two to four years, saving approximately 14 million lives.",
      "After the war, Turing's work was classified for decades. In 1952, he was prosecuted by the British government for being gay and sentenced to chemical castration. He died in 1954 at age 41, and was granted a posthumous royal pardon in 2013. The mathematical framework he developed at Bletchley became the foundation of computer science. Every device you use today runs on ideas he first formalised.",
    ],
  },
}

// ── Level 1: Caesar Cipher ──────────────────────────────────────────────────
// Plaintext: "THE EAGLE CROSSES THE RHINE AT MIDNIGHT. BURN THIS AFTER READING. CAESAR."
// Shift: 3  (classic Caesar value)

export const L1 = {
  correctShift: 3,
  ciphertext:   'WKH HDJOH FURVVHV WKH UKLQH DW PLGQLJKW. EXUQ WKLV DIWHU UHDGLQJ. FDHVDU.',
  plaintext:    'THE EAGLE CROSSES THE RHINE AT MIDNIGHT. BURN THIS AFTER READING. CAESAR.',
}

// ── Level 2: Rosetta Key ────────────────────────────────────────────────────
// Symbol substitution cipher with bilingual anchor clues.
// Each plain letter maps to a Unicode symbol.

export const L2_SYMBOL_MAP: Record<string, string> = {
  A:'♦', B:'♣', C:'♠', D:'♥', E:'★', F:'☆', G:'◎', H:'●', I:'□',
  J:'■', K:'△', L:'▲', M:'◇', N:'◆', O:'◯', P:'⊕', Q:'⊗', R:'☉',
  S:'⊙', T:'⊛', U:'⊜', V:'⊝', W:'⊞', X:'⊟', Y:'⊡', Z:'⊠',
}

// Reverse: symbol → plain letter
export const L2_LETTER_MAP: Record<string, string> =
  Object.fromEntries(Object.entries(L2_SYMBOL_MAP).map(([k, v]) => [v, k]))

export const L2_PLAINTEXT = 'DECREE OF THE ETERNAL KING. ALL NATIONS SHALL HONOUR THE SACRED STONE.'

function encodeWithSymbols(text: string): string {
  return text.split('').map(ch => L2_SYMBOL_MAP[ch] ?? ch).join('')
}

export const L2_CIPHERTEXT = encodeWithSymbols(L2_PLAINTEXT)

// Bilingual anchors given to the player as starting clues
export const L2_ANCHORS: { label: string; plain: string; symbols: string }[] = [
  { label: 'THE',  plain: 'THE',  symbols: encodeWithSymbols('THE')  },
  { label: 'KING', plain: 'KING', symbols: encodeWithSymbols('KING') },
]

// All unique symbols that appear in the ciphertext (for the mapping palette)
export function getUniqueSymbols(ciphertext: string): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const ch of ciphertext) {
    if (L2_LETTER_MAP[ch] && !seen.has(ch)) {
      seen.add(ch)
      result.push(ch)
    }
  }
  return result
}

// ── Level 3: Codon Table ────────────────────────────────────────────────────

export interface Codon {
  triplet: string
  aminoAcid: string
  abbr: string
  isStart?: boolean
  isStop?: boolean
}

// Subset of codons used in the puzzle strand + a few neighbours for the reference table
export const CODON_TABLE: Codon[] = [
  { triplet: 'AUG', aminoAcid: 'Methionine',   abbr: 'Met', isStart: true  },
  { triplet: 'UGU', aminoAcid: 'Cysteine',     abbr: 'Cys'                 },
  { triplet: 'UAC', aminoAcid: 'Tyrosine',     abbr: 'Tyr'                 },
  { triplet: 'CAG', aminoAcid: 'Glutamine',    abbr: 'Gln'                 },
  { triplet: 'AAG', aminoAcid: 'Lysine',       abbr: 'Lys'                 },
  { triplet: 'GGU', aminoAcid: 'Glycine',      abbr: 'Gly'                 },
  { triplet: 'CCG', aminoAcid: 'Proline',      abbr: 'Pro'                 },
  { triplet: 'CUG', aminoAcid: 'Leucine',      abbr: 'Leu'                 },
  { triplet: 'UAU', aminoAcid: 'Tyrosine',     abbr: 'Tyr'                 },
  { triplet: 'GCG', aminoAcid: 'Alanine',      abbr: 'Ala'                 },
  { triplet: 'ACG', aminoAcid: 'Threonine',    abbr: 'Thr'                 },
  { triplet: 'UCG', aminoAcid: 'Serine',       abbr: 'Ser'                 },
  { triplet: 'UAA', aminoAcid: 'Stop',         abbr: 'Stop', isStop: true  },
  { triplet: 'UAG', aminoAcid: 'Stop',         abbr: 'Stop', isStop: true  },
  { triplet: 'UGA', aminoAcid: 'Stop',         abbr: 'Stop', isStop: true  },
]

// The puzzle strand — simplified oxytocin-like peptide
// AUG (start / Met) → Cys → Tyr → Gln → Lys → Gly → Pro → Leu → Stop
export const L3_STRAND  = ['AUG', 'UGU', 'UAC', 'CAG', 'AAG', 'GGU', 'CCG', 'CUG', 'UAA']
export const L3_ANSWERS = ['Met', 'Cys', 'Tyr', 'Gln', 'Lys', 'Gly', 'Pro', 'Leu', 'Stop']
export const L3_PROTEIN = 'Oxytocin-like neuropeptide (simplified 8-residue form)'

// ── Level 4: Signal in the Noise ────────────────────────────────────────────
// Models PSR B1919+21, the first pulsar discovered by Jocelyn Bell Burnell.
// The waveform is generated procedurally in Level4.tsx using these parameters.

export const L4 = {
  periodS:        1.3373,   // seconds — real PSR B1919+21 period
  totalDurationS: 26,       // simulated window shown to player
  noiseAmplitude: 0.42,     // fraction of peak height
  pulseAmplitude: 1.0,
  pulseWidthS:    0.07,     // gaussian pulse half-width
  sampleRate:     160,      // samples per second
  minPeaks:       5,        // peaks to tag before period can be calculated
  tolerancePct:   0.09,     // 9% period tolerance to count as "consistent"
}

// ── Level 5: Frequency Analysis ─────────────────────────────────────────────
// ATBASH cipher: A↔Z, B↔Y, C↔X … — historically attested, visually memorable.

const PLAIN_ALPHA  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const ATBASH_ALPHA = 'ZYXWVUTSRQPONMLKJIHGFEDCBA'

function atbash(text: string): string {
  return text.toUpperCase().split('').map(ch => {
    const i = PLAIN_ALPHA.indexOf(ch)
    return i >= 0 ? ATBASH_ALPHA[i] : ch
  }).join('')
}

// Source: paraphrase of Al-Kindi's own description of frequency analysis
const L5_PLAIN_TEXT =
  'ONE WAY TO SOLVE AN ENCRYPTED MESSAGE, IF WE KNOW ITS LANGUAGE, ' +
  'IS TO FIND A PLAIN TEXT OF THE SAME LANGUAGE LONG ENOUGH TO FILL ' +
  'ONE SHEET OR SO. WE COUNT THE OCCURRENCES OF EACH LETTER. ' +
  'WE CALL THIS THE FREQUENCY. WE DO THE SAME FOR THE SECRET TEXT. ' +
  'THE MOST FREQUENT LETTER IN THE SECRET TEXT LIKELY CORRESPONDS ' +
  'TO THE MOST FREQUENT LETTER IN THE PLAIN TEXT. ' +
  'COMPARE THEM CAREFULLY AND SUBSTITUTE.'

export const L5 = {
  plainAlpha:  PLAIN_ALPHA,
  cipherAlpha: ATBASH_ALPHA,
  plaintext:   L5_PLAIN_TEXT,
  ciphertext:  atbash(L5_PLAIN_TEXT),
}

// ── Level 6: The Unbreakable Machine (Crib-drag) ────────────────────────────
// Vigenère cipher with key "BLETCH" — simplified Enigma analogue.
// Mechanic: player drags the crib "WEATHER" along the ciphertext, at each
// position computing the implied key fragment. At the correct position, the
// fragment matches the repeating key "BLETCH", which the player recognises.

const L6_KEY   = 'BLETCH'
const L6_PLAIN = 'PANZER DIVISION WEATHER REPORT WINDS NORTH AT FORTY KNOTS VISIBILITY POOR'
const L6_CRIB  = 'WEATHER'

function vigenereEncode(text: string, key: string): string {
  let ki = 0
  return text.toUpperCase().split('').map(ch => {
    if (!/[A-Z]/.test(ch)) return ch
    const shift = key.toUpperCase().charCodeAt(ki % key.length) - 65
    ki++
    return String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65)
  }).join('')
}

function vigenereDecode(text: string, key: string): string {
  let ki = 0
  return text.toUpperCase().split('').map(ch => {
    if (!/[A-Z]/.test(ch)) return ch
    const shift = key.toUpperCase().charCodeAt(ki % key.length) - 65
    ki++
    return String.fromCharCode(((ch.charCodeAt(0) - 65 - shift + 26) % 26) + 65)
  }).join('')
}

// Compute implied key fragment when crib is placed at a given letter-index position
export function extractKeyFragment(ciphertextLetters: string, crib: string, pos: number): string {
  return crib.toUpperCase().split('').map((ch, i) => {
    const cipherCh = ciphertextLetters[pos + i]
    if (!cipherCh) return '?'
    const diff = (cipherCh.charCodeAt(0) - ch.charCodeAt(0) + 26) % 26
    return String.fromCharCode(diff + 65)
  }).join('')
}

// Letters-only versions (key index matches letter index for UI)
const L6_CIPHER_FULL    = vigenereEncode(L6_PLAIN, L6_KEY)
const L6_CIPHER_LETTERS = L6_CIPHER_FULL.replace(/[^A-Z]/gi, '').toUpperCase()
const L6_PLAIN_LETTERS  = L6_PLAIN.replace(/[^A-Z]/gi, '').toUpperCase()

// Position where WEATHER starts in the letter-only plaintext
const L6_CRIB_POS = L6_PLAIN_LETTERS.indexOf(L6_CRIB)

export const L6 = {
  key:              L6_KEY,
  crib:             L6_CRIB,
  cribPosition:     L6_CRIB_POS,           // 14
  cipherFull:       L6_CIPHER_FULL,         // with spaces (for display)
  cipherLetters:    L6_CIPHER_LETTERS,      // letters only (for crib-drag mechanic)
  plainLetters:     L6_PLAIN_LETTERS,       // letters only (for verify)
  decode:           (ct: string) => vigenereDecode(ct, L6_KEY),
  // Expected key fragment at the correct position
  correctFragment:  extractKeyFragment(L6_CIPHER_LETTERS, L6_CRIB, L6_CRIB_POS),
}
