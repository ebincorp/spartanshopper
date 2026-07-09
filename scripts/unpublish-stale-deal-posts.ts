/**
 * Unpublish (archive) stale "deals this week" posts whose entire premise is dead
 * (audit 2026-07-08: nearly all items reverted to full price post-Prime-Day).
 *
 * The site's Sanity client reads with the `raw` perspective, so moving a post to
 * a Sanity draft would NOT hide it. Instead we retype the doc from `post` ->
 * `archivedPost`, preserving _id and all content. It then no longer matches the
 * public `*[_type=="post"]` queries (list, slug page, sitemap, search) and the
 * slug page 404s. Fully reversible: set _type back to `post`.
 *
 *   npx tsx scripts/unpublish-stale-deal-posts.ts --dry
 *   npx tsx scripts/unpublish-stale-deal-posts.ts            # apply
 *   npx tsx scripts/unpublish-stale-deal-posts.ts --restore  # flip archivedPost -> post
 */
import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@sanity/client'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const DRY = process.argv.includes('--dry')
const RESTORE = process.argv.includes('--restore')
const SLUGS = ['best-amazon-deals-this-week-2026', 'best-amazon-deals-this-week-june-2026']
const REASON = 'Prime-Day deal premise stale — ~20/22 and 3/4 items reverted to full price (audit 2026-07-08). Content preserved; pulled from public view pending retire/replace decision.'

// raw perspective so we can see + mutate the published docs regardless of drafts
const raw = createClient({ projectId: 'eohdr7jw', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN, perspective: 'raw' })

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

    if (DRY) { console.log(`     would set _type: ${fromType} -> ${toType}\n`); continue }

    // _type is immutable on a given _id, so we create a new doc of the target type
    // (preserving content) and delete the old one — atomically.
    const { _rev, _createdAt, _updatedAt, ...rest } = doc
    let next: Record<string, unknown>
    if (RESTORE) {
      const targetId = (doc.originalId as string) || doc._id.replace(/^archived-/, '')
      const { originalId, originalType, archivedAt, archivedReason, ...clean } = rest
      next = { ...clean, _id: targetId, _type: 'post' }
    } else {
      next = { ...rest, _id: `archived-${doc._id}`, _type: 'archivedPost', originalId: doc._id, originalType: 'post', archivedAt: new Date().toISOString(), archivedReason: REASON }
    }
    await raw.transaction().createOrReplace(next as never).delete(doc._id).commit()
    console.log(`     ✓ ${RESTORE ? 'restored to post' : 'archived'} — new _id=${next._id} (content preserved, old _id ${doc._id} removed)\n`)
  }

  // Verify against the exact public query the site uses.
  console.log('— Verify (public query *[_type=="post" && slug.current==$slug][0]) —')
  for (const slug of SLUGS) {
    const stillPost = await raw.fetch(`*[_type=="post" && slug.current==$slug][0]{_id, "bodyLen": count(body)}`, { slug })
    const archived = await raw.fetch(`*[_type=="archivedPost" && slug.current==$slug][0]{_id, originalId, "bodyLen": count(body)}`, { slug })
    console.log(`  ${slug}:`)
    console.log(`     as post        : ${stillPost ? `${stillPost._id} (VISIBLE)` : 'null → 404 (hidden)'}`)
    console.log(`     as archivedPost: ${archived ? `${archived._id} (originalId ${archived.originalId}), ${archived.bodyLen} blocks preserved` : 'none'}`)
  }
})().catch((e) => { console.error(e); process.exit(1) })
