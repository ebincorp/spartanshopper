import Link from 'next/link'
import { client, urlFor } from '@/lib/sanity.client'
import { dealsQuery, dealsByCategoryQuery, dealCategoriesQuery } from '@/lib/queries'
import type { Deal } from '@/lib/types'
import DealCard from '@/components/DealCard'

export const revalidate = 3600

const CATEGORY_LABELS: Record<string, string> = {
  electronics: 'Electronics',
  fashion: 'Fashion',
  'home-garden': 'Home & Garden',
  'food-dining': 'Food & Dining',
  travel: 'Travel',
  'health-beauty': 'Health & Beauty',
  'sports-outdoors': 'Sports & Outdoors',
  other: 'Other',
}

interface Props {
  searchParams: Promise<{ category?: string }>
}

export const metadata = {
  title: 'Deals — SpartanShopper',
  description: 'Browse the latest hand-picked deals and discounts updated daily.',
}

export default async function DealsPage({ searchParams }: Props) {
  const { category } = await searchParams

  const [deals, categories] = await Promise.all([
    client
      .fetch<Deal[]>(category ? dealsByCategoryQuery : dealsQuery, category ? { category } : {})
      .catch(() => [] as Deal[]),
    client.fetch<string[]>(dealCategoriesQuery).catch(() => [] as string[]),
  ])

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div style={{ backgroundColor: '#1A1A2E' }} className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-white text-4xl font-extrabold mb-2">🔥 All Deals</h1>
          <p className="text-white/60">
            {deals.length} deal{deals.length !== 1 ? 's' : ''} found
            {category ? ` in ${CATEGORY_LABELS[category] ?? category}` : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              href="/deals"
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                !category
                  ? 'text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
              style={!category ? { backgroundColor: '#E63946' } : {}}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/deals?category=${cat}`}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  category === cat
                    ? 'text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
                style={category === cat ? { backgroundColor: '#E63946' } : {}}
              >
                {CATEGORY_LABELS[cat] ?? cat}
              </Link>
            ))}
          </div>
        )}

        {/* Deals Grid */}
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
                slug={deal.slug.current}
                affiliateSlug={deal.affiliateSlug}
                image={deal.image ? urlFor(deal.image).width(400).url() : undefined}
                expiryDate={deal.expiryDate}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏷️</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No deals found</h2>
            <p className="text-gray-400 mb-6">
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
  )
}
