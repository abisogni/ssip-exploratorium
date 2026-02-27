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

type AuthLevel = 'None' | 'API Key' | 'OAuth Token'
type Category = 'General' | 'ISS / Tracking' | 'Launches' | 'Exoplanets' | 'Space Weather' | 'Stellar' | 'Research' | 'Planetary'

interface API {
  name: string
  provider: string
  description: string
  baseUrl: string
  auth: AuthLevel
  category: Category
  docs: string
  tags: string[]
}

const APIS: API[] = [
  {
    name: 'NASA Open APIs',
    provider: 'NASA',
    description:
      'APOD, Mars Rover Photos, Near Earth Objects, DONKI space weather, Earth imagery, Exoplanets, and more — all in one portal.',
    baseUrl: 'api.nasa.gov',
    auth: 'API Key',
    category: 'General',
    docs: 'https://api.nasa.gov',
    tags: ['APOD', 'Mars', 'NeoWs', 'DONKI'],
  },
  {
    name: 'Open Notify',
    provider: 'Nathan Bergey',
    description:
      'Real-time ISS current location (lat/lon), ISS pass predictions for a ground location, and current count of humans in space.',
    baseUrl: 'api.open-notify.org',
    auth: 'None',
    category: 'ISS / Tracking',
    docs: 'http://open-notify.org',
    tags: ['ISS', 'real-time', 'pass-times'],
  },
  {
    name: 'Where the ISS at?',
    provider: 'Open-source',
    description:
      'ISS current position, velocity, altitude, and visibility. Also supports TLE retrieval for the station.',
    baseUrl: 'api.wheretheiss.at/v1',
    auth: 'None',
    category: 'ISS / Tracking',
    docs: 'https://wheretheiss.at/w/developer',
    tags: ['ISS', 'TLE', 'position'],
  },
  {
    name: 'SpaceX API',
    provider: 'r-spacex (community)',
    description:
      'Launches, rockets, capsules, launchpads, payloads, cores, and Starlink satellite data from SpaceX. Actively maintained.',
    baseUrl: 'api.spacexdata.com/v5',
    auth: 'None',
    category: 'Launches',
    docs: 'https://github.com/r-spacex/SpaceX-API',
    tags: ['SpaceX', 'launches', 'Starlink', 'Falcon'],
  },
  {
    name: 'CelesTrak',
    provider: 'Dr. T.S. Kelso',
    description:
      'TLE (Two-Line Element) orbital data for thousands of satellites. Updated multiple times per day. The de-facto standard TLE source.',
    baseUrl: 'celestrak.org/SOCRATES',
    auth: 'None',
    category: 'ISS / Tracking',
    docs: 'https://celestrak.org',
    tags: ['TLE', 'orbital-elements', 'satellites'],
  },
  {
    name: 'NASA Exoplanet Archive',
    provider: 'NASA / Caltech',
    description:
      'TAP (Table Access Protocol) service for 5,000+ confirmed exoplanets. Supports complex ADQL queries for stellar and planetary parameters.',
    baseUrl: 'exoplanetarchive.ipac.caltech.edu/TAP',
    auth: 'None',
    category: 'Exoplanets',
    docs: 'https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html',
    tags: ['exoplanets', 'TAP', 'ADQL', 'confirmed'],
  },
  {
    name: 'NOAA Space Weather',
    provider: 'NOAA / SWPC',
    description:
      'Real-time solar wind, geomagnetic indices (Kp), solar flare events, and ionospheric disturbance data. JSON feeds, no auth required.',
    baseUrl: 'services.swpc.noaa.gov/json',
    auth: 'None',
    category: 'Space Weather',
    docs: 'https://www.swpc.noaa.gov/developers',
    tags: ['solar', 'Kp-index', 'geomagnetic', 'CME'],
  },
  {
    name: 'ESA Gaia Archive',
    provider: 'ESA / ESAC',
    description:
      'TAP access to the Gaia DR3 catalogue — 1.8 billion stellar sources with astrometry, photometry, and spectroscopy.',
    baseUrl: 'gea.esac.esa.int/tap-server/tap',
    auth: 'None',
    category: 'Stellar',
    docs: 'https://gea.esac.esa.int/archive/documentation',
    tags: ['Gaia', 'DR3', 'stellar', 'ESA', 'TAP'],
  },
  {
    name: 'NASA ADS',
    provider: 'Harvard / NASA',
    description:
      'Astrophysics Data System — search and retrieve 14M+ astronomy and physics papers, citations, and references via REST.',
    baseUrl: 'api.adsabs.harvard.edu/v1',
    auth: 'OAuth Token',
    category: 'Research',
    docs: 'https://ui.adsabs.harvard.edu/help/api',
    tags: ['papers', 'citations', 'literature', 'astronomy'],
  },
  {
    name: 'Solar System OpenData',
    provider: 'imcce.fr',
    description:
      'Orbital data and physical parameters for Solar System bodies: planets, moons, asteroids, comets. Clean JSON REST API.',
    baseUrl: 'api.le-systeme-solaire.net/rest',
    auth: 'None',
    category: 'Planetary',
    docs: 'https://api.le-systeme-solaire.net',
    tags: ['solar-system', 'planets', 'moons', 'asteroids'],
  },
]

const AUTH_COLOR: Record<AuthLevel, { bg: string; text: string }> = {
  None: { bg: 'rgba(63,185,80,0.15)', text: '#3fb950' },
  'API Key': { bg: 'rgba(210,153,34,0.15)', text: '#e3b341' },
  'OAuth Token': { bg: 'rgba(163,113,247,0.15)', text: '#a371f7' },
}

const CAT_COLOR: Record<Category, string> = {
  General: '#58a6ff',
  'ISS / Tracking': '#3fb950',
  Launches: '#f78166',
  Exoplanets: '#a371f7',
  'Space Weather': '#e3b341',
  Stellar: '#79c0ff',
  Research: '#7d8590',
  Planetary: '#ffa657',
}

function OctoCat() {
  return (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="#e6edf3" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

export default function SpaceApis() {
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
          <span style={{ color: GH.text, fontWeight: 600 }}>space-apis</span>
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
          gap: 0,
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
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: i === 0 ? -1 : 0,
            }}
          >
            {tab}
            {i === 1 && (
              <span
                style={{
                  background: GH.bgTertiary,
                  border: `1px solid ${GH.border}`,
                  borderRadius: 99,
                  padding: '0 6px',
                  fontSize: 12,
                  color: GH.textMuted,
                }}
              >
                0
              </span>
            )}
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
        {/* Main — API table */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* Repo description */}
          <div
            style={{
              background: GH.bgSecondary,
              border: `1px solid ${GH.border}`,
              borderRadius: 6,
              padding: '16px 20px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 20 }}>📡</span>
            <p style={{ margin: 0, color: GH.textMuted, fontSize: 14 }}>
              A curated directory of open REST APIs for space exploration, astronomy, and Earth
              observation. All endpoints are publicly accessible unless noted.
            </p>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', fontSize: 12 }}>
            {(Object.entries(AUTH_COLOR) as [AuthLevel, { bg: string; text: string }][]).map(
              ([level, { bg, text }]) => (
                <span
                  key={level}
                  style={{
                    background: bg,
                    color: text,
                    borderRadius: 99,
                    padding: '2px 10px',
                  }}
                >
                  {level}
                </span>
              )
            )}
            <span style={{ color: GH.textMuted, marginLeft: 4 }}>← auth required</span>
          </div>

          {/* API table */}
          <div
            style={{
              border: `1px solid ${GH.border}`,
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                background: GH.bgSecondary,
                borderBottom: `1px solid ${GH.border}`,
                padding: '8px 16px',
                fontSize: 12,
                color: GH.textMuted,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <span>API / Description</span>
              <span>Category</span>
              <span>Auth</span>
              <span>Base URL</span>
            </div>

            {/* Rows */}
            {APIS.map((api, i) => (
              <div
                key={api.name}
                className="gh-api-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  padding: '16px',
                  borderTop: i > 0 ? `1px solid ${GH.border}` : 'none',
                  gap: 12,
                  alignItems: 'start',
                  transition: 'background 0.1s',
                }}
              >
                {/* Name + desc + tags */}
                <div>
                  <a
                    href={api.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gh-repo-link"
                    style={{
                      color: GH.link,
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: 14,
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    {api.name}
                  </a>
                  <p style={{ color: GH.textMuted, fontSize: 12, margin: '0 0 8px', lineHeight: 1.5 }}>
                    {api.description}
                  </p>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {api.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          background: 'rgba(31,111,235,0.12)',
                          color: '#58a6ff',
                          borderRadius: 99,
                          padding: '1px 8px',
                          fontSize: 11,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div style={{ paddingTop: 2 }}>
                  <span
                    style={{
                      color: CAT_COLOR[api.category],
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {api.category}
                  </span>
                  <div style={{ color: GH.textMuted, fontSize: 11, marginTop: 2 }}>
                    {api.provider}
                  </div>
                </div>

                {/* Auth */}
                <div style={{ paddingTop: 2 }}>
                  <span
                    style={{
                      background: AUTH_COLOR[api.auth].bg,
                      color: AUTH_COLOR[api.auth].text,
                      borderRadius: 99,
                      padding: '2px 10px',
                      fontSize: 12,
                    }}
                  >
                    {api.auth}
                  </span>
                </div>

                {/* Base URL */}
                <div style={{ paddingTop: 2 }}>
                  <code
                    style={{
                      fontFamily:
                        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                      fontSize: 11,
                      color: '#79c0ff',
                      wordBreak: 'break-all',
                    }}
                  >
                    {api.baseUrl}
                  </code>
                </div>
              </div>
            ))}
          </div>

          <p style={{ color: GH.textMuted, fontSize: 12, marginTop: 16 }}>
            {APIS.length} APIs listed &mdash; submit additions via the{' '}
            <a
              href="https://github.com/abisogni/ssip-exploratorium"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: GH.link, textDecoration: 'none' }}
            >
              ssip-exploratorium repo
            </a>
            .
          </p>
        </main>

        {/* Sidebar — About */}
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
            A curated directory of open space APIs — no paywalls, publicly accessible, or free-tier
            available.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
            {['space', 'api', 'nasa', 'esa', 'astronomy', 'open-data'].map((t) => (
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

          <div style={{ fontSize: 13, color: GH.textMuted }}>
            <div style={{ marginBottom: 8 }}>
              <strong style={{ color: GH.text }}>10</strong> APIs
            </div>
            <div>
              <strong style={{ color: GH.text }}>3</strong> auth types
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: `1px solid ${GH.border}`, margin: '16px 0' }} />

          <div style={{ fontSize: 13 }}>
            <p style={{ color: GH.textMuted, margin: '0 0 8px' }}>Languages used:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { lang: 'JSON', color: '#f1e05a', pct: 70 },
                { lang: 'Python', color: '#3572A5', pct: 20 },
                { lang: 'REST', color: '#3fb950', pct: 10 },
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
