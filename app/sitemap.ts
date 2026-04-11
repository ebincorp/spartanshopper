import type { MetadataRoute } from 'next'
import { client } from '@/lib/sanity.client'
import { dealSlugsQuery, couponSlugsQuery, sweepstakeSlugsQuery } from '@/lib/queries'

const BASE_URL = 'https://spartanshopper.com'

interface SlugEntry {
  slug: string
  _updatedAt: string
}

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [deals, coupons, sweepstakes] = await Promise.all([
    client.fetch<SlugEntry[]>(dealSlugsQuery).catch(() => [] as SlugEntry[]),
    client.fetch<SlugEntry[]>(couponSlugsQuery).catch(() => [] as SlugEntry[]),
    client.fetch<SlugEntry[]>(sweepstakeSlugsQuery).catch(() => [] as SlugEntry[]),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/deals`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/coupons`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/sweepstakes`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ]

  const dynamicPages: MetadataRoute.Sitemap = [
    ...deals.map((d) => ({
      url: `${BASE_URL}/post/${d.slug}`,
      lastModified: new Date(d._updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...coupons.map((c) => ({
      url: `${BASE_URL}/post/${c.slug}`,
      lastModified: new Date(c._updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...sweepstakes.map((s) => ({
      url: `${BASE_URL}/post/${s.slug}`,
      lastModified: new Date(s._updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]

  return [...staticPages, ...dynamicPages]
}
