import { createClient } from '@sanity/client'

// Dedicated non-CDN client for redirect lookups — always fresh, never cached.
const redirectClient = createClient({
  projectId: 'eohdr7jw',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

// Priority order: dedicated affiliateLink → sweepstake entryUrl → content affiliateUrl.
// coalesce() returns the first non-null value, avoiding nested projection chaining.
const redirectQuery = `
  coalesce(
    *[_type == "affiliateLink" && slug.current == $slug][0].destination,
    *[_type == "sweepstake" && affiliateSlug.current == $slug][0].entryUrl,
    *[affiliateSlug.current == $slug][0].affiliateUrl
  )
`

export async function getRedirectBySlug(slug: string): Promise<{ url: string } | null> {
  console.log(`[/go] Looking up slug: "${slug}"`)

  const url = await redirectClient.fetch<string | null>(redirectQuery, { slug })

  console.log(`[/go] Resolved URL for "${slug}": ${url ?? 'none'}`)

  if (!url) return null
  return { url }
}
