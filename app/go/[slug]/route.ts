import { NextRequest, NextResponse } from 'next/server'
import { getRedirectBySlug } from '@/lib/redirects'

export const revalidate = 3600

const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://spartanshopper.com'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const redirect = await getRedirectBySlug(slug)

    if (!redirect?.url) {
      return NextResponse.redirect(new URL('/', req.url), { status: 302 })
    }

    return NextResponse.redirect(redirect.url, { status: 301 })
  } catch {
    return NextResponse.redirect(FALLBACK_URL, { status: 302 })
  }
}
