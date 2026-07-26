import { client, urlFor } from '@/lib/sanity.client'
import { dealBySlugQuery, dealSlugsQuery } from '@/lib/queries'
import type { Deal } from '@/lib/types'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { generateBreadcrumbJsonLd } from '@/lib/generateJsonLd'
import { pageMetadata } from '@/lib/seo'

export const revalidate = 3600

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

  const ended = !deal.active || (deal.expiryDate ? new Date(deal.expiryDate) < new Date() : false)

  const description = ended
    ? `This ${deal.title} deal has ended. See today's live deals on SpartanShopper.`
    : `Get ${deal.title} at ${deal.store} for $${deal.salePrice.toFixed(2)}. Shop now on SpartanShopper.`
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
  const imageUrl = deal.image ? urlFor(deal.image).width(800).url() : deal.imageUrl || null

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
  const expired = !deal.active || (deal.expiryDate ? new Date(deal.expiryDate) < new Date() : false)
  const savings =
    deal.originalPrice && deal.originalPrice > deal.salePrice
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
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
    />
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
                  {savings}% OFF
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

            <div className="flex items-baseline gap-3 mb-6">
              <span style={{ color: '#E63946' }} className="text-4xl font-extrabold">
                ${deal.salePrice.toFixed(2)}
              </span>
              {deal.originalPrice && deal.originalPrice > deal.salePrice && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    ${deal.originalPrice.toFixed(2)}
                  </span>
                  {savings && savings <= 75 && (
                    <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      Save {savings}%
                    </span>
                  )}
                </>
              )}
            </div>

            {deal.description && (
              <div className="text-gray-600 text-sm leading-relaxed mb-6 border-t pt-5">
                <p>{deal.description}</p>
              </div>
            )}

            {deal.expiryDate && !expired && (
              <p className="text-sm text-gray-400 mb-6">
                Expires:{' '}
                {new Date(deal.expiryDate).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </p>
            )}

            <a
              href={deal.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={`block w-full text-center font-extrabold py-4 rounded-xl text-lg tracking-wide transition ${
                expired
                  ? 'bg-gray-200 text-gray-400 pointer-events-none'
                  : 'text-white hover:opacity-90 active:scale-95'
              }`}
              style={!expired ? { backgroundColor: '#E63946' } : {}}
            >
              {expired ? 'This Deal Has Ended' : '🛒 Get This Deal →'}
            </a>

          </div>
        </div>
      </div>
    </main>
    </>
  )
}
