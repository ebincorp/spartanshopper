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
  console.log('  SpartanShopper — Patch, Publish + Affiliate Links')
  console.log('═══════════════════════════════════════════════════════════\n')

  // ── Find both draft documents by coupon code ──────────────────────────────
  const docs = await client.fetch<Array<{ _id: string; code: string }>>(
    `*[_type == "coupon" && code in ["XXYH563Y", "3Z8M4NTG"]]{_id, code}`
  )

  const luffwellDraft = docs.find(d => d.code === 'XXYH563Y' && d._id.startsWith('drafts.'))
  const libbipawDraft = docs.find(d => d.code === '3Z8M4NTG' && d._id.startsWith('drafts.'))

  if (!luffwellDraft) throw new Error('LUFFWELL draft not found — run add-coupons.ts first')
  if (!libbipawDraft) throw new Error('Libbipaw draft not found — run add-coupons.ts first')

  // ── Patch LUFFWELL ────────────────────────────────────────────────────────
  process.stdout.write(`  Patching LUFFWELL (${luffwellDraft._id})… `)
  await client.patch(luffwellDraft._id).set({
    title:        'LUFFWELL Dog Runner for Yard — 10% Off with Code',
    slug:         { _type: 'slug', current: 'luffwell-dog-runner-coupon' },
    affiliateSlug: { _type: 'slug', current: 'luffwell-dog-runner' },
    active:       true,
    verified:     true,
    tags:         ['dog', 'pet supplies', 'amazon coupon', 'dog runner', 'outdoor dog'],
    whyWeLikeThis: "The LUFFWELL Dog Runner gives large dogs real freedom without the stress of a stake or fence. At 100 feet, it's one of the longest runs you'll find at this price point, and the heavy-duty steel cable holds up to 250 lbs — no snapping, no fraying. The included 15FT tie-out cable adds flexibility for camping or park trips. It has over 1,400 Amazon reviews and an Overall Pick badge, which tells you this isn't a novelty purchase — dog owners keep coming back to it. At $36.99 with 10% off, it's a genuinely useful buy for anyone with a yard and an energetic dog.",
  }).commit()
  console.log('✓')

  // ── Publish LUFFWELL ──────────────────────────────────────────────────────
  process.stdout.write('  Publishing LUFFWELL… ')
  const luffwellId = await publishDraft(luffwellDraft._id)
  console.log(`✓\n  Published ID: ${luffwellId}\n`)

  // ── Patch Libbipaw ────────────────────────────────────────────────────────
  process.stdout.write(`  Patching Libbipaw (${libbipawDraft._id})… `)
  await client.patch(libbipawDraft._id).set({
    title:        'Libbipaw Windproof Elevated Dog Bed — 15% Off with Code',
    slug:         { _type: 'slug', current: 'libbipaw-elevated-dog-bed-coupon' },
    affiliateSlug: { _type: 'slug', current: 'libbipaw-elevated-dog-bed' },
    active:       true,
    verified:     true,
    tags:         ['dog', 'pet supplies', 'amazon coupon', 'dog bed', 'outdoor dog bed', 'elevated dog bed'],
    whyWeLikeThis: "Most elevated dog beds are bare cots — the Libbipaw adds a 3-sided canopy that blocks 90% of UV rays, which makes a real difference for dogs that spend time outdoors in the summer heat. The chew-proof Teslin mesh mat holds up better than standard fabric, and the whole thing stakes into the ground so it doesn't blow over. It supports large dogs up to 150 lbs and comes in blue or tan. At $59.99 with 15% off using the code, it's a solid deal for anyone whose dog is spending more time in the backyard this season.",
  }).commit()
  console.log('✓')

  // ── Publish Libbipaw ──────────────────────────────────────────────────────
  process.stdout.write('  Publishing Libbipaw… ')
  const libbipawId = await publishDraft(libbipawDraft._id)
  console.log(`✓\n  Published ID: ${libbipawId}\n`)

  // ── Affiliate links (published — required for /go/ redirect resolution) ───
  // Check for existing slugs first
  const existingLinks = await client.fetch<Array<{ slug: string }>>(
    `*[_type == "affiliateLink" && slug.current in ["luffwell-dog-runner", "libbipaw-elevated-dog-bed"]]{ "slug": slug.current }`
  )
  const takenSlugs = new Set(existingLinks.map(l => l.slug))

  if (takenSlugs.has('luffwell-dog-runner')) {
    console.log('  /go/luffwell-dog-runner already exists — skipped')
  } else {
    process.stdout.write('  Creating /go/luffwell-dog-runner… ')
    const al1 = await client.create({
      _type:       'affiliateLink',
      title:       'LUFFWELL Dog Runner',
      slug:        { _type: 'slug', current: 'luffwell-dog-runner' },
      destination: 'https://www.amazon.com/dp/B08R872F53?tag=sku18798384-20',
    })
    console.log(`✓  ID: ${al1._id}`)
  }

  if (takenSlugs.has('libbipaw-elevated-dog-bed')) {
    console.log('  /go/libbipaw-elevated-dog-bed already exists — skipped')
  } else {
    process.stdout.write('  Creating /go/libbipaw-elevated-dog-bed… ')
    const al2 = await client.create({
      _type:       'affiliateLink',
      title:       'Libbipaw Elevated Dog Bed',
      slug:        { _type: 'slug', current: 'libbipaw-elevated-dog-bed' },
      destination: 'https://www.amazon.com/dp/B0G344DFBZ?tag=sku18798384-20',
    })
    console.log(`✓  ID: ${al2._id}`)
  }

  console.log('\n── Done ────────────────────────────────────────────────────')
  console.log('  Both coupons are published and live in Sanity.')
  console.log('  /go/luffwell-dog-runner and /go/libbipaw-elevated-dog-bed are active.')
  console.log('  Note: coupons have startDate 2026-06-01 — they surface on site from that date.')
  console.log('  Note: product images need to be added manually in Studio (Coupons → image field).')
}

main().catch(err => {
  console.error('\n[fatal]', err.message ?? err)
  process.exit(1)
})
