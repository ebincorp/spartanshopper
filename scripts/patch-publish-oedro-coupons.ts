import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { createClient } from '@sanity/client'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token:     process.env.SANITY_API_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn:    false,
})

async function uploadImage(filename: string): Promise<string> {
  const filePath = path.resolve(process.cwd(), 'public', filename)
  if (!fs.existsSync(filePath)) throw new Error(`Image not found: ${filePath}`)
  const ext = path.extname(filename).slice(1).toLowerCase()
  const contentType = ext === 'webp' ? 'image/webp' : 'image/jpeg'
  const buffer = fs.readFileSync(filePath)
  const asset = await client.assets.upload('image', buffer, { filename, contentType })
  return asset._id
}

async function publishDraft(draftId: string): Promise<string> {
  const draft = await client.getDocument(draftId)
  if (!draft) throw new Error(`Draft not found: ${draftId}`)
  const { _id, _rev, ...content } = draft as Record<string, unknown>
  const publishedId = draftId.replace('drafts.', '')
  await client.transaction()
    .createOrReplace({ ...content, _id: publishedId } as Parameters<typeof client.createOrReplace>[0])
    .delete(draftId)
    .commit()
  return publishedId
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  SpartanShopper — Patch, Publish + Images')
  console.log('  Oedro Coupons (OEAFF20 · TONNEAU30 · FORKS10)')
  console.log('═══════════════════════════════════════════════════════════\n')

  // ── Find drafts by code ───────────────────────────────────────────────────
  const docs = await client.fetch<Array<{ _id: string; code: string }>>(
    `*[_type == "coupon" && code in ["OEAFF20", "TONNEAU30", "FORKS10"]]{_id, code}`
  )
  const find = (code: string) => {
    const doc = docs.find(d => d.code === code && d._id.startsWith('drafts.'))
    if (!doc) throw new Error(`Draft not found for code ${code}`)
    return doc
  }
  const oeaff20Draft  = find('OEAFF20')
  const tonneau30Draft = find('TONNEAU30')
  const forks10Draft  = find('FORKS10')

  // ── Upload images (correct extensions: oeaff20=.webp, others=.jpg) ────────
  process.stdout.write('  Uploading oedro-oeaff20.webp… ')
  const oeaff20AssetId = await uploadImage('oedro-oeaff20.webp')
  console.log(`✓  ${oeaff20AssetId}`)

  process.stdout.write('  Uploading oedro-tonneau30.jpg… ')
  const tonneau30AssetId = await uploadImage('oedro-tonneau30.jpg')
  console.log(`✓  ${tonneau30AssetId}`)

  process.stdout.write('  Uploading oedro-forks10.jpg… ')
  const forks10AssetId = await uploadImage('oedro-forks10.jpg')
  console.log(`✓  ${forks10AssetId}\n`)

  // ── Patch + publish OEAFF20 ───────────────────────────────────────────────
  process.stdout.write(`  Patching OEAFF20 (${oeaff20Draft._id})… `)
  await client.patch(oeaff20Draft._id).set({
    title:        'Oedro — 20% Off Sitewide with Code',
    slug:         { _type: 'slug', current: 'oedro-20-off-coupon' },
    affiliateSlug: { _type: 'slug', current: 'oedro-oeaff20' },
    active:       true,
    verified:     true,
    category:     'automotive',
    tags:         ['oedro', 'truck accessories', 'floor mats', 'tonneau cover', 'running boards', 'amazon coupon', 'automotive'],
    description:  'Save 20% off sitewide at Oedro on floor mats, tonneau covers, running boards, pallet forks, LED light bars, and more. Visit the page for the code.',
    whyWeLikeThis: "Oedro has quietly become one of the go-to brands for truck and SUV owners who want quality aftermarket accessories without the premium price tag. Their catalog covers everything from custom-fit TPE floor mats to hard tonneau covers, running boards, underseat storage, and even heavy-duty pallet forks — all backed by a 1-year warranty and free shipping. A 20% sitewide discount is rare from Oedro and stacks nicely with already-competitive pricing. Whether you're outfitting a work truck or weekend adventure rig, this is a solid opportunity to grab multiple items in one order and save across the board.",
    image: {
      _type: 'image',
      asset: { _type: 'reference', _ref: oeaff20AssetId },
      alt: 'Oedro running boards on blue truck — 20% off sitewide with coupon code',
    },
  }).commit()
  console.log('✓')

  process.stdout.write('  Publishing OEAFF20… ')
  const oeaff20Id = await publishDraft(oeaff20Draft._id)
  console.log(`✓  ${oeaff20Id}\n`)

  // ── Patch + publish TONNEAU30 ─────────────────────────────────────────────
  process.stdout.write(`  Patching TONNEAU30 (${tonneau30Draft._id})… `)
  await client.patch(tonneau30Draft._id).set({
    title:        'Oedro Tonneau Cover — $30 Off with Code',
    slug:         { _type: 'slug', current: 'oedro-tonneau-cover-coupon' },
    affiliateSlug: { _type: 'slug', current: 'oedro-tonneau30' },
    active:       true,
    verified:     true,
    category:     'automotive',
    tags:         ['oedro', 'tonneau cover', 'truck bed cover', 'f-150', 'silverado', 'tacoma', 'automotive'],
    description:  'Save $30 on Oedro tonneau covers for your truck. Compatible with popular models including Ford F-150, Chevy Silverado, Toyota Tacoma, and Dodge Ram. Visit the page for the code.',
    whyWeLikeThis: "Oedro makes some of the best-value tonneau covers on the market, available in soft tri-fold, hard tri-fold, and roll-up styles to suit any truck owner's needs. Their covers are custom-fit for a clean, factory look and come with all hardware included for a straightforward install — no drilling required on most models. The weatherproof seal keeps your truck bed dry and your cargo protected. With free shipping on all orders and a 30-day return policy, it's a low-risk upgrade that pays for itself quickly in fuel savings alone. This $30 discount makes an already affordable cover even easier to justify.",
    image: {
      _type: 'image',
      asset: { _type: 'reference', _ref: tonneau30AssetId },
      alt: 'Red truck with Oedro tonneau cover — save $30 with coupon code TONNEAU30',
    },
  }).commit()
  console.log('✓')

  process.stdout.write('  Publishing TONNEAU30… ')
  const tonneau30Id = await publishDraft(tonneau30Draft._id)
  console.log(`✓  ${tonneau30Id}\n`)

  // ── Patch + publish FORKS10 ───────────────────────────────────────────────
  process.stdout.write(`  Patching FORKS10 (${forks10Draft._id})… `)
  await client.patch(forks10Draft._id).set({
    title:        'Oedro Pallet Forks — 10% Off with Code',
    slug:         { _type: 'slug', current: 'oedro-pallet-forks-coupon' },
    affiliateSlug: { _type: 'slug', current: 'oedro-forks10' },
    active:       true,
    verified:     true,
    category:     'automotive',
    tags:         ['oedro', 'pallet forks', 'tractor', 'skid steer', 'farm equipment', 'automotive'],
    description:  'Save 10% on Oedro pallet forks for tractors and skid steers. Built for farm, ranch, and construction use. Visit the page for the code.',
    whyWeLikeThis: "Oedro's pallet forks are a standout product for anyone who needs serious lifting capability without paying commercial equipment prices. Built from heavy-duty steel and designed to fit standard tractor and skid steer quick-attach systems, they're a popular choice for farmers, ranchers, and small construction operators. With free shipping on all orders and a 1-year warranty, Oedro backs their equipment the way a working tool should be backed. The 10% discount brings an already competitive price down further, making this a smart buy for anyone looking to add versatile material-handling capability to their equipment lineup without a major capital outlay.",
    image: {
      _type: 'image',
      asset: { _type: 'reference', _ref: forks10AssetId },
      alt: 'Oedro pallet forks on skid steer — 10% off with coupon code FORKS10',
    },
  }).commit()
  console.log('✓')

  process.stdout.write('  Publishing FORKS10… ')
  const forks10Id = await publishDraft(forks10Draft._id)
  console.log(`✓  ${forks10Id}\n`)

  console.log('── Done ────────────────────────────────────────────────────')
  console.log('  All 3 Oedro coupons patched, imaged, and published.')
  console.log(`  OEAFF20  → ${oeaff20Id}`)
  console.log(`  TONNEAU30 → ${tonneau30Id}`)
  console.log(`  FORKS10  → ${forks10Id}`)
}

main().catch(err => {
  console.error('\n[fatal]', err.message ?? err)
  process.exit(1)
})
