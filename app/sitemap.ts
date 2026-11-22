import type { MetadataRoute } from 'next'
import { client } from '@/lib/sanity.client'
import { dealSlugsQuery, couponSlugsQuery, sweepstakeSlugsQuery } from '@/lib/queries'
import { redirectedPostSlugs } from '@/lib/blogQueries'

const BASE_URL = 'https://www.spartanshopper.com'

const postSlugsQuery = `
  *[_type == "post" && defined(slug.current)
    && !(slug.current in $redirectedSlugs)
    // Time-bound posts drop out once past seo.noindexAfter (they send noindex too).
    && !(defined(seo.noindexAfter) && seo.noindexAfter <= now())] {
    "slug": slug.current, _updatedAt
  }
`

interface SlugEntry {
  slug: string
  _updatedAt: string
}

// Sitemap discovery must reflect CMS publishes without waiting for a rebuild
// or a webhook to invalidate a previously generated metadata route.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    return [{ url: BASE_URL }]
  }

  const [deals, coupons, sweepstakes, posts] = await Promise.all([
    client.fetch<SlugEntry[]>(dealSlugsQuery, {}, { cache: 'no-store' }),
    client.fetch<SlugEntry[]>(couponSlugsQuery, {}, { cache: 'no-store' }),
    client.fetch<SlugEntry[]>(sweepstakeSlugsQuery, {}, { cache: 'no-store' }),
    client.fetch<SlugEntry[]>(postSlugsQuery, { redirectedSlugs: redirectedPostSlugs }, { cache: 'no-store' }),
  ])

  // These routes also change when offers expire or site code changes. Omit
  // lastModified until we can report a reliable content-change timestamp.
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/deals`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/coupons`, changeFrequency: 'weekly', priority: 0.8 },
    ...(sweepstakes.length > 0
      ? [{ url: `${BASE_URL}/sweepstakes`, changeFrequency: 'weekly' as const, priority: 0.8 }]
      : []),
  ]

  const dynamicPages: MetadataRoute.Sitemap = [
    ...posts.map((p) => ({
      url: `${BASE_URL}/blog/${p.slug}`,
      lastModified: new Date(p._updatedAt),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
    ...deals.map((d) => ({
      url: `${BASE_URL}/deals/${d.slug}`,
      lastModified: new Date(d._updatedAt),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
    ...coupons.map((c) => ({
      url: `${BASE_URL}/coupons/${c.slug}`,
      lastModified: new Date(c._updatedAt),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
    ...sweepstakes.map((s) => ({
      url: `${BASE_URL}/sweepstakes/${s.slug}`,
      lastModified: new Date(s._updatedAt),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
  ]

  return [...staticPages, ...dynamicPages]
}
