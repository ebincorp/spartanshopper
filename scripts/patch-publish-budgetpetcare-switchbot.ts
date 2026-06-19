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
  console.log('  Budget Pet Care + SwitchBot')
  console.log('═══════════════════════════════════════════════════════════\n')

  const docs = await client.fetch<Array<{ _id: string; code: string }>>(
    `*[_type == "coupon" && code in ["SUMMER12", "SWITCHBOT20OFF"]]{_id, code}`
  )

  const bpcDraft = docs.find(d => d.code === 'SUMMER12' && d._id.startsWith('drafts.'))
  const sbDraft  = docs.find(d => d.code === 'SWITCHBOT20OFF' && d._id.startsWith('drafts.'))

  if (!bpcDraft) throw new Error('Budget Pet Care draft not found')
  if (!sbDraft)  throw new Error('SwitchBot draft not found')

  // ── Patch Budget Pet Care ─────────────────────────────────────────────────
  process.stdout.write(`  Patching Budget Pet Care (${bpcDraft._id})… `)
  await client.patch(bpcDraft._id).set({
    title:        'Budget Pet Care — 12% Off Sitewide with Code',
    slug:         { _type: 'slug', current: 'budget-pet-care-summer12-coupon' },
    affiliateSlug: { _type: 'slug', current: 'budget-pet-care-summer12' },
    active:       true,
    verified:     true,
    tags:         ['budget pet care', 'flea treatment', 'tick treatment', 'nexgard', 'simparica', 'revolution plus', 'pet care'],
    whyWeLikeThis: "Budget Pet Care is one of the most trusted online retailers for name-brand pet medications at prices well below what you'd pay at the vet or a big box store. Their catalog includes heavy hitters like Nexgard, Simparica Trio, and Revolution Plus — all vet-recommended treatments that protect dogs and cats from fleas, ticks, heartworm, and more. The 12% discount stacks nicely with already-competitive pricing, and free shipping sitewide means no minimum order threshold to hit. If you're buying monthly preventatives for one or more pets, this is an easy way to cut your annual pet care bill without sacrificing quality or efficacy.",
  }).commit()
  console.log('✓')

  // ── Publish Budget Pet Care ───────────────────────────────────────────────
  process.stdout.write('  Publishing Budget Pet Care… ')
  const bpcId = await publishDraft(bpcDraft._id)
  console.log(`✓\n  Published ID: ${bpcId}\n`)

  // ── Patch SwitchBot ───────────────────────────────────────────────────────
  process.stdout.write(`  Patching SwitchBot (${sbDraft._id})… `)
  await client.patch(sbDraft._id).set({
    title:        'SwitchBot — 15% Off Sitewide with Code',
    slug:         { _type: 'slug', current: 'switchbot-15-off-coupon' },
    affiliateSlug: { _type: 'slug', current: 'switchbot-15-off' },
    active:       true,
    verified:     true,
    tags:         ['switchbot', 'smart home', 'smart lock', 'home automation', 'alexa', 'google home', 'matter'],
    whyWeLikeThis: "SwitchBot has become one of the most popular smart home brands for good reason — their devices work across Alexa, Google Home, and Apple Home with no subscription fees required. Their lineup covers everything from curtain robots and smart locks to hubs, plugs, and sensors, all designed to automate your home without a full rewire. The Hub 2 alone bridges 50+ Bluetooth devices to Wi-Fi and doubles as a temperature and humidity sensor. A 15% sitewide discount on gear that regularly runs $30–$100 per device adds up fast when you're building out a full setup. Long expiry makes this a reliable code to bookmark for whenever you're ready to upgrade.",
  }).commit()
  console.log('✓')

  // ── Publish SwitchBot ─────────────────────────────────────────────────────
  process.stdout.write('  Publishing SwitchBot… ')
  const sbId = await publishDraft(sbDraft._id)
  console.log(`✓\n  Published ID: ${sbId}\n`)

  // ── Affiliate links ────────────────────────────────────────────────────────
  const slugsToCreate = [
    {
      slug:        'budget-pet-care-summer12',
      title:       'Budget Pet Care — 12% Off (SUMMER12)',
      destination: 'https://www.dpbolvw.net/click-101726308-17079095',
    },
    {
      slug:        'switchbot-15-off',
      title:       'SwitchBot — 15% Off Sitewide',
      destination: 'https://www.anrdoezrs.net/click-101726308-15310710',
    },
  ]

  const existing = await client.fetch<Array<{ slug: string }>>(
    `*[_type == "affiliateLink" && slug.current in ${JSON.stringify(slugsToCreate.map(s => s.slug))}]{ "slug": slug.current }`
  )
  const taken = new Set(existing.map(l => l.slug))

  for (const { slug, title, destination } of slugsToCreate) {
    if (taken.has(slug)) {
      console.log(`  /go/${slug} already exists — skipped`)
    } else {
      process.stdout.write(`  Creating /go/${slug}… `)
      const al = await client.create({
        _type: 'affiliateLink',
        title,
        slug:  { _type: 'slug', current: slug },
        destination,
      })
      console.log(`✓  ID: ${al._id}`)
    }
  }

  console.log('\n── Done ────────────────────────────────────────────────────')
  console.log('  Both coupons published. /go/ redirects active.')
  console.log('  Next: run npx tsx scripts/upload-coupon-images.ts')
}

main().catch(err => {
  console.error('\n[fatal]', err.message ?? err)
  process.exit(1)
})
