import type { Metadata } from 'next'
import Link from 'next/link'
import { client, urlFor } from '@/lib/sanity.client'
import { dealsQuery, dealsByCategoryQuery, dealCategoriesQuery } from '@/lib/queries'
import type { Deal } from '@/lib/types'
import DealCard from '@/components/DealCard'
import DealShelf from '@/components/DealShelf'
import DealsCategoryFilterBar from '@/components/DealsCategoryFilterBar'
import { pageMetadata } from '@/lib/seo'

export const revalidate = 3600

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
    title: "Today's Best Deals — Discounts & Sales Updated Daily",
    description: "Shop today's best deals and discounts — hand-picked across electronics, fashion, home, beauty, and more. Updated daily so you never miss a saving.",
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
        name: "Today's Best Deals",
        description: "Hand-picked deals and discounts updated daily.",
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
  const under = (amount: number) => deals.filter((deal) => deal.salePrice <= amount).sort(byDiscount).slice(0, 8)
  const inCategories = (values: string[]) => deals.filter((deal) => values.includes(deal.category ?? '')).sort(byDiscount).slice(0, 8)
  const premiumUnder100 = deals.filter((deal) => deal.salePrice <= 100 && ['luxury', 'health-beauty', 'fashion'].includes(deal.category ?? '')).sort(byDiscount).slice(0, 8)

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
          <h1 className="text-white text-4xl font-extrabold tracking-tight mb-2 sm:text-5xl">Find the deal worth buying.</h1>
          <p className="max-w-2xl text-white/70">
            Browse {deals.length} active deal{deals.length !== 1 ? 's' : ''} by budget, category, and what you actually need.
            {category ? ` in ${CATEGORY_LABELS[category] ?? category}` : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Category Filters */}
        {categories.length > 0 && (
          <DealsCategoryFilterBar categories={categories} activeCategory={category} />
        )}

        {!category && deals.length > 0 && (
          <div className="mb-2">
            <DealShelf title="Best savings right now" description="Strong markdowns among the active listings. Check the product page for the final price and availability." deals={[...deals].sort(byDiscount).slice(0, 8)} />
            <DealShelf title="Premium finds under $100" description="Beauty, fashion, and luxury picks within a clear budget." deals={premiumUnder100} />
            <DealShelf title="Home, kitchen, and everyday upgrades" description="Useful items for the spaces and routines you already have." deals={inCategories(['home-garden', 'food-dining'])} />
            <DealShelf title="Trending finds under $50" description="A lower-price shelf for practical purchases and gift ideas." deals={under(50)} />
            <DealShelf title="Seasonal style and comfort" description="Fashion and home finds for fall routines, travel, and gifting." deals={inCategories(['fashion', 'home-garden', 'travel'])} />
            <DealShelf title="Recently added deals" description="The newest additions to SpartanShopper’s active deal directory." deals={deals.slice(0, 8)} />
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
                image={deal.image ? urlFor(deal.image).width(400).url() : undefined}
                imageUrl={deal.imageUrl}
                expiryDate={deal.expiryDate}
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
