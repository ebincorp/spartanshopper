import { createClient } from '@sanity/client'

// Dedicated non-CDN client for redirect lookups — always fresh, never cached.
const redirectClient = createClient({
  projectId: 'eohdr7jw',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

// Checks dedicated affiliateLink documents first, then falls back to
// affiliateSlug fields on content types — all in a single GROQ round-trip.
const redirectQuery = `
  {
    "fromLink": *[_type == "affiliateLink" && slug.current == $slug][0].destination,
    "fromContent": *[affiliateSlug.current == $slug][0] {
      "url": select(
        _type == "sweepstake" => entryUrl,
        affiliateUrl
      )
    }.url
  }
`

interface RedirectLookup {
  fromLink: string | null
  fromContent: string | null
}

export async function getRedirectBySlug(slug: string): Promise<{ url: string } | null> {
  console.log(`[/go] Looking up slug: "${slug}"`)

  const result = await redirectClient.fetch<RedirectLookup>(redirectQuery, { slug })

  console.log(`[/go] Sanity result for "${slug}":`, JSON.stringify(result))

  const url = result?.fromLink || result?.fromContent
  if (!url) return null
  return { url }
}
