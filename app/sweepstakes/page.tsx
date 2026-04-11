import { client } from '@/lib/sanity.client'
import { sweepstakesQuery } from '@/lib/queries'
import type { Sweepstake } from '@/lib/types'
import SweepstakesCard from '@/components/SweepstakesCard'
import Link from 'next/link'

export const revalidate = 3600

export const metadata = {
  title: 'Sweepstakes — SpartanShopper',
  description: 'Enter free sweepstakes and win big prizes. Updated daily.',
}

export default async function SweepstakesPage() {
  const sweepstakes = await client
    .fetch<Sweepstake[]>(sweepstakesQuery)
    .catch(() => [] as Sweepstake[])

  // Split active (future deadline) vs ended
  const now = new Date()
  const active = sweepstakes.filter((s) => new Date(s.entryDeadline) >= now)
  const ended = sweepstakes.filter((s) => new Date(s.entryDeadline) < now)

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div style={{ backgroundColor: '#1A1A2E' }} className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-white text-4xl font-extrabold mb-2">🏆 Free Sweepstakes</h1>
          <p className="text-white/60">
            {active.length} active sweepstake{active.length !== 1 ? 's' : ''} — all free to enter
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Free entry banner */}
        <div
          style={{ backgroundColor: '#1A1A2E' }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl px-6 py-5 mb-10"
        >
          <div>
            <p className="text-white font-bold text-lg">🎉 All sweepstakes are 100% FREE to enter</p>
            <p className="text-white/60 text-sm mt-1">No purchase necessary. Just click and enter.</p>
          </div>
          <div style={{ color: '#E63946' }} className="text-3xl font-extrabold whitespace-nowrap">
            {active.length} Open Now
          </div>
        </div>

        {/* Active Sweepstakes */}
        {active.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {active.map((sweep) => (
                <SweepstakesCard
                  key={sweep._id}
                  title={sweep.title}
                  sponsor={sweep.sponsor}
                  prize={sweep.prize}
                  entryUrl={sweep.entryUrl}
                  entryDeadline={sweep.entryDeadline}
                  entryFrequency={sweep.entryFrequency}
                />
              ))}
            </div>

            {/* Ended section */}
            {ended.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-500 mb-4">Recently Ended</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
                  {ended.map((sweep) => (
                    <SweepstakesCard
                      key={sweep._id}
                      title={sweep.title}
                      sponsor={sweep.sponsor}
                      prize={sweep.prize}
                      entryUrl={sweep.entryUrl}
                      entryDeadline={sweep.entryDeadline}
                      entryFrequency={sweep.entryFrequency}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No sweepstakes found</h2>
            <p className="text-gray-400 mb-6">No active sweepstakes right now — check back soon.</p>
            <Link
              href="/"
              style={{ backgroundColor: '#E63946' }}
              className="inline-block text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition"
            >
              Back to Homepage
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
