/**
 * Shared deal/coupon verification logic (permanent).
 * Used by scripts/verify-amazon-deals.ts (dry-run default) and the
 * /api/cron/verify-deals route (execute mode).
 *
 * Rules (per record with an asin):
 *  - explicit out-of-stock signal              → DEACTIVATE (active=false)
 *  - missing listing or price data             → REVIEW (no mutation)
 *  - currentPrice within ±$1 of stored price   → OK (save the observed price)
 *  - price moved but savingsPercent >= 15       → UPDATE (salePrice/originalPrice)
 *  - savingsPercent < 15                        → DEACTIVATE
 *  - NOT_YET_ELIGIBLE overall                   → no-op, mutate nothing
 *  - clipCoupon deal                            → compare Amazon's price to the
 *    stored PRE-coupon price (originalPrice); the API can't see clip coupons, so
 *    within ±$1 → OK, otherwise REVIEW (no mutation — coupon math needs a human)
 *
 * Save the observed prices and timestamp together for successful deal checks.
 * An API check of a clip-coupon deal covers only the pre-coupon price, so it
 * cannot refresh the timestamp of the stored coupon-adjusted amount.
 *
 * Coupons carry no salePrice, so the ±$1 / UPDATE branches don't apply to them;
 * they are only ever DEACTIVATED (unavailable or savings<15) or left OK.
 */
import { createClient } from '@sanity/client'
import { getItems, type CreatorItem } from './creators-api'
import { CREATORS_API_PRICE_SOURCE, isPriceAmount } from './deal-price'

const PRICE_TOLERANCE = 1 // dollars
const MIN_SAVINGS = 15 // percent

// Safety guard against a bad-but-200 Amazon response. If the API has a partial
// outage or returns malformed/empty items, unreturned ASINs must not be
// deactivated. When more than this fraction of a large-enough batch has no
// usable price, we treat it as a suspected API
// fault, mutate NOTHING, and surface SUSPECTED_FAULT so callers can alert.
const FAULT_UNAVAILABLE_RATIO = 0.5
const FAULT_MIN_SAMPLE = 5 // don't trip the guard on tiny batches
const MISSING_PRICE_REASON = 'Amazon API returned no usable price; check product page'

export type Action = 'OK' | 'UPDATED' | 'DEACTIVATED' | 'REVIEW'

export interface VerifyRow {
  id: string
  type: 'deal' | 'coupon'
  title: string
  asin: string
  action: Action
  storedPrice?: number
  newPrice?: number
  savingsPercent?: number
  reason: string
}

export type VerifyResult =
  | { status: 'NOT_YET_ELIGIBLE'; message: string; rows: [] }
  | { status: 'NO_RECORDS'; rows: [] }
  | { status: 'SUSPECTED_FAULT'; rows: VerifyRow[]; checked: number; unavailable: number }
  | { status: 'DONE'; executed: boolean; rows: VerifyRow[] }

interface Record {
  _id: string
  _type: 'deal' | 'coupon'
  title: string
  asin: string
  salePrice?: number
  originalPrice?: number
  clipCoupon?: boolean
}

function makeClient() {
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'eohdr7jw',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
  })
}

export function decide(rec: Record, item: CreatorItem | undefined): VerifyRow {
  const base = {
    id: rec._id,
    type: rec._type,
    title: rec.title,
    asin: rec.asin,
    storedPrice: rec.salePrice,
    savingsPercent: item?.savingsPercent,
  }

  // The Creators API sometimes omits a purchasable ASIN or its price. That is
  // not evidence that the live offer ended; a person must check the listing.
  if (!item || !isPriceAmount(item.currentPrice)) {
    return { ...base, action: 'REVIEW', reason: MISSING_PRICE_REASON }
  }

  if (!item.available) {
    return { ...base, action: 'DEACTIVATED', reason: 'unavailable on Amazon' }
  }

  // Clip-coupon deals: salePrice is the post-coupon price, which the API never
  // reports. Check the pre-coupon price instead, and never auto-reprice or
  // deactivate on savings% (the API sees no discount at all).
  if (rec._type === 'deal' && rec.clipCoupon) {
    const preCoupon = rec.originalPrice ?? rec.salePrice
    if (typeof preCoupon === 'number' && Math.abs(item.currentPrice - preCoupon) <= PRICE_TOLERANCE) {
      return { ...base, action: 'OK', newPrice: item.currentPrice, reason: 'clip coupon: pre-coupon price unchanged' }
    }
    return {
      ...base,
      action: 'REVIEW',
      newPrice: item.currentPrice,
      reason: `clip coupon: Amazon price $${item.currentPrice} vs stored pre-coupon $${preCoupon ?? '?'} — recheck coupon manually`,
    }
  }

  // Coupons have no stored price to compare against.
  const hasStoredPrice = typeof rec.salePrice === 'number'

  if (hasStoredPrice && Math.abs(item.currentPrice - (rec.salePrice as number)) <= PRICE_TOLERANCE) {
    return { ...base, action: 'OK', newPrice: item.currentPrice, reason: 'price within tolerance' }
  }

  if (item.savingsPercent < MIN_SAVINGS) {
    return {
      ...base,
      action: 'DEACTIVATED',
      newPrice: item.currentPrice,
      reason: `savings ${item.savingsPercent}% < ${MIN_SAVINGS}%`,
    }
  }

  if (hasStoredPrice) {
    return {
      ...base,
      action: 'UPDATED',
      newPrice: item.currentPrice,
      reason: `price moved, savings ${item.savingsPercent}% ok`,
    }
  }

  // Coupon that is available and still well-discounted — leave as-is.
  return { ...base, action: 'OK', newPrice: item.currentPrice, reason: 'available, savings ok' }
}

export async function runVerifyDeals(opts: { execute: boolean; publishedOnly?: boolean }): Promise<VerifyResult> {
  const client = makeClient().withConfig({ perspective: opts.publishedOnly === false ? 'raw' : 'published' })

  const records = await client.fetch<(Record & { _rev: string })[]>(
    `*[_type in ["deal","coupon"] && active == true && defined(asin)]{
      _id, _rev, _type, title, asin, salePrice, originalPrice, clipCoupon
    }`
  )

  if (records.length === 0) return { status: 'NO_RECORDS', rows: [] }

  const result = await getItems(records.map((r) => r.asin))
  if (result.status === 'NOT_YET_ELIGIBLE') {
    return { status: 'NOT_YET_ELIGIBLE', message: result.message, rows: [] }
  }

  const byAsin = new Map(result.items.map((it) => [it.asin, it]))
  const rows = records.map((rec) => decide(rec, byAsin.get(rec.asin)))

  // Guard: an implausible share of missing-price results signals an API fault
  // (empty/partial response), not that every product genuinely went dead. Never
  // commit that — it would blank the deals page. Surface it for alerting instead.
  const unavailable = rows.filter((r) => r.reason === MISSING_PRICE_REASON).length
  if (rows.length >= FAULT_MIN_SAMPLE && unavailable / rows.length > FAULT_UNAVAILABLE_RATIO) {
    return { status: 'SUSPECTED_FAULT', rows, checked: rows.length, unavailable }
  }

  if (opts.execute) {
    const verifiedAt = new Date().toISOString()
    let tx = client.transaction()
    let mutations = 0
    for (const [index, row] of rows.entries()) {
      const record = records[index]
      const item = byAsin.get(row.asin)
      if (row.action === 'DEACTIVATED') {
        tx = tx.patch(row.id, (p) => p.ifRevisionId(record._rev).set({ active: false }))
        mutations++
      } else if ((row.action === 'UPDATED' || (row.action === 'OK' && row.type === 'deal' && !record.clipCoupon))
        && item && isPriceAmount(item.currentPrice)) {
        const { currentPrice, listPrice } = item
        tx = tx.patch(row.id, (p) =>
          p.ifRevisionId(record._rev).set({
            salePrice: currentPrice,
            originalPrice: isPriceAmount(listPrice) ? listPrice : currentPrice,
            ...(row.type === 'deal' && {
              priceVerifiedAt: verifiedAt,
              priceVerificationSource: CREATORS_API_PRICE_SOURCE,
              priceApiObservation: { amount: item.currentPrice, checkedAt: verifiedAt },
            }),
          })
        )
        mutations++
      }
    }
    if (mutations > 0) await tx.commit()
  }

  return { status: 'DONE', executed: opts.execute, rows }
}
