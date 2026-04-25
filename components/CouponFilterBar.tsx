'use client'

import { useState } from 'react'
import { urlFor } from '@/lib/sanity.client'
import CouponCard from '@/components/CouponCard'
import type { Coupon } from '@/lib/types'

const ALL_CATEGORIES = [
  { label: 'Health & Wellness', value: 'health' },
  { label: 'Tech & Gadgets',    value: 'tech' },
  { label: 'Home & Kitchen',    value: 'home' },
  { label: 'Food & Grocery',    value: 'food' },
  { label: 'Beauty',            value: 'beauty' },
  { label: 'Fitness',           value: 'fitness' },
  { label: 'Pets',              value: 'pets' },
  { label: 'Travel',            value: 'travel' },
  { label: 'Fashion',           value: 'fashion' },
  { label: 'Amazon Deals',      value: 'amazon' },
]

interface Props {
  coupons: Coupon[]
}

export default function CouponFilterBar({ coupons }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all')

  // Only show pills for categories that have at least one coupon
  const presentCategories = ALL_CATEGORIES.filter((cat) =>
    coupons.some((c) => c.category === cat.value)
  )

  const filtered =
    activeCategory === 'all'
      ? coupons
      : coupons.filter((c) => c.category === activeCategory)

  const pillBase =
    'whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors focus:outline-none'

  return (
    <div>
      {/* Filter pills */}
      {presentCategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
          {/* All pill */}
          <button
            onClick={() => setActiveCategory('all')}
            className={`${pillBase} ${
              activeCategory === 'all'
                ? 'text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
            style={activeCategory === 'all' ? { backgroundColor: '#E63946' } : {}}
          >
            All
            <span className="ml-1.5 text-xs opacity-70">({coupons.length})</span>
          </button>

          {presentCategories.map((cat) => {
            const count = coupons.filter((c) => c.category === cat.value).length
            const isActive = activeCategory === cat.value
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`${pillBase} ${
                  isActive
                    ? 'text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
                style={isActive ? { backgroundColor: '#E63946' } : {}}
              >
                {cat.label}
                <span className="ml-1.5 text-xs opacity-70">({count})</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Coupon grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((coupon) => (
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
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">
            No coupons in this category yet — check back soon!
          </p>
        </div>
      )}
    </div>
  )
}
