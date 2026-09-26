/**
 * Bing CTR pass (2026-09-26): new SERP titles (seo.metaTitle) and meta
 * descriptions for 5 high-impression / low-click posts. The on-page H1
 * (post.title) is unchanged.
 *
 *   npx tsx scripts/apply-bing-title-meta-2026-09-26.ts            # dry run
 *   npx tsx scripts/apply-bing-title-meta-2026-09-26.ts --execute  # snapshot seo, apply, ping IndexNow
 *   npx tsx scripts/apply-bing-title-meta-2026-09-26.ts --revert   # restore seo from the snapshot
 *
 * Each title/meta was checked against the page text before inclusion; see the
 * notes per entry for anything trimmed or held.
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

const REVERT_FILE = path.resolve('scripts/data/bing-title-meta-2026-09-26-revert.json')

const UPDATES: { slug: string; metaTitle?: string; metaDescription: string; note: string }[] = [
  {
    slug: 'best-at-home-skin-devices-2026',
    metaTitle: 'At-Home Skin Devices Compared: Cost, Results & What’s Worth It',
    metaDescription: 'Cold laser, microcurrent, or LED? We compare LYMA, NuFACE, CurrentBody and more on price, results, and which at-home skin device is actually worth buying.',
    note: 'As drafted — page covers all three technologies, the three brands, price, results and verdicts.',
  },
  {
    slug: 'canada-pet-care-review-2026',
    metaTitle: 'Is Canada Pet Care Legit? Honest Review of Prices, Safety & Shipping',
    metaDescription: 'Thinking of ordering from Canada Pet Care? What to know about pricing, product authenticity, shipping times, and how it compares to Chewy and your vet.',
    note: 'Meta trimmed (160 → 151 chars): "other online pet pharmacies" → "Chewy and your vet", which is what the comparison table covers.',
  },
  {
    slug: 'psyllium-husk-dosage',
    metaTitle: 'How Much Psyllium Husk to Take (and When): A Simple Dosage Guide',
    metaDescription: 'How to take psyllium husk powder or capsules: typical daily amounts, the best time of day, how much water to use, and common mistakes that cause bloating.',
    note: 'As drafted — amounts, timing, water, and too-much/too-fast/low-water bloating mistakes are all covered.',
  },
  {
    slug: 'owala-vs-stanley',
    metaTitle: 'Owala vs Stanley: Which Water Bottle Wins for Everyday Use?',
    metaDescription: 'Owala FreeSip or Stanley Quencher? We compare lids, carrying, cleaning, and fit in cupholders and bags to help you pick the right everyday water bottle.',
    note: 'Meta trimmed: dropped "leaks" — the page only relays that both brands call their lids leakproof; it does not compare leaking.',
  },
  {
    slug: 'biodance-eye-patches-review',
    // Title held: "Do They Work" promises a verdict the page explicitly doesn't give
    // ("We haven't tried the patches ourselves"). Existing title kept pending James.
    metaDescription: 'An honest look at BIODANCE Collagen Peptide Eye Patches: how to use them, what results to expect, cost per use, and who they’re best for.',
    note: 'Meta as drafted. Title HELD (see comment).',
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

  const docs = await client.fetch<Doc[]>(
    `*[_type == "post" && slug.current in $s && !(_id in path("drafts.**"))]{ _id, _rev, "slug": slug.current, seo, "draft": count(*[_id == "drafts." + ^._id]) }`,
    { s: UPDATES.map((u) => u.slug) }
  )
  for (const u of UPDATES) {
    const d = docs.find((x) => x.slug === u.slug)
    const problem = !d ? 'not found' : d.draft ? 'has an unpublished draft' : u.metaDescription.length > 155 ? `meta ${u.metaDescription.length} chars` : ''
    console.log(`${problem ? 'SKIP' : 'ok  '} ${u.slug}  meta=${u.metaDescription.length}${u.metaTitle ? ` title=${u.metaTitle.length}` : ' title=held'}${problem ? `  (${problem})` : ''}\n       ${u.note}`)
    if (problem) throw new Error(`Refusing to run with a failed check: ${u.slug}`)
  }
  if (!process.argv.includes('--execute')) { console.log('DRY RUN — nothing written'); return }

  mkdirSync(path.dirname(REVERT_FILE), { recursive: true })
  if (existsSync(REVERT_FILE)) throw new Error(`${REVERT_FILE} exists — refusing to overwrite an earlier revert record`)
  writeFileSync(REVERT_FILE, JSON.stringify(docs, null, 1))

  const tx = client.transaction()
  for (const u of UPDATES) {
    const d = docs.find((x) => x.slug === u.slug)!
    tx.patch(d._id, (p) => p.ifRevisionId(d._rev).set({
      'seo.metaDescription': u.metaDescription,
      ...(u.metaTitle ? { 'seo.metaTitle': u.metaTitle } : {}),
    }))
  }
  await tx.commit()
  console.log(`applied to ${UPDATES.length} posts; revert record: ${REVERT_FILE}`)

  // Direct IndexNow submission (the Sanity webhook may also ping; duplicates are harmless).
  await pingIndexNow(UPDATES.map((u) => `/blog/${u.slug}`))
}

main().catch((e) => { console.error(e); process.exit(1) })
