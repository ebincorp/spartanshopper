import { voltaritekOffer as offer } from '../lib/voltaritek-offer'

export default function VoltariTekOffer({ showButton = true }: { showButton?: boolean }) {
  if (!offer.active) return null
  return <div className="my-3 rounded-xl border-2 border-rose-200 bg-rose-50 p-4">
    <p className="text-2xl font-extrabold tracking-tight text-rose-800">{offer.label} VoltariTek labels</p>
    <p className="mt-1 text-sm font-semibold text-slate-900">Use code <span className="rounded border border-rose-200 bg-white px-2 py-1 font-mono font-bold">{offer.code}</span> at checkout.</p>
    <p className="mt-3 text-xs leading-relaxed text-slate-600">Affiliate link: we may earn a commission at no extra cost to you.</p>
    {showButton && <a href={offer.href} rel="sponsored nofollow" className="mt-2 flex min-h-12 items-center justify-center rounded-xl bg-[#E63946] px-4 py-3 text-center text-sm font-bold text-white hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2">{offer.cta} →</a>}
  </div>
}
