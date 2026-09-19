import type { Metadata } from 'next'
import Link from 'next/link'
import { client, urlFor } from '@/lib/sanity.client'
import { couponsQuery, dealsQuery } from '@/lib/queries'
import { getAllPostsQuery } from '@/lib/blogQueries'
import type { Coupon, Deal, Post } from '@/lib/types'
import CouponCard from '@/components/CouponCard'
import { pageMetadata } from '@/lib/seo'

export const revalidate = 3600

interface Props {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return pageMetadata({
    title: q ? `Search results for "${q}"` : 'Search',
    description: q
      ? `Find deals, coupon codes, and savings related to "${q}" on SpartanShopper.`
      : 'Search deals, coupon codes, and shopping guides on SpartanShopper.',
    path: '/search',
    noIndex: true,
  })
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '')
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.trim().slice(0, 200) ?? ''
  const term = normalize(query)

  let coupons: Coupon[] = []
  let deals: Deal[] = []
  let posts: Post[] = []

  if (term) {
    const [allCoupons, allDeals, allPosts] = await Promise.all([
      client.fetch<Coupon[]>(couponsQuery).catch(() => [] as Coupon[]),
      client.fetch<Deal[]>(dealsQuery).catch(() => [] as Deal[]),
      client.fetch<Post[]>(getAllPostsQuery).catch(() => [] as Post[]),
    ])

    coupons = allCoupons.filter((c) =>
      normalize(c.title).includes(term) ||
      normalize(c.store).includes(term) ||
      (c.description && normalize(c.description).includes(term)) ||
      (c.category && normalize(c.category).includes(term))
    )

    deals = allDeals.filter((d) =>
      normalize(d.title).includes(term) ||
      normalize(d.store).includes(term) ||
      (d.description && normalize(d.description).includes(term))
    )

    posts = allPosts.filter((p) =>
      normalize(p.title).includes(term) ||
      (p.excerpt && normalize(p.excerpt).includes(term))
    )
  }

  const totalResults = coupons.length + deals.length + posts.length

  return (
    <main className="min-h-screen bg-gray-50">
      <div style={{ backgroundColor: '#1A1A2E' }} className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-white text-3xl font-extrabold mb-1">
            {query ? `Results for "${query}"` : 'Search'}
          </h1>
          {query && (
            <p className="text-white/60 text-sm">
              {totalResults} result{totalResults !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
        <form action="/search" role="search" className="flex flex-wrap gap-3">
          <label htmlFor="site-search" className="w-full font-semibold">Search products, brands, or stores</label>
          <input id="site-search" name="q" type="search" defaultValue={query} maxLength={200} required className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3" />
          <button className="rounded-lg bg-[#1A1A2E] px-5 py-3 font-semibold text-white">Search</button>
        </form>

        {!query && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-6">Enter a search term in the bar above to find deals, coupons, and articles.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/coupons" style={{ backgroundColor: '#E63946' }} className="text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition">Browse Coupons</Link>
              <Link href="/deals" style={{ backgroundColor: '#1A1A2E' }} className="text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition">Browse Deals</Link>
            </div>
          </div>
        )}

        {query && totalResults === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-2">No results found for <strong>&ldquo;{query}&rdquo;</strong></p>
            <p className="text-gray-500 text-sm mb-8">Try a broader term, or browse by category below.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/coupons" style={{ backgroundColor: '#E63946' }} className="text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition">All Coupons</Link>
              <Link href="/deals" style={{ backgroundColor: '#1A1A2E' }} className="text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition">All Deals</Link>
              <Link href="/blog" className="border-2 border-gray-300 text-gray-700 font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition">Blog</Link>
            </div>
          </div>
        )}

        {coupons.length > 0 && (
          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-5">Coupon Codes ({coupons.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.map((coupon) => (
                <CouponCard
                  key={coupon._id}
                  title={coupon.title}
                  store={coupon.store}
                  code={coupon.code}
                  discount={coupon.discount}
                  description={coupon.description}
                  image={coupon.image ? urlFor(coupon.image).width(600).url() : undefined}
                  affiliateUrl={coupon.affiliateUrl}
                  slug={coupon.slug.current}
                  affiliateSlug={coupon.affiliateSlug}
                  expiryDate={coupon.expiryDate}
                  verified={coupon.verified}
                />
              ))}
            </div>

          </section>
        )}

        {deals.length > 0 && (
          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-5">Deals ({deals.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.map((deal) => (
                <Link
                  key={deal._id}
                  href={`/deals/${deal.slug.current}`}
                  className="bg-white rounded-2xl shadow-md p-5 hover:shadow-xl transition-shadow flex flex-col gap-2"
                >
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">{deal.store}</p>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug">{deal.title}</h3>
                  </div>
                  <div className="flex items-baseline gap-2 mt-auto">
                    <span style={{ color: '#E63946' }} className="text-xl font-extrabold">${deal.salePrice.toFixed(2)}</span>
                    {deal.originalPrice && deal.originalPrice > deal.salePrice && (
                      <span className="text-sm text-gray-500 line-through">${deal.originalPrice.toFixed(2)}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {posts.length > 0 && (
          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-5">Articles ({posts.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {posts.map((post) => (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug.current}`}
                  className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow"
                >
                  <p className="text-xs text-gray-500 mb-1">
                    {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1">{post.title}</h3>
                  {post.excerpt && <p className="text-gray-500 text-xs line-clamp-2">{post.excerpt}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  )
}

