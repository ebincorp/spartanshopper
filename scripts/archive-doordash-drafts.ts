/**
 * Archive the two DRAFT-ONLY DoorDash sweepstakes posts that were being served
 * publicly for ~7 weeks via the `raw` Sanity perspective without ever being
 * formally published or reviewed. Same reversible method as the stale deal posts:
 * copy content into an `archivedPost` doc and delete the original, so it stops
 * matching the public `*[_type=="post"]` queries. Nothing is lost.
 *
 *   npx tsx scripts/archive-doordash-drafts.ts --dry
 *   npx tsx scripts/archive-doordash-drafts.ts            # apply
 *   npx tsx scripts/archive-doordash-drafts.ts --restore  # back to prior DRAFT state
 *
 * Restore recreates the doc at its original id (`drafts.<uuid>`) as _type=post,
 * i.e. exactly the draft-only state it was in before.
 */
import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@sanity/client'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
const DRY = process.argv.includes('--dry')
const RESTORE = process.argv.includes('--restore')
const SLUGS = ['free-doordash-gift-card', 'win-doordash-gift-card']
const REASON = 'Draft-only DoorDash sweepstakes post served publicly ~7 weeks via raw perspective without review. Pulled 2026-07-08 pending publish-or-retire content decision. Restorable to prior draft state via originalId.'

const raw = createClient({ projectId: 'eohdr7jw', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN, perspective: 'raw' })

;(async () => {
  console.log(`${DRY ? 'DRY-RUN' : 'APPLY'} — ${RESTORE ? 'RESTORE' : 'ARCHIVE'} DoorDash drafts\n`)

  for (const slug of SLUGS) {
    const doc = RESTORE
      ? await raw.fetch(`*[_type=="archivedPost" && slug.current==$slug][0]`, { slug })
      : await raw.fetch(`*[_id in path("drafts.**") && _type=="post" && slug.current==$slug][0]`, { slug })
    if (!doc) { console.log(`  ⚠ ${slug}: no ${RESTORE ? 'archivedPost' : 'draft post'} found — skipped`); continue }

    const bodyLen = Array.isArray(doc.body) ? doc.body.length : 0
    console.log(`  ${slug}\n     _id=${doc._id}  body=${bodyLen} blocks  title="${(doc.title || '').slice(0, 60)}"`)
    if (DRY) { console.log(`     would ${RESTORE ? `restore to ${doc.originalId}` : 'archive'}\n`); continue }

    const { _rev, _createdAt, _updatedAt, ...rest } = doc
    let next: Record<string, unknown>
    if (RESTORE) {
      const targetId = (doc.originalId as string) || doc._id.replace(/^archived-/, 'drafts.')
      const { originalId, originalType, archivedAt, archivedReason, ...clean } = rest
      next = { ...clean, _id: targetId, _type: 'post' }
    } else {
      // clean archived id: strip the drafts. prefix, prepend archived-
      const cleanId = 'archived-' + doc._id.replace(/^drafts\./, '')
      next = { ...rest, _id: cleanId, _type: 'archivedPost', originalId: doc._id, originalType: 'post', archivedAt: new Date().toISOString(), archivedReason: REASON }
    }
    await raw.transaction().createOrReplace(next as never).delete(doc._id).commit()
    console.log(`     ✓ ${RESTORE ? 'restored to' : 'archived as'} ${next._id} (content preserved, ${doc._id} removed)\n`)
  }

  console.log('— Verify (public query *[_type=="post" && slug.current==$slug][0]) —')
  for (const slug of SLUGS) {
    const asPost = await raw.fetch(`*[_type=="post" && slug.current==$slug][0]{_id}`, { slug })
    const archived = await raw.fetch(`*[_type=="archivedPost" && slug.current==$slug][0]{_id, originalId, "bodyLen": count(body)}`, { slug })
    console.log(`  ${slug}:`)
    console.log(`     as post        : ${asPost ? `${asPost._id} (VISIBLE)` : 'null → 404 (hidden)'}`)
    console.log(`     as archivedPost: ${archived ? `${archived._id} (originalId ${archived.originalId}), ${archived.bodyLen} blocks` : 'none'}`)
  }
})().catch((e) => { console.error(e); process.exit(1) })
