export const metadata = {
  title: 'Info Center — The Exploratorium',
}

export default function InfoCenter() {
  return (
    <main className="relative min-h-screen bg-black flex flex-col items-center justify-center px-6 font-mono">
      {/* Header back link */}
      <div style={{ position: 'absolute', top: '1.5rem', left: '2rem' }}>
        <a
          href="/"
          className="text-xs tracking-widest uppercase transition-colors text-white/25 hover:text-white"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
        >
          &larr; Exploratorium
        </a>
      </div>
      <div className="max-w-xl w-full text-center space-y-6">
        <p className="text-xs tracking-[0.4em] uppercase" style={{ color: 'rgba(100,160,255,0.5)' }}>
          SSIP — Exploratorium
        </p>
        <h1 className="text-5xl font-bold tracking-tight text-white">Info Center</h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
          // information hub coming soon
        </p>
      </div>
    </main>
  )
}
