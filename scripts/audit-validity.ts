import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@sanity/client'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token:     process.env.SANITY_API_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn:    false,
})

const TODAY = new Date('2026-07-15T00:00:00Z').getTime()
const isPast = (d?: string) => !!d && new Date(d).getTime() < TODAY

async function main() {
  // ---------- COUPONS ----------
  const coupons = await client.fetch<any[]>(
    `*[_type == "coupon"]{
      _id, title, "slug": slug.current, code, store, discountLabel, active, verified,
      startDate, expiryDate, affiliateUrl, "goSlug": affiliateSlug.current, category,
      "hasImage": defined(image.asset) || defined(imageUrl)
    } | order(expiryDate asc)`
  )
  console.log(`\n========== COUPONS (${coupons.length} total) ==========`)
  console.log('ACTIVE\tEXPIRY\t\tSTATE\tSLUG\t\tCODE')
  for (const c of coupons) {
    const state = isPast(c.expiryDate) ? 'EXPIRED' : 'ok'
    console.log(`${c.active ? 'Y' : 'n'}\t${(c.expiryDate ?? '(none)').slice(0,10)}\t${state}\t${c.slug ?? '-'}\t${c.code ?? '-'}`)
  }
  console.log('\n-- Coupons EXPIRED but still ACTIVE (need deactivation) --')
  coupons.filter(c => c.active && isPast(c.expiryDate)).forEach(c =>
    console.log(`  ${c.slug} (${c.code}) exp ${c.expiryDate?.slice(0,10)} — ${c.title}`))
  console.log('\n-- Coupon structural flags --')
  for (const c of coupons.filter(c => c.active)) {
    const issues: string[] = []
    if (c.affiliateUrl && /amazon\.com/.test(c.affiliateUrl) && !c.affiliateUrl.includes('tag=sku18798384-20')) issues.push('missing tag')
    if (!c.goSlug) issues.push('no /go slug')
    if (!c.expiryDate) issues.push('no expiryDate')
    if (!c.hasImage) issues.push('NO IMAGE — card renders blank on /coupons')
    if (issues.length) console.log(`  ⚠ ${c.slug}: ${issues.join('; ')}`)
  }

  // Live cards with no photo. The `image` field is intentionally NOT required in the
  // schema (16 legacy docs lack one), so script-created coupons pass validation and
  // go live as blank cards next to ones with photos. Surfaced here instead.
  const hasStarted = (c: any) => !c.startDate || isPast(c.startDate)
  const notExpired = (c: any) => !c.expiryDate || !isPast(c.expiryDate)
  const liveNoImage = coupons.filter(c => c.active && !c.hasImage && hasStarted(c) && notExpired(c))
  console.log(`\n-- LIVE coupons missing an image (${liveNoImage.length}) --`)
  liveNoImage.forEach(c =>
    console.log(`  ⚠ ${String(c.store ?? c.slug).padEnd(30)} ${String(c.code ?? '-').padEnd(16)} — upload via scripts/upload-coupon-images.ts`))

  // Evergreen coupons never expire, so they never resurface for review the way dated
  // ones do — they can go stale silently and indefinitely. Listed for periodic manual checks.
  const evergreen = coupons.filter(c => c.active && !c.expiryDate)
  console.log(`\n-- EVERGREEN coupons, no expiry date (${evergreen.length}) — verify these manually, nothing else will --`)
  evergreen.forEach(c =>
    console.log(`  • ${String(c.slug).padEnd(38)} ${String(c.code ?? '-').padEnd(16)} ${c.hasImage ? '' : '(also missing image)'}`))

  // ---------- DEALS ----------
  const deals = await client.fetch<any[]>(
    `*[_type == "deal"]{
      _id, title, "slug": slug.current, active, expiryDate, category, asin,
      affiliateUrl, "goSlug": affiliateSlug.current, salePrice, originalPrice
    } | order(expiryDate asc)`
  )
  const activeDeals = deals.filter(d => d.active)
  console.log(`\n\n========== DEALS (${deals.length} total, ${activeDeals.length} active) ==========`)
  console.log('\n-- Deals EXPIRED but still ACTIVE (need deactivation) --')
  activeDeals.filter(d => isPast(d.expiryDate)).forEach(d =>
    console.log(`  ${d.slug} exp ${d.expiryDate?.slice(0,10)} — ${d.title}`))
  console.log('\n-- Active deal structural flags --')
  for (const d of activeDeals) {
    const issues: string[] = []
    if (d.affiliateUrl && /amazon\.com/.test(d.affiliateUrl) && !d.affiliateUrl.includes('tag=sku18798384-20')) issues.push('missing tag')
    if (d.salePrice && d.originalPrice && d.salePrice >= d.originalPrice) issues.push('sale >= original')
    if (d.expiryDate && isPast(d.expiryDate)) issues.push('EXPIRED but active')
    if (issues.length) console.log(`  ⚠ ${d.slug}: ${issues.join('; ')}`)
  }
  console.log('\n(no ⚠ lines above a section = clean)')
}

main().catch((e) => { console.error(e); process.exit(1) })
