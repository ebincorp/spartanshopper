import { NextRequest, NextResponse } from 'next/server'
import { getRedirectBySlug } from '@/lib/redirects'

// Force dynamic — never cache redirect responses
export const dynamic = 'force-dynamic'

const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://spartanshopper.com'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  console.log(`[/go] GET request for slug: "${slug}"`)

  try {
    const redirect = await getRedirectBySlug(slug)

    if (!redirect?.url) {
      console.log(`[/go] No redirect found for "${slug}", falling back to homepage`)
      return NextResponse.redirect(new URL('/', req.url), { status: 302 })
    }

    console.log(`[/go] Redirecting "${slug}" → ${redirect.url}`)
    return NextResponse.redirect(redirect.url, { status: 301 })
  } catch (err) {
    console.error(`[/go] Error looking up "${slug}":`, err)
    return NextResponse.redirect(FALLBACK_URL, { status: 302 })
  }
}
