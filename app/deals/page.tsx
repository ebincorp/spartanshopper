import type { Metadata } from 'next'
import Link from 'next/link'
import { client, urlFor } from '@/lib/sanity.client'
import { dealsQuery, dealsByCategoryQuery, dealCategoriesQuery } from '@/lib/queries'
import type { Deal } from '@/lib/types'
import DealCard from '@/components/DealCard'
import { dealCardFacts, dealDisplayTitle } from '@/lib/deal-product-copy'
import { endingSoonDeals } from '@/lib/ending-soon-deals'
import EndingSoonDeals from '@/components/EndingSoonDeals'
import DealShelf from '@/components/DealShelf'
import DealsCategoryFilterBar from '@/components/DealsCategoryFilterBar'
import { pageMetadata } from '@/lib/seo'

export const revalidate = 300

interface Props {
  searchParams: Promise<{ category?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { category } = await searchParams
  return pageMetadata({
    title: 'Shopping Deals: Compare Models & Offers',
    description: 'Browse by category and compare models, sizes and included accessories before you visit the retailer.',
    path: '/deals',
    // Category-filtered views canonicalise to the unfiltered listing.
    ...(category ? { canonicalPath: '/deals' } : {}),
  })
}

export default async function DealsPage({ searchParams }: Props) {
  const { category } = await searchParams

  const [deals, categories] = await Promise.all([
    client
      .fetch<Deal[]>(category ? dealsByCategoryQuery : dealsQuery, category ? { category } : {})
      .catch(() => [] as Deal[]),
    client.fetch<string[]>(dealCategoriesQuery).catch(() => [] as string[]),
  ])

  const dealsJsonLd = !category
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Shopping Deals: Compare Models & Offers',
        description: 'Product deals with model details and offer notes to check before buying.',
        url: 'https://www.spartanshopper.com/deals',
        numberOfItems: deals.length,
        // Product rich results belong on individual deal pages, not this directory.
        itemListElement: deals.map((d, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: dealDisplayTitle(d.title),
          url: `https://www.spartanshopper.com/deals/${d.slug.current}`,
        })),
      }
    : null

  const inCategories = (values: string[]) => (deal: Deal) => values.includes(deal.category ?? '')

  // Shelves only show deals with a real product image, and each deal appears on
  // at most one shelf (earlier shelves claim first). The full grid below still
  // lists every active deal.
  const shelfCandidates = deals.filter((deal) => deal.hasCardImage)
  const claimed = new Set<string>()
  const urgentDeals = endingSoonDeals(deals)
  urgentDeals.forEach(deal => claimed.add(deal._id))
  const shelf = (pool: Deal[], limit = 8) => {
    const picked = pool.filter((deal) => !claimed.has(deal._id)).slice(0, limit)
    picked.forEach((deal) => claimed.add(deal._id))
    return picked
  }
  // The query returns newest first. Keep that order within each group.
  const featuredCandidates = shelfCandidates.filter(deal => dealCardFacts(deal.title, deal.description).length > 0)
  const shelves = [
    { title: 'Recently added', description: 'See the model, included parts and fit details for new finds.', deals: shelf(featuredCandidates) },
    { title: 'Beauty, fashion and luxury', description: 'Compare the size, color or attachment bundle before choosing your version.', deals: shelf(featuredCandidates.filter(inCategories(['luxury', 'health-beauty', 'fashion']))) },
    { title: 'For the kitchen and around the house', description: 'Check capacity, counter space and included accessories against the job you need done.', deals: shelf(featuredCandidates.filter(inCategories(['home-garden', 'food-dining']))) },
    { title: 'For your car and workshop', description: 'Match the model, power needs and included fittings to your setup.', deals: shelf(featuredCandidates.filter(inCategories(['automotive', 'tools', 'home-improvement']))) },
    { title: 'Clothing, luggage and home finds', description: 'Check garment measurements, suitcase dimensions and product sizes before ordering.', deals: shelf(featuredCandidates.filter(inCategories(['fashion', 'home-garden', 'travel']))) },
  ].filter(({ deals }) => deals.length > 0)

  return (
    <>
    {dealsJsonLd && (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dealsJsonLd) }}
      />
    )}
    <main className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div style={{ backgroundColor: '#1A1A2E' }} className="px-4 py-4 sm:py-14">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-5xl">Find the model that fits.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-5 text-white/80 sm:text-base">
            Compare models and offer terms.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:py-10">
        {categories.length > 0 && (
          <DealsCategoryFilterBar categories={categories} activeCategory={category} />
        )}
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 sm:mt-3">
          <p className="text-sm font-medium text-slate-700">
            {deals.length} {category ? 'matching' : 'active'} deal{deals.length === 1 ? '' : 's'}
          </p>
          {(category || deals.length > 0) && (
            <a
              href={category ? '/deals#all-deals' : '#all-deals'}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-rose-800 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Browse all deals
            </a>
          )}
        </div>

        {deals.length > 0 && (
          <p className="mb-5 text-sm leading-5 text-slate-700">
            We may earn a commission from qualifying purchases.{' '}
            <Link href="/affiliate-disclosure" className="font-semibold text-rose-800 underline underline-offset-4">
              Affiliate disclosure
            </Link>
          </p>
        )}

        <EndingSoonDeals deals={urgentDeals} />

        {!category && deals.length > 0 && (
          <div className="mb-2">
            {shelves.map(({ title, description, deals }, index) => (
              <div key={title} className={index > 0 ? 'hidden sm:block' : undefined}>
                <DealShelf title={title} description={description} deals={deals} />
              </div>
            ))}
          </div>
        )}

        {/* Deals Grid */}
        {deals.length > 0 ? (
          <section id="all-deals" aria-labelledby="all-deals-title" tabIndex={-1} className="scroll-mt-20">
            <h2 id="all-deals-title" className="mb-4 text-2xl font-extrabold tracking-tight text-slate-950">
              {category ? 'Matching deals' : 'All deals'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {category === 'automotive' && (
                <aside
                  className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-7"
                  aria-label="Fuel card sweepstakes"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="max-w-3xl">
                      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-800">
                        Sweepstakes for drivers
                      </p>
                      <h2 className="mb-2 text-2xl font-extrabold text-gray-900">
                        Enter for a chance to win a $500 fuel card
                      </h2>
                      <p className="text-sm leading-6 text-gray-700">
                        Open to US residents 18+. No purchase is necessary. Entry requires the requested
                        information and final confirmation, and the entry flow may include sales offers.
                        SpartanShopper may earn a commission if you enter.
                      </p>
                    </div>
                    <Link
                      href="/go/everydaywinner-500-gas-card"
                      target="_blank"
                      rel="sponsored noopener noreferrer"
                      style={{ backgroundColor: '#E63946' }}
                      className="shrink-0 rounded-xl px-5 py-3 text-center text-sm font-extrabold text-white transition hover:opacity-90"
                    >
                      Enter Now →
                    </Link>
                  </div>
                </aside>
              )}
              {deals.map((deal) => (
                <DealCard
                  key={deal._id}
                  title={deal.title}
                  store={deal.store}
                  salePrice={deal.salePrice}
                  description={deal.description}
                  affiliateUrl={deal.affiliateUrl}
                  asin={deal.asin}
                  slug={deal.slug.current}
                  affiliateSlug={deal.affiliateSlug}
                  image={deal.hasCardImage && deal.image ? urlFor(deal.image).width(400).url() : undefined}
                  imageAlt={deal.hasCardImage ? deal.image?.alt : undefined}
                  imageAttribution={deal.image?.attribution}
                  imageUrl={deal.hasCardImage ? deal.imageUrl : undefined}
                  expiryDate={deal.expiryDate}
                  priceVerifiedAt={deal.priceVerifiedAt}
                  priceVerificationSource={deal.priceVerificationSource}
                  priceApiObservation={deal.priceApiObservation}
                  clipCoupon={deal.clipCoupon}
                />
              ))}
            </div>
          </section>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏷️</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No deals found</h2>
            <p className="text-gray-500 mb-6">
              {category ? `No deals in this category yet.` : `No active deals right now — check back soon.`}
            </p>
            {category && (
              <Link
                href="/deals"
                style={{ backgroundColor: '#E63946' }}
                className="inline-block text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition"
              >
                View All Deals
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
    </>
  )
}
