import Link from 'next/link'
import { client, urlFor } from '@/lib/sanity.client'
import {
  featuredDealsQuery,
  featuredCouponsQuery,
  featuredSweepstakesQuery,
} from '@/lib/queries'
import type { Deal, Coupon, Sweepstake } from '@/lib/types'
import DealCard from '@/components/DealCard'
import CouponCard from '@/components/CouponCard'
import SweepstakesCard from '@/components/SweepstakesCard'

async function getData() {
  try {
    const [deals, coupons, sweepstakes] = await Promise.all([
      client.fetch<Deal[]>(featuredDealsQuery),
      client.fetch<Coupon[]>(featuredCouponsQuery),
      client.fetch<Sweepstake[]>(featuredSweepstakesQuery),
    ])
    return { deals, coupons, sweepstakes }
  } catch {
    return { deals: [], coupons: [], sweepstakes: [] }
  }
}

export default async function HomePage() {
  const { deals, coupons, sweepstakes } = await getData()

  return (
    <main>
      {/* ===== HERO ===== */}
      <section
        style={{ backgroundColor: '#1A1A2E' }}
        className="py-20 px-4 text-center relative overflow-hidden"
      >
        <div
          style={{ backgroundColor: '#E63946' }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-10 blur-3xl rounded-full pointer-events-none"
        />
        <div className="relative max-w-3xl mx-auto">
          <div
            style={{ backgroundColor: '#E63946' }}
            className="inline-block text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
          >
            Updated Daily
          </div>
          <h1 className="text-white text-5xl sm:text-6xl font-extrabold leading-tight mb-5 tracking-tight">
            Save Big.{' '}
            <span style={{ color: '#E63946' }}>Enter to Win.</span>
            <br />
            Shop Smart.
          </h1>
          <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
            The freshest deals, verified coupon codes, and free sweepstakes — all in one place.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/deals"
              style={{ backgroundColor: '#E63946' }}
              className="text-white font-bold px-8 py-3.5 rounded-xl hover:opacity-90 transition active:scale-95 text-sm"
            >
              Browse Deals →
            </Link>
            <Link
              href="/sweepstakes"
              className="text-white font-bold px-8 py-3.5 rounded-xl hover:bg-white/10 transition border border-white/20 text-sm"
            >
              Enter Sweepstakes
            </Link>
          </div>
          <div className="flex justify-center gap-10 mt-12 flex-wrap">
            {[
              { num: '500+', label: 'Active Deals' },
              { num: '200+', label: 'Coupon Codes' },
              { num: '50+', label: 'Sweepstakes' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div style={{ color: '#E63946' }} className="text-3xl font-extrabold">{stat.num}</div>
                <div className="text-white/50 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LATEST DEALS ===== */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">🔥 Latest Deals</h2>
              <p className="text-gray-500 text-sm mt-1">Hand-picked savings updated daily</p>
            </div>
            <Link
              href="/deals"
              style={{ color: '#E63946' }}
              className="font-bold text-sm border-2 border-[#E63946] px-4 py-2 rounded-xl hover:bg-[#E63946] hover:text-white transition"
            >
              View All →
            </Link>
          </div>
          {deals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.map((deal) => (
                <DealCard
                  key={deal._id}
                  title={deal.title}
                  store={deal.store}
                  salePrice={deal.salePrice}
                  originalPrice={deal.originalPrice}
                  affiliateUrl={deal.affiliateUrl}
                  image={deal.image ? urlFor(deal.image).width(400).url() : undefined}
                  expiryDate={deal.expiryDate}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-10">No deals yet — check back soon.</p>
          )}
        </div>
      </section>

      {/* ===== LATEST COUPONS ===== */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">🏷️ Coupon Codes</h2>
              <p className="text-gray-500 text-sm mt-1">Verified codes that actually work</p>
            </div>
            <Link
              href="/coupons"
              style={{ color: '#E63946' }}
              className="font-bold text-sm border-2 border-[#E63946] px-4 py-2 rounded-xl hover:bg-[#E63946] hover:text-white transition"
            >
              View All →
            </Link>
          </div>
          {coupons.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.map((coupon) => (
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
            <p className="text-gray-400 text-center py-10">No coupons yet — check back soon.</p>
          )}
        </div>
      </section>

      {/* ===== SWEEPSTAKES ===== */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">🏆 Active Sweepstakes</h2>
              <p className="text-gray-500 text-sm mt-1">100% free to enter — win big prizes</p>
            </div>
            <Link
              href="/sweepstakes"
              style={{ color: '#E63946' }}
              className="font-bold text-sm border-2 border-[#E63946] px-4 py-2 rounded-xl hover:bg-[#E63946] hover:text-white transition"
            >
              View All →
            </Link>
          </div>
          {sweepstakes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sweepstakes.map((sweep) => (
                <SweepstakesCard
                  key={sweep._id}
                  title={sweep.title}
                  sponsor={sweep.sponsor}
                  prize={sweep.prize}
                  entryUrl={sweep.entryUrl}
                  slug={sweep.slug.current}
                  entryDeadline={sweep.entryDeadline}
                  entryFrequency={sweep.entryFrequency}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-10">No sweepstakes yet — check back soon.</p>
          )}
        </div>
      </section>

      {/* ===== BOTTOM CTA ===== */}
      <section style={{ backgroundColor: '#E63946' }} className="py-14 px-4 text-center">
        <h2 className="text-white text-3xl font-extrabold mb-3">Never Miss a Deal Again</h2>
        <p className="text-white/80 mb-6 max-w-md mx-auto">
          Bookmark SpartanShopper and check back daily for fresh deals, new coupons, and active sweepstakes.
        </p>
        <Link
          href="/sweepstakes"
          className="inline-block bg-white font-extrabold px-8 py-3.5 rounded-xl hover:bg-white/90 transition text-sm"
          style={{ color: '#E63946' }}
        >
          Enter Today&apos;s Sweepstakes →
        </Link>
      </section>
    </main>
  )
}
