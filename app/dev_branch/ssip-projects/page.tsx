import Link from 'next/link'
import Image from 'next/image'

const GH = {
  bg: '#0d1117',
  bgNav: '#010409',
  bgSecondary: '#161b22',
  border: '#30363d',
  text: '#e6edf3',
  textMuted: '#7d8590',
  link: '#58a6ff',
}

function Logo() {
  return (
    <Image
      src="/logo-dev_branch.jpg"
      alt="SSIP"
      width={32}
      height={32}
      style={{ borderRadius: '50%' }}
    />
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
        <Logo />
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
