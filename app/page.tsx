export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-xl w-full text-center space-y-6">
        <p className="text-sm uppercase tracking-widest text-gray-500">
          SSIP — Experimental
        </p>
        <h1 className="text-4xl font-bold tracking-tight">The Exploratorium</h1>
        <p className="text-gray-400 text-lg leading-relaxed">
          A space for prototypes, hackathon projects, and ideas worth testing.
          Not everything here is finished. That&apos;s the point.
        </p>
        <a
          href="https://www.ssip-pl.ch"
          className="inline-block text-sm text-gray-600 hover:text-white transition-colors"
        >
          ssip-pl.ch
        </a>
      </div>
    </main>
  );
}
