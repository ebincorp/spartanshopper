/**
 * Internal-linking batch 1 (approved 2026-09-26).
 *
 *   npx tsx scripts/apply-internal-links-batch1.ts            # dry run: validate every anchor, write nothing
 *   npx tsx scripts/apply-internal-links-batch1.ts --execute  # snapshot touched posts, then apply
 *   npx tsx scripts/apply-internal-links-batch1.ts --revert   # restore bodies from the snapshot
 *
 * Each link wraps a short phrase that already exists in the paragraph (no new
 * copy), except the one approved sentence appended to the luxury beauty article.
 * An anchor must occur exactly once, inside a single unlinked span, or that
 * edit is skipped. Writes are pinned to the revision read (ifRevisionId), so a
 * post edited in the meantime is skipped rather than overwritten.
 */
import dotenv from 'dotenv'
import path from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { createClient } from '@sanity/client'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'eohdr7jw',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token: process.env.SANITY_API_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const REVERT_FILE = path.resolve('scripts/data/internal-links-batch1-revert.json')
const BLOG = (slug: string) => `https://www.spartanshopper.com/blog/${slug}`
const k = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12)

type Link = { source: string; block: string; anchor: string; target: string }

const LINKS: Link[] = [
  { source: 'best-fda-cleared-led-face-masks-wrinkles-2026', block: 'z54mlwaq', anchor: '10-minute sessions', target: 'at-home-led-light-therapy-mask-routine' },
  { source: 'best-pdrn-serums-led-mask-2026', block: 'z2xbqbxe', anchor: 'your routine', target: 'at-home-led-light-therapy-mask-routine' },
  { source: 'biodance-bio-collagen-real-deep-mask-review', block: '9739c6846e85', anchor: 'luxury splurge', target: 'luxury-beauty-products-worth-the-money' },
  { source: 'amorepacific-treatment-enzyme-peel-review', block: 'k117', anchor: 'luxury cleanser', target: 'luxury-beauty-products-worth-the-money' },
  { source: 'luxury-beauty-products-worth-the-money', block: 'fcc88e52b1e9', anchor: 'sold or shipped by Amazon', target: 'is-amazon-luxury-authentic' },
  { source: 'is-amazon-luxury-authentic', block: '63f82a2b78cb', anchor: 'genuine brand-approved markdowns', target: 'amazon-luxury-deals-men-2026' },
  { source: 'best-korean-skincare-products-2026', block: 'd8ade2541db0', anchor: 'BIODANCE Bio-Collagen Real Deep Mask Review', target: 'biodance-bio-collagen-real-deep-mask-review' },
  { source: 'biodance-eye-patches-review', block: 'traffic-34', anchor: 'a Bio-Collagen full-face mask', target: 'biodance-bio-collagen-real-deep-mask-review' },
  { source: 'best-korean-skincare-products-2026', block: 'a45edbbceb6d', anchor: 'snail mucin', target: 'best-snail-hydrogel-products-2026' },
  { source: 'best-korean-eye-patches-2026', block: 'f564468a4ac3', anchor: 'Snail Secretion Filtrate', target: 'best-snail-hydrogel-products-2026' },
  { source: 'peptides-in-skincare-guide', block: 'dad28993-08c', anchor: 'A peptide moisturizer', target: 'peptide-serum-vs-peptide-moisturizer' },
  { source: 'how-to-use-peptides-in-a-skincare-routine', block: 'd258e055-ffd', anchor: 'a peptide serum', target: 'peptide-serum-vs-peptide-moisturizer' },
  { source: 'how-to-shop-peptide-skincare-on-amazon', block: 'efc7debf-e39', anchor: 'peptide serums, moisturizers', target: 'peptide-serum-vs-peptide-moisturizer' },
  { source: 'kojic-acid-soap-for-dark-spots', block: '078d00dafff5', anchor: 'this body wash', target: 'medicube-kojic-acid-body-wash-review' },
  { source: 'kojic-acid-soap-for-dark-spots', block: '49d5a03db001', anchor: 'gentle physical exfoliation', target: 'best-japanese-exfoliating-shower-towels-2026' },
  { source: 'psyllium-husk-supplement-benefits', block: '55037dccff4a', anchor: 'a flavored blend', target: 'colonbroom-review-2026' },
]

// The one approved new sentence (link 19): appended to the fragrance intro.
const APPEND = {
  source: 'luxury-beauty-products-worth-the-money',
  block: 'bb941a2fa3d9',
  before: ' And when the scent you want is a niche bottle priced out of reach, a well-chosen dupe can get surprisingly close. See our ',
  anchor: 'Baccarat Rouge 540 dupe guide',
  after: '.',
  target: 'baccarat-rouge-540-dupe-dossier',
}

type Span = { _type: 'span'; _key: string; text: string; marks?: string[] }
type MarkDef = { _key: string; _type: string; href?: string }
type Block = { _type: string; _key: string; children?: Span[]; markDefs?: MarkDef[] }
type Post = { _id: string; _rev: string; slug: string; body: Block[] }

function applyLink(block: Block, anchor: string, href: string): string | null {
  const linkKeys = new Set((block.markDefs ?? []).filter((d) => d._type === 'link').map((d) => d._key))
  const full = (block.children ?? []).map((s) => s.text).join('')
  const count = full.split(anchor).length - 1
  if (count !== 1) return `anchor occurs ${count}x in paragraph`
  const idx = (block.children ?? []).findIndex((s) => s.text.includes(anchor))
  if (idx < 0) return 'anchor spans more than one text run'
  const span = block.children![idx]
  if ((span.marks ?? []).some((m) => linkKeys.has(m))) return 'anchor is already inside a link'
  const at = span.text.indexOf(anchor)
  const linkKey = k()
  const pieces: Span[] = [
    ...(at > 0 ? [{ ...span, _key: k(), text: span.text.slice(0, at) }] : []),
    { ...span, _key: k(), text: anchor, marks: [...(span.marks ?? []), linkKey] },
    ...(at + anchor.length < span.text.length ? [{ ...span, _key: k(), text: span.text.slice(at + anchor.length) }] : []),
  ]
  block.children!.splice(idx, 1, ...pieces)
  block.markDefs = [...(block.markDefs ?? []), { _key: linkKey, _type: 'link', href }]
  return null
}

async function main() {
  const execute = process.argv.includes('--execute')

  if (process.argv.includes('--revert')) {
    const saved: Post[] = JSON.parse(readFileSync(REVERT_FILE, 'utf8'))
    const tx = client.transaction()
    for (const p of saved) tx.patch(p._id, (pt) => pt.set({ body: p.body }))
    await tx.commit()
    console.log(`Reverted ${saved.length} posts from ${REVERT_FILE}`)
    return
  }

  const sources = [...new Set([...LINKS.map((l) => l.source), APPEND.source])]
  const posts = await client.fetch<Post[]>(
    `*[_type == "post" && slug.current in $s && !(_id in path("drafts.**"))]{ _id, _rev, "slug": slug.current, body }`,
    { s: sources }
  )
  const drafts = await client.fetch<string[]>(`*[_id in $ids]._id`, { ids: posts.map((p) => `drafts.${p._id}`) })
  const targets = new Set(await client.fetch<string[]>(`*[_type == "post" && slug.current in $t && !(_id in path("drafts.**"))].slug.current`, { t: [...LINKS.map((l) => l.target), APPEND.target] }))

  const snapshot: Post[] = posts.map((p) => JSON.parse(JSON.stringify(p)))
  const touched = new Set<string>()
  let ok = 0
  for (const l of LINKS) {
    const post = posts.find((p) => p.slug === l.source)
    const block = post?.body.find((b) => b._key === l.block)
    const why = !post ? 'source post not found'
      : drafts.includes(`drafts.${post._id}`) ? 'source has an unpublished draft (would diverge)'
      : !targets.has(l.target) ? 'target is not a published post'
      : !block ? 'paragraph not found'
      : applyLink(block, l.anchor, BLOG(l.target))
    console.log(`${why ? 'SKIP' : 'ok  '} ${l.source} "${l.anchor}" → /blog/${l.target}${why ? `  (${why})` : ''}`)
    if (!why) { ok++; touched.add(l.source) }
  }

  const lux = posts.find((p) => p.slug === APPEND.source)
  const intro = lux?.body.find((b) => b._key === APPEND.block)
  const introText = (intro?.children ?? []).map((s) => s.text).join('')
  if (intro && !introText.includes(APPEND.anchor) && introText.startsWith('Fragrance is one of the best-value luxury categories')) {
    const linkKey = k()
    intro.children!.push(
      { _type: 'span', _key: k(), text: APPEND.before, marks: [] },
      { _type: 'span', _key: k(), text: APPEND.anchor, marks: [linkKey] },
      { _type: 'span', _key: k(), text: APPEND.after, marks: [] },
    )
    intro.markDefs = [...(intro.markDefs ?? []), { _key: linkKey, _type: 'link', href: BLOG(APPEND.target) }]
    touched.add(APPEND.source); ok++
    console.log(`ok   ${APPEND.source} + new sentence → /blog/${APPEND.target}`)
  } else console.log(`SKIP ${APPEND.source} new sentence (paragraph missing, changed, or already added)`)

  console.log(`\n${ok} of ${LINKS.length + 1} edits valid across ${touched.size} posts`)
  if (!execute) { console.log('DRY RUN — nothing written'); return }

  mkdirSync(path.dirname(REVERT_FILE), { recursive: true })
  if (existsSync(REVERT_FILE)) throw new Error(`${REVERT_FILE} already exists — refusing to overwrite an earlier revert record`)
  writeFileSync(REVERT_FILE, JSON.stringify(snapshot.filter((p) => touched.has(p.slug)), null, 1))
  console.log(`revert record: ${REVERT_FILE}`)

  const tx = client.transaction()
  for (const p of posts.filter((x) => touched.has(x.slug))) tx.patch(p._id, (pt) => pt.ifRevisionId(p._rev).set({ body: p.body }))
  await tx.commit()
  console.log(`applied to ${touched.size} posts`)
}

main().catch((e) => { console.error(e); process.exit(1) })
