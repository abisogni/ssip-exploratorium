import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SSipHub',
}

export default function DevBranchLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Hover states and GitHub-specific resets that can't live in inline styles */}
      <style>{`
        .gh-repo-card:hover { background-color: #161b22; }
        .gh-repo-link:hover { text-decoration: underline; }
        .gh-nav-link:hover { color: #e6edf3 !important; }
        .gh-tab-active { border-bottom: 2px solid #f78166; color: #e6edf3 !important; }
        .gh-topic:hover { background: rgba(31,111,235,0.3) !important; }
        .gh-btn:hover { background: #30363d !important; border-color: #8b949e !important; }
        .gh-input:focus { border-color: #1f6feb !important; outline: none; box-shadow: 0 0 0 3px rgba(31,111,235,0.3); }
        .gh-api-row:hover { background: #161b22; }
        .gh-proj-card:hover { border-color: #58a6ff !important; }
        .gh-breadcrumb a:hover { text-decoration: underline; }
      `}</style>
      {children}
    </>
  )
}
