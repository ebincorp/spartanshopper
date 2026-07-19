/**
 * Backfill `coupon.asin` from existing affiliate URLs.
 *
 * As of 2026-07-19 the `asin` field was populated on 0 of 204 published coupon
 * docs — completely unpopulated, not sparse. The ASIN is however already sitting
 * inside many coupons' `affiliateUrl`, or inside the `affiliateLink.destination`
 * their `affiliateSlug` resolves to. This extracts it and writes it to the field.
 *
 * Pure string extraction — no Creators API calls, no credentials required.
 * It does NOT fix the coupons missing images (those are non-Amazon or
 * identity-less and have no ASIN anywhere); it populates a field that every
 * future coupon-side Creators API operation depends on.
 *
 * Usage:
 *   npx tsx scripts/backfill-coupon-asins.ts          # dry run (default)
 *   npx tsx scripts/backfill-coupon-asins.ts --write  # apply
 */
import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'eohdr7jw',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

const WRITE = process.argv.includes('--write')

// /dp/XXXXXXXXXX, /gp/product/XXXXXXXXXX, ASIN=XXXXXXXXXX
const ASIN_RE = /(?:\/dp\/|\/gp\/product\/|ASIN=)([A-Z0-9]{10})/i
// An ASIN is 10 chars, starts with B (modern) or is a 10-digit ISBN (books).
const VALID_ASIN = /^(B[A-Z0-9]{9}|\d{9}[\dX])$/

function extract(url?: string): string | null {
  if (!url) return null
  const m = url.match(ASIN_RE)
  if (!m) return null
  const asin = m[1].toUpperCase()
  return VALID_ASIN.test(asin) ? asin : null
}

interface Row {
  _id: string
  store?: string
  code?: string
  asin?: string
  affiliateUrl?: string
  affSlug?: string
}

async function main() {
  console.log(`\n${WRITE ? '⚠️  WRITE MODE' : '🔍 DRY RUN'} — coupon.asin backfill\n`)

  const coupons = await client.fetch<Row[]>(
    `*[_type=="coupon" && !(_id in path("drafts.**"))]{
      _id, store, code, asin, affiliateUrl, "affSlug": affiliateSlug.current
    }`
  )
  const links = await client.fetch<{ slug: string; destination: string }[]>(
    `*[_type=="affiliateLink"]{"slug": slug.current, destination}`
  )
  const linkMap = new Map(links.map((l) => [l.slug, l.destination]))

  const planned: Array<Row & { found: string; via: string }> = []
  let alreadySet = 0
  let noAsin = 0

  for (const c of coupons) {
    if (c.asin) { alreadySet++; continue }
    const fromUrl = extract(c.affiliateUrl)
    if (fromUrl) { planned.push({ ...c, found: fromUrl, via: 'affiliateUrl' }); continue }
    const fromGo = extract(c.affSlug ? linkMap.get(c.affSlug) : undefined)
    if (fromGo) { planned.push({ ...c, found: fromGo, via: '/go/ destination' }); continue }
    noAsin++
  }

  console.log(`  published coupons : ${coupons.length}`)
  console.log(`  asin already set  : ${alreadySet}`)
  console.log(`  no ASIN anywhere  : ${noAsin}  (non-Amazon or identity-less — expected)`)
  console.log(`  TO BACKFILL       : ${planned.length}\n`)

  for (const p of planned) {
    console.log(`  ${String(p.store ?? '?').padEnd(22)} ${String(p.code ?? '-').padEnd(14)} ${p.found}  ← ${p.via}`)
  }

  if (!planned.length) { console.log('\n  nothing to do.'); return }

  if (!WRITE) {
    console.log(`\n  Dry run only. Re-run with --write to apply ${planned.length} patch(es).`)
    return
  }

  console.log()
  let ok = 0
  for (const p of planned) {
    await client.patch(p._id).set({ asin: p.found }).commit()
    ok++
    console.log(`  ✅ ${p._id} → asin=${p.found}`)
  }
  console.log(`\n  Patched ${ok} of ${planned.length}.`)
}

main().catch((e) => { console.error('\n[fatal]', e.message ?? e); process.exit(1) })
