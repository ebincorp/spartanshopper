import { client, urlFor } from '@/lib/sanity.client'
import { couponBySlugQuery, couponSlugsQuery } from '@/lib/queries'
import type { Coupon } from '@/lib/types'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import CopyButton from '@/components/CopyButton'
import RelatedCoupons from '@/components/RelatedCoupons'
import { offerExpiryLabel } from '@/lib/offerExpiry'
import { generateBreadcrumbJsonLd } from '@/lib/generateJsonLd'
import { pageMetadata } from '@/lib/seo'
import { isCouponEnded } from '@/lib/offer-status'

export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await client
    .fetch<{ slug: string }[]>(couponSlugsQuery)
    .catch(() => [])
  return slugs.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const coupon = await client
    .fetch<Coupon | null>(couponBySlugQuery, { slug })
    .catch(() => null)

  if (!coupon) return {}

  if (isCouponEnded(coupon)) {
    return pageMetadata({
      title: `${coupon.title} — Coupon Ended`,
      description: `This ${coupon.store} coupon has ended. See today's active coupons on SpartanShopper.`,
      path: `/coupons/${slug}`,
      type: 'article',
      noIndex: true,
    })
  }

  const description = coupon.seo?.metaDescription
    || coupon.description
    || `${coupon.discount ? `Save ${coupon.discount} at ${coupon.store}` : `Save at ${coupon.store}`}. See the offer terms and confirm the discount at checkout.`

  const ogImage = coupon.image
    ? urlFor(coupon.image).width(1200).height(630).url()
    : undefined

  return pageMetadata({
    // A CMS metaTitle is authored complete, so it bypasses brand appending.
    ...(coupon.seo?.metaTitle ? { absoluteTitle: coupon.seo.metaTitle } : {}),
    title: coupon.title,
    description,
    path: `/coupons/${slug}`,
    image: ogImage,
    type: 'article',
    ...(coupon.seo?.canonicalUrl ? { canonicalPath: coupon.seo.canonicalUrl } : {}),
  })
}

export default async function CouponPage({ params }: Props) {
  const { slug } = await params
  const coupon = await client
    .fetch<Coupon | null>(couponBySlugQuery, { slug })
    .catch(() => null)

  // Never-existed (or not-yet-started) slugs 404. Ended coupons — deactivated
  // or past expiry — keep their URL (external links, /post/ legacy redirects)
  // but render an ended state with `noindex, follow`, matching ended deals.
  // (They previously 404'd; before that they redirected to /coupons, which
  // filled GSC's "Page with redirect" report.)
  if (!coupon) notFound()
  const ended = isCouponEnded(coupon)

  const expiryLabel = offerExpiryLabel(coupon.expiryDate)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: coupon.title,
    ...(coupon.description && { description: coupon.description }),
    url: coupon.affiliateUrl,
    ...(expiryLabel && { validThrough: coupon.expiryDate?.length === 10 ? `${coupon.expiryDate}T23:59:59.999Z` : coupon.expiryDate }),
    seller: {
      '@type': 'Organization',
      name: coupon.store,
    },
  }

  const shopUrl = coupon.affiliateSlug
    ? `/go/${coupon.affiliateSlug}`
    : coupon.affiliateUrl

  return (
    <>
    {!ended && (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    )}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: generateBreadcrumbJsonLd([
          { name: 'Home', url: 'https://www.spartanshopper.com' },
          { name: 'Coupons', url: 'https://www.spartanshopper.com/coupons' },
          { name: coupon.title, url: `https://www.spartanshopper.com/coupons/${coupon.slug.current}` },
        ])
      }}
    />
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        <Link
          href="/coupons"
          className="inline-flex items-center gap-1 text-sm font-semibold mb-6 transition hover:underline"
          style={{ color: '#E63946' }}
        >
          ← Back to Coupons
        </Link>

        {ended && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <p className="font-extrabold text-amber-900 mb-1">This coupon has ended</p>
            <p className="text-sm text-amber-900/80 mb-4">
              This {coupon.store} offer is no longer available, so we&apos;ve removed the code. See the
              active coupons below or browse everything that&apos;s live right now.
            </p>
            <Link
              href="/coupons"
              style={{ backgroundColor: '#E63946' }}
              className="inline-block text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition"
            >
              See today&apos;s active coupons →
            </Link>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-md overflow-hidden">

          {coupon.image && (
            <div className="relative w-full h-64 sm:h-80 bg-gray-100">
              <Image
                src={urlFor(coupon.image).width(800).url()}
                alt={coupon.title}
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </div>
          )}

          <div className="p-6 sm:p-8">

            <div className="flex items-center gap-3 mb-4">
              <span
                className="text-xs font-bold uppercase tracking-widest text-white px-3 py-1 rounded-full"
                style={{ backgroundColor: '#E63946' }}
              >
                Coupon
              </span>
              {ended && (
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  Ended
                </span>
              )}
              {coupon.verified && !ended && (
                <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                  ✓ Previously checked
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
              {coupon.title}
            </h1>

            <p className="text-gray-500 text-sm font-medium mb-6">Store: {coupon.store}</p>

            {coupon.discount && (
              <p className="text-2xl font-extrabold mb-4" style={{ color: '#E63946' }}>
                {coupon.discount}
              </p>
            )}

            {coupon.code && !ended && (
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div
                  className="min-w-0 break-all flex-1 border-2 border-dashed rounded-xl px-5 py-4 font-mono font-bold text-2xl tracking-widest"
                  style={{ borderColor: '#E63946', color: '#E63946' }}
                >
                  {coupon.code}
                </div>
                <CopyButton code={coupon.code} />
              </div>
            )}

            {!ended && <p className="text-sm text-gray-600 mb-6">{expiryLabel ? `Expires: ${expiryLabel}` : 'End date not supplied — confirm with the retailer.'}</p>}
            {coupon.description && <p className="text-gray-700 leading-relaxed mb-6">{coupon.description}</p>}
            {!ended && (<>
            <div className="bg-slate-50 rounded-xl p-5 mb-6">
              <h2 className="font-bold text-lg mb-2">How to use this offer</h2>
              <p className="text-gray-700 leading-relaxed">{coupon.code ? 'Copy the code above, visit the retailer, and enter it at checkout.' : 'Visit the retailer and follow the offer instructions on its product or promotion page.'} Confirm that the discount applies to your selected item before paying. Availability and eligibility can change.</p>
            </div>
            <p className="text-sm text-gray-600 mb-4">We may earn a commission from qualifying purchases through this link. <Link href="/affiliate-disclosure" className="underline">Affiliate disclosure</Link></p>

            <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="block w-full text-center font-extrabold py-4 rounded-xl text-lg tracking-wide transition text-white hover:opacity-90 active:scale-95"
              style={{ backgroundColor: '#E63946' }}
            >
              🏷️ Shop Now →
            </a>
            </>)}
            {ended && (
              <p className="block w-full text-center font-extrabold py-4 rounded-xl text-lg tracking-wide bg-gray-200 text-gray-500">
                This Coupon Has Ended
              </p>
            )}

          </div>
        </div>

        {coupon.whyWeLikeThis && (
          <div className="mt-8 bg-white rounded-2xl shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">Why We Like This</h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
              {coupon.whyWeLikeThis}
            </p>
          </div>
        )}


        <RelatedCoupons currentId={coupon._id} category={coupon.category} />
      </div>
    </main>
    </>
  )
}
