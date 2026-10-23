'use client'

import { Children, useMemo, useState, type ReactNode } from 'react'
import { findBlogPosts, type BlogSearchItem } from '@/lib/blog-discovery'

export default function BlogDiscovery({ posts, children, featured }: { posts: BlogSearchItem[]; children: ReactNode; featured?: ReactNode }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('published')
  const categories = useMemo(() => ['All', ...new Set(posts.map(p => p.category).filter((x): x is string => Boolean(x)))], [posts])
  const matches = useMemo(() => findBlogPosts(posts, query, category, sort), [posts, query, category, sort])
  const childCards = Children.toArray(children)
  const cards = new Map(posts.map((post, index) => [post.id, childCards[index]]))
  const clear = () => { setQuery(''); setCategory('All') }
  return <section aria-label="Browse all articles">
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="blog-search" className="block font-bold text-slate-900">Find an article</label>
          <input id="blog-search" type="search" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Try magnetic labels, VoltariTek, skincare…" aria-controls="blog-results"
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus-visible:ring-2 focus-visible:ring-rose-500" />
        </div>
        <div>
          <label htmlFor="blog-sort" className="block font-bold text-slate-900">Sort articles</label>
          <select id="blog-sort" value={sort} onChange={e => setSort(e.target.value)}
            className="mt-2 min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-slate-900">
            <option value="published">Newest published</option>
            <option value="updated">Recently updated</option>
          </select>
        </div>
      </div>
      <div role="group" aria-label="Filter articles by category" className="mt-4 flex flex-wrap gap-2">
        {categories.map(item => <button key={item} type="button" aria-pressed={category === item}
          onClick={() => setCategory(item)} className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-rose-500 ${category === item ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-700'}`}>{item}</button>)}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p role="status" aria-live="polite" className="text-sm text-slate-600">{matches.length} {matches.length === 1 ? 'article' : 'articles'}{query || category !== 'All' ? ' found' : ''}</p>
        {(query || category !== 'All') && <button onClick={clear} className="min-h-11 font-semibold text-rose-700 underline">Clear filters</button>}
      </div>
    </div>
    {!query && category === 'All' && sort === 'published' && featured}
    <div id="blog-results" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {matches.map(post => cards.get(post.id))}
    </div>
    {matches.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h2 className="text-xl font-bold">No articles match those filters</h2>
      <p className="mt-2 text-slate-600">Try a shorter product name, another topic, or clear the filters.</p>
      <button onClick={clear} className="mt-4 min-h-12 rounded-xl bg-slate-900 px-5 text-white">Show all articles</button>
    </div>}
  </section>
}
