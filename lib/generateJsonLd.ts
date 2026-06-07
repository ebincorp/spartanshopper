/**
 * lib/generateJsonLd.ts
 *
 * Automatically generates JSON-LD structured data for blog posts.
 *
 * Priority:
 *   1. If post.jsonLd is set → use it as-is (manual override)
 *   2. Otherwise → auto-generate based on post.category and body content
 *
 * Schema types generated:
 *   - "Reviews" category with table → ItemList (product roundup)
 *   - "Reviews" category without table → Review (single product)
 *   - Everything else → Article
 *
 * Phase 2: When post.products[] is added to the Sanity schema,
 *   this function will use structured product data (including
 *   aggregateRating) instead of parsing the body table.
 */

import type { Post } from './types'

const SITE_URL = 'https://www.spartanshopper.com'

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseCell(cell: string): { name: string; url: string | null } {
  if (cell.includes('||')) {
    const [name, url] = cell.split('||')
    return { name: name.trim(), url: url.trim() }
  }
  return { name: cell.trim(), url: null }
}

function extractTableRows(body: any[]): Array<{ name: string; url: string | null; cells: string[] }> {
  const tableBlock = body?.find((b: any) => b._type === 'table')
  if (!tableBlock) return []

  const rows: any[] = tableBlock.rows ?? []
  return rows.slice(1).map((row: any) => {
    const cells: string[] = row.cells ?? []
    const first = parseCell(cells[0] ?? '')
    return { name: first.name, url: first.url, cells }
  })
}

function getCoverImageUrl(post: Post): string | undefined {
  if (!post.coverImage?.asset?._ref) return undefined
  const ref = post.coverImage.asset._ref
  // ref format: image-{hash}-{WxH}-{format}
  const parts = ref.split('-')
  if (parts.length < 4) return undefined
  const format = parts[parts.length - 1]
  const dimensions = parts[parts.length - 2]
  const hash = parts.slice(1, parts.length - 2).join('-')
  return `https://cdn.sanity.io/images/eohdr7jw/production/${hash}-${dimensions}.${format}`
}

// ── Schema generators ─────────────────────────────────────────────────────────

function generateArticleSchema(post: Post): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt ?? '',
    url: `${SITE_URL}/blog/${post.slug.current}`,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'SpartanShopper',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'SpartanShopper',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    ...(getCoverImageUrl(post) ? { image: getCoverImageUrl(post) } : {}),
  }
}

function generateItemListSchema(post: Post, rows: ReturnType<typeof extractTableRows>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: post.title,
    description: post.excerpt ?? '',
    url: `${SITE_URL}/blog/${post.slug.current}`,
    numberOfItems: rows.length,
    itemListElement: rows.map((row, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: row.name,
      ...(row.url ? { url: row.url } : {}),
    })),
  }
}

function generateReviewSchema(post: Post): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: post.title,
    description: post.excerpt ?? '',
    url: `${SITE_URL}/blog/${post.slug.current}`,
    datePublished: post.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'SpartanShopper',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'SpartanShopper',
      url: SITE_URL,
    },
    ...(getCoverImageUrl(post) ? { image: getCoverImageUrl(post) } : {}),
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateJsonLd(post: Post): string {
  if (post.jsonLd && post.jsonLd.trim().length > 0) {
    return post.jsonLd
  }

  const isReview = post.category === 'Reviews'
  const body: any[] = post.body ?? []
  let schema: object

  if (isReview) {
    const rows = extractTableRows(body)
    schema = rows.length > 1
      ? generateItemListSchema(post, rows)
      : generateReviewSchema(post)
  } else {
    schema = generateArticleSchema(post)
  }

  return JSON.stringify(schema)
}

/**
 * Phase 2 — use once post.products[] exists in the Sanity schema.
 * Enables aggregateRating and richer ItemList entries.
 */
export function generateJsonLdFromProducts(post: Post, products: any[]): string {
  if (post.jsonLd && post.jsonLd.trim().length > 0) {
    return post.jsonLd
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: post.title,
    description: post.excerpt ?? '',
    url: `${SITE_URL}/blog/${post.slug.current}`,
    numberOfItems: products.length,
    itemListElement: products.map((product: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: product.name,
        description: product.description ?? '',
        image: product.image ?? '',
        brand: { '@type': 'Brand', name: product.brand ?? '' },
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: product.affiliateUrl ?? '',
        },
        ...(product.ratingValue && product.reviewCount ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.ratingValue,
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        } : {}),
      },
    })),
  }

  return JSON.stringify(schema)
}
