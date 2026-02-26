export const metadata = {
  title: 'dev_branch — The Exploratorium',
}

export default function DevBranch() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 font-mono">
      <div className="max-w-xl w-full text-center space-y-6">
        <p className="text-xs tracking-[0.4em] uppercase" style={{ color: 'rgba(100,160,255,0.5)' }}>
          SSIP — Exploratorium
        </p>
        <h1 className="text-5xl font-bold tracking-tight">dev_branch</h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
          // experiments in progress
        </p>
        <a
          href="/"
          className="inline-block text-xs tracking-widest uppercase transition-colors text-white/25 hover:text-white"
        >
          &larr; return
        </a>
      </div>
    </main>
  )
}
