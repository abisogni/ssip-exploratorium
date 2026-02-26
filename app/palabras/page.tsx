export const metadata = {
  title: 'palabras — The Exploratorium',
}

export default function Palabras() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-xl w-full text-center space-y-6">
        <p className="text-xs tracking-[0.4em] uppercase" style={{ color: 'rgba(100,160,255,0.5)' }}>
          SSIP — Exploratorium
        </p>
        <h1 className="text-5xl font-bold tracking-tight">palabras</h1>
        <p className="text-base" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Coming soon.
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
