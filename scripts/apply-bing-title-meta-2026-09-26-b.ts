/**
 * Bing CTR pass, batch B (2026-09-26): seo.metaTitle + metaDescription for 6
 * posts, plus restoring biodance-eye-patches-review's original meta (it was
 * changed in batch A before being marked "performing — do not touch").
 * Already live from batch A and intentionally not re-applied: owala-vs-stanley,
 * canada-pet-care-review-2026, best-at-home-skin-devices-2026.
 *
 *   npx tsx scripts/apply-bing-title-meta-2026-09-26-b.ts            # dry run
 *   npx tsx scripts/apply-bing-title-meta-2026-09-26-b.ts --execute  # snapshot seo, apply, ping IndexNow
 *   npx tsx scripts/apply-bing-title-meta-2026-09-26-b.ts --revert   # restore seo from the snapshot
 */
import dotenv from 'dotenv'
import path from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { createClient } from '@sanity/client'
import { pingIndexNow } from '../lib/indexnow'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'eohdr7jw',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token: process.env.SANITY_API_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const REVERT_FILE = path.resolve('scripts/data/bing-title-meta-2026-09-26-b-revert.json')
const BATCH_A_REVERT = path.resolve('scripts/data/bing-title-meta-2026-09-26-revert.json')

type Update = { slug: string; metaTitle?: string; metaDescription?: string; restoreFromBatchA?: boolean; note: string }

const UPDATES: Update[] = [
  {
    slug: 'psyllium-husk-how-to-use',
    metaTitle: 'How to Take Psyllium Husk Powder (or Capsules) Without Bloating',
    metaDescription: 'How to take psyllium husk: mixing the powder, how much water to use, the best time of day, and the mistakes that cause bloating or make it stop working.',
    note: 'Meta tightened 166 → 152 chars ("the right way" cut); all topics kept.',
  },
  {
    slug: 'psyllium-husk-dosage',
    metaTitle: 'Psyllium Husk Dosage: How Much to Take Per Day (and When)',
    metaDescription: 'How much psyllium husk to take per day, how to start low and build up, when to take it, and how dosage differs between powder and capsules.',
    note: 'As drafted; replaces the batch A version.',
  },
  {
    slug: 'irestore-hair-wellness-review',
    metaTitle: 'iRestore Review: Essential vs Professional vs Elite, Which to Buy?',
    metaDescription: 'Comparing iRestore’s Essential, Professional and Elite laser caps: key differences, what the clinical evidence shows, and which model is worth the money.',
    note: 'Meta tightened 165 → 153 chars ("hair growth" cut); all topics kept.',
  },
  {
    slug: 'owala-freesip-insulated-stainless-steel-water-bottle',
    metaTitle: 'Owala FreeSip Review: Which Size to Get (24, 32 or 40 oz)?',
    metaDescription: 'How the Owala FreeSip spout and lid work, which size fits your bag and cupholder, how to clean it, and the downsides to know before buying.',
    note: 'As drafted.',
  },
  {
    slug: 'biodance-bio-collagen-real-deep-mask-review',
    metaTitle: 'BIODANCE Bio-Collagen Mask Review: Does It Actually Work?',
    metaDescription: 'An honest look at the BIODANCE Bio-Collagen Real Deep Mask: what it does, how to use it overnight, what results to expect, and who it’s best for.',
    note: 'As drafted. Removes the unsupported "We tested it" claim from the old meta (no testing language anywhere on the page).',
  },
  {
    slug: 'best-dyson-hair-tools-2026',
    metaTitle: 'Dyson Airwrap vs Supersonic vs Airstrait (and Shark Alternatives)',
    metaDescription: 'Dyson Airwrap, Supersonic Nural and Airstrait vs Shark FlexStyle and SpeedStyle: what each does best, and which hair tool is actually worth the money.',
    note: 'Meta tightened 161 → 150 chars ("compared with" → "vs"); all topics kept.',
  },
  {
    slug: 'biodance-eye-patches-review',
    restoreFromBatchA: true,
    note: 'RESTORE original seo (pre-batch-A) — page marked "performing, do not touch".',
  },
]

type Doc = { _id: string; _rev: string; slug: string; seo: Record<string, unknown> | null; draft: number }

async function main() {
  if (process.argv.includes('--revert')) {
    const saved: Doc[] = JSON.parse(readFileSync(REVERT_FILE, 'utf8'))
    const tx = client.transaction()
    for (const d of saved) tx.patch(d._id, (p) => (d.seo ? p.set({ seo: d.seo }) : p.unset(['seo'])))
    await tx.commit()
    console.log(`Reverted seo on ${saved.length} posts`)
    return
  }

  const batchA: Doc[] = JSON.parse(readFileSync(BATCH_A_REVERT, 'utf8'))
  const docs = await client.fetch<Doc[]>(
    `*[_type == "post" && slug.current in $s && !(_id in path("drafts.**"))]{ _id, _rev, "slug": slug.current, seo, "draft": count(*[_id == "drafts." + ^._id]) }`,
    { s: UPDATES.map((u) => u.slug) }
  )
  for (const u of UPDATES) {
    const d = docs.find((x) => x.slug === u.slug)
    const original = u.restoreFromBatchA ? batchA.find((x) => x.slug === u.slug) : undefined
    const problem = !d ? 'not found'
      : d.draft ? 'has an unpublished draft'
      : u.restoreFromBatchA && !original ? 'no batch A snapshot to restore'
      : (u.metaDescription?.length ?? 0) > 155 ? `meta ${u.metaDescription!.length} chars` : ''
    const desc = u.restoreFromBatchA ? `restore → ${JSON.stringify(original?.seo)}` : `meta=${u.metaDescription!.length} title=${u.metaTitle!.length}`
    console.log(`${problem ? 'SKIP' : 'ok  '} ${u.slug}  ${desc}${problem ? `  (${problem})` : ''}\n       ${u.note}`)
    if (problem) throw new Error(`Refusing to run with a failed check: ${u.slug}`)
  }
  if (!process.argv.includes('--execute')) { console.log('DRY RUN — nothing written'); return }

  mkdirSync(path.dirname(REVERT_FILE), { recursive: true })
  if (existsSync(REVERT_FILE)) throw new Error(`${REVERT_FILE} exists — refusing to overwrite an earlier revert record`)
  writeFileSync(REVERT_FILE, JSON.stringify(docs, null, 1))

  const tx = client.transaction()
  for (const u of UPDATES) {
    const d = docs.find((x) => x.slug === u.slug)!
    if (u.restoreFromBatchA) {
      const original = batchA.find((x) => x.slug === u.slug)!
      tx.patch(d._id, (p) => (original.seo ? p.ifRevisionId(d._rev).set({ seo: original.seo }) : p.ifRevisionId(d._rev).unset(['seo'])))
    } else {
      tx.patch(d._id, (p) => p.ifRevisionId(d._rev).set({ 'seo.metaTitle': u.metaTitle, 'seo.metaDescription': u.metaDescription }))
    }
  }
  await tx.commit()
  console.log(`applied to ${UPDATES.length} posts; revert record: ${REVERT_FILE}`)
  await pingIndexNow(UPDATES.map((u) => `/blog/${u.slug}`))
}

main().catch((e) => { console.error(e); process.exit(1) })
