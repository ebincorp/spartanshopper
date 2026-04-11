import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity.client'
import { affiliateUrlBySlugQuery } from '@/lib/queries'

const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://spartanshopper.com'

interface AffiliateResult {
  _type: string
  url: string | null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const result = await client.fetch<AffiliateResult | null>(
      affiliateUrlBySlugQuery,
      { slug }
    )

    if (!result?.url) {
      return NextResponse.redirect(FALLBACK_URL, { status: 302 })
    }

    return NextResponse.redirect(result.url, { status: 302 })
  } catch {
    return NextResponse.redirect(FALLBACK_URL, { status: 302 })
  }
}
