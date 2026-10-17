import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/lib/sanity.client'
import { offerExpiryLabel } from '@/lib/offerExpiry'
import type { Deal } from '@/lib/types'

export default function EndingSoonDeals({ deals }: { deals: Deal[] }) {
  if (!deals.length) return null
  return (
    <section id="ending-soon" aria-labelledby="ending-soon-title" className="mb-8 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 sm:p-6 scroll-mt-20">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-rose-700">Time-sensitive offers</p>
          <h2 id="ending-soon-title" className="text-2xl font-extrabold tracking-tight text-slate-950">Deals ending soon</h2>
          <p className="mt-1 text-sm text-slate-600">Ending within 48 hours, earliest first. Prices and availability can change.</p>
        </div>
        <Link href="/deals" className="text-sm font-bold text-rose-700 underline underline-offset-4">All deals →</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
        {deals.map(deal => {
          const image = deal.image ? urlFor(deal.image).width(420).url() : undefined
          const saving = deal.originalPrice && deal.originalPrice > deal.salePrice
            ? Math.round((1 - deal.salePrice / deal.originalPrice) * 100) : 0
          return (
            <article key={deal._id} className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <Link href={`/deals/${deal.slug.current}`} className="group block p-3 sm:p-4">
                <div className="relative mb-3 h-28 sm:h-36">
                  {image && <Image src={image} alt={deal.image?.alt || deal.title} fill unoptimized className="object-contain" />}
                </div>
                <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-950 group-hover:text-rose-700">{deal.title}</h3>
                <p className="mt-2 flex flex-wrap items-baseline gap-2">
                  <span className="text-xl font-extrabold text-[#E63946]">${deal.salePrice.toFixed(2)}</span>
                  {saving > 0 && saving <= 75 && <span className="text-xs font-bold text-emerald-800">{saving}% off{deal.clipCoupon ? ' with coupon' : ''}</span>}
                </p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-700">Ends {offerExpiryLabel(deal.expiryDate)}</p>
                <span className="mt-3 block rounded-lg bg-[#E63946] px-2 py-2 text-center text-sm font-bold text-white">View offer →</span>
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}
