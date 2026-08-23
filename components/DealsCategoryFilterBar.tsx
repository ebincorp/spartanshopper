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

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <Link
        {...pillProps('/deals')}
        className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
          !activeCategory
            ? 'text-white'
            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
        }`}
        style={!activeCategory ? { backgroundColor: '#E63946' } : {}}
      >
        All
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat}
          {...pillProps(`/deals?category=${cat}`)}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            activeCategory === cat
              ? 'text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
          style={activeCategory === cat ? { backgroundColor: '#E63946' } : {}}
        >
          {CATEGORY_LABELS[cat] ?? cat}
        </Link>
      ))}
    </div>
  )
}
