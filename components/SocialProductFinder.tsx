'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { filterSocialProducts, type SocialProductCard } from '@/lib/social-products'

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946] focus-visible:ring-offset-2'

function featuredDate(value?: string) {
  if (!value) return null
  const date = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date)
}

function ProductImage({ product, priority }: { product: SocialProductCard; priority: boolean }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="relative flex h-52 shrink-0 items-center justify-center overflow-hidden border-b border-slate-100 bg-white p-5 sm:h-56 sm:p-6">
      {product.imageUrl && !failed ? (
        // Existing published product imagery; never a promotional graphic with an old price.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl}
          alt={product.imageAlt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain p-5 sm:p-6"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="max-w-xs text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-[#E63946]" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6"><path d="M6 7h12l1 13H5L6 7Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
          </span>
          <p className="text-sm font-medium text-slate-500">See the product details for photos</p>
        </div>
      )}
    </div>
  )
}

export default function SocialProductFinder({ products }: { products: SocialProductCard[] }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const categories = useMemo(() => ['All', ...new Set(products.map(product => product.category))], [products])
  const matches = useMemo(() => filterSocialProducts(products, query, category), [products, query, category])
  const hasFilters = query.trim().length > 0 || category !== 'All'

  function clearFilters() {
    setQuery('')
    setCategory('All')
  }

  return (
    <section aria-label="Products from our recent posts" className="mx-auto max-w-6xl px-5 pb-12 pt-5 sm:pt-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <label htmlFor="social-product-search" className="block text-base font-bold text-[#1A1A2E]">Find a product from a post</label>
        <div className="relative mt-2">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
          <input
            id="social-product-search"
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Try VoltariTek, magnetic labels, coffee maker…"
            autoComplete="off"
            aria-controls="social-product-results"
            className={`min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-12 pr-4 text-base text-slate-900 placeholder:text-slate-500 ${focusRing}`}
          />
        </div>
        <div role="group" aria-label="Filter by product category" className="mt-3 flex gap-2 overflow-x-auto px-1 py-1 sm:flex-wrap">
          {categories.map(item => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              aria-controls="social-product-results"
              onClick={() => setCategory(item)}
              className={`min-h-11 shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${focusRing} ${category === item ? 'border-[#1A1A2E] bg-[#1A1A2E] text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'}`}
            >{item}</button>
          ))}
        </div>
      </div>

      <div className="flex min-h-14 items-center justify-between gap-3 py-3">
        <p role="status" aria-live="polite" aria-atomic="true" className="text-sm text-slate-600">
          <span className="font-semibold text-[#1A1A2E]">{matches.length}</span> {matches.length === 1 ? 'product' : 'products'}{hasFilters ? ' found' : ' · Newest posts first'}
        </p>
        {hasFilters && <button type="button" onClick={clearFilters} className={`min-h-11 rounded-lg px-3 text-sm font-semibold text-rose-700 underline underline-offset-4 hover:text-rose-900 ${focusRing}`}>Clear filters</button>}
      </div>

      <div id="social-product-results" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((product, index) => {
          const date = featuredDate(product.postedAt)
          const detailSlug = product.detailHref.split('?')[0].split('/').filter(Boolean).pop()
          return (
            <article id={product.id} data-social-product={product.id} key={product.id} className="flex min-w-0 scroll-mt-24 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <ProductImage product={product} priority={index < 3} />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-semibold">
                  <span className="text-rose-700">{product.category}</span>
                  {date && <time dateTime={product.postedAt} className="text-slate-500">Featured {date}</time>}
                </div>
                <h2 className="mt-2 text-xl font-bold leading-snug tracking-tight text-[#1A1A2E]">{product.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{product.description}</p>
                {product.offerEnded && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-950">The previous offer is no longer active. View the product details for context.</p>}
                <div className="mt-auto space-y-2 pt-5">
                  {product.watchUrl && <a href={product.watchUrl} target="_blank" rel="noopener noreferrer" className={`flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-3 py-3 text-center text-sm font-semibold text-[#1A1A2E] ${focusRing}`}>Watch the builder video ↗</a>}
                  {product.affiliateHref && !product.offerEnded && (
                    <a href={product.affiliateHref} aria-label={`Check price at ${product.store} for ${product.title}`} rel="sponsored nofollow" className={`flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1A1A2E] px-3 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-[#30304b] ${focusRing}`}>
                      Check price at {product.store}
                      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4 shrink-0"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>
                    </a>
                  )}
                  <Link
                    href={product.detailHref}
                    aria-label={product.detailKind === 'guide' ? `Read the guide for ${product.title}` : `Product details for ${product.title}`}
                    data-video-guide={product.detailKind === 'guide' ? detailSlug : undefined}
                    data-video-deal={product.detailKind === 'deal' ? detailSlug : undefined}
                    className={`flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-3 py-3 text-center text-sm font-semibold text-[#1A1A2E] transition-colors hover:bg-slate-50 ${focusRing}`}
                  >{product.detailKind === 'guide' ? 'Read the guide' : 'Product details'}</Link>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {matches.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
          <h2 className="text-xl font-bold text-[#1A1A2E]">{products.length ? 'No products match yet' : 'Our product list is being refreshed'}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">{products.length ? 'Try a brand, a shorter product name, or another category.' : 'You can still browse current deals and our buying guides.'}</p>
          {hasFilters ? <button type="button" onClick={clearFilters} className={`mt-5 min-h-12 rounded-xl bg-[#1A1A2E] px-5 py-3 font-semibold text-white ${focusRing}`}>Show all products</button> : <Link href="/deals" className={`mt-5 inline-flex min-h-12 items-center rounded-xl bg-[#1A1A2E] px-5 py-3 font-semibold text-white ${focusRing}`}>Browse current deals</Link>}
        </div>
      )}
    </section>
  )
}
