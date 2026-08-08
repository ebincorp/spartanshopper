/**
 * Unpublish (archive) 3 time-bound "deals" posts whose entire premise is dead
 * (audit 2026-08-07):
 *
 * 1. amazon-promo-codes-beauty-grooming-june-2026 — all 4 promo codes carry
 *    explicit expiry dates in the body (June 6/21/30) that have all passed;
 *    the codes are unrecoverable (Amazon promo codes don't renew).
 * 2. beauty-deals-before-prime-day-june-2026 — entire premise ("Prime Day
 *    starts Tuesday", "prices live as of this morning") is a pre-Prime-Day
 *    snapshot; Prime Day 2026 is long over and none of the 7 items carry a
 *    Sanity coupon/deal doc to re-verify against.
 * 3. amazon-clippable-coupon-deals-july-2026 — checked all 9 ASINs live via
 *    Creators API (2026-08-07): 2/9 unavailable (SenCre ice maker, GrowthWing
 *    AC), 4/9 no longer at the advertised coupon price (45dB earplugs $18.49
 *    -> $29.99, Bmasse purifier $89.98 -> $109.99, MANSPOT trimmer $32.99 ->
 *    $39.99, BougeRV fridge $156.99 -> $165.99). Only 3/9 (ENHULK vacuum,
 *    HOSHANHO knives, Jasion e-bike) are still at or below the advertised
 *    price — a minority, and none of them show live coupon-clip pricing
 *    specifically (just current price), so the "clippable coupon" premise
 *    itself can't be salvaged from 3 items.
 *
 * Same retype-to-archivedPost pattern as scripts/unpublish-stale-deal-posts.ts
 * (the site's public client reads the `published` perspective, but archiving
 * by retype keeps this reversible and out of every `_type=="post"` query,
 * incl. sitemap). 301 redirects to the closest evergreen page live in
 * next.config.mjs.
 *
 *   npx tsx scripts/unpublish-stale-time-bound-deals-aug2026.ts --dry
 *   npx tsx scripts/unpublish-stale-time-bound-deals-aug2026.ts            # apply
 *   npx tsx scripts/unpublish-stale-time-bound-deals-aug2026.ts --restore  # flip back
 */
import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@sanity/client'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const DRY = process.argv.includes('--dry')
const RESTORE = process.argv.includes('--restore')

const SLUGS = [
  'amazon-promo-codes-beauty-grooming-june-2026',
  'beauty-deals-before-prime-day-june-2026',
  'amazon-clippable-coupon-deals-july-2026',
]

const REASON =
  'Time-bound deals/coupons post, all offers expired or no longer live as of the 2026-08-07 audit. Content preserved; see scripts/unpublish-stale-time-bound-deals-aug2026.ts header for per-post verification detail.'

const raw = createClient({
  projectId: 'eohdr7jw',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  perspective: 'raw',
})

;(async () => {
  const fromType = RESTORE ? 'archivedPost' : 'post'
  const toType = RESTORE ? 'post' : 'archivedPost'
  console.log(`${DRY ? 'DRY-RUN' : 'APPLY'} — ${RESTORE ? 'RESTORE' : 'ARCHIVE'} (${fromType} -> ${toType})\n`)

  for (const slug of SLUGS) {
    const doc = await raw.fetch(`*[_type==$fromType && slug.current==$slug][0]`, { slug, fromType })
    if (!doc) {
      console.log(`  ⚠ ${slug}: no ${fromType} doc found — skipped`)
      continue
    }
    const bodyLen = Array.isArray(doc.body) ? doc.body.length : 0
    console.log(`  ${slug}`)
    console.log(`     _id=${doc._id}  body blocks=${bodyLen}  title="${doc.title?.slice(0, 60)}"`)

    if (DRY) {
      console.log(`     would set _type: ${fromType} -> ${toType}\n`)
      continue
    }

    const { _rev, _createdAt, _updatedAt, ...rest } = doc
    let next: Record<string, unknown>
    if (RESTORE) {
      const targetId = (doc.originalId as string) || doc._id.replace(/^archived-/, '')
      const { originalId, originalType, archivedAt, archivedReason, ...clean } = rest
      next = { ...clean, _id: targetId, _type: 'post' }
    } else {
      next = {
        ...rest,
        _id: `archived-${doc._id}`,
        _type: 'archivedPost',
        originalId: doc._id,
        originalType: 'post',
        archivedAt: new Date().toISOString(),
        archivedReason: REASON,
      }
    }
    await raw.transaction().createOrReplace(next as never).delete(doc._id).commit()
    console.log(`     ✓ ${RESTORE ? 'restored to post' : 'archived'} — new _id=${next._id}\n`)
  }

  console.log('— Verify (public query *[_type=="post" && slug.current==$slug][0]) —')
  for (const slug of SLUGS) {
    const stillPost = await raw.fetch(`*[_type=="post" && slug.current==$slug][0]{_id, "bodyLen": count(body)}`, { slug })
    const archived = await raw.fetch(`*[_type=="archivedPost" && slug.current==$slug][0]{_id, originalId, "bodyLen": count(body)}`, { slug })
    console.log(`  ${slug}:`)
    console.log(`     as post        : ${stillPost ? `${stillPost._id} (VISIBLE)` : 'null → 404 (hidden)'}`)
    console.log(`     as archivedPost: ${archived ? `${archived._id} (originalId ${archived.originalId}), ${archived.bodyLen} blocks preserved` : 'none'}`)
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
