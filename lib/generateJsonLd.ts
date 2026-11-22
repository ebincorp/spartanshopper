import { SITE_NAME, SITE_URL } from './seo'
import type { Post } from './types'

const CONTEXT = 'https://schema.org'
export const ORGANIZATION_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`
const LOGO = `${SITE_URL}/android-chrome-512x512.png`
const ARTICLE_TYPES = new Set(['Article', 'BlogPosting', 'NewsArticle'])
const QUESTION = /^(what|how|why|is|are|can|does|do|when|where|which|who|will|should)\b/i

type Node = Record<string, unknown>
type TextBlock = { _type?: string; style?: string; children?: Array<{ text?: string }> }

function blockText(block: TextBlock) {
  return block.children?.map(child => child.text ?? '').join('').trim() ?? ''
}

export function articleDescription(post: Post) {
  const authored = post.seo?.metaDescription?.trim() || post.excerpt?.trim()
  if (authored) return authored
  const firstParagraph = post.body?.find((block: TextBlock) =>
    block._type === 'block' && block.style === 'normal' && blockText(block))
  if (!firstParagraph) return `Read ${post.title.trim()} on SpartanShopper.`
  const text = blockText(firstParagraph).replace(/\s+/g, ' ')
  return text.length > 160 ? text.slice(0, 159).replace(/\s+\S*$/, '') + '…' : text
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data, (key, value) =>
    ['logo', 'url', 'contentUrl'].includes(key)
      && typeof value === 'string'
      && /^(?:https?:\/\/(?:www\.)?spartanshopper\.com)?\/logo\.png$/i.test(value)
      ? LOGO
      : value,
  ).replace(/</g, '\\u003c')
}

export function generateBreadcrumbJsonLd(crumbs: { name: string; url: string }[]) {
  return serializeJsonLd({
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map(({ name, url }, index) => ({
      '@type': 'ListItem', position: index + 1, name, item: url,
    })),
  })
}

export function generatePageJsonLd(
  path: string,
  name: string,
  description?: string | null,
  type: 'WebPage' | 'AboutPage' | 'ContactPage' = 'WebPage',
) {
  const url = new URL(path, SITE_URL).href
  return serializeJsonLd({
    '@context': CONTEXT,
    '@type': type,
    '@id': `${url}#webpage`,
    url,
    name,
    ...(description && { description }),
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
  })
}

function articleNode(post: Post, coverUrl?: string): Node {
  const url = new URL(post.seo?.canonicalUrl || `/blog/${post.slug.current}`, SITE_URL).href
  return {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: post.title,
    description: articleDescription(post),
    url,
    mainEntityOfPage: url,
    datePublished: post.publishedAt,
    dateModified: post._updatedAt ?? post.publishedAt,
    author: post.author
      ? { '@type': 'Person', name: post.author }
      : { '@type': 'Organization', '@id': ORGANIZATION_ID, name: SITE_NAME },
    publisher: {
      '@type': 'Organization', '@id': ORGANIZATION_ID, name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: LOGO },
    },
    ...(coverUrl && { image: coverUrl }),
  }
}

function authoredNodes(raw: string | undefined): Node[] {
  if (!raw?.trim()) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    const list = Array.isArray(parsed) ? parsed
      : parsed && typeof parsed === 'object' && '@graph' in parsed && Array.isArray(parsed['@graph'])
        ? parsed['@graph'] : [parsed]
    return list.filter((node): node is Node =>
      node != null && typeof node === 'object' && !Array.isArray(node) && '@type' in node,
    )
  } catch {
    return []
  }
}

function isArticle(node: Node) {
  const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']]
  return types.some(type => typeof type === 'string' && ARTICLE_TYPES.has(type))
}

function faqNode(blocks: TextBlock[]): Node | undefined {
  const questions = blocks.flatMap((block, index) => {
    if (block._type !== 'block' || (block.style !== 'h2' && block.style !== 'h3')) return []
    const question = blockText(block)
    if (!question || (!QUESTION.test(question) && !question.endsWith('?'))) return []
    const answer = []
    for (const following of blocks.slice(index + 1, index + 5)) {
      if (following.style === 'h2' || following.style === 'h3') break
      if (following._type === 'block' && following.style === 'normal') answer.push(blockText(following))
    }
    const text = answer.filter(Boolean).join(' ')
    return text ? [{
      '@type': 'Question',
      name: question.endsWith('?') ? question : `${question}?`,
      acceptedAnswer: { '@type': 'Answer', text },
    }] : []
  })
  return questions.length >= 2 ? { '@type': 'FAQPage', mainEntity: questions } : undefined
}

function productList(post: Post): Node | undefined {
  const products = post.products?.filter(product => product.name?.trim())
  if (!products?.length) return undefined
  return {
    '@type': 'ItemList',
    name: post.title,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.name,
      ...(product.affiliateUrl && { url: product.affiliateUrl }),
    })),
  }
}

export function generateJsonLd(post: Post, coverUrl?: string) {
  const authored = authoredNodes(post.jsonLd)
  const supplemental = authored.length ? authored : [productList(post), faqNode(post.body ?? [])].filter(Boolean)
  const graph = authored.some(isArticle) ? authored : [articleNode(post, coverUrl), ...supplemental]
  return serializeJsonLd(graph.length === 1
    ? { '@context': CONTEXT, ...graph[0] }
    : { '@context': CONTEXT, '@graph': graph })
}
