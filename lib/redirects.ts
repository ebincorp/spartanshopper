import { client } from '@/lib/sanity.client'

// Looks up an affiliateSlug across all four content types.
// Sweepstakes use entryUrl; everything else uses affiliateUrl.
const redirectByAffiliateSlugQuery = `
  *[affiliateSlug.current == $slug && defined(affiliateSlug)][0] {
    _type,
    "url": select(
      _type == "sweepstake" => entryUrl,
      affiliateUrl
    )
  }
`

interface RedirectResult {
  _type: string
  url: string | null
}

export async function getRedirectBySlug(slug: string): Promise<{ url: string } | null> {
  const result = await client.fetch<RedirectResult | null>(
    redirectByAffiliateSlugQuery,
    { slug }
  )
  if (!result?.url) return null
  return { url: result.url }
}
