# Exploratorium — Claude Code Context

Live at **https://exploratorium.ssip-pl.ch**
GitHub: **abisogni/ssip-exploratorium** (push to `main` → auto-deploys via Vercel)

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, inline styles |
| Images | `next/image` with `fill` + `object-fit: cover` |
| Hosting | Vercel (team: SSIP's projects) |

---

## Project Structure

```
app/
  layout.tsx          # Root layout (Geist fonts)
  page.tsx            # Home — interactive Three.js space scene
  globals.css         # Base styles; adds .hide-scrollbar utility
  palabras/
    layout.tsx        # Sets <title> for palabras
    page.tsx          # Palabras orchestrator — scroll-reveal + blog overlay
    TarotTable.tsx    # DesktopGrid + MobileView exports (the card spread)
    BlogView.tsx      # Placeholder blog posts per topic
    OuijaBoard.tsx    # Earlier prototype (unused, kept for reference)
  dev_branch/         # Dev branch section (GitHub-themed)
  event_log/          # Event log page
  afkkwpd/            # Hidden admin page
tarot/                # Tarot card images (1024×1536 JPG, 2:3 ratio)
public/
  tarot -> ../tarot   # Symlink so Next.js serves images at /tarot/*
```

---

## palabras page — current state (Feb 2026)

### Flow

1. **Intro animation** — word scramble: parabolé → parabola → parable → palabras (Geist Mono, white on black)
2. After 1.2 s hold → **auto-scroll** to section 2 (scrollbar hidden)
3. **Section 2** — dark medieval background + "palabras" serif header + subtitle + tarot spread

### Tarot spread (desktop)

- **Layout**: 5 × 2 grid of cards, `15.4%` width each, `2%` gap
- **Scrambled order** (hardcoded): Intelligence, Habitat, Ghost, Platform, Astronaut / Enlightened, Alchemist, Botanist, Maker, Entities
- Each card has a fixed subtle rotation (±3.5°); hover straightens, lifts, scales, emits gold glow
- Hover label fades in below card: serif, `0.65rem`, vivid amber `rgba(222,148,18,0.97)`
- Clicking a card fades in **BlogView** overlay (z-index 50)

### Topics / card mapping

| Card file | Card title | Topic ID | Label shown on hover |
|---|---|---|---|
| tarot-the_intelligence.jpg | The Intelligence | `ai-ml` | AI & ML News |
| tarot-the_habitat.jpg | The Habitat | `space-station` | Space Station News |
| tarot-the_ghost.jpg | The Ghost | `cybersecurity` | Cybersecurity News |
| tarot-the_platform.jpg | The Platform | `ssip` | SSIP News |
| tarot-the_astronaut.jpg | The Astronaut | `space-news` | Space News |
| tarot-the_enlightened.jpg | The Enlightened | `swiss-uni` | Local Discoveries |
| tarot-the_alchemist.jpg | The Alchemist | `pharmaceuticals` | Pharmaceutical Science |
| tarot-the_botanist.jpg | The Botanist | `life-sciences` | Life Sciences |
| tarot-the_maker.jpg | The Maker | `materials` | Materials Science |
| tarot-the_entities.jpg | The Entities | `space-agencies` | Space Agencies |

### Background (section 2)
Six radial gradient pools over `#09060c`:
crimson (top-right), emerald (left-mid), amber/candlelight (bottom-center),
violet (bottom-left), wine (bottom-right), teal-smoke (top-center)

### Mobile
Below 768 px: MobileView — each card full-viewport-height with `scroll-snap-type: y mandatory`.
After intro, cards fade in (no scroll-reveal on mobile).

### BlogView
Placeholder posts per topic (3 each). All topics populated.
"← back to the cards" returns to the spread.

---

## Next steps (not yet built)

- Wire real content feeds per topic (RSS aggregation or CMS)
- Mobile scroll-reveal (currently just a fade-in)
- Card back-face / flip animation on click before blog opens
- Consider adding more tarot cards for future topic expansions
