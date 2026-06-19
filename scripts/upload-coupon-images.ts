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

// filename must match the affiliate link slug exactly, e.g. luffwell-dog-runner.jpg → slug luffwell-dog-runner
// fallbackId: use when slug.current doesn't match (legacy documents with auto-generated slugs)
const images: Array<{ filename: string; couponSlug: string; fallbackId?: string }> = [
  { filename: 'luffwell-dog-runner.jpg',         couponSlug: 'luffwell-dog-runner-coupon' },
  { filename: 'libbipaw-elevated-dog-bed.jpg',   couponSlug: 'libbipaw-elevated-dog-bed-coupon' },
  { filename: 'drg-brightening-peeling-gel.jpg', couponSlug: 'drg-brightening-peeling-gel-coupon' },
  { filename: 'dermal-sheet-mask.jpg',           couponSlug: 'dermal-sheet-mask-coupon',          fallbackId: 'coupon-dermal-korean-sheet-mask' },
  { filename: 'jumiso-niacinamide-serum.webp',   couponSlug: 'jumiso-niacinamide-serum-coupon',   fallbackId: 'coupon-jumiso-niacinamide-serum' },
  { filename: 'dermafirm-bakuchiol-serum.webp',  couponSlug: 'dermafirm-bakuchiol-serum-coupon',  fallbackId: 'coupon-dermafirm-bakuchiol-serum' },
  { filename: 'modari-tire-inflator.jpg',        couponSlug: 'modari-tire-inflator-coupon' },
  { filename: 'reidea-candle-lighter.jpg',       couponSlug: 'reidea-candle-lighter-coupon' },
  { filename: 'megelin-led-light-therapy-mask.jpg', couponSlug: 'megelin-led-light-therapy-mask-coupon' },
  { filename: 'budget-pet-care-summer12.webp',      couponSlug: 'budget-pet-care-summer12-coupon' },
  { filename: 'switchbot-15-off.webp',              couponSlug: 'switchbot-15-off-coupon' },
]

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  SpartanShopper — Upload Coupon Images')
  console.log('═══════════════════════════════════════════════════════════\n')

  for (const { filename, couponSlug, fallbackId } of images) {
    const filePath = path.resolve(process.cwd(), 'public', filename)
    const ext = path.extname(filename).slice(1).toLowerCase()
    const contentType = ext === 'webp' ? 'image/webp' : 'image/jpeg'

    process.stdout.write(`  [${filename}]\n`)

    if (!fs.existsSync(filePath)) {
      console.log(`    ✗ File not found: ${filePath}`)
      continue
    }

    // Upload asset
    process.stdout.write('    Uploading to Sanity… ')
    let assetId: string
    try {
      const buffer = fs.readFileSync(filePath)
      const asset = await client.assets.upload('image', buffer, { filename, contentType })
      assetId = asset._id
      console.log(`✓  Asset ID: ${assetId}`)
    } catch (err) {
      console.log(`✗  Upload failed: ${(err as Error).message}`)
      continue
    }

    // Find coupon by slug; fall back to known _id for legacy documents
    process.stdout.write(`    Finding coupon "${couponSlug}"… `)
    let docId: string | null = null

    const bySlug = await client.fetch<{ _id: string } | null>(
      `*[_type == "coupon" && slug.current == $slug][0]{_id}`,
      { slug: couponSlug }
    )
    if (bySlug) {
      docId = bySlug._id
      console.log(`✓  Document: ${docId} (by slug)`)
    } else if (fallbackId) {
      docId = fallbackId
      console.log(`✓  Document: ${docId} (fallback _id)`)
    } else {
      console.log(`✗  Coupon not found`)
      continue
    }

    // Patch image field
    process.stdout.write('    Patching image field… ')
    try {
      await client.patch(docId).set({
        image: { _type: 'image', asset: { _type: 'reference', _ref: assetId } },
      }).commit()
      console.log('✓')
    } catch (err) {
      console.log(`✗  Patch failed: ${(err as Error).message}`)
    }

    console.log()
  }

  console.log('── Done ─────────────────────────────────────────────────────')
  console.log('  Verify images in Sanity Studio: Coupons → image field.')
}

main().catch(err => {
  console.error('\n[fatal]', err.message ?? err)
  process.exit(1)
})
