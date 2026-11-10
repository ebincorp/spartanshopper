import type { Metadata } from 'next'
import Link from 'next/link'
import { client, urlFor } from '@/lib/sanity.client'
import { dealsQuery, dealsByCategoryQuery, dealCategoriesQuery } from '@/lib/queries'
import type { Deal } from '@/lib/types'
import DealCard from '@/components/DealCard'
import { isPriceFresh } from '@/lib/deal-price'
import { endingSoonDeals } from '@/lib/ending-soon-deals'
import EndingSoonDeals from '@/components/EndingSoonDeals'
import DealShelf from '@/components/DealShelf'
import DealsCategoryFilterBar from '@/components/DealsCategoryFilterBar'
import { pageMetadata } from '@/lib/seo'

export const revalidate = 300

const CATEGORY_LABELS: Record<string, string> = {
  electronics: 'Electronics',
  fashion: 'Fashion',
  'home-garden': 'Home & Garden',
  'food-dining': 'Food & Dining',
  travel: 'Travel',
  'health-beauty': 'Health & Beauty',
  'sports-outdoors': 'Sports & Outdoors',
  automotive: 'Automotive',
  baby: 'Baby & Nursery',
  luxury: 'Luxury',
  other: 'Other',
}

interface Props {
  searchParams: Promise<{ category?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { category } = await searchParams
  return pageMetadata({
    title: 'Shopping Deals: Compare Models & Offers',
    description: 'Browse deals by category, then check the exact model, size and included accessories. Read offer details before visiting the retailer for the current price.',
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
          name: d.title,
          url: `https://www.spartanshopper.com/deals/${d.slug.current}`,
        })),
      }
    : null

  const discount = (deal: Deal) =>
    deal.originalPrice && deal.originalPrice > deal.salePrice
      ? (deal.originalPrice - deal.salePrice) / deal.originalPrice
      : 0
  const byDiscount = (a: Deal, b: Deal) => discount(b) - discount(a)
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
  // Verified prices lead; stale ones follow (they render as "Check current price").
  const fresh = (deal: Deal) => isPriceFresh(deal.priceVerifiedAt)
  const byDiscountPool = [...shelfCandidates].sort((a, b) => Number(fresh(b)) - Number(fresh(a)) || byDiscount(a, b))
  const topShelf = shelf(byDiscountPool)
  // "Best savings" only makes sense when savings are actually on show.
  const topShelfHasPrices = topShelf.some(fresh)
  const shelves = [
    topShelfHasPrices
      ? { title: 'Compare prices and product details', description: 'Recently checked prices appear first. Open a product to see the selected model and offer notes.', deals: topShelf }
      : { title: 'Explore the current listings', description: 'Open a product for model and offer details, then check its current price with the retailer.', deals: topShelf },
    { title: 'Beauty, fashion and luxury', description: 'Compare the size, color or attachment bundle before choosing your version.', deals: shelf(byDiscountPool.filter(inCategories(['luxury', 'health-beauty', 'fashion']))) },
    { title: 'For the kitchen and around the house', description: 'Check capacity, counter space and included accessories against the job you need done.', deals: shelf(byDiscountPool.filter(inCategories(['home-garden', 'food-dining']))) },
    { title: 'Small purchases and gift ideas', description: 'Check the pack size and delivered total before deciding whether an extra is worth adding.', deals: shelf(byDiscountPool.filter((deal) => deal.salePrice <= 50)) },
    { title: 'Clothing, luggage and home finds', description: 'Check garment measurements, suitcase dimensions and product sizes before ordering.', deals: shelf(byDiscountPool.filter(inCategories(['fashion', 'home-garden', 'travel']))) },
    { title: 'Recently added deals', description: 'See what was added to the directory, with links to the product details and retailer.', deals: shelf(shelfCandidates) },
  ]

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
      <div style={{ backgroundColor: '#1A1A2E' }} className="py-12 px-4 sm:py-14">
        <div className="max-w-7xl mx-auto">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-rose-300">SpartanShopper deals</p>
          <h1 className="text-white text-4xl font-extrabold tracking-tight mb-2 sm:text-5xl">Check what you get for the price.</h1>
          <p className="max-w-2xl text-white/70">
            Browse {deals.length} active deal{deals.length !== 1 ? 's' : ''}{category ? ` in ${CATEGORY_LABELS[category] ?? category}` : ' by category'}.
            {' '}Open the details to check the model, size or included pieces before visiting the retailer.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <EndingSoonDeals deals={urgentDeals} />
        {/* Category Filters */}
        {categories.length > 0 && (
          <DealsCategoryFilterBar categories={categories} activeCategory={category} />
        )}

        {!category && deals.length > 0 && (
          <div className="mb-2">
            {shelves.map((s) => <DealShelf key={s.title} title={s.title} description={s.description} deals={s.deals} />)}
          </div>
        )}

        {/* Deals Grid */}
        {deals.length > 0 ? (
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
                originalPrice={deal.originalPrice}
                affiliateUrl={deal.affiliateUrl}
                slug={deal.slug.current}
                affiliateSlug={deal.affiliateSlug}
                image={deal.hasCardImage && deal.image ? urlFor(deal.image).width(400).url() : undefined}
                imageUrl={deal.hasCardImage ? deal.imageUrl : undefined}
                expiryDate={deal.expiryDate}
                priceVerifiedAt={deal.priceVerifiedAt}
                clipCoupon={deal.clipCoupon}
              />
            ))}
          </div>
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
