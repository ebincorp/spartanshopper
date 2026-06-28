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

function blockText(block: any): string {
  return (block.children ?? [])
    .map((s: any) => (s && typeof s === 'object' && 'text' in s ? String(s.text) : ''))
    .join('')
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

function authorSchema(post: Post) {
  return post.author
    ? { '@type': 'Person', name: post.author }
    : { '@type': 'Organization', name: 'SpartanShopper', url: SITE_URL }
}

// ── FAQ extraction ────────────────────────────────────────────────────────────

const QUESTION_RE = /^(what|how|why|is|are|can|does|do|when|where|which|who|will|should)\b/i

function extractFaqPairs(body: any[]): Array<{ question: string; answer: string }> {
  const pairs: Array<{ question: string; answer: string }> = []
  for (let i = 0; i < body.length; i++) {
    const block = body[i]
    if (block._type !== 'block') continue
    if (block.style !== 'h2' && block.style !== 'h3') continue

    const heading = blockText(block).trim()
    if (!heading) continue
    if (!QUESTION_RE.test(heading) && !heading.endsWith('?')) continue

    // Collect following normal paragraphs as the answer (up to next heading or 4 blocks)
    const answerParts: string[] = []
    for (let j = i + 1; j < body.length && j <= i + 4; j++) {
      const next = body[j]
      if (next._type === 'block' && (next.style === 'h2' || next.style === 'h3')) break
      if (next._type === 'block' && next.style === 'normal') {
        const text = blockText(next).trim()
        if (text) answerParts.push(text)
      }
    }
    if (answerParts.length === 0) continue

    pairs.push({
      question: heading.endsWith('?') ? heading : `${heading}?`,
      answer: answerParts.join(' '),
    })
  }
  return pairs
}

function generateFaqSchema(pairs: Array<{ question: string; answer: string }>): object {
  return {
    '@type': 'FAQPage',
    mainEntity: pairs.map((p) => ({
      '@type': 'Question',
      name: p.question,
      acceptedAnswer: { '@type': 'Answer', text: p.answer },
    })),
  }
}

// ── Schema generators ─────────────────────────────────────────────────────────

function generateArticleSchema(post: Post): object {
  return {
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt ?? '',
    url: `${SITE_URL}/blog/${post.slug.current}`,
    datePublished: post.publishedAt,
    dateModified: post._updatedAt ?? post.publishedAt,
    author: authorSchema(post),
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
  // Strip trailing "review/comparison" suffixes to get the product name
  const productName = post.title
    .replace(/\s+(review|reviewed|vs\.?|comparison|guide|test)\s*.*$/i, '')
    .trim() || post.title

  return {
    '@type': 'Review',
    name: post.title,
    description: post.excerpt ?? '',
    url: `${SITE_URL}/blog/${post.slug.current}`,
    datePublished: post.publishedAt,
    dateModified: post._updatedAt ?? post.publishedAt,
    itemReviewed: {
      '@type': 'Product',
      name: productName,
    },
    author: authorSchema(post),
    publisher: {
      '@type': 'Organization',
      name: 'SpartanShopper',
      url: SITE_URL,
    },
    ...(getCoverImageUrl(post) ? { image: getCoverImageUrl(post) } : {}),
  }
}

// ── Breadcrumb helper ─────────────────────────────────────────────────────────

export function generateBreadcrumbJsonLd(
  crumbs: Array<{ name: string; url: string }>
): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  })
}

// ── Main exports ──────────────────────────────────────────────────────────────

export function generateJsonLd(post: Post): string {
  if (post.jsonLd && post.jsonLd.trim().length > 0) {
    return post.jsonLd
  }

  const isReview = post.category === 'Reviews'
  const body: any[] = post.body ?? []

  let primary: object
  if (isReview) {
    const rows = extractTableRows(body)
    primary = rows.length > 1
      ? generateItemListSchema(post, rows)
      : generateReviewSchema(post)
  } else {
    primary = generateArticleSchema(post)
  }

  // Add FAQ schema when 2+ question headings are found in the body
  const faqPairs = extractFaqPairs(body)
  if (faqPairs.length >= 2) {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [primary, generateFaqSchema(faqPairs)],
    })
  }

  return JSON.stringify({ '@context': 'https://schema.org', ...primary })
}

export function generateJsonLdFromProducts(post: Post, products: any[]): string {
  if (post.jsonLd && post.jsonLd.trim().length > 0) {
    return post.jsonLd
  }

  const primary = {
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

  const faqPairs = extractFaqPairs(post.body ?? [])
  if (faqPairs.length >= 2) {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [primary, generateFaqSchema(faqPairs)],
    })
  }

  return JSON.stringify({ '@context': 'https://schema.org', ...primary })
}
