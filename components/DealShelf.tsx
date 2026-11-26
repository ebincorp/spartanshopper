import { urlFor } from '@/lib/sanity.client'
import type { Deal } from '@/lib/types'
import DealCard from './DealCard'

type Props = {
  title: string
  description?: string
  deals: Deal[]
}

export default function DealShelf({ title, description, deals }: Props) {
  if (!deals.length) return null

  return (
    <section aria-label={title} className="mb-10">
      <h2 className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">{title}</h2>
      {description && <p className="mt-1 hidden text-sm text-slate-600 sm:block">{description}</p>}
      <div className="-mx-4 mt-3 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:mt-4 sm:px-0">
        {deals.map(deal => (
          <div key={deal._id} className="flex w-[min(76vw,268px)] shrink-0 snap-start [&>article]:w-full">
            <DealCard
              {...deal}
              slug={deal.slug.current}
              image={deal.image ? urlFor(deal.image).width(400).url() : undefined}
              compact
            />
          </div>
        ))}
      </div>
    </section>
  )
}
