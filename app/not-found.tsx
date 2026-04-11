import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="text-8xl mb-6">🐔</div>
        <h1
          className="text-6xl font-extrabold mb-4"
          style={{ color: '#E63946' }}
        >
          404
        </h1>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-3">
          Oops! This deal has flown the coop.
        </h2>
        <p className="text-gray-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or the deal may have expired.
        </p>
        <Link
          href="/"
          className="inline-block text-white font-extrabold px-8 py-4 rounded-xl text-sm tracking-wide transition hover:opacity-90 active:scale-95"
          style={{ backgroundColor: '#E63946' }}
        >
          Back to Homepage →
        </Link>
      </div>
    </main>
  )
}
