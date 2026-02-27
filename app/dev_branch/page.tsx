import Link from 'next/link'
import type { CSSProperties } from 'react'

const GH = {
  bg: '#0d1117',
  bgNav: '#010409',
  bgSecondary: '#161b22',
  bgTertiary: '#21262d',
  border: '#30363d',
  text: '#e6edf3',
  textMuted: '#7d8590',
  link: '#58a6ff',
  green: '#3fb950',
  orange: '#f78166',
  blue: '#1f6feb',
  yellow: '#e3b341',
}

const REPOS = [
  {
    slug: 'space-apis',
    name: 'space-apis',
    description:
      'A curated directory of open REST APIs for space exploration, astronomy, satellite tracking, and Earth observation.',
    language: 'JSON',
    langColor: '#f1e05a',
    stars: 0,
    forks: 0,
    isPublic: true,
    topics: ['space', 'api', 'nasa', 'astronomy', 'open-data'],
  },
  {
    slug: 'open-source',
    name: 'open-source',
    description:
      'Handpicked open-source projects in aerospace engineering, astrodynamics, mission operations, and spacecraft simulation.',
    language: 'Python',
    langColor: '#3572A5',
    stars: 0,
    forks: 0,
    isPublic: true,
    topics: ['space', 'open-source', 'astrodynamics', 'mission-ops'],
  },
  {
    slug: 'ssip-projects',
    name: 'ssip-projects',
    description:
      'Projects built by the SSIP community — hackathon work, research tools, and experimental prototypes in development.',
    language: 'TypeScript',
    langColor: '#3178c6',
    stars: 0,
    forks: 0,
    isPublic: false,
    topics: ['ssip', 'hackathon', 'space', 'prototypes'],
  },
]

// Octocat SVG
function OctoCat() {
  return (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="#e6edf3" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

const nav: CSSProperties = {
  background: GH.bgNav,
  borderBottom: `1px solid ${GH.border}`,
  padding: '12px 24px',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  position: 'sticky',
  top: 0,
  zIndex: 100,
}

const badge = (pub: boolean): CSSProperties => ({
  border: `1px solid ${GH.border}`,
  borderRadius: 99,
  padding: '1px 8px',
  fontSize: 12,
  color: GH.textMuted,
})

export default function DevBranch() {
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
      <header style={nav}>
        <OctoCat />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15 }}>
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
          <span style={{ color: GH.text, fontWeight: 600 }}>dev_branch</span>
        </div>
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

      {/* Org body */}
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
        {/* ── Sidebar ── */}
        <aside style={{ width: 272, flexShrink: 0 }}>
          {/* Avatar */}
          <div
            style={{
              width: 260,
              height: 260,
              borderRadius: 6,
              background: '#1c2128',
              border: `1px solid ${GH.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              fontSize: 72,
              fontWeight: 900,
              color: GH.link,
              letterSpacing: '-4px',
              fontFamily: 'monospace',
              userSelect: 'none',
            }}
          >
            SSIP
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 400, margin: '0 0 4px' }}>SSIP</h1>
          <p style={{ color: GH.textMuted, margin: '0 0 16px', fontSize: 14 }}>
            Space Systems Innovation Platform
          </p>

          <hr style={{ border: 'none', borderTop: `1px solid ${GH.border}`, margin: '16px 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, color: GH.textMuted, fontSize: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🌐</span>
              <a href="https://ssip-pl.ch" target="_blank" rel="noopener noreferrer" style={{ color: GH.link, textDecoration: 'none' }}>
                ssip-pl.ch
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📍</span>
              <span>Switzerland</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🛰</span>
              <span>Space Systems Innovation</span>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: `1px solid ${GH.border}`, margin: '16px 0' }} />

          <div style={{ fontSize: 13, color: GH.textMuted }}>
            <strong style={{ color: GH.text }}>3</strong>&nbsp;repositories
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: `1px solid ${GH.border}`,
              marginBottom: 24,
              gap: 0,
            }}
          >
            {[
              { label: 'Repositories', count: 3, active: true },
              { label: 'Projects', count: null, active: false },
              { label: 'Members', count: null, active: false },
            ].map(({ label, count, active }) => (
              <div
                key={label}
                className={active ? 'gh-tab-active' : ''}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  color: active ? GH.text : GH.textMuted,
                  cursor: 'pointer',
                  marginBottom: active ? -1 : 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {label}
                {count !== null && (
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
                    {count}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Filter row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              placeholder="Find a repository…"
              className="gh-input"
              style={{
                flex: 1,
                background: 'transparent',
                border: `1px solid ${GH.border}`,
                borderRadius: 6,
                padding: '5px 12px',
                color: GH.textMuted,
                fontSize: 14,
              }}
            />
            {['Type', 'Language', 'Sort'].map((label) => (
              <select
                key={label}
                style={{
                  background: GH.bgSecondary,
                  border: `1px solid ${GH.border}`,
                  borderRadius: 6,
                  padding: '5px 12px',
                  color: GH.text,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <option>{label}</option>
              </select>
            ))}
          </div>

          {/* Repo list */}
          <div>
            {REPOS.map((repo) => (
              <div
                key={repo.slug}
                className="gh-repo-card"
                style={{
                  borderTop: `1px solid ${GH.border}`,
                  padding: '24px 16px',
                  transition: 'background 0.1s',
                  cursor: 'default',
                }}
              >
                {/* Name + badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Link
                    href={`/dev_branch/${repo.slug}`}
                    className="gh-repo-link"
                    style={{ color: GH.link, textDecoration: 'none', fontWeight: 600, fontSize: 16 }}
                  >
                    {repo.name}
                  </Link>
                  <span style={badge(repo.isPublic)}>{repo.isPublic ? 'Public' : 'Internal'}</span>
                </div>

                {/* Description */}
                <p style={{ color: GH.textMuted, fontSize: 13, margin: '0 0 10px', maxWidth: 560 }}>
                  {repo.description}
                </p>

                {/* Topics */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                  {repo.topics.map((t) => (
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

                {/* Meta */}
                <div style={{ display: 'flex', gap: 16, color: GH.textMuted, fontSize: 12, alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: repo.langColor,
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    {repo.language}
                  </span>
                  <span>⭐ {repo.stars}</span>
                  <span>⑂ {repo.forks}</span>
                  <span>Updated today</span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
