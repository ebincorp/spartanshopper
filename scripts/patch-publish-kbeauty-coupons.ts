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
  console.log('  SpartanShopper — Patch, Publish + Affiliate Links')
  console.log('  K-Beauty Coupons')
  console.log('═══════════════════════════════════════════════════════════\n')

  // ── Find Dr.G draft ───────────────────────────────────────────────────────
  const docs = await client.fetch<Array<{ _id: string; code: string }>>(
    `*[_type == "coupon" && code == "DRGDEWYGLOW"]{_id, code}`
  )
  const drgDraft = docs.find(d => d._id.startsWith('drafts.'))
  if (!drgDraft) throw new Error('Dr.G draft not found — run add-coupons.ts first')

  // ── Patch Dr.G draft ──────────────────────────────────────────────────────
  process.stdout.write(`  Patching Dr.G (${drgDraft._id})… `)
  await client.patch(drgDraft._id).set({
    title:        'Dr.G Brightening Peeling Gel — 10% Off with Code',
    slug:         { _type: 'slug', current: 'drg-brightening-peeling-gel-coupon' },
    affiliateSlug: { _type: 'slug', current: 'drg-brightening-peeling-gel' },
    active:       true,
    verified:     true,
    category:     'korean-skincare',
    tags:         ['peeling gel', 'korean exfoliator', 'brightening', 'korean skincare', 'amazon coupon', 'beauty deals'],
    whyWeLikeThis: "Dr.G is one of the most respected names in Korean dermocosmetics, and the Brightening Peeling Gel is a standout in their lineup. Unlike harsh physical scrubs or chemical exfoliants that can irritate, this gel uses a rolling action — you apply it dry and physically roll it across your skin, which lifts away dead skin cells without any abrasion.\nThe formula includes niacinamide for brightening, centella asiatica for soothing, and beta-glucan to support the skin barrier. The result is instantly smoother, brighter skin that feels genuinely different after a single use — not the subtle 'maybe I see a difference' of some exfoliants.\nIt's designed for all skin types including sensitive, and the texture and scent are distinctly elevated compared to drugstore alternatives. Over 10,000 Amazon ratings and consistent repurchase behavior tell the story — this is a product people keep coming back to once they try it.\nAt the regular price it's already a solid deal. With 10% off using the promo code, it becomes a no-brainer for anyone building a Korean skincare routine or looking for a reliable exfoliator.",
  }).commit()
  console.log('✓')

  // ── Publish Dr.G ──────────────────────────────────────────────────────────
  process.stdout.write('  Publishing Dr.G… ')
  const drgId = await publishDraft(drgDraft._id)
  console.log(`✓\n  Published ID: ${drgId}\n`)

  // ── Patch existing published coupons to korean-skincare category ──────────
  const existingIds = [
    'coupon-dermafirm-bakuchiol-serum',
    'coupon-dermal-korean-sheet-mask',
    'coupon-jumiso-niacinamide-serum',
  ]
  for (const id of existingIds) {
    process.stdout.write(`  Patching category on ${id}… `)
    await client.patch(id).set({ category: 'korean-skincare' }).commit()
    console.log('✓')
  }
  console.log()

  // ── Affiliate links ────────────────────────────────────────────────────────
  const slugsToCreate = [
    {
      slug: 'drg-brightening-peeling-gel',
      title: 'Dr.G Brightening Peeling Gel',
      destination: 'https://www.amazon.com/dp/B07WNMS4LS?tag=sku18798384-20',
    },
    {
      slug: 'dermal-sheet-mask',
      title: 'DERMAL Korean Sheet Masks',
      destination: 'https://www.amazon.com/dp/B00R97V26Y?tag=sku18798384-20',
    },
    {
      slug: 'jumiso-niacinamide-serum',
      title: 'JUMISO Niacinamide 20 Serum',
      destination: 'https://www.amazon.com/dp/B0C4WRWP56?tag=sku18798384-20',
    },
    {
      slug: 'dermafirm-bakuchiol-serum',
      title: 'Dermafirm Bakuchiol Retinol Serum',
      destination: 'https://www.amazon.com/dp/B0CQTN8KYW?tag=sku18798384-20',
    },
  ]

  const existingLinks = await client.fetch<Array<{ slug: string }>>(
    `*[_type == "affiliateLink" && slug.current in ${JSON.stringify(slugsToCreate.map(s => s.slug))}]{ "slug": slug.current }`
  )
  const takenSlugs = new Set(existingLinks.map(l => l.slug))

  for (const { slug, title, destination } of slugsToCreate) {
    if (takenSlugs.has(slug)) {
      console.log(`  /go/${slug} already exists — skipped`)
    } else {
      process.stdout.write(`  Creating /go/${slug}… `)
      const al = await client.create({
        _type:       'affiliateLink',
        title,
        slug:        { _type: 'slug', current: slug },
        destination,
      })
      console.log(`✓  ID: ${al._id}`)
    }
  }

  console.log('\n── Done ────────────────────────────────────────────────────')
  console.log('  Dr.G coupon published and live in Sanity.')
  console.log('  DERMAL, JUMISO, Dermafirm updated to korean-skincare category.')
  console.log('  All 4 /go/ redirects are active.')
  console.log('  Note: Dr.G coupon startDate is 2026-06-15 — surfaces on site from that date.')
  console.log('  Note: product images need to be added manually in Studio (Coupons → image field).')
}

main().catch(err => {
  console.error('\n[fatal]', err.message ?? err)
  process.exit(1)
})
