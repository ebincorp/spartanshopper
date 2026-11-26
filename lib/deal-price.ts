/**
 * Price freshness for Amazon deals.
 *
 * Stored prices are only shown while the daily verification job has recently
 * confirmed them against the Creators API (it stamps `priceVerifiedAt`). Once
 * that lapses — API outage, cron failure, or a hand-entered price ageing out —
 * cards and deal pages stop presenting the stored price as current and send
 * shoppers to Amazon to check it instead. The deal and its affiliate link stay up.
 *
 * 25h = the daily cron cadence plus an hour of slack for run-time drift, so a
 * normal day never flickers a deal into the fallback.
 */
export const PRICE_FRESH_HOURS = 25
export const CREATORS_API_PRICE_SOURCE = 'amazon-creators-api'

export interface ApiPriceObservation {
  amount: number
  checkedAt: string
}

export interface ClipCouponObservation {
  label: string
  checkedAt: string
  terms?: string
}

interface DealPriceObservation {
  store?: string | null
  salePrice?: number | null
  priceVerificationSource?: string | null
  priceVerifiedAt?: string | null
  priceApiObservation?: ApiPriceObservation | null
  clipCoupon?: boolean | null
}

const priceCheckFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  timeZone: 'America/Los_Angeles', timeZoneName: 'short',
})

export function getPriceCheckTime(priceVerifiedAt?: string | null, now = Date.now()): number | null {
  if (!priceVerifiedAt || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(priceVerifiedAt)) return null
  const day = priceVerifiedAt.slice(0, 10)
  const calendarDate = new Date(day)
  if (!Number.isFinite(calendarDate.getTime()) || calendarDate.toISOString().slice(0, 10) !== day) return null
  const verified = Date.parse(priceVerifiedAt)
  return Number.isFinite(verified) && verified <= now ? verified : null
}

export function formatPriceCheckTime(checkedAt: number): string {
  return priceCheckFormatter.format(checkedAt)
}

export function isPriceAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export function isPriceFresh(priceVerifiedAt: string | null | undefined, now = Date.now()): boolean {
  const verified = getPriceCheckTime(priceVerifiedAt, now)
  return verified !== null && now - verified <= PRICE_FRESH_HOURS * 60 * 60 * 1000
}

/** Older verification stamps can be manual. Require the source on this price. */
export function hasFreshApiPrice<T extends DealPriceObservation>(
  deal: T, now = Date.now(),
): deal is T & { salePrice: number; priceVerifiedAt: string } {
  return deal.priceVerificationSource === CREATORS_API_PRICE_SOURCE &&
    /^amazon(?:\.com)?$/i.test(deal.store?.trim() ?? '') &&
    !deal.clipCoupon && isPriceAmount(deal.salePrice) &&
    deal.priceApiObservation?.amount === deal.salePrice &&
    deal.priceApiObservation.checkedAt === deal.priceVerifiedAt &&
    isPriceFresh(deal.priceVerifiedAt, now)
}
