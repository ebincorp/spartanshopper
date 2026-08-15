/**
 * Expiry sweep: deactivate any active deal or coupon whose expiryDate has passed.
 *
 * Extracted from app/api/cron/expire-coupons/route.ts so the combined
 * daily-maintenance route and the original route can share one implementation
 * rather than duplicating the query.
 */
import { createClient } from '@sanity/client'

export interface ExpireResult {
  deactivated: number
  deals: number
  coupons: number
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

export async function runExpireCoupons(): Promise<ExpireResult> {
  const client = makeClient()

  // Plain string comparison, not dateTime(expiryDate) < dateTime(now()) — GROQ's
  // dateTime() can't parse bare "YYYY-MM-DD" values (no time component) and
  // silently returns null, which drops those docs out of the filter forever.
  // ISO date/datetime strings compare correctly as strings as long as both sides
  // are zero-padded, so this matches the same approach lib/queries.ts already
  // uses for the public coupons query.
  const expired = await client.fetch<{ _id: string; _type: string }[]>(
    `*[_type in ["deal", "coupon"] && active == true && defined(expiryDate) && expiryDate < now()]{ _id, _type }`
  )

  if (expired.length > 0) {
    let tx = client.transaction()
    for (const doc of expired) tx = tx.patch(doc._id, (p) => p.set({ active: false }))
    await tx.commit()
  }

  return {
    deactivated: expired.length,
    deals: expired.filter((d) => d._type === 'deal').length,
    coupons: expired.filter((d) => d._type === 'coupon').length,
  }
}
