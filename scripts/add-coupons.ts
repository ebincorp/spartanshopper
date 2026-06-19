/**
 * Manual coupon entry → Sanity draft creator
 *
 * 1. Fill in scripts/promotions.json with your promo codes
 * 2. Run: npx tsx scripts/add-coupons.ts
 * 3. Review and activate drafts in https://spartanshopper.sanity.studio
 *
 * Valid category values:
 *   health | tech | home | food | beauty | fitness | pets | travel | fashion | amazon
 *
 * Optional: pass a different file path as the first argument:
 *   npx tsx scripts/add-coupons.ts ./my-promos.json
 */

import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { createClient } from '@sanity/client'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true })

// ── Types ────────────────────────────────────────────────────────────────────

interface PromoInput {
  brand: string
  code: string
  discount: string       // e.g. "50% Off" or "$10 Off"
  category: string       // one of the valid values listed above
  expiryDate: string     // YYYY-MM-DD or any parseable date
  startDate?: string     // optional — coupon hidden until this date
  affiliateUrl?: string  // optional — add later in Studio if needed
  description?: string   // optional — auto-generated if blank
}

interface SkippedEntry {
  code: string
  brand: string
  reason: string
}

// ── Sanity client ────────────────────────────────────────────────────────────

const client = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:    process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token:      process.env.SANITY_API_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn:     false,
})

// ── Duplicate checks (one batch query, not N individual queries) ─────────────

interface ExistingCoupon {
  code: string
  store: string
  discount: string
}

async function fetchExistingCoupons(): Promise<ExistingCoupon[]> {
  return client.fetch<ExistingCoupon[]>(
    `*[_type == "coupon"]{ code, "store": store, discount }`
  )
}

function isDuplicateCode(code: string, existing: ExistingCoupon[]): boolean {
  return existing.some((e) => e.code?.toUpperCase() === code.toUpperCase())
}

function isDuplicateBrandDiscount(brand: string, discount: string, existing: ExistingCoupon[]): boolean {
  const normBrand    = brand.trim().toLowerCase()
  const normDiscount = discount.trim().toLowerCase()
  return existing.some(
    (e) =>
      e.store?.toLowerCase() === normBrand &&
      e.discount?.toLowerCase() === normDiscount
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function isExpired(dateStr: string): boolean {
  return new Date(dateStr).getTime() < Date.now()
}

function buildTitle(promo: PromoInput): string {
  return `${promo.discount} ${promo.brand}`.trim()
}

function buildDescription(promo: PromoInput): string {
  if (promo.description?.trim()) return promo.description.trim()
  return `Save ${promo.discount} on ${promo.brand} products on Amazon. Use code ${promo.code} at checkout. Expires ${formatDate(promo.expiryDate)}.`
}

// ── Validate input ───────────────────────────────────────────────────────────

const VALID_CATEGORIES = new Set([
  'health', 'tech', 'home', 'food', 'beauty',
  'fitness', 'pets', 'travel', 'fashion', 'amazon',
  'korean-skincare', 'automotive', 'outdoor',
])

function validate(promo: PromoInput, index: number): string[] {
  const errors: string[] = []
  if (!promo.brand?.trim())    errors.push(`[${index}] "brand" is required`)
  if (!promo.code?.trim())     errors.push(`[${index}] "code" is required`)
  if (!promo.discount?.trim()) errors.push(`[${index}] "discount" is required`)
  if (!promo.expiryDate)       errors.push(`[${index}] "expiryDate" is required`)
  if (!VALID_CATEGORIES.has(promo.category)) {
    errors.push(
      `[${index}] "category" must be one of: ${[...VALID_CATEGORIES].join(', ')} (got "${promo.category}")`
    )
  }
  if (promo.expiryDate && isNaN(new Date(promo.expiryDate).getTime())) {
    errors.push(`[${index}] "expiryDate" is not a valid date`)
  }
  if (promo.startDate && isNaN(new Date(promo.startDate).getTime())) {
    errors.push(`[${index}] "startDate" is not a valid date`)
  }
  return errors
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const filePath = process.argv[2] ?? path.resolve(process.cwd(), 'scripts/promotions.json')

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    process.exit(1)
  }

  const raw: PromoInput[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  console.log('═══════════════════════════════════════════')
  console.log('  SpartanShopper — Add Coupons to Sanity')
  console.log('═══════════════════════════════════════════')
  console.log(`  File:    ${filePath}`)
  console.log(`  Entries: ${raw.length}`)
  console.log()

  // Validate all entries first — fail fast before touching Sanity
  const allErrors: string[] = []
  raw.forEach((p, i) => allErrors.push(...validate(p, i + 1)))
  if (allErrors.length > 0) {
    console.error('Validation errors — fix these before continuing:\n')
    allErrors.forEach((e) => console.error('  ✗', e))
    process.exit(1)
  }

  // Fetch all existing coupons once (avoids N round-trips)
  process.stdout.write('  Fetching existing coupons from Sanity… ')
  const existing = await fetchExistingCoupons()
  console.log(`${existing.length} found\n`)

  const createdTitles: string[] = []
  const skippedEntries: SkippedEntry[] = []

  for (const promo of raw) {
    const code  = promo.code.trim().toUpperCase()
    const brand = promo.brand.trim()
    const label = `${code} (${brand})`

    // ── Check 1: expired ───────────────────────────────────────────────────
    if (isExpired(promo.expiryDate)) {
      console.log(`  ⚠ SKIP  ${label} — expired on ${formatDate(promo.expiryDate)}`)
      skippedEntries.push({ code, brand, reason: `Expired on ${formatDate(promo.expiryDate)}` })
      continue
    }

    // ── Check 2: duplicate code ────────────────────────────────────────────
    if (isDuplicateCode(code, existing)) {
      console.log(`  ⚠ SKIP  ${label} — code already exists in Sanity`)
      skippedEntries.push({ code, brand, reason: 'Duplicate code already in Sanity' })
      continue
    }

    // ── Check 3: duplicate brand + discount ────────────────────────────────
    if (isDuplicateBrandDiscount(brand, promo.discount, existing)) {
      console.log(`  ⚠ SKIP  ${label} — ${brand} already has a "${promo.discount}" coupon`)
      skippedEntries.push({ code, brand, reason: `${brand} already has a "${promo.discount}" coupon` })
      continue
    }

    // ── Create draft ───────────────────────────────────────────────────────
    const title = buildTitle(promo)
    const draftId = `drafts.${crypto.randomUUID()}`

    await client.create({
      _id:          draftId,
      _type:        'coupon',
      title,
      store:        brand,
      code,
      discount:     promo.discount.trim(),
      description:  buildDescription(promo),
      category:     promo.category,
      tags:         ['amazon-coupon', promo.category],
      startDate:    promo.startDate ? new Date(promo.startDate).toISOString() : undefined,
      expiryDate:   new Date(promo.expiryDate).toISOString(),
      affiliateUrl: promo.affiliateUrl?.trim() ?? '',
      slug:         { _type: 'slug', current: generateSlug(title) },
      active:       false,
      verified:     false,
    })

    // Add to local cache so subsequent entries in the same file are also deduped
    existing.push({ code, store: brand, discount: promo.discount.trim() })

    console.log(`  ✓ DRAFT  ${label}`)
    createdTitles.push(`${title} (${code}) — expires ${formatDate(promo.expiryDate)}`)
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log()
  console.log('── Summary ─────────────────────────────────────────')
  console.log(`  Created: ${createdTitles.length}`)
  console.log(`  Skipped: ${skippedEntries.length}`)

  if (createdTitles.length > 0) {
    console.log()
    console.log('── New drafts ───────────────────────────────────────')
    createdTitles.forEach((t) => console.log(`  • ${t}`))
    console.log()
    console.log('  Review at: https://spartanshopper.sanity.studio')
  }

  if (skippedEntries.length > 0) {
    console.log()
    console.log('── Skipped ─────────────────────────────────────────')
    skippedEntries.forEach((s) => console.log(`  • ${s.code} (${s.brand}) — ${s.reason}`))
  }
}

main().catch((err) => {
  console.error('\n[fatal]', err.message ?? err)
  process.exit(1)
})
