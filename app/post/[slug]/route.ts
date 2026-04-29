import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

// Force dynamic — never cache redirect responses
export const dynamic = 'force-dynamic'

const sanity = createClient({
  projectId: 'eohdr7jw',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})

const typeToPath: Record<string, string> = {
  deal: 'deals',
  coupon: 'coupons',
  sweepstake: 'sweepstakes',
  post: 'blog',
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const result = await sanity.fetch<{ _type: string } | null>(
      `*[slug.current == $slug][0]{ _type }`,
      { slug }
    )

    const section = result?._type ? typeToPath[result._type] : null

    if (section) {
      return NextResponse.redirect(new URL(`/${section}/${slug}`, req.url), { status: 301 })
    }
  } catch (err) {
    console.error(`[/post] Error looking up "${slug}":`, err)
  }

  return new NextResponse(null, { status: 404 })
}
