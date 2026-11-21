import { client } from '@/lib/sanity.client'
import { couponsQuery } from '@/lib/queries'
import type { Coupon } from '@/lib/types'
import CouponFilterBar from '@/components/CouponFilterBar'
import Link from 'next/link'
import { pageMetadata } from '@/lib/seo'
import { offerExpiryLabel } from '@/lib/offerExpiry'
import { getCouponVerification } from '@/lib/couponVerification'

export const revalidate = 3600

export const metadata = pageMetadata({
  title: 'Coupon Codes & Offer Terms',
  description: 'Browse coupon codes by category. See dated offer checks when available, then confirm eligibility and the final discount at checkout.',
  path: '/coupons',
})

export default async function CouponsPage() {
  const coupons = await client
    .fetch<Coupon[]>(couponsQuery)
    .catch(() => [] as Coupon[])

  const verified = coupons.filter((c) => c.verified)
  const unverified = coupons.filter((c) => !c.verified)
  const sorted = [...verified, ...unverified]
  const datedChecks = coupons.filter((coupon) => getCouponVerification(coupon.verification) !== null).length

  const offerCatalogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'Coupon Codes & Offer Terms',
    description: 'Browse coupon codes and offer terms across shopping categories.',
    url: 'https://www.spartanshopper.com/coupons',
    numberOfItems: coupons.length,
    itemListElement: sorted.slice(0, 15).map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Offer',
        name: c.title,
        url: `https://www.spartanshopper.com/coupons/${c.slug.current}`,
        // Sanity stores some dates as full ISO timestamps and others as date-only
        // values. Appending a time to both produces invalid values such as
        // `2026-11-30T00:00:00.000ZT23:59:59` in structured data.
        ...(c.expiryDate && offerExpiryLabel(c.expiryDate) && { validThrough: c.expiryDate }),
        seller: { '@type': 'Organization', name: c.store },
      },
    })),
  }

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(offerCatalogJsonLd) }}
    />
    <main className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div style={{ backgroundColor: '#1A1A2E' }} className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-white text-4xl font-extrabold mb-2">Find a coupon for what you need.</h1>
          <p className="max-w-2xl text-white/80 mb-3">Choose a category, reveal the code and check the offer details before placing your order.</p>
          <p className="text-white/60">
            {coupons.length} coupon{coupons.length !== 1 ? 's' : ''} available
            {datedChecks > 0 && ` · ${datedChecks} with dated checks`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {sorted.length > 0 && (
          <p className="bg-white border border-slate-200 rounded-xl px-5 py-3 mb-8 text-slate-700 text-sm">
            Each dated result shows what was checked and when. Confirm eligibility and the final discount at checkout.
          </p>
        )}

        {sorted.length > 0 ? (
          <section aria-labelledby="coupon-catalog-heading">
            <h2 id="coupon-catalog-heading" className="sr-only">Coupon codes by category</h2>
            <CouponFilterBar coupons={sorted} />
          </section>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏷️</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No coupons found</h2>
            <p className="text-gray-500 mb-6">No active coupon codes right now — check back soon.</p>
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
    </>
  )
}
