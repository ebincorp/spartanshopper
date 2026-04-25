import { createClient } from '@sanity/client'
import type { AmazonPromotion, CreatedDraft } from './types'

const CATEGORY_MAP: Record<string, string> = {
  'baby':              'home',
  'nursery':           'home',
  'sports':            'fitness',
  'fitness':           'fitness',
  'outdoor':           'fitness',
  'health':            'health',
  'beauty':            'beauty',
  'personal care':     'health',
  'wellness':          'health',
  'electronics':       'tech',
  'tech':              'tech',
  'gadgets':           'tech',
  'software':          'tech',
  'kitchen':           'home',
  'home':              'home',
  'furniture':         'home',
  'pet':               'pets',
  'clothing':          'fashion',
  'fashion':           'fashion',
  'apparel':           'fashion',
  'shoes':             'fashion',
  'grocery':           'food',
  'food':              'food',
  'meal':              'food',
  'travel':            'travel',
  'hotel':             'travel',
  'flight':            'travel',
  'amazon':            'amazon',
}

function mapCategory(amazonCategory: string): string {
  const lower = amazonCategory.toLowerCase()
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) return value
  }
  return 'amazon' // Default: treat unknown as amazon deal
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 96)
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function generateDescription(promo: AmazonPromotion): string {
  return `Save ${promo.discountPercent}% on ${promo.brand} products on Amazon. Use code ${promo.promoCode} at checkout. Expires ${formatDate(promo.endDate)}.`
}

function generateTags(promo: AmazonPromotion): string[] {
  const tags = [
    'amazon-coupon',
    promo.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
  ]
  if (promo.discountPercent >= 50) tags.push('50-percent-off')
  if (promo.discountPercent >= 30) tags.push('30-percent-off')
  return [...new Set(tags.filter(Boolean))]
}

function getClient() {
  return createClient({
    projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset:    process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
    token:      process.env.SANITY_API_TOKEN!,
    apiVersion: '2024-01-01',
    useCdn:     false,
  })
}

/** Returns true if a coupon with this code already exists (draft or published) */
async function codeExists(client: ReturnType<typeof getClient>, code: string): Promise<boolean> {
  const result = await client.fetch<string | null>(
    `*[_type == "coupon" && code == $code][0]._id`,
    { code }
  )
  return result !== null
}

export async function createSanityDraft(promo: AmazonPromotion): Promise<CreatedDraft | null> {
  const client = getClient()

  // Skip if code already in Sanity (published or draft)
  if (await codeExists(client, promo.promoCode)) {
    console.log(`[sanity] Skipping ${promo.promoCode} — already exists`)
    return null
  }

  const title    = `${promo.discountPercent}% Off ${promo.brand}`
  const category = mapCategory(promo.category)
  const slug     = generateSlug(title)

  // Prefix with 'drafts.' so it appears as a draft in Sanity Studio
  const draftId = `drafts.${crypto.randomUUID()}`

  const doc = {
    _id:         draftId,
    _type:       'coupon',
    title,
    store:       promo.brand,
    code:        promo.promoCode,
    discount:    `${promo.discountPercent}% Off`,
    description: generateDescription(promo),
    category,
    tags:        generateTags(promo),
    expiryDate:  new Date(promo.endDate).toISOString(),
    affiliateUrl: promo.productUrl ?? '',
    slug:        { _type: 'slug', current: slug },
    active:      false,   // Must be activated manually after review
    verified:    false,   // Must be verified manually before activating
  }

  const created = await client.create(doc)

  console.log(`[sanity] Created draft: ${title} (${created._id})`)

  return {
    sanityId:  created._id,
    title,
    code:      promo.promoCode,
    discount:  `${promo.discountPercent}% Off`,
    category,
    expiryDate: promo.endDate,
  }
}

export async function createSanityDrafts(
  promotions: AmazonPromotion[]
): Promise<{ added: CreatedDraft[]; errors: string[] }> {
  const added: CreatedDraft[] = []
  const errors: string[] = []

  for (const promo of promotions) {
    try {
      const draft = await createSanityDraft(promo)
      if (draft) added.push(draft)
    } catch (err) {
      const msg = `Failed to create draft for ${promo.promoCode}: ${err instanceof Error ? err.message : String(err)}`
      console.error('[sanity]', msg)
      errors.push(msg)
    }
  }

  return { added, errors }
}
