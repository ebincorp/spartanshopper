import { NextResponse } from 'next/server'
import { client, urlFor } from '@/lib/sanity.client'
import { offerStatus, validFind, MAX_SAVED_FINDS, type CurrentFind, type SavedFind } from '@/lib/saved-finds'
import type { SanityImage } from '@/lib/types'

export const dynamic = 'force-dynamic'
interface Record extends SavedFind {
  _type: 'deal' | 'coupon'; active: boolean; startDate?: string; expiryDate?: string
  store?: string; image?: SanityImage; imageUrl?: string; salePrice?: number; discount?: string; affiliateSlug?: string
}
export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'no-store' }
  try {
    const text = await request.text()
    if (text.length > 80000) return NextResponse.json({ error: 'List too large' }, { status: 413, headers })
    const body: unknown = JSON.parse(text)
    if (!Array.isArray(body) || body.length > MAX_SAVED_FINDS || !body.every(validFind)) return NextResponse.json({ error: 'Invalid list' }, { status: 400, headers })
    if (!body.length) return NextResponse.json({ finds: [] }, { headers })
    const records = await client.fetch<Record[]>(`*[_type in ["deal", "coupon"] && slug.current in $slugs]{_type, title, "slug": slug.current, active, startDate, expiryDate, store, image, imageUrl, salePrice, discount, "affiliateSlug": affiliateSlug.current}`, { slugs: body.map(item => item.slug) }, { cache: 'no-store' })
    const finds: CurrentFind[] = body.map(item => {
      const record = records.find(r => r._type === item.kind && r.slug === item.slug)
      if (!record) return { ...item, status: 'unavailable' }
      const status = offerStatus(record.active === true, record.startDate, record.expiryDate)
      return {
        kind: item.kind, slug: item.slug, title: record.title, store: record.store, status,
        image: record.imageUrl || (record.image?.asset ? urlFor(record.image).width(500).url() : undefined),
        offer: status === 'available' ? (item.kind === 'deal' && typeof record.salePrice === 'number' ? `$${record.salePrice.toFixed(2)}` : record.discount) : undefined,
        affiliateSlug: status === 'available' && record.affiliateSlug && /^[a-zA-Z0-9_-]+$/.test(record.affiliateSlug) ? record.affiliateSlug : undefined,
      }
    })
    return NextResponse.json({ finds }, { headers })
  } catch {
    return NextResponse.json({ error: 'Unable to refresh saved finds. Please retry.' }, { status: 503, headers })
  }
}
