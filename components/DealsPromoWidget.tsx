interface Offer {
  id: string
  eyebrow: string
  headline: string
  body: string
  cta: string
  href: string
  accent: string
  swatch: string
}

const OFFERS: Offer[] = [
  {
    id: 'healthy-snack-box',
    eyebrow: 'Free Sample Box',
    headline: 'Get a Free Healthy Snack Box',
    body: 'Gluten-free, sugar-free, better-for-you snacks. No purchase required.',
    cta: 'Claim My Free Box',
    href: '/go/healthy-snack-box',
    accent: '#3F7D58',
    swatch: '🌾',
  },
  // Add approved offers here as they come in, e.g.:
  // {
  //   id: 'gas-card',
  //   eyebrow: 'Sweepstakes',
  //   headline: 'Enter to Win a $500 Gas Card',
  //   body: 'Quick entry. Winner drawn monthly.',
  //   cta: 'Enter Now',
  //   href: '/go/gas-card-sweepstakes',
  //   accent: '#C4471F',
  //   swatch: '⛽',
  // },
]

export default function DealsPromoWidget() {
  const offer = OFFERS[0]
  if (!offer) return null

  return (
    <div className="w-full max-w-xs">
      <div
        className="relative overflow-hidden rounded-lg border bg-white shadow-sm"
        style={{ borderColor: `${offer.accent}33` }}
      >
        <div className="h-1 w-full" style={{ backgroundColor: offer.accent }} />
        <div className="p-5">
          <div
            className="mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
            style={{
              backgroundColor: `${offer.accent}14`,
              color: offer.accent,
            }}
          >
            <span aria-hidden="true">{offer.swatch}</span>
            {offer.eyebrow}
          </div>
          <h3 className="mb-1.5 text-lg font-bold leading-snug text-gray-900">
            {offer.headline}
          </h3>
          <p className="mb-4 text-sm leading-relaxed text-gray-600">{offer.body}</p>
          <a
            href={offer.href}
            rel="sponsored noopener"
            className="group flex w-full items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: offer.accent }}
          >
            {offer.cta}
            <span
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5"
            >
              →
            </span>
          </a>
          <p className="mt-3 text-center text-[11px] leading-tight text-gray-400">
            Sponsored offer. No purchase necessary.
          </p>
        </div>
      </div>
    </div>
  )
}
