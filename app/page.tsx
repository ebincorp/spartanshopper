import Link from 'next/link'
import { pageMetadata } from '@/lib/seo'
import { client, urlFor } from '@/lib/sanity.client'
import { couponsQuery, featuredDealsQuery } from '@/lib/queries'
import type { Coupon, Deal, Post } from '@/lib/types'
import CouponFilterBar from '@/components/CouponFilterBar'
import DealCard from '@/components/DealCard'

export const revalidate = 300
export const metadata = pageMetadata({
  absoluteTitle: 'SpartanShopper — Coupon Codes & Shopping Deals',
  title: 'Coupon Codes & Shopping Deals',
  description: 'Browse coupon codes and shopping deals across home, beauty, tech, pets, and more. Find offer details and check the final price with the retailer.',
  path: '/',
})
const relatedGuidesQuery = `*[_type == "post" && defined(slug.current)
  && publishedAt <= now() && relatedCategory in $categories]
  | order(publishedAt desc)[0...3] { _id, title, slug }`

export default async function HomePage() {
  const [couponResult, dealResult] = await Promise.allSettled([
    client.fetch<Coupon[]>(couponsQuery), client.fetch<Deal[]>(featuredDealsQuery),
  ])
  const coupons = couponResult.status === 'fulfilled' ? couponResult.value : []
  const deals = dealResult.status === 'fulfilled' ? dealResult.value : []
  const categories = [...new Set(deals.map(deal => deal.category).filter(Boolean))]
  const guides = categories.length
    ? await client.fetch<Post[]>(relatedGuidesQuery, { categories }).catch(() => [] as Post[])
    : []
  const jsonLd = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'Organization', name: 'SpartanShopper.com', url: 'https://www.spartanshopper.com',
        logo: 'https://www.spartanshopper.com/android-chrome-512x512.png',
        sameAs: ['https://www.instagram.com/spartanshopper', 'https://www.tiktok.com/@spartanshopper'] },
      { '@type': 'WebSite', name: 'SpartanShopper', url: 'https://www.spartanshopper.com',
        potentialAction: { '@type': 'SearchAction', target: {
          '@type': 'EntryPoint', urlTemplate: 'https://www.spartanshopper.com/search?q={search_term_string}'
        }, 'query-input': 'required name=search_term_string' } },
    ],
  }
  return (
    <main className="bg-slate-50 text-slate-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <section className="bg-[#1A1A2E] px-4 py-10 sm:py-14 text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold tracking-widest uppercase text-rose-300 mb-3">SpartanShopper / Coupons & deals</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-2xl">Find a coupon.<br />Make your money go further.</h1>
            <p className="text-slate-300 text-lg mt-4 max-w-xl">Explore offers for everyday purchases, from home and beauty to tech and pets.</p>
            <div className="flex flex-wrap gap-3 mt-6">
              <a href="#coupons" className="bg-[#E63946] rounded-lg px-6 py-3 font-bold hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Browse coupons</a>
              <Link href="/deals" className="border border-white/40 rounded-lg px-6 py-3 font-semibold hover:bg-white/10">Explore deals</Link>
            </div>
          </div>
          <form action="/search" role="search" className="min-w-0 bg-white rounded-2xl p-6 text-slate-900 shadow-lg">
            <label htmlFor="home-search" className="block text-xl font-bold mb-2">Shopping for something?</label>
            <p id="search-help" className="text-slate-600 mb-4">Search products, brands, or stores.</p>
            <div className="flex gap-2">
              <input id="home-search" name="q" type="search" required maxLength={200} aria-describedby="search-help" placeholder="Try kitchen or skincare" className="min-w-0 flex-1 border border-slate-300 rounded-lg px-3 py-3 focus:outline-2 focus:outline-[#E63946]" />
              <button className="bg-[#1A1A2E] text-white font-semibold rounded-lg px-4 hover:bg-slate-700">Search</button>
            </div>
            <p className="text-sm text-slate-600 mt-4">Check the offer details before heading to the retailer.</p>
          </form>
        </div>
      </section>
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <p className="max-w-7xl mx-auto text-sm text-slate-600">We may earn a commission from qualifying purchases. <Link href="/affiliate-disclosure" className="underline underline-offset-2">How affiliate links work</Link></p>
      </div>
      <section id="coupons" className="max-w-7xl mx-auto px-4 py-9 scroll-mt-20">
        <div className="flex flex-wrap justify-between items-end gap-3 mb-5">
          <div><h2 className="text-3xl font-extrabold tracking-tight">Browse coupon offers</h2>
            <p className="mt-2 text-slate-600">{couponResult.status === 'fulfilled' ? `${coupons.length} listed offers. ` : ''}Choose a category to narrow your search.</p></div>
          <Link href="/coupons" className="font-semibold underline underline-offset-4">View coupon directory</Link>
        </div>
        {coupons.length > 0 ? <CouponFilterBar coupons={coupons} initialLimit={6} /> :
          <p className="border rounded-xl bg-white p-6">{couponResult.status === 'rejected' ? 'We couldn’t load coupon offers. Please try again shortly.' : 'No coupon offers are currently listed. Explore our shopping guides while we add more.'}</p>}
      </section>
      {deals.length > 0 && <section id="spartan-picks" aria-labelledby="spartan-picks-title" className="max-w-7xl mx-auto px-4 pb-10 scroll-mt-20">
        <p className="text-sm font-bold uppercase tracking-widest text-rose-700 mb-2">A little browsing. A little less spending.</p>
        <div className="flex flex-wrap justify-between gap-3 items-end mb-5"><h2 id="spartan-picks-title" className="text-3xl font-extrabold tracking-tight">Spartan Picks</h2><Link href="/deals" className="font-semibold underline underline-offset-4">View all deals</Link></div>
        <p className="text-slate-600 mb-2">Your cart doesn’t need a pep talk. Your budget might appreciate one.</p>
        <p className="text-sm text-slate-600 mb-5">Recent additions to our active deal directory. Prices and availability can change; confirm the final price and offer conditions with the retailer.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{deals.map(deal => <DealCard key={deal._id} {...deal} slug={deal.slug.current} image={deal.image ? urlFor(deal.image).width(400).url() : undefined} />)}</div>
        {guides.length > 0 && <aside className="mt-6 rounded-xl border border-slate-200 bg-white p-5" aria-label="Related shopping guides">
          <h3 className="font-bold text-lg">Do a little homework before checkout</h3>
          <p className="mt-1 text-sm text-slate-600">Explore guides in these shopping categories.</p>
          <ul className="mt-3 space-y-3">{guides.map(guide => <li key={guide._id}><Link className="font-semibold underline underline-offset-4 hover:text-rose-700" href={`/blog/${guide.slug.current}`}>{guide.title}</Link></li>)}</ul>
        </aside>}
      </section>}
      <section className="bg-[#1A1A2E] text-white px-4 py-10">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-6"><div><h2 className="text-2xl font-bold">Compare before you buy</h2><p className="text-slate-300 mt-2">Explore product comparisons and shopping guides.</p></div><Link href="/blog" className="bg-white text-[#1A1A2E] font-bold px-6 py-3 rounded-lg">Read the guides</Link></div>
      </section>
    </main>
  )
}
