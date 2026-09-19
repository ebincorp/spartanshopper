import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/lib/sanity.client'
import type { Deal } from '@/lib/types'

type Props = {
  title: string
  description?: string
  deals: Deal[]
}

function savings(deal: Deal) {
  return deal.originalPrice && deal.originalPrice > deal.salePrice
    ? Math.round(((deal.originalPrice - deal.salePrice) / deal.originalPrice) * 100)
    : null
}

export default function DealShelf({ title, description, deals }: Props) {
  if (deals.length === 0) return null

  return (
    <section aria-label={title} className="mb-12">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
        </div>
        <Link href="/deals" className="text-sm font-bold text-[#E63946] underline underline-offset-4 hover:text-[#bf2633]">
          View all deals
        </Link>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
        {deals.map((deal) => {
          const discount = savings(deal)
          const image = deal.imageUrl || (deal.image ? urlFor(deal.image).width(360).url() : undefined)
          return (
            <article key={deal._id} className="w-[186px] shrink-0 snap-start sm:w-[204px]">
              <Link href={`/deals/${deal.slug.current}`} className="group block" aria-label={`View ${deal.title} deal details`}>
                <div className="relative aspect-square overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition group-hover:shadow-md">
                  {image ? (
                    <Image src={image} alt={deal.title} fill unoptimized className="object-contain p-3 transition duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-5 text-center text-sm font-medium text-slate-400">Image coming soon</div>
                  )}
                </div>
                <div className="pt-3">
                  <div className="mb-1 flex min-h-6 items-center gap-1.5">
                    {discount && discount <= 75 && <span className="rounded bg-[#E63946] px-1.5 py-1 text-xs font-extrabold text-white">{discount}% off</span>}
                    <span className="text-xs font-semibold text-slate-500">{deal.store}</span>
                  </div>
                  <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-900 group-hover:text-[#E63946]">{deal.title}</h3>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-lg font-extrabold text-slate-950">${deal.salePrice.toFixed(2)}</span>
                    {deal.originalPrice && deal.originalPrice > deal.salePrice && <span className="text-xs text-slate-500 line-through">${deal.originalPrice.toFixed(2)}</span>}
                  </div>
                </div>
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}
