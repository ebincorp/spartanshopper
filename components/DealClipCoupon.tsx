import { formatPriceCheckTime, getPriceCheckTime, PRICE_FRESH_HOURS, type ClipCouponObservation } from '@/lib/deal-price'

export default function DealClipCoupon({ observation, showCheckTime = false }: {
  observation?: ClipCouponObservation | null
  showCheckTime?: boolean
}) {
  const now = Date.now()
  const checkedAt = getPriceCheckTime(observation?.checkedAt, now)
  const recent = checkedAt !== null && now - checkedAt <= PRICE_FRESH_HOURS * 60 * 60 * 1000
  const label = recent ? observation?.label?.trim() : ''
  const terms = recent ? observation?.terms?.trim() : ''

  return (
    <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm leading-5 text-slate-800">
      <p className="font-semibold text-rose-900">{label || 'Check the listing for a clip coupon'}</p>
      <p>Clip the coupon on the product page if shown. {terms && <>{terms} </>}Confirm the discount at checkout.</p>
      {showCheckTime && label && checkedAt !== null && (
        <p className="mt-1 text-xs text-slate-600">
          Coupon checked <time dateTime={observation?.checkedAt}>{formatPriceCheckTime(checkedAt)}</time>.
        </p>
      )}
    </div>
  )
}
