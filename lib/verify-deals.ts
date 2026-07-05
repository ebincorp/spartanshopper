/**
 * Shared deal/coupon verification logic (permanent).
 * Used by scripts/verify-amazon-deals.ts (dry-run default) and the
 * /api/cron/verify-deals route (execute mode).
 *
 * Rules (per record with an asin):
 *  - unavailable via API                       → DEACTIVATE (active=false)
 *  - currentPrice within ±$1 of stored price   → OK (no change)
 *  - price moved but savingsPercent >= 15       → UPDATE (salePrice/originalPrice)
 *  - savingsPercent < 15                        → DEACTIVATE
 *  - NOT_YET_ELIGIBLE overall                   → no-op, mutate nothing
 *
 * Coupons carry no salePrice, so the ±$1 / UPDATE branches don't apply to them;
 * they are only ever DEACTIVATED (unavailable or savings<15) or left OK.
 */
import { createClient } from '@sanity/client'
import { getItems, type CreatorItem } from './creators-api'

const PRICE_TOLERANCE = 1 // dollars
const MIN_SAVINGS = 15 // percent

export type Action = 'OK' | 'UPDATED' | 'DEACTIVATED'

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
  | { status: 'DONE'; executed: boolean; rows: VerifyRow[] }

interface Record {
  _id: string
  _type: 'deal' | 'coupon'
  title: string
  asin: string
  salePrice?: number
  originalPrice?: number
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

function decide(rec: Record, item: CreatorItem | undefined): VerifyRow {
  const base = {
    id: rec._id,
    type: rec._type,
    title: rec.title,
    asin: rec.asin,
    storedPrice: rec.salePrice,
    savingsPercent: item?.savingsPercent,
  }

  if (!item || !item.available || item.currentPrice == null) {
    return { ...base, action: 'DEACTIVATED', reason: 'unavailable on Amazon' }
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

export async function runVerifyDeals(opts: { execute: boolean }): Promise<VerifyResult> {
  const client = makeClient()

  const records = await client.fetch<Record[]>(
    `*[_type in ["deal","coupon"] && active == true && defined(asin)]{
      _id, _type, title, asin, salePrice, originalPrice
    }`
  )

  if (records.length === 0) return { status: 'NO_RECORDS', rows: [] }

  const result = await getItems(records.map((r) => r.asin))
  if (result.status === 'NOT_YET_ELIGIBLE') {
    return { status: 'NOT_YET_ELIGIBLE', message: result.message, rows: [] }
  }

  const byAsin = new Map(result.items.map((it) => [it.asin, it]))
  const rows = records.map((rec) => decide(rec, byAsin.get(rec.asin)))

  if (opts.execute) {
    let tx = client.transaction()
    let mutations = 0
    for (const row of rows) {
      const item = byAsin.get(row.asin)
      if (row.action === 'DEACTIVATED') {
        tx = tx.patch(row.id, (p) => p.set({ active: false }))
        mutations++
      } else if (row.action === 'UPDATED' && item) {
        tx = tx.patch(row.id, (p) =>
          p.set({ salePrice: item.currentPrice, originalPrice: item.listPrice ?? item.currentPrice })
        )
        mutations++
      }
    }
    if (mutations > 0) await tx.commit()
  }

  return { status: 'DONE', executed: opts.execute, rows }
}
