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
  console.log('  MEGELIN LED Light Therapy Mask')
  console.log('═══════════════════════════════════════════════════════════\n')

  // ── Find draft ────────────────────────────────────────────────────────────
  const docs = await client.fetch<Array<{ _id: string; code: string }>>(
    `*[_type == "coupon" && code == "2ALISONN10"]{_id, code}`
  )
  const draft = docs.find(d => d._id.startsWith('drafts.'))
  if (!draft) throw new Error('MEGELIN draft not found — run add-coupons.ts first')

  // ── Patch ─────────────────────────────────────────────────────────────────
  process.stdout.write(`  Patching MEGELIN (${draft._id})… `)
  await client.patch(draft._id).set({
    title:        'MEGELIN LED Light Therapy Mask — 10% Off with Code',
    slug:         { _type: 'slug', current: 'megelin-led-light-therapy-mask-coupon' },
    affiliateSlug: { _type: 'slug', current: 'megelin-led-light-therapy-mask' },
    active:       true,
    verified:     true,
    tags:         ['beauty', 'skincare', 'red light therapy', 'led mask', 'anti-aging', 'amazon coupon', 'skin rejuvenation'],
    whyWeLikeThis: "Red light therapy has moved from clinical spas to living rooms, and the MEGELIN mask makes it easy to see why. Seven wavelengths target different layers of skin — from surface brightening to deeper collagen stimulation — while the neck coverage addresses an area most face masks ignore entirely. With 468 reviews and 600+ monthly buyers at $362, this isn't an impulse buy, but it's a serious skincare investment that holds up to scrutiny. FSA and HSA eligible, which makes it more accessible than the price tag suggests. At 10% off through July 15, that's over $36 back on a device people actually use daily.",
  }).commit()
  console.log('✓')

  // ── Publish ───────────────────────────────────────────────────────────────
  process.stdout.write('  Publishing… ')
  const publishedId = await publishDraft(draft._id)
  console.log(`✓\n  Published ID: ${publishedId}\n`)

  // ── Affiliate link ─────────────────────────────────────────────────────────
  const existing = await client.fetch<Array<{ slug: string }>>(
    `*[_type == "affiliateLink" && slug.current == "megelin-led-light-therapy-mask"]{ "slug": slug.current }`
  )
  if (existing.length > 0) {
    console.log('  /go/megelin-led-light-therapy-mask already exists — skipped')
  } else {
    process.stdout.write('  Creating /go/megelin-led-light-therapy-mask… ')
    const al = await client.create({
      _type:       'affiliateLink',
      title:       'MEGELIN LED Light Therapy Mask',
      slug:        { _type: 'slug', current: 'megelin-led-light-therapy-mask' },
      destination: 'https://www.amazon.com/dp/B0CPY3NKWB?tag=sku18798384-20',
    })
    console.log(`✓  ID: ${al._id}`)
  }

  console.log('\n── Done ────────────────────────────────────────────────────')
  console.log('  MEGELIN coupon is published and live in Sanity.')
  console.log('  /go/megelin-led-light-therapy-mask is active.')
  console.log('  Note: coupon startDate is 2026-06-15 — surfaces on site from that date.')
  console.log('  Next: run npx tsx scripts/upload-coupon-images.ts to attach the product image.')
}

main().catch(err => {
  console.error('\n[fatal]', err.message ?? err)
  process.exit(1)
})
