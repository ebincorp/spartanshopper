import { client, urlFor } from '@/lib/sanity.client'
import { relatedCouponsQuery } from '@/lib/queries'
import type { Coupon } from '@/lib/types'
import CouponCard from '@/components/CouponCard'

interface Props {
  currentId: string
  category?: string
}

export default async function RelatedCoupons({ currentId, category }: Props) {
  if (!category) return null

  const coupons = await client
    .fetch<Coupon[]>(relatedCouponsQuery, { category, currentId })
    .catch(() => [] as Coupon[])

  if (coupons.length === 0) return null

  return (
    <section className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="text-xl font-extrabold text-gray-900 mb-6">Related Coupons</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((coupon) => (
          <CouponCard
            key={coupon._id}
            title={coupon.title}
            store={coupon.store}
            code={coupon.code}
            discount={coupon.discount}
            description={coupon.description}
            image={coupon.image ? urlFor(coupon.image).width(400).url() : undefined}
            affiliateUrl={coupon.affiliateUrl}
            slug={coupon.slug.current}
            affiliateSlug={coupon.affiliateSlug}
            expiryDate={coupon.expiryDate}
            verified={coupon.verified}
          />
        ))}
      </div>
    </section>
  )
}
