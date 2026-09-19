import { NextRequest, NextResponse } from 'next/server'
import { getRedirectBySlug } from '@/lib/redirects'
import { affiliateRequestPolicy, AFFILIATE_RESPONSE_HEADERS } from '@/lib/affiliateRequest'

// Force dynamic — never cache redirect responses
export const dynamic = 'force-dynamic'

const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.spartanshopper.com'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const policy = affiliateRequestPolicy(req)
  // Log only classification and slug, never cookies, IPs or destination tokens.
  console.info(JSON.stringify({ event: 'affiliate_redirect', slug, decision: policy }))
  if (policy !== 'navigate') {
    return new NextResponse(null, {
      status: policy === 'bot' ? 403 : 204,
      headers: AFFILIATE_RESPONSE_HEADERS,
    })
  }

  try {
    const redirect = await getRedirectBySlug(slug)

    if (!redirect?.url) {
      console.log(`[/go] No redirect found for "${slug}", falling back to homepage`)
      return NextResponse.redirect(new URL('/', req.url), { status: 302, headers: AFFILIATE_RESPONSE_HEADERS })
    }

    return NextResponse.redirect(redirect.url, { status: 302, headers: AFFILIATE_RESPONSE_HEADERS })
  } catch (err) {
    console.error(`[/go] Error looking up "${slug}":`, err)
    return NextResponse.redirect(FALLBACK_URL, { status: 302, headers: AFFILIATE_RESPONSE_HEADERS })
  }
}

// Link checks must not resolve or visit the retailer, or generate click events.
export function HEAD() {
  return new NextResponse(null, { status: 204, headers: AFFILIATE_RESPONSE_HEADERS })
}
