import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@sanity/client'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token:     process.env.SANITY_API_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn:    false,
})

async function publishDraft(draftId: string): Promise<string> {
  const draft = await client.getDocument(draftId)
  if (!draft) throw new Error(`Draft not found: ${draftId}`)
  const { _id, _rev, ...content } = draft as Record<string, unknown>
  const publishedId = (draftId as string).replace('drafts.', '')
  await client.transaction()
    .createOrReplace({ ...content, _id: publishedId } as Parameters<typeof client.createOrReplace>[0])
    .delete(draftId)
    .commit()
  return publishedId
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  SpartanShopper — Patch, Publish + Affiliate Link')
  console.log('  modari Portable Tire Inflator')
  console.log('═══════════════════════════════════════════════════════════\n')

  // ── Find draft ────────────────────────────────────────────────────────────
  const docs = await client.fetch<Array<{ _id: string; code: string }>>(
    `*[_type == "coupon" && code == "NQORHRFO"]{_id, code}`
  )
  const draft = docs.find(d => d._id.startsWith('drafts.'))
  if (!draft) throw new Error('modari draft not found — run add-coupons.ts first')

  // ── Patch ─────────────────────────────────────────────────────────────────
  process.stdout.write(`  Patching modari (${draft._id})… `)
  await client.patch(draft._id).set({
    title:        'modari Portable Tire Inflator — 50% Off with Code',
    slug:         { _type: 'slug', current: 'modari-tire-inflator-coupon' },
    affiliateSlug: { _type: 'slug', current: 'modari-tire-inflator' },
    active:       true,
    verified:     true,
    tags:         ['automotive', 'tire inflator', 'car accessories', 'amazon coupon', 'air compressor', 'cordless'],
    whyWeLikeThis: "A flat tire at the wrong time is one of those problems that's entirely preventable — if you have the right tool. The modari tire inflator is compact enough to live in your glove box and powerful enough to handle cars, pickups, motorcycles, and bikes at up to 160 PSI. Auto shut-off means you won't overinflate, and the cordless design means no hunting for a wall outlet in a parking lot. It has over 1,700 Amazon reviews, an Overall Pick badge, and 2,000+ buyers every month — which tells you this isn't a gimmick purchase. At half price, it's a no-brainer to add to your car kit.",
  }).commit()
  console.log('✓')

  // ── Publish ───────────────────────────────────────────────────────────────
  process.stdout.write('  Publishing… ')
  const publishedId = await publishDraft(draft._id)
  console.log(`✓\n  Published ID: ${publishedId}\n`)

  // ── Affiliate link ─────────────────────────────────────────────────────────
  const existing = await client.fetch<Array<{ slug: string }>>(
    `*[_type == "affiliateLink" && slug.current == "modari-tire-inflator"]{ "slug": slug.current }`
  )
  if (existing.length > 0) {
    console.log('  /go/modari-tire-inflator already exists — skipped')
  } else {
    process.stdout.write('  Creating /go/modari-tire-inflator… ')
    const al = await client.create({
      _type:       'affiliateLink',
      title:       'modari Portable Tire Inflator',
      slug:        { _type: 'slug', current: 'modari-tire-inflator' },
      destination: 'https://www.amazon.com/promocode/A3SRH9QURTZ2WG?tag=sku18798384-20',
    })
    console.log(`✓  ID: ${al._id}`)
  }

  console.log('\n── Done ────────────────────────────────────────────────────')
  console.log('  modari coupon is published and live in Sanity.')
  console.log('  /go/modari-tire-inflator is active.')
  console.log('  Note: coupon startDate is 2026-06-09 — surfaces on site from that date.')
  console.log('  Next: run npx tsx scripts/upload-coupon-images.ts to attach the product image.')
}

main().catch(err => {
  console.error('\n[fatal]', err.message ?? err)
  process.exit(1)
})
