import { createClient } from '@sanity/client'

// Dedicated non-CDN client for redirect lookups — always fresh, never cached.
const redirectClient = createClient({
  projectId: 'eohdr7jw',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

// Looks up an affiliateSlug across all four content types.
// Sweepstakes use entryUrl; everything else uses affiliateUrl.
const redirectByAffiliateSlugQuery = `
  *[affiliateSlug.current == $slug][0] {
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
  console.log(`[/go] Looking up affiliateSlug: "${slug}"`)

  const result = await redirectClient.fetch<RedirectResult | null>(
    redirectByAffiliateSlugQuery,
    { slug }
  )

  console.log(`[/go] Sanity result for "${slug}":`, JSON.stringify(result))

  if (!result?.url) return null
  return { url: result.url }
}
