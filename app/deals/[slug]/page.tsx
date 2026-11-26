import { formatPriceCheckTime, hasFreshApiPrice } from '@/lib/deal-price'
import DealClipCoupon from '@/components/DealClipCoupon'
import { dealDisplayTitle, dealProductDescription } from '@/lib/deal-product-copy'
import { client } from '@/lib/sanity.client'
import { dealPhotoUrl } from '@/lib/deal-photo'
import { dealBySlugQuery, dealSlugsQuery, relatedDealsQuery } from '@/lib/queries'
import { autoGuideCategoriesForDeal } from '@/lib/deal-categories'
import DealCard from '@/components/DealCard'
import DealPhotoCredit from '@/components/DealPhotoCredit'
import type { Deal, Post } from '@/lib/types'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { generateBreadcrumbJsonLd, generatePageJsonLd } from '@/lib/generateJsonLd'
import { pageMetadata } from '@/lib/seo'
import { offerExpiryLabel } from '@/lib/offerExpiry'
import { endTime } from '@/lib/offer-status'
import { dealSearchCopy, dealProductJsonLd, serializeDealJsonLd } from '@/lib/deal-seo'

export const revalidate = 3600

const CATEGORY_NAMES: Record<string, string> = {
  'health-beauty': 'Health & Beauty',
  'home-garden': 'Home & Garden',
  'food-dining': 'Food & Dining',
  'sports-outdoors': 'Sports & Outdoors',
  baby: 'Baby & Nursery',
  electronics: 'Electronics',
  fashion: 'Fashion',
  luxury: 'Luxury',
  automotive: 'Automotive',
  travel: 'Travel',
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await client
    .fetch<{ slug: string }[]>(dealSlugsQuery)
    .catch(() => [])
  return slugs.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const deal = await client
    .fetch<Deal | null>(dealBySlugQuery, { slug })
    .catch(() => null)

  if (!deal) return {}

  const ended = !deal.active || (endTime(deal.expiryDate) ?? Infinity) <= Date.now()

  const { title, description } = dealSearchCopy({ ...deal, title: dealDisplayTitle(deal.title) }, ended)
  const imageUrl = dealPhotoUrl(deal, 1200, 630)

  return {
    ...pageMetadata({
      title,
      description,
      path: `/deals/${slug}`,
      image: imageUrl,
      type: 'article',
    }),
    // Keep the URL reachable for existing external links, but stop search
    // engines indexing a deal that is no longer purchasable. `follow` is kept so
    // link equity still flows through to /deals.
    ...(ended ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function DealPage({ params }: Props) {
  const { slug } = await params
  const deal = await client
    .fetch<Deal | null>(dealBySlugQuery, { slug })
    .catch(() => null)

  if (!deal) notFound()

  // Keep related deals and guides available to shoppers who are still comparing.
  // Hand-picked guides win; otherwise only auto-match for categories specific
  // enough to be a close fit, closest post category first, then newest. With
  // neither, the section is hidden and the page ends with related deals.
  const guideCategories = autoGuideCategoriesForDeal(deal.category)
  const pickedGuides = (deal.relatedGuides ?? []).filter(Boolean)
  const [relatedDeals, matchedGuides] = await Promise.all([
    deal.category
      ? client.fetch<Deal[]>(relatedDealsQuery, { category: deal.category, id: deal._id }).catch(() => [] as Deal[])
      : Promise.resolve([] as Deal[]),
    pickedGuides.length === 0 && guideCategories.length
      ? client
          .fetch<Post[]>(
            `*[_type == "post" && defined(slug.current) && publishedAt <= now() && relatedCategory in $categories]
              | order(publishedAt desc)[0...12] { _id, title, slug, relatedCategory }`,
            { categories: guideCategories }
          )
          .catch(() => [] as Post[])
      : Promise.resolve([] as Post[]),
  ])
  const categoryRank = (post: Post) => guideCategories.indexOf(post.relatedCategory ?? '')
  const relatedGuides = pickedGuides.length
    ? pickedGuides
    : [...matchedGuides].sort((a, b) => categoryRank(a) - categoryRank(b)).slice(0, 3)

  const imageUrl = dealPhotoUrl(deal, 800)
  const shopUrl = deal.affiliateSlug ? `/go/${deal.affiliateSlug}` : deal.affiliateUrl

  const expired = !deal.active || (endTime(deal.expiryDate) ?? Infinity) <= Date.now()
  const expiryLabel = offerExpiryLabel(deal.expiryDate)
  const title = dealDisplayTitle(deal.title)
  const productNotes = dealProductDescription(deal.description)
  const price = !expired && hasFreshApiPrice(deal) ? deal : null
  const productJsonLd = dealProductJsonLd(
    { ...deal, title, description: productNotes.join(' ') },
    imageUrl ?? null,
    Boolean(price)
  )
  const pageJsonLd = productJsonLd ? serializeDealJsonLd(productJsonLd) : !expired
    ? generatePageJsonLd(`/deals/${slug}`, title, productNotes.join(' ') || undefined)
    : null

  return (
    <>
    {/* An Offer price Google can't match on the landing page is worse than none. */}
    {pageJsonLd && (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: pageJsonLd }}
      />
    )}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: generateBreadcrumbJsonLd([
          { name: 'Home', url: 'https://www.spartanshopper.com' },
          { name: 'Deals', url: 'https://www.spartanshopper.com/deals' },
          { name: title, url: `https://www.spartanshopper.com/deals/${slug}` },
        ])
      }}
    />
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        <Link
          href="/deals"
          className="inline-flex items-center gap-1 text-sm font-semibold mb-6 transition hover:underline"
          style={{ color: '#E63946' }}
        >
          ← Back to Deals
        </Link>

        {/* Keep the product information available on ended listings. */}
        {expired && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <p className="font-extrabold text-amber-900 mb-1">This deal has ended</p>
            <p className="text-sm text-amber-900/80 mb-4">
              This listing stays available for the product details. See the directory for active deals.
            </p>
            <Link
              href="/deals"
              style={{ backgroundColor: '#E63946' }}
              className="inline-block text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition"
            >
              See today&apos;s live deals →
            </Link>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 mb-2">
              {title}
            </h1>

            <p className="mb-4 text-sm font-medium text-slate-600">{deal.store}</p>
            {!expired && deal.clipCoupon && (
              <div className="mb-5"><DealClipCoupon observation={deal.clipCouponObservation} showCheckTime /></div>
            )}

            {productNotes.length > 0 && (
              <section aria-labelledby="deal-product-notes" className="mb-5 rounded-xl bg-slate-50 p-4">
                <h2 id="deal-product-notes" className="font-bold text-slate-900">Fit and buying details</h2>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-700">
                  {productNotes.map((note, index) => <li key={index}>{note}</li>)}
                </ul>
              </section>
            )}

            {price && (
              <div className="mb-6">
                <span className="text-3xl font-extrabold text-rose-800">${price.salePrice.toFixed(2)}</span>
                <p className="mt-1 text-sm text-slate-600">
                  Price checked <time dateTime={price.priceVerifiedAt}>{formatPriceCheckTime(Date.parse(price.priceVerifiedAt))}</time>.
                </p>
              </div>
            )}

            {expiryLabel && !expired && (
              <p className="mb-4 text-sm font-semibold text-slate-700">Ends {expiryLabel}</p>
            )}

            {!expired && (
              <>
                <p className="mb-3 text-sm leading-5 text-slate-600">
                  We may earn a commission from qualifying purchases.{' '}
                  <Link href="/affiliate-disclosure" className="font-semibold text-rose-800 underline underline-offset-4">
                    Affiliate disclosure
                  </Link>
                </p>
                <a
                  href={shopUrl}
                  target="_blank"
                  rel="sponsored noopener noreferrer nofollow"
                  aria-label={`Check current price for ${title} at ${deal.store}`}
                  className="flex min-h-11 items-center justify-center rounded-xl bg-[#B42332] px-3 py-3 text-center font-bold text-white hover:bg-rose-900"
                >
                  Check current price at {deal.store}
                </a>
              </>
            )}
          </div>

          {imageUrl && (
            <figure className="border-t border-slate-100">
              <div className="relative h-56 w-full sm:h-80">
                <Image
                  src={imageUrl}
                  alt={deal.image?.alt || title}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <DealPhotoCredit attribution={deal.image?.attribution} />
            </figure>
          )}
        </div>

        {!imageUrl && !expired && (
          <section aria-labelledby="deal-buying-checks" className="mt-6 border-b border-slate-200 pb-6">
            <h2 id="deal-buying-checks" className="text-lg font-bold text-slate-950">Before checkout</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-700">
              <li>Match the model, color, size, or pack count to the listing.</li>
              <li>Confirm which accessories come with it and which cost extra.</li>
              <li>Check delivery and return terms for the selected seller.</li>
            </ul>
          </section>
        )}

        {relatedDeals.length > 0 && (
          <section aria-labelledby="related-deals-title" className="mt-10">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <h2 id="related-deals-title" className="text-xl font-extrabold text-gray-900">
                More {CATEGORY_NAMES[deal.category ?? ''] ?? 'related'} deals
              </h2>
              <Link href={`/deals?category=${deal.category}`} className="text-sm font-bold text-[#E63946] underline underline-offset-4">
                See all
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {relatedDeals.map((d) => (
                <DealCard
                  key={d._id}
                  title={d.title}
                  store={d.store}
                  salePrice={d.salePrice}
                  description={d.description}
                  affiliateUrl={d.affiliateUrl}
                  asin={d.asin}
                  slug={d.slug.current}
                  affiliateSlug={d.affiliateSlug}
                  image={dealPhotoUrl(d, 400)}
                  imageAlt={d.image?.alt}
                  imageAttribution={d.image?.attribution}
                  expiryDate={d.expiryDate}
                  priceVerifiedAt={d.priceVerifiedAt}
                  priceVerificationSource={d.priceVerificationSource}
                  priceApiObservation={d.priceApiObservation}
                  clipCoupon={d.clipCoupon}
                  clipCouponObservation={d.clipCouponObservation}
                />
              ))}
            </div>
          </section>
        )}

        {relatedGuides.length > 0 && (
          <section aria-labelledby="related-guides-title" className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
            <h2 id="related-guides-title" className="mb-3 text-lg font-extrabold text-gray-900">Read before you buy</h2>
            <ul className="space-y-2">
              {relatedGuides.map((g) => (
                <li key={g._id}>
                  <Link href={`/blog/${g.slug.current}`} className="font-semibold text-gray-800 underline underline-offset-4 hover:text-[#E63946]">
                    {g.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {deal.category === 'automotive' && (
          <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-800">
              Sweepstakes for drivers
            </p>
            <h2 className="mb-2 text-xl font-extrabold text-gray-900">
              Enter for a chance to win a $500 fuel card
            </h2>
            <p className="mb-4 text-sm leading-6 text-gray-700">
              Open to US residents 18+. No purchase is necessary. Entry requires the requested
              information and final confirmation, and the entry flow may include sales offers.
              SpartanShopper may earn a commission if you enter.
            </p>
            <Link
              href="/go/everydaywinner-500-gas-card"
              target="_blank"
              rel="sponsored noopener noreferrer"
              style={{ backgroundColor: '#E63946' }}
              className="inline-block rounded-xl px-5 py-3 text-sm font-extrabold text-white transition hover:opacity-90"
            >
              Enter Now →
            </Link>
          </section>
        )}
      </div>
    </main>
    </>
  )
}
