import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { pingIndexNow } from '@/lib/indexnow'
import { client } from '@/lib/sanity.client'

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')

  if (secret !== process.env.SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
  }

  revalidatePath('/')
  revalidatePath('/blog')
  revalidatePath('/deals')
  revalidatePath('/coupons')
  revalidatePath('/sweepstakes')
  revalidatePath('/sitemap.xml')

  let slug: string | undefined
  try {
    const body = await req.json()
    slug = body?.slug?.current ?? body?.slug
    if (slug) {
      // The webhook payload's _type isn't reliably present across every
      // trigger source, and revalidatePath on a route that doesn't exist for
      // this slug is a harmless no-op — so revalidate all four detail-page
      // shapes rather than guessing the type. Previously only /blog/{slug}
      // was covered here, so edits to deals/coupons/sweepstakes docs (e.g.
      // unpublishing one) sat stale in ISR cache for up to an hour.
      revalidatePath(`/blog/${slug}`)
      revalidatePath(`/deals/${slug}`)
      revalidatePath(`/coupons/${slug}`)
      revalidatePath(`/sweepstakes/${slug}`)
    }
  } catch {
    // body absent or not JSON — skip slug revalidation
  }

  // Blog posts embed coupons dynamically via RelatedCoupons, matched by
  // category rather than an explicit reference — so a coupon activation/
  // deactivation/edit can affect any post's rendered output with no direct
  // link between the two documents for the webhook payload to name. Since
  // there's no reliable way to know from here which specific posts a given
  // coupon change affects, revalidate every post that renders the widget
  // (i.e. has a relatedCategory set) on every webhook call. This previously
  // caused a coupon deactivated via Sanity to keep rendering as active
  // (Verified badge, working code, live "Shop Now" link) in other posts'
  // Related Coupons sections for up to an hour of ISR staleness.
  try {
    const postSlugs = await client.fetch<string[]>(
      `*[_type == "post" && defined(relatedCategory) && defined(slug.current)].slug.current`,
    )
    for (const postSlug of postSlugs) revalidatePath(`/blog/${postSlug}`)
  } catch {
    // Sanity fetch failed — the top-level revalidations above still ran
  }

  // Notify IndexNow (Bing/Yahoo/DuckDuckGo) of the changed content so it gets
  // crawled instantly. Best-effort — pingIndexNow never throws. The changed
  // post URL is the priority signal; /blog is its updated listing.
  await pingIndexNow(slug ? [`/blog/${slug}`, '/blog'] : ['/', '/blog'])

  return NextResponse.json({ revalidated: true, now: Date.now() })
}
