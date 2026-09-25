import { NextResponse } from 'next/server'
import { healthAuthorized } from '@/lib/deal-health-auth'
import { inspectOffer, type HealthRecord } from '@/lib/deal-health'
import { client } from '@/lib/sanity.client'
import { runVerifyDeals } from '@/lib/verify-deals'

export const dynamic = 'force-dynamic'
export const maxDuration = 60
const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' }

export async function GET(request: Request) {
  if (!healthAuthorized(request.headers.get('authorization'))) return NextResponse.json({ error: 'Enter a valid dashboard access key. The server requires DEAL_HEALTH_TOKEN (at least 32 characters).' }, { status: 401, headers })
  try {
    const records = await client.fetch<HealthRecord[]>(`*[_type in ["deal", "coupon"]] {
      _id, _type, title, active, "slug": slug.current, "affiliateSlug": affiliateSlug.current,
      expiryDate, startDate, salePrice, originalPrice, asin,
      "destination": select(defined(affiliateSlug.current) => coalesce(
        *[_type == "affiliateLink" && slug.current == ^.affiliateSlug.current][0].destination,
        *[_type == "sweepstake" && affiliateSlug.current == ^.affiliateSlug.current][0].entryUrl,
        *[affiliateSlug.current == ^.affiliateSlug.current][0].affiliateUrl
      ))
    }`, {}, { cache: 'no-store' })
    const rows = records.map(record => inspectOffer(record))
    return NextResponse.json({ checkedAt: new Date().toISOString(), rows }, { headers })
  } catch { return NextResponse.json({ error: 'Could not read Sanity. Retry after checking the server configuration.' }, { status: 503, headers }) }
}

export async function POST(request: Request) {
  if (!healthAuthorized(request.headers.get('authorization'))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
  try {
    // This endpoint never accepts execute flags and cannot publish or patch records.
    const result = await runVerifyDeals({ execute: false, publishedOnly: true })
    return NextResponse.json({ checkedAt: new Date().toISOString(), result }, { headers })
  } catch { return NextResponse.json({ error: 'Amazon price check failed. No records changed. Retry later.' }, { status: 503, headers }) }
}
