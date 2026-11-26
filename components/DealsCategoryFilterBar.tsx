'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  categories: string[]
  activeCategory?: string
}

export default function DealsCategoryFilterBar({ categories, activeCategory }: Props) {
  const router = useRouter()

  // Plain <Link> navigation between `/deals` and `/deals?category=x` was
  // getting served a stale Router Cache entry — the URL and active pill
  // updated but the deals grid didn't. router.refresh() forces the server
  // component tree to re-render on the new params instead of reusing cache.
  const pillProps = (href: string) => ({
    href,
    onClick: () => router.refresh(),
  })
  const categoryPath = (category: string) =>
    category ? `/deals?category=${encodeURIComponent(category)}` : '/deals'

  return (
    <>
      <div className="flex items-center gap-3 sm:hidden">
        <label htmlFor="deals-category" className="text-sm font-semibold text-slate-900">Category</label>
        <select
          id="deals-category"
          value={activeCategory ?? ''}
          onChange={event => window.location.assign(categoryPath(event.currentTarget.value))}
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-800"
        >
          <option value="">All categories</option>
          {activeCategory && !categories.includes(activeCategory) && (
            <option value={activeCategory}>{CATEGORY_LABELS[activeCategory] ?? activeCategory}</option>
          )}
          {categories.map(category => (
            <option key={category} value={category}>{CATEGORY_LABELS[category] ?? category}</option>
          ))}
        </select>
      </div>
      <div className="hidden flex-wrap gap-2 sm:flex">
        <Link
          {...pillProps('/deals')}
          aria-current={!activeCategory ? 'page' : undefined}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            !activeCategory
              ? 'text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
          style={!activeCategory ? { backgroundColor: '#B42332' } : {}}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat}
            {...pillProps(categoryPath(cat))}
            aria-current={activeCategory === cat ? 'page' : undefined}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              activeCategory === cat
                ? 'text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
            style={activeCategory === cat ? { backgroundColor: '#B42332' } : {}}
          >
            {CATEGORY_LABELS[cat] ?? cat}
          </Link>
        ))}
      </div>
    </>
  )
}
