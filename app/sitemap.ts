import type { MetadataRoute } from 'next'
import { client } from '@/lib/sanity.client'
import { dealSlugsQuery, couponSlugsQuery, sweepstakeSlugsQuery } from '@/lib/queries'

const BASE_URL = 'https://spartanshopper.com'

const postSlugsQuery = `
  *[_type == "post" && defined(slug.current)] {
    "slug": slug.current, _updatedAt
  }
`

interface SlugEntry {
  slug: string
  _updatedAt: string
}

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    return [{ url: BASE_URL }]
  }

  const [deals, coupons, sweepstakes, posts] = await Promise.all([
    client.fetch<SlugEntry[]>(dealSlugsQuery).catch(() => [] as SlugEntry[]),
    client.fetch<SlugEntry[]>(couponSlugsQuery).catch(() => [] as SlugEntry[]),
    client.fetch<SlugEntry[]>(sweepstakeSlugsQuery).catch(() => [] as SlugEntry[]),
    client.fetch<SlugEntry[]>(postSlugsQuery).catch(() => [] as SlugEntry[]),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                       lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/blog`,             lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/deals`,            lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/coupons`,          lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/sweepstakes`,      lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
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
