import Link from 'next/link'

const GH = {
  bg: '#0d1117',
  bgNav: '#010409',
  bgSecondary: '#161b22',
  border: '#30363d',
  text: '#e6edf3',
  textMuted: '#7d8590',
  link: '#58a6ff',
}

function OctoCat() {
  return (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="#e6edf3" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

export default function SsipProjects() {
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
          <span style={{ color: GH.text, fontWeight: 600 }}>ssip-projects</span>
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
        {['Code', 'Issues', 'Pull requests', 'Actions'].map((tab, i) => (
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

      {/* Empty state */}
      <div
        style={{
          maxWidth: 640,
          margin: '80px auto',
          padding: '0 24px',
          textAlign: 'center',
        }}
      >
        {/* Repo description banner */}
        <div
          style={{
            background: GH.bgSecondary,
            border: `1px solid ${GH.border}`,
            borderRadius: 6,
            padding: '16px 20px',
            marginBottom: 48,
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 20 }}>🚀</span>
          <p style={{ margin: 0, color: GH.textMuted, fontSize: 14 }}>
            Projects built by the SSIP community — hackathon work, research tools, and experimental
            prototypes in development.
          </p>
        </div>

        {/* GitHub-style empty state icon */}
        <div style={{ marginBottom: 24 }}>
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            style={{ color: GH.textMuted, opacity: 0.4 }}
          >
            <path
              d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 400, margin: '0 0 12px', color: GH.text }}>
          ssip-projects is being assembled
        </h2>
        <p style={{ color: GH.textMuted, fontSize: 15, margin: '0 0 32px', lineHeight: 1.6 }}>
          SSIP community projects — hackathon builds, research prototypes, and tooling — will live
          here. Check back soon, or contribute at{' '}
          <a
            href="https://ssip-pl.ch"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: GH.link, textDecoration: 'none' }}
          >
            ssip-pl.ch
          </a>
          .
        </p>

        {/* Commit-log style placeholder — adds to the dev aesthetic */}
        <div
          style={{
            border: `1px solid ${GH.border}`,
            borderRadius: 6,
            overflow: 'hidden',
            textAlign: 'left',
            marginBottom: 32,
          }}
        >
          <div
            style={{
              background: GH.bgSecondary,
              borderBottom: `1px solid ${GH.border}`,
              padding: '8px 16px',
              fontSize: 12,
              color: GH.textMuted,
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
            }}
          >
            latest commits
          </div>
          {[
            { hash: 'a3f9e12', msg: 'initial commit', ago: 'just now', author: 'ssip-bot' },
            { hash: '...', msg: 'more coming soon', ago: '—', author: '—' },
          ].map(({ hash, msg, ago, author }) => (
            <div
              key={hash}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: 16,
                padding: '10px 16px',
                borderTop: `1px solid ${GH.border}`,
                alignItems: 'center',
                fontSize: 13,
              }}
            >
              <span style={{ color: GH.textMuted }}>{msg}</span>
              <span
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                  fontSize: 12,
                  color: GH.link,
                }}
              >
                {hash}
              </span>
              <span style={{ color: GH.textMuted, fontSize: 12, whiteSpace: 'nowrap' }}>{ago}</span>
            </div>
          ))}
        </div>

        <Link
          href="/dev_branch"
          style={{
            color: GH.link,
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          ← Back to dev_branch
        </Link>
      </div>
    </div>
  )
}
