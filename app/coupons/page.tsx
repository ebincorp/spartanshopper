import { client } from '@/lib/sanity.client'
import { couponsQuery } from '@/lib/queries'
import type { Coupon } from '@/lib/types'
import CouponCard from '@/components/CouponCard'
import Link from 'next/link'

export const revalidate = 3600

export const metadata = {
  title: 'Coupon Codes — SpartanShopper',
  description: 'Browse verified coupon codes and promo codes updated daily.',
}

export default async function CouponsPage() {
  const coupons = await client
    .fetch<Coupon[]>(couponsQuery)
    .catch(() => [] as Coupon[])

  const verified = coupons.filter((c) => c.verified)
  const unverified = coupons.filter((c) => !c.verified)
  const sorted = [...verified, ...unverified]

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div style={{ backgroundColor: '#1A1A2E' }} className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-white text-4xl font-extrabold mb-2">🏷️ Coupon Codes</h1>
          <p className="text-white/60">
            {coupons.length} coupon{coupons.length !== 1 ? 's' : ''} available
            {verified.length > 0 && ` · ${verified.length} verified`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Verified banner */}
        {verified.length > 0 && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-3 mb-8">
            <span className="text-green-600 text-xl">✓</span>
            <p className="text-green-700 text-sm font-medium">
              <strong>{verified.length} verified codes</strong> — tested and confirmed working
            </p>
          </div>
        )}

        {sorted.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((coupon) => (
              <CouponCard
                key={coupon._id}
                title={coupon.title}
                store={coupon.store}
                code={coupon.code}
                discount={coupon.discount}
                affiliateUrl={coupon.affiliateUrl}
                expiryDate={coupon.expiryDate}
                verified={coupon.verified}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏷️</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No coupons found</h2>
            <p className="text-gray-400 mb-6">No active coupon codes right now — check back soon.</p>
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
