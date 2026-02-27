import Link from 'next/link'

const GH = {
  bg: '#0d1117',
  bgNav: '#010409',
  bgSecondary: '#161b22',
  bgTertiary: '#21262d',
  border: '#30363d',
  text: '#e6edf3',
  textMuted: '#7d8590',
  link: '#58a6ff',
}

interface Project {
  name: string
  org: string
  language: string
  langColor: string
  stars: string
  description: string
  url: string
  topics: string[]
  category: string
}

const PROJECTS: Project[] = [
  {
    name: 'OpenMCT',
    org: 'nasa',
    language: 'JavaScript',
    langColor: '#f1e05a',
    stars: '11.9k',
    description:
      'Next-generation mission control data visualization framework developed at NASA Ames. Displays telemetry from spacecraft, rovers, and ground systems in real time. Highly extensible plugin architecture.',
    url: 'https://github.com/nasa/openmct',
    topics: ['mission-control', 'telemetry', 'visualization', 'nasa'],
    category: 'Mission Operations',
  },
  {
    name: 'F Prime (fprime)',
    org: 'nasa',
    language: 'C++',
    langColor: '#f34b7d',
    stars: '9.8k',
    description:
      'Flight software and embedded systems framework originally developed for the Mars Cube One CubeSats and used in the Mars Ingenuity helicopter. Deployable on resource-constrained hardware.',
    url: 'https://github.com/nasa/fprime',
    topics: ['flight-software', 'embedded', 'cubesat', 'nasa', 'mars'],
    category: 'Flight Software',
  },
  {
    name: 'Astropy',
    org: 'astropy',
    language: 'Python',
    langColor: '#3572A5',
    stars: '4.4k',
    description:
      'Community Python library for astronomy. Handles FITS files, celestial coordinates, time systems, cosmological calculations, units, and more. The foundation of almost all Python-based astronomy pipelines.',
    url: 'https://github.com/astropy/astropy',
    topics: ['astronomy', 'python', 'fits', 'coordinates', 'cosmology'],
    category: 'Astronomy / Science',
  },
  {
    name: 'poliastro',
    org: 'poliastro',
    language: 'Python',
    langColor: '#3572A5',
    stars: '700',
    description:
      'Astrodynamics and orbital mechanics in Python. Compute transfers, plot orbits, propagate trajectories, and visualize interplanetary missions. Interactive Jupyter notebook support.',
    url: 'https://github.com/poliastro/poliastro',
    topics: ['orbital-mechanics', 'astrodynamics', 'python', 'hohmann', 'transfers'],
    category: 'Astrodynamics',
  },
  {
    name: 'Orekit',
    org: 'CS Group',
    language: 'Java',
    langColor: '#b07219',
    stars: '900',
    description:
      'Industrial-grade space flight dynamics library. Covers orbit determination, attitude control, event detection, and frame transformations. Used by ESA, CNES, and aerospace industry.',
    url: 'https://github.com/CS-SI/Orekit',
    topics: ['orbit-determination', 'attitude', 'java', 'esa', 'flight-dynamics'],
    category: 'Astrodynamics',
  },
  {
    name: 'SatNOGS',
    org: 'Libre Space Foundation',
    language: 'Python',
    langColor: '#3572A5',
    stars: '300',
    description:
      'Global open-source network of amateur satellite ground stations. Crowdsources satellite observation data. Any licensed operator can contribute a station and access all observations.',
    url: 'https://github.com/satnogs/satnogs-network',
    topics: ['satellites', 'ground-station', 'ham-radio', 'crowdsourced', 'open-hardware'],
    category: 'Ground Segment',
  },
  {
    name: 'SPICE Toolkit (SpiceyPy)',
    org: 'NASA / NAIF',
    language: 'Python',
    langColor: '#3572A5',
    stars: '400',
    description:
      'Python wrapper for NASA\'s SPICE navigation and ancillary information system. Compute spacecraft positions, orientations, and instrument pointing for any NASA mission using published kernels.',
    url: 'https://github.com/AndrewAnnex/SpiceyPy',
    topics: ['spice', 'navigation', 'nasa', 'kernels', 'pointing'],
    category: 'Navigation',
  },
  {
    name: 'Basilisk',
    org: 'AVS Lab, CU Boulder',
    language: 'C / Python',
    langColor: '#555555',
    stars: '200',
    description:
      'Fast spacecraft simulation framework for GNC algorithm development and hardware-in-the-loop testing. Modular architecture, Monte Carlo support, and hardware interface capabilities.',
    url: 'https://hanspeterschaub.info/basilisk',
    topics: ['gnc', 'simulation', 'cubesat', 'monte-carlo', 'attitude-control'],
    category: 'Simulation',
  },
]

const LANG_COLOR: Record<string, string> = {
  JavaScript: '#f1e05a',
  'C++': '#f34b7d',
  Python: '#3572A5',
  Java: '#b07219',
  'C / Python': '#555555',
}

function OctoCat() {
  return (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="#e6edf3" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

const CATEGORIES = [...new Set(PROJECTS.map((p) => p.category))]

export default function OpenSource() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflowY: 'auto',
        background: GH.bg,
        color: GH.text,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      {/* Top nav */}
      <header
        style={{
          background: GH.bgNav,
          borderBottom: `1px solid ${GH.border}`,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <OctoCat />
        <nav
          className="gh-breadcrumb"
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 15 }}
        >
          <a
            href="https://ssip-pl.ch"
            target="_blank"
            rel="noopener noreferrer"
            className="gh-nav-link"
            style={{ color: GH.textMuted, textDecoration: 'none', fontWeight: 600 }}
          >
            SSIP
          </a>
          <span style={{ color: GH.textMuted }}>/</span>
          <Link
            href="/dev_branch"
            className="gh-nav-link"
            style={{ color: GH.textMuted, textDecoration: 'none', fontWeight: 600 }}
          >
            dev_branch
          </Link>
          <span style={{ color: GH.textMuted }}>/</span>
          <span style={{ color: GH.text, fontWeight: 600 }}>open-source</span>
        </nav>
        <div style={{ marginLeft: 'auto' }}>
          <Link
            href="/"
            className="gh-nav-link"
            style={{ color: GH.textMuted, textDecoration: 'none', fontSize: 13 }}
          >
            ← return to explorer
          </Link>
        </div>
      </header>

      {/* Repo sub-nav */}
      <div
        style={{
          background: GH.bg,
          borderBottom: `1px solid ${GH.border}`,
          padding: '0 24px',
          display: 'flex',
        }}
      >
        {['Code', 'Issues', 'Pull requests', 'Actions', 'Wiki'].map((tab, i) => (
          <div
            key={tab}
            className={i === 0 ? 'gh-tab-active' : ''}
            style={{
              padding: '12px 16px',
              fontSize: 14,
              color: i === 0 ? GH.text : GH.textMuted,
              cursor: 'pointer',
              marginBottom: i === 0 ? -1 : 0,
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '32px 24px',
          display: 'flex',
          gap: 32,
          alignItems: 'flex-start',
        }}
      >
        {/* Main — project cards */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* Intro */}
          <div
            style={{
              background: GH.bgSecondary,
              border: `1px solid ${GH.border}`,
              borderRadius: 6,
              padding: '16px 20px',
              marginBottom: 28,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 20 }}>🔭</span>
            <p style={{ margin: 0, color: GH.textMuted, fontSize: 14 }}>
              Handpicked open-source projects in aerospace engineering, orbital mechanics, mission
              operations, and spacecraft simulation. All projects are actively maintained.
            </p>
          </div>

          {/* Projects by category */}
          {CATEGORIES.map((cat) => {
            const group = PROJECTS.filter((p) => p.category === cat)
            return (
              <div key={cat} style={{ marginBottom: 32 }}>
                <h2
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    margin: '0 0 12px',
                    color: GH.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {cat}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {group.map((proj, i) => (
                    <div
                      key={proj.name}
                      className="gh-proj-card"
                      style={{
                        background: GH.bgSecondary,
                        border: `1px solid ${GH.border}`,
                        borderRadius: i === 0 ? '6px 6px 0 0' : i === group.length - 1 ? '0 0 6px 6px' : '0',
                        padding: '16px 20px',
                        transition: 'border-color 0.1s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Header row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                            <a
                              href={proj.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="gh-repo-link"
                              style={{
                                color: GH.link,
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: 15,
                              }}
                            >
                              {proj.org} / {proj.name}
                            </a>
                            <span
                              style={{
                                border: `1px solid ${GH.border}`,
                                borderRadius: 99,
                                padding: '1px 8px',
                                fontSize: 11,
                                color: GH.textMuted,
                              }}
                            >
                              Public
                            </span>
                          </div>

                          {/* Description */}
                          <p style={{ color: GH.textMuted, fontSize: 13, margin: '0 0 10px', lineHeight: 1.6 }}>
                            {proj.description}
                          </p>

                          {/* Topics */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                            {proj.topics.map((t) => (
                              <span
                                key={t}
                                className="gh-topic"
                                style={{
                                  background: 'rgba(31,111,235,0.12)',
                                  color: '#58a6ff',
                                  borderRadius: 99,
                                  padding: '2px 8px',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                  transition: 'background 0.1s',
                                }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>

                          {/* Meta */}
                          <div style={{ display: 'flex', gap: 16, color: GH.textMuted, fontSize: 12, alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span
                                style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  background: proj.langColor,
                                  display: 'inline-block',
                                  flexShrink: 0,
                                }}
                              />
                              {proj.language}
                            </span>
                            <span>⭐ {proj.stars}</span>
                            <a
                              href={proj.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="gh-repo-link"
                              style={{ color: GH.link, textDecoration: 'none', marginLeft: 'auto' }}
                            >
                              View on GitHub →
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </main>

        {/* Sidebar */}
        <aside style={{ width: 248, flexShrink: 0 }}>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              margin: '0 0 16px',
              paddingBottom: 8,
              borderBottom: `1px solid ${GH.border}`,
            }}
          >
            About
          </h2>
          <p style={{ color: GH.textMuted, fontSize: 13, lineHeight: 1.6, margin: '0 0 16px' }}>
            Handpicked open-source projects in aerospace, astrodynamics, and spacecraft engineering.
            Actively maintained. Battle-tested.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
            {['space', 'open-source', 'nasa', 'astrodynamics', 'python', 'mission-ops'].map((t) => (
              <span
                key={t}
                className="gh-topic"
                style={{
                  background: 'rgba(31,111,235,0.15)',
                  color: '#58a6ff',
                  borderRadius: 99,
                  padding: '2px 10px',
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
              >
                {t}
              </span>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: `1px solid ${GH.border}`, margin: '16px 0' }} />

          <div style={{ fontSize: 13, color: GH.textMuted, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <strong style={{ color: GH.text }}>{PROJECTS.length}</strong> projects listed
            </div>
            <div>
              <strong style={{ color: GH.text }}>{CATEGORIES.length}</strong> categories
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: `1px solid ${GH.border}`, margin: '16px 0' }} />

          <div style={{ fontSize: 13 }}>
            <p style={{ color: GH.textMuted, margin: '0 0 10px' }}>Languages</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { lang: 'Python', color: '#3572A5', pct: 50 },
                { lang: 'C++', color: '#f34b7d', pct: 20 },
                { lang: 'JavaScript', color: '#f1e05a', pct: 15 },
                { lang: 'Java', color: '#b07219', pct: 10 },
                { lang: 'C', color: '#555555', pct: 5 },
              ].map(({ lang, color, pct }) => (
                <div key={lang} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: GH.text }}>{lang}</span>
                  <span style={{ color: GH.textMuted, marginLeft: 'auto' }}>{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
