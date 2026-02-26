import SpaceLoader from '@/components/SpaceLoader'

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      <SpaceLoader />

      {/* Title overlay — pointer-events-none so clicks pass through to the canvas */}
      <div
        className="absolute inset-0 flex flex-col items-center pointer-events-none"
        style={{ paddingTop: '11vh' }}
      >
        <p
          className="text-xs tracking-[0.4em] uppercase mb-4"
          style={{ color: 'rgba(100,160,255,0.5)' }}
        >
          SSIP &mdash; Experimental
        </p>
        <h1
          className="text-white font-black uppercase"
          style={{
            fontSize: 'clamp(2rem, 6vw, 5.5rem)',
            letterSpacing: '0.22em',
            textShadow:
              '0 0 60px rgba(80,140,255,0.45), 0 0 20px rgba(80,140,255,0.2)',
          }}
        >
          The Exploratorium
        </h1>
        <p
          className="mt-5 text-xs tracking-[0.3em] uppercase"
          style={{ color: 'rgba(255,255,255,0.18)' }}
        >
          Explore at your own risk
        </p>
      </div>
    </main>
  )
}
