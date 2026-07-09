import { createClient } from '@sanity/client'
import { createImageUrlBuilder } from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'placeholder',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  // Only ever serve PUBLISHED content. With a token and no perspective the client
  // reads `raw`, which exposes drafts publicly (caused the DoorDash draft-leak, Jul 2026:
  // two never-published draft posts were live + in the sitemap for ~7 weeks).
  // With this set, native Sanity unpublish (Studio "Unpublish" / delete-published-keep-draft)
  // hides a doc — no `archivedPost` retype workaround needed for future unpublishes.
  perspective: 'published',
})

const builder = createImageUrlBuilder(client)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function urlFor(source: any) {
  return builder.image(source)
}
