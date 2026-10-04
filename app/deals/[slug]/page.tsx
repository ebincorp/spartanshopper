import { isPriceFresh } from '@/lib/deal-price'
import { client, urlFor } from '@/lib/sanity.client'
import { dealBySlugQuery, dealSlugsQuery, relatedDealsQuery } from '@/lib/queries'
import { autoGuideCategoriesForDeal } from '@/lib/deal-categories'
import DealCard from '@/components/DealCard'
import type { Deal, Post } from '@/lib/types'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { generateBreadcrumbJsonLd } from '@/lib/generateJsonLd'
import { pageMetadata } from '@/lib/seo'
import { offerExpiryLabel } from '@/lib/offerExpiry'
import { endTime } from '@/lib/offer-status'

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

  const description = ended
    ? `This ${deal.title} deal has ended. See today's live deals on SpartanShopper.`
    : isPriceFresh(deal.priceVerifiedAt)
      ? `Get ${deal.title} for USD ${deal.salePrice.toFixed(2)}. Check the offer details on SpartanShopper.`
      : `${deal.title}. Check today's price and availability on SpartanShopper.`
  const imageUrl = deal.image
    ? urlFor(deal.image).width(1200).height(630).url()
    : deal.imageUrl || undefined

  return {
    ...pageMetadata({
      title: ended ? `${deal.title} — Deal Ended` : deal.title,
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

  // Prefer the Sanity asset; fall back to the Amazon-compliant imageUrl string so the
  // Product schema `image` (and visible image) is never omitted — mirrors DealCard's
  // `imageUrl || image`. This was the root cause of the GSC "Missing field image" errors
  // when older deals carried only the imageUrl string and no Sanity asset.
  // Keep shoppers who aren't ready to buy on the site: same-category deals
  // (with real images) and guides from the matching post categories.
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

  const imageUrl = deal.image ? urlFor(deal.image).width(800).url() : deal.imageUrl || null
  const shopUrl = deal.affiliateSlug ? `/go/${deal.affiliateSlug}` : deal.affiliateUrl

  // A deal ends one of two ways, and BOTH must show the ended state:
  //  - its expiryDate passes, or
  //  - daily-maintenance deactivates it because the discount died or it went
  //    out of stock (that path sets active:false and never touches expiryDate).
  //
  // Only the first was handled, so a cron-deactivated deal rendered as fully
  // live — active "Get This Deal" button and a stale price presented as current.
  // The URL is deliberately kept alive (200, not 404) because external links —
  // Pinterest pins, backlinks, bookmarks — point at these pages and cannot be
  // updated after the fact. A dead-end 404 would break them permanently.
  const expired = !deal.active || (endTime(deal.expiryDate) ?? Infinity) <= Date.now()
  const expiryLabel = offerExpiryLabel(deal.expiryDate)
  // Active deals only show the stored price while it's recently verified (see
  // lib/deal-price.ts). Ended deals keep showing it, labelled as historic.
  const priceFresh = isPriceFresh(deal.priceVerifiedAt)
  const showPrice = expired || priceFresh
  const savings =
    showPrice && deal.originalPrice && deal.originalPrice > deal.salePrice
      ? Math.round(((deal.originalPrice - deal.salePrice) / deal.originalPrice) * 100)
      : null

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: deal.title,
    ...(deal.description && { description: deal.description }),
    ...(imageUrl && { image: imageUrl }),
    brand: { '@type': 'Brand', name: deal.store },
    offers: {
      '@type': 'Offer',
      price: deal.salePrice,
      priceCurrency: 'USD',
      availability: expired
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      url: deal.affiliateUrl,
      seller: { '@type': 'Organization', name: deal.store },
      ...(deal.expiryDate && { priceValidUntil: deal.expiryDate }),
    },
  }

  return (
    <>
    {/* An Offer price Google can't match on the landing page is worse than none. */}
    {showPrice && (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
    )}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: generateBreadcrumbJsonLd([
          { name: 'Home', url: 'https://www.spartanshopper.com' },
          { name: 'Deals', url: 'https://www.spartanshopper.com/deals' },
          { name: deal.title, url: `https://www.spartanshopper.com/deals/${slug}` },
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

        {/* Ended deals keep their URL so external links (Pinterest pins,
            backlinks, bookmarks) still resolve — but the page must say plainly
            that the price is historic and route people to what IS live. */}
        {expired && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <p className="font-extrabold text-amber-900 mb-1">This deal has ended</p>
            <p className="text-sm text-amber-900/80 mb-4">
              The price shown below is what this item cost when we listed it — it is no longer
              current. Amazon prices change frequently, so check the live listing before buying.
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

          {imageUrl && (
            <div className="relative w-full h-64 sm:h-80 bg-white">
              <Image
                src={imageUrl}
                alt={deal.title}
                fill
                className="object-contain"
                priority
                unoptimized
              />
              {savings && savings <= 75 && (
                <div
                  className="absolute top-4 left-4 text-white text-sm font-bold px-3 py-1 rounded-full"
                  style={{ backgroundColor: '#E63946' }}
                >
                  {savings}% OFF{deal.clipCoupon ? ' w/ coupon' : ''}
                </div>
              )}
              {expired && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-extrabold text-2xl tracking-widest">DEAL ENDED</span>
                </div>
              )}
            </div>
          )}

          <div className="p-6 sm:p-8">

            <div className="flex items-center gap-3 mb-4">
              <span
                className="text-xs font-bold uppercase tracking-widest text-white px-3 py-1 rounded-full"
                style={{ backgroundColor: '#E63946' }}
              >
                Deal
              </span>
              {expired && (
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  Ended
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
              {deal.title}
            </h1>

            <p className="text-gray-500 text-sm font-medium mb-6">Store: {deal.store}</p>

            {showPrice ? (
            <div className="flex flex-wrap items-baseline gap-3 mb-6">
              <span style={{ color: '#E63946' }} className="text-4xl font-extrabold">
                ${deal.salePrice.toFixed(2)}
              </span>
              {deal.originalPrice && deal.originalPrice > deal.salePrice && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    ${deal.originalPrice.toFixed(2)}
                  </span>
                  {savings && savings <= 75 && !deal.clipCoupon && (
                    <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      Save {savings}%
                    </span>
                  )}
                </>
              )}
              {deal.clipCoupon && !expired && (
                <span className="text-sm font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-full">
                  Clip coupon
                </span>
              )}
            </div>
            ) : (
              <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="font-bold text-gray-900">Check the current price on Amazon</p>
                <p className="mt-1 text-sm text-gray-600">
                  We haven&apos;t been able to confirm today&apos;s price for this item. Amazon prices change
                  often, so the live listing has the current price and availability.
                </p>
              </div>
            )}

            {deal.clipCoupon && priceFresh && !expired && (
              <p className="mb-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
                <strong>This price includes a clip coupon.</strong> Check the coupon box on the Amazon product
                page before adding to your cart. Amazon applies the discount at checkout.
              </p>
            )}

            {deal.description && (
              <div className="text-gray-600 text-sm leading-relaxed mb-6 border-t pt-5">
                <p>{deal.description}</p>
              </div>
            )}

            {expiryLabel && !expired && (
              <p className="text-sm text-gray-400 mb-6">
                Expires:{' '}
                {expiryLabel}
              </p>
            )}

            <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={`block w-full text-center font-extrabold py-4 rounded-xl text-lg tracking-wide transition ${
                expired
                  ? 'bg-gray-200 text-gray-400 pointer-events-none'
                  : 'text-white hover:opacity-90 active:scale-95'
              }`}
              style={!expired ? { backgroundColor: '#E63946' } : {}}
            >
              {expired ? 'This Deal Has Ended' : priceFresh ? '🛒 Get This Deal →' : 'Check Price on Amazon →'}
            </a>

          </div>
        </div>

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
                  originalPrice={d.originalPrice}
                  affiliateUrl={d.affiliateUrl}
                  slug={d.slug.current}
                  affiliateSlug={d.affiliateSlug}
                  image={d.image ? urlFor(d.image).width(400).url() : undefined}
                  imageUrl={d.imageUrl}
                  expiryDate={d.expiryDate}
                  priceVerifiedAt={d.priceVerifiedAt}
                  clipCoupon={d.clipCoupon}
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
