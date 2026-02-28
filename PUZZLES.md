# Exploratorium — Puzzles Page Concepts

Tracking doc for interactive puzzle games. Each entry includes concept, mechanics, tech notes, and build status.

Status values: `planned` | `in progress` | `shipped`

---

## Cryptography

### 1. The Cipher Room
**Status:** `planned`

**Concept:**
Player receives intercepted "SSIP transmissions" and must crack them. Story framing: you are an SSIP analyst decoding communications from an unknown source. Each level reveals part of a larger message.

**Mechanics:**
- Level 1 — Caesar cipher: shift the alphabet to decode
- Level 2 — Vigenère cipher: given a keyword hint, decode a longer message
- Level 3 — Substitution cipher: use frequency analysis to map letters manually

**UI:**
- Dark terminal aesthetic (monospace font, green-on-black or amber-on-black)
- Input field where player types or clicks letter mappings
- Live decoded text updates as player makes guesses
- "Transmission received" narrative wrapper

**Tech:**
- Pure TypeScript logic, no external deps
- Pre-baked cipher texts and keys stored as constants
- Optional: add a hint system (reveal one letter per hint)

---

### 2. Frequency Fingerprint
**Status:** `planned`

**Concept:**
Given an encrypted substitution cipher, player decodes it by analyzing letter frequencies. Teaches the real technique used to break classical ciphers.

**Mechanics:**
- Encrypted text is displayed
- Live bar chart shows frequency of each cipher letter
- Player drags or clicks to map cipher letters to plaintext letters
- Decoded text updates in real time
- Puzzle is solved when full plaintext is revealed

**UI:**
- Split view: encrypted text left, frequency chart right
- Letter mapping palette below
- Subtle animation when a correct mapping locks in

**Tech:**
- Bar chart: simple SVG or a lightweight lib (e.g. recharts, already common in Next.js stacks)
- Drag-to-map: React DnD or simpler click-to-assign
- Pre-baked cipher texts (3–5 puzzles of increasing length)

---

### 3. Signal from Deep Space
**Status:** `planned`

**Concept:**
Inspired by the 1974 Arecibo message. Player receives a raw binary transmission (a sequence of 1s and 0s). They must figure out the grid dimensions by factoring the length (prime factorization hint), arrange the bits into a 2D grid, and read the image that emerges.

**Mechanics:**
- Step 1: given bit count (e.g. 1679 = 23 × 73), player picks grid dimensions
- Step 2: binary bits populate a grid; player can try row/column orientations
- Step 3: image resolves — reveal explains what the pattern represents (numbers, DNA, a figure, etc.)

**UI:**
- Full dark background, pixel grid with glow effect on active cells
- Dimension picker (width × height) with live grid preview
- "Decoding..." animation on correct solve

**Tech:**
- Pure CSS/SVG grid
- Pre-designed binary payloads (3 puzzles: easy recognizable shape → Arecibo-style)
- No external deps needed

---

## AI / ML

### 4. Turing or Not Turing
**Status:** `planned`

**Concept:**
Two conversation transcripts displayed side by side. One participant is human, the other is an AI. Player reads the exchange and votes on which is which. After voting, the reveal explains the tells.

**Mechanics:**
- 5–8 rounds, each a different conversation snippet (different topics/styles)
- Player selects "A is human" or "B is human"
- Running score tracked
- Each reveal includes a short explanation: what gave the AI away (or didn't)

**UI:**
- Chat bubble layout, two columns (Participant A / Participant B)
- Vote buttons below each conversation
- Reveal panel slides in with verdict + explanation

**Tech:**
- Pre-scripted transcripts stored as JSON
- Optional enhancement: wire one side to Claude API for live, unpredictable play
- Zero external deps for the static version

---

### 5. Neural Paint
**Status:** `planned`

**Concept:**
Player draws a digit (0–9) or simple shape on a canvas. A neural network running entirely in-browser classifies it in real time. Confidence scores for all classes update as you draw.

**Mechanics:**
- Freehand canvas drawing (mouse or touch)
- Model runs inference on every stroke update (debounced ~200ms)
- Top-3 predictions shown with confidence bars
- "Clear" button resets; player can try to fool the model

**UI:**
- Large dark canvas with white drawing
- Confidence bar chart beside the canvas, animating live
- "What does the AI see?" framing

**Tech:**
- TensorFlow.js with a pre-trained MNIST model (model files are ~1MB, host in `/public`)
- No server needed — fully client-side inference
- `use client` component in Next.js App Router

---

### 6. Adversarial Patch
**Status:** `planned`

**Concept:**
Shows how adversarial perturbations fool image classifiers. Player sees two versions of an image side by side — original vs. adversarially perturbed — and a classifier label for each. The labels differ despite the images looking nearly identical to the human eye.

**Mechanics:**
- Gallery of 5–8 pre-baked adversarial image pairs
- Slider or toggle to morph between original and perturbed
- Classifier labels shown for both states
- Explanation panel: what changed, why the model was fooled, what this means for AI safety

**UI:**
- Side-by-side image comparison with a CSS blend slider
- Label badges animate when they change
- Educational overlay on reveal

**Tech:**
- Pre-generated image pairs (static assets in `/public`)
- Slider: CSS `clip-path` or overlay opacity trick
- No model inference needed at runtime — labels are pre-baked metadata

---

## Space

### 7. Exoplanet Detective
**Status:** `planned`

**Concept:**
Player is given a real (or realistic) stellar light curve — brightness vs. time. They must identify dips that indicate a transiting exoplanet, mark them, and calculate the implied orbital period.

**Mechanics:**
- Interactive SVG chart of a light curve
- Player clicks to place markers on dips
- After marking 2+ dips, player calculates period (or it's auto-calculated)
- Puzzle solved when period matches within tolerance
- Bonus: estimate planet size from dip depth

**UI:**
- Full-width dark chart with subtle star-field background
- Crosshair cursor on the chart
- Annotation markers placed on click
- Result panel shows orbital period and comparison to real exoplanets

**Tech:**
- Light curve data: real Kepler public data or synthetic arrays
- Rendering: SVG or a lightweight chart (recharts / visx)
- Interaction: click handlers on SVG paths

---

### 8. Orbital Heist
**Status:** `planned`

**Concept:**
2D orbital mechanics puzzle. Fixed gravity wells (planets) are placed on a canvas. Player adjusts the launch angle and speed of a spacecraft to thread through gravity and reach a target zone.

**Mechanics:**
- Player drags an arrow on the spacecraft to set velocity vector
- "Launch" runs a simulation: trajectory is drawn as it unfolds
- Gravity bends the path in real time
- Multiple levels with increasing planet configurations

**UI:**
- Dark canvas with glowing planet circles and star-field
- Trajectory trace drawn as a dotted arc
- Success: spacecraft reaches target with a flare effect
- Failure: ship flies off into space or crashes, with a retry option

**Tech:**
- Simple Euler integration loop on `<canvas>` (no physics engine needed)
- 2D gravity: `F = G*m1*m2/r²` applied per frame
- Level configs as JSON (planet positions, masses, start, target)
- Medium effort — ~2–3 days

---

### 9. Dead Reckoning
**Status:** `planned`

**Concept:**
Player controls a Mars rover, but every command takes 20 minutes of simulated communication delay to arrive. They must plan a sequence of moves in advance to navigate the rover to a target without being able to react in real time.

**Mechanics:**
- Grid map of Martian terrain with obstacles and a goal marker
- Player queues up commands: move forward N steps, turn left/right
- "Send transmission" executes the queue after a visual delay countdown
- If the rover hits an obstacle, mission fails — player re-plans
- Levels increase in terrain complexity

**UI:**
- Top-down grid view, Mars color palette
- Command queue panel (drag to reorder)
- Delay countdown animation before execution
- Rover animates through the path step by step

**Tech:**
- Pure React state machine — grid positions, command queue, execution loop
- No physics needed; grid-based movement
- Level maps as JSON arrays
- Straightforward to build (~1–2 days)

---

## Build Order Suggestion

| Priority | Puzzle | Effort | Reason |
|---|---|---|---|
| 1 | Signal from Deep Space | Low | Most unique, pure CSS/SVG, fast win |
| 2 | Dead Reckoning | Low–Med | Self-contained React state, no deps |
| 3 | Turing or Not Turing | Low | Pre-scripted JSON, fast to build |
| 4 | The Cipher Room | Med | High thematic fit, escalating difficulty |
| 5 | Exoplanet Detective | Med | Needs charting + interaction |
| 6 | Neural Paint | Med | TF.js is well-documented, clear scope |
| 7 | Frequency Fingerprint | Med | Needs drag UI, richer interaction |
| 8 | Adversarial Patch | Low–Med | Pre-baked assets, mostly UI work |
| 9 | Orbital Heist | High | Canvas physics, most complex |
