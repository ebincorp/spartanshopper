import Link from 'next/link'
import { halloweenGuides } from '@/lib/halloween-feature'

const focusStyle = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-700'

export default function HalloweenFeature() {
  return (
    <section id="halloween" aria-labelledby="halloween-title" className="max-w-7xl mx-auto px-4 pt-6 scroll-mt-20">
      <div className="overflow-hidden rounded-2xl border border-orange-200 bg-orange-50">
        <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5 sm:px-7 sm:pt-7">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-900">Halloween 2026 · October 31</p>
            <h2 id="halloween-title" className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1A1A2E]">More Halloween. Less last-minute panic.</h2>
            <p className="mt-2 text-sm sm:text-base text-slate-700">Pick what you still need. Leave the unnecessary extras in the cart.</p>
          </div>
          <Link href="/blog/halloween-shopping-guide-2026" className={`inline-flex items-center gap-3 rounded-lg bg-[#1A1A2E] px-4 py-3 text-sm font-bold text-white hover:bg-slate-700 ${focusStyle}`}>
            Explore the Halloween guide <span aria-hidden="true">→</span>
          </Link>
        </div>
        <ul className="grid gap-3 p-5 sm:grid-cols-3 sm:gap-4 sm:p-7">
          {halloweenGuides.map(guide => (
            <li key={guide.href} className="min-w-0">
              <Link href={guide.href} className={`group flex h-full flex-col rounded-xl border border-orange-200 bg-white p-4 transition-colors hover:border-orange-600 hover:bg-orange-50/50 sm:p-5 ${focusStyle}`}>
                <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-orange-900"><span aria-hidden="true" className="text-orange-700">{guide.number}</span>{guide.label}</p>
                <h3 className="mt-2 text-lg font-bold leading-snug text-[#1A1A2E]">{guide.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{guide.description}</p>
                <span className="mt-4 flex items-center justify-between gap-3 text-sm font-semibold text-slate-900 underline decoration-orange-300 underline-offset-4 group-hover:decoration-orange-700">{guide.cta}<span aria-hidden="true">→</span></span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="border-t border-orange-200 px-5 py-3 text-xs leading-relaxed text-slate-600 sm:px-7">Ordering for a party? Check arrival for your address, selected size, and seller. Delivery before Halloween is not guaranteed.</p>
      </div>
    </section>
  )
}
