'use client'

import { useState } from 'react'
import { urlFor } from '@/lib/sanity.client'
import CouponCard from '@/components/CouponCard'
import type { Coupon } from '@/lib/types'

// Each label may match multiple stored category slugs (old short-form + new descriptive-form)
const CATEGORY_GROUPS: { label: string; values: string[] }[] = [
  { label: 'Health & Wellness', values: ['health', 'health-wellness'] },
  { label: 'Tech & Gadgets',    values: ['tech', 'tech-gadgets']      },
  { label: 'Home & Kitchen',    values: ['home', 'home-kitchen']      },
  { label: 'Food & Grocery',    values: ['food']                      },
  { label: 'Beauty',            values: ['beauty']                    },
  { label: 'Fitness',           values: ['fitness']                   },
  { label: 'Pets',              values: ['pets']                      },
  { label: 'Travel',            values: ['travel']                    },
  { label: 'Fashion',           values: ['fashion']                   },
  { label: 'Amazon Deals',      values: ['amazon']                    },
  { label: 'Automotive',        values: ['automotive']                },
  { label: 'Outdoor',           values: ['outdoor']                   },
  { label: 'Baby & Nursery',    values: ['baby-nursery']              },
]

interface Props {
  coupons: Coupon[]
}

export default function CouponFilterBar({ coupons }: Props) {
  const [activeLabel, setActiveLabel] = useState<string>('all')

  // Only show pills for groups that have at least one coupon
  const presentGroups = CATEGORY_GROUPS.filter((group) =>
    coupons.some((c) => group.values.includes(c.category ?? ''))
  )

  const filtered =
    activeLabel === 'all'
      ? coupons
      : coupons.filter((c) => {
          const group = CATEGORY_GROUPS.find((g) => g.label === activeLabel)
          return group ? group.values.includes(c.category ?? '') : false
        })

  const pillBase =
    'whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors focus:outline-none'

  return (
    <div>
      {/* Filter pills */}
      {presentGroups.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
          {/* All pill */}
          <button
            onClick={() => setActiveLabel('all')}
            className={`${pillBase} ${
              activeLabel === 'all'
                ? 'text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
            style={activeLabel === 'all' ? { backgroundColor: '#E63946' } : {}}
          >
            All
            <span className="ml-1.5 text-xs opacity-70">({coupons.length})</span>
          </button>

          {presentGroups.map((group) => {
            const count = coupons.filter((c) => group.values.includes(c.category ?? '')).length
            const isActive = activeLabel === group.label
            return (
              <button
                key={group.label}
                onClick={() => setActiveLabel(group.label)}
                className={`${pillBase} ${
                  isActive
                    ? 'text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
                style={isActive ? { backgroundColor: '#E63946' } : {}}
              >
                {group.label}
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
