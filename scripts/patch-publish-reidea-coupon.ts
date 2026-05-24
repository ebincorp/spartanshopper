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
  console.log('  REIDEA USB Candle Lighter')
  console.log('═══════════════════════════════════════════════════════════\n')

  // ── Find draft ────────────────────────────────────────────────────────────
  const docs = await client.fetch<Array<{ _id: string; code: string }>>(
    `*[_type == "coupon" && code == "WZ4A3EUV"]{_id, code}`
  )
  const draft = docs.find(d => d._id.startsWith('drafts.'))
  if (!draft) throw new Error('REIDEA draft not found — run add-coupons.ts first')

  // ── Patch ─────────────────────────────────────────────────────────────────
  process.stdout.write(`  Patching REIDEA (${draft._id})… `)
  await client.patch(draft._id).set({
    title:        'REIDEA USB Candle Lighter — 40% Off with Code',
    slug:         { _type: 'slug', current: 'reidea-candle-lighter-coupon' },
    affiliateSlug: { _type: 'slug', current: 'reidea-candle-lighter' },
    active:       true,
    verified:     true,
    tags:         ['home', 'candle lighter', 'amazon coupon', 'kitchen', 'gifts', 'flameless lighter'],
    whyWeLikeThis: "With nearly 40,000 Amazon reviews and a Best Seller badge, the REIDEA candle lighter isn't a discovery — it's a proven household staple that people keep coming back to. The windproof electric arc means no flame, no butane, and no struggling to relight in a breeze. It charges via USB, lasts for hundreds of lights on a single charge, and the safety protector button prevents accidental ignition. At $12.99 with 40% off, it's the kind of practical gift that works for anyone with candles, a fireplace, or a grill. Hard to go wrong at this price.",
  }).commit()
  console.log('✓')

  // ── Publish ───────────────────────────────────────────────────────────────
  process.stdout.write('  Publishing… ')
  const publishedId = await publishDraft(draft._id)
  console.log(`✓\n  Published ID: ${publishedId}\n`)

  // ── Affiliate link ─────────────────────────────────────────────────────────
  const existing = await client.fetch<Array<{ slug: string }>>(
    `*[_type == "affiliateLink" && slug.current == "reidea-candle-lighter"]{ "slug": slug.current }`
  )
  if (existing.length > 0) {
    console.log('  /go/reidea-candle-lighter already exists — skipped')
  } else {
    process.stdout.write('  Creating /go/reidea-candle-lighter… ')
    const al = await client.create({
      _type:       'affiliateLink',
      title:       'REIDEA USB Candle Lighter',
      slug:        { _type: 'slug', current: 'reidea-candle-lighter' },
      destination: 'https://www.amazon.com/dp/B08N4HHPZL?tag=sku18798384-20',
    })
    console.log(`✓  ID: ${al._id}`)
  }

  console.log('\n── Done ────────────────────────────────────────────────────')
  console.log('  REIDEA coupon is published and live in Sanity.')
  console.log('  /go/reidea-candle-lighter is active.')
  console.log('  Next: run npx tsx scripts/upload-coupon-images.ts to attach the product image.')
}

main().catch(err => {
  console.error('\n[fatal]', err.message ?? err)
  process.exit(1)
})
