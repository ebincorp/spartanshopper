import Link from 'next/link'
import type { BuyingSummary } from '@/lib/types'

function PriceLink({ pick, showModel }: { pick: NonNullable<BuyingSummary['picks']>[number]; showModel?: boolean }) {
  if (!pick.affiliateSlug || !/^[a-z0-9-]+$/i.test(pick.affiliateSlug)) return null

  return (
    <a
      href={`/go/${pick.affiliateSlug}`}
      target="_blank"
      rel="sponsored noopener noreferrer nofollow"
      aria-label={`Check current price for ${pick.name}`}
      className="inline-flex min-h-11 items-center font-semibold text-rose-800 underline underline-offset-4"
    >
      {showModel ? `Check current price for ${pick.name}` : 'Check current price'}
    </a>
  )
}

export default function ArticleBuyingSummary({ summary }: { summary: BuyingSummary }) {
  const picks = summary.picks?.filter(pick => pick.name?.trim()) ?? []
  const single = picks.length === 1 ? picks[0] : undefined

  return (
    <section aria-labelledby="article-buying-summary" className="mb-7 border-b border-slate-200 pb-6">
      <h2 id="article-buying-summary" className="text-xl font-bold text-slate-950">
        {picks.length > 1 ? 'Picks at a glance' : 'Quick verdict'}
      </h2>
      <p className="mt-2 max-w-prose leading-relaxed text-slate-800">{summary.verdict}</p>
      {summary.details && summary.details.length > 0 && (
        <ul className="mt-3 max-w-prose list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-700">
          {summary.details.map((detail, index) => <li key={index}>{detail}</li>)}
        </ul>
      )}
      {summary.evidence && <p className="mt-3 text-sm leading-5 text-slate-600">{summary.evidence}</p>}
      <p className="mt-4 text-sm leading-5 text-slate-600">
        We may earn a commission from qualifying purchases.{' '}
        <Link href="/affiliate-disclosure" className="font-semibold text-rose-800 underline underline-offset-4">
          Affiliate disclosure
        </Link>
      </p>

      {single && (
        <div className="mt-3">
          {single.fit && <p className="text-sm leading-6 text-slate-700">{single.fit}</p>}
          {single.check && <p className="text-sm leading-6 text-slate-700">{single.check}</p>}
          <PriceLink pick={single} showModel />
        </div>
      )}
      {picks.length > 1 && (
        <>
          <ul className="mt-4 divide-y divide-slate-200 border-t border-slate-200 sm:hidden">
            {picks.map(pick => (
              <li key={pick._key} className="py-3">
                <h3 className="font-bold text-slate-950">{pick.name}</h3>
                {pick.fit && <p className="mt-1 text-sm leading-5 text-slate-700">{pick.fit}</p>}
                {pick.check && <p className="mt-1 text-sm leading-5 text-slate-700">{pick.check}</p>}
                <PriceLink pick={pick} />
              </li>
            ))}
          </ul>
          <table className="mt-4 hidden w-full border-collapse text-left text-sm sm:table" aria-label="Compare recommended products">
            <thead className="bg-slate-100 text-slate-900">
              <tr>
                <th scope="col" className="p-3">Product</th>
                <th scope="col" className="p-3">Good fit for</th>
                <th scope="col" className="p-3">Check first</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {picks.map(pick => (
                <tr key={pick._key}>
                  <th scope="row" className="w-1/3 p-3 align-top text-slate-950">
                    {pick.name}<br /><PriceLink pick={pick} />
                  </th>
                  <td className="p-3 align-top">{pick.fit}</td>
                  <td className="p-3 align-top">{pick.check}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  )
}
