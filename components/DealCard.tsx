import Image from 'next/image'
import Link from 'next/link'
import SaveFindButton from './SaveFindButton'
import { BlackFridayCardLabel, BlackFridayPrice } from './BlackFridayFlag'
import { getBlackFridayTarget } from '@/lib/black-friday-offers'
import { formatPriceCheckTime, hasFreshApiPrice, type ApiPriceObservation } from '@/lib/deal-price'
import { dealCardFacts, dealDisplayTitle } from '@/lib/deal-product-copy'
import { offerExpiryLabel } from '@/lib/offerExpiry'
import { endTime } from '@/lib/offer-status'

interface DealCardProps {
  title: string
  store: string
  salePrice?: number
  description?: string
  compact?: boolean
  affiliateUrl: string
  slug: string
  affiliateSlug?: string
  asin?: string
  image?: string
  imageUrl?: string
  expiryDate?: string
  priceVerifiedAt?: string
  priceVerificationSource?: string
  priceApiObservation?: ApiPriceObservation
  clipCoupon?: boolean
}

function getExpiryStatus(expiryDate?: string): 'expired' | 'soon' | 'ok' | null {
  const expiry = endTime(expiryDate)
  if (expiry === null) return null
  const now = Date.now()
  if (expiry <= now) return 'expired'
  const hoursLeft = (expiry - now) / (1000 * 60 * 60)
  if (hoursLeft <= 48) return 'soon'
  return 'ok'
}

export default function DealCard(props: DealCardProps) {
  const {
    title: rawTitle,
    store,
    description,
    compact,
    affiliateUrl,
    slug,
    affiliateSlug,
    asin,
    image,
    imageUrl,
    expiryDate,
  } = props
  const title = dealDisplayTitle(rawTitle)
  const facts = dealCardFacts(title, description)
  const shopUrl = affiliateSlug ? `/go/${affiliateSlug}` : affiliateUrl
  // Amazon's source URLs can reject browser hotlinks. Prefer the uploaded
  // Sanity asset, which is stable and is available for the repaired deals.
  const imgSrc = image || imageUrl
  const expiryStatus = getExpiryStatus(expiryDate)
  const expiryLabel = offerExpiryLabel(expiryDate)
  const expired = expiryStatus === 'expired'
  const offerTarget = expired ? undefined : getBlackFridayTarget(shopUrl, asin)
  const cta = expired ? 'Deal Expired' : `Check price at ${store}`
  const pricing = !expired && hasFreshApiPrice(props) ? (
    <div className="mb-3">
      <span className="text-xl font-extrabold text-rose-800">${props.salePrice.toFixed(2)}</span>
      <p className="mt-1 text-xs text-slate-600">
        Price checked <time dateTime={props.priceVerifiedAt}>{formatPriceCheckTime(Date.parse(props.priceVerifiedAt))}</time>.
      </p>
    </div>
  ) : null

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Image */}
      <div className={compact ? "relative h-36 w-full overflow-hidden bg-white" : "relative h-44 w-full overflow-hidden bg-white"}>
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={title}
            fill
            unoptimized
            className="object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Expired badge */}
        {expiryStatus === 'expired' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-extrabold text-xl tracking-widest">EXPIRED</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{store}</p>
        <h3 className="mt-1 text-base font-bold leading-snug text-[#1A1A2E]">
          <Link href={`/deals/${slug}`} className="hover:underline">{title}</Link>
        </h3>
        {facts.length > 0 && (
          <ul className="mt-3 space-y-2 text-sm leading-5 text-slate-700">
            {facts.slice(0, compact ? 1 : 2).map(fact => (
              <li key={fact} className="border-l-2 border-slate-200 pl-2.5">{fact}</li>
            ))}
          </ul>
        )}
        {/* Expiry */}
        {expiryLabel && expiryStatus !== 'expired' && (
          <p className={`text-xs mb-3 font-medium ${expiryStatus === 'soon' ? 'text-[#E63946]' : 'text-gray-500'}`}>
            {expiryStatus === 'soon' ? '⚠ Expires soon: ' : 'Expires: '}
            {expiryLabel}
          </p>
        )}

        <div className="mt-auto pt-4">
          {offerTarget
            ? <BlackFridayPrice target={offerTarget} flagClassName="mb-2">{pricing}</BlackFridayPrice>
            : pricing}
          <a
            href={shopUrl}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            aria-label={expiryStatus === 'expired' ? `${title}: deal expired` : `Check ${title} at ${store}`}
            className={`flex min-h-11 w-full items-center justify-center rounded-xl px-2 text-center text-sm font-bold text-white transition-opacity ${
              expiryStatus === 'expired'
                ? 'bg-gray-300 pointer-events-none opacity-60'
                : 'bg-[#B42332] hover:bg-rose-900'
            }`}
          >
            {offerTarget ? <BlackFridayCardLabel target={offerTarget}>{cta}</BlackFridayCardLabel> : cta}
          </a>
          <Link href={`/deals/${slug}`} aria-label={`See product and offer details for ${title}`} className="mt-1 flex min-h-11 items-center justify-center text-center text-sm font-semibold text-rose-800 underline underline-offset-4">
            See product &amp; offer details
          </Link>
          <SaveFindButton find={{ kind: 'deal', slug, title }} />
        </div>
      </div>
    </article>
  )
}
