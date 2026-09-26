/* eslint-disable @typescript-eslint/no-explicit-any -- heterogeneous Portable Text edited in place */
/**
 * ColonBroom review rebuild (2026-09-26): replaces the body of the existing
 * /blog/colonbroom-review-2026 (was a 233-word compliance stub) with the
 * reviewer's full draft, keeping the URL, and restores the batch-1 internal
 * link on the psyllium pillar ("a flavored blend" → this page).
 *
 *   npx tsx scripts/publish-colonbroom-review-rebuild.ts            # dry run
 *   npx tsx scripts/publish-colonbroom-review-rebuild.ts --execute  # snapshot, publish, restore link, IndexNow
 *   npx tsx scripts/publish-colonbroom-review-rebuild.ts --revert   # restore both docs from the snapshot
 *
 * Copy is the reviewer's draft. Structural changes required by site rules:
 *  - H2s that began with a question word renamed (they'd become bogus FAQ schema);
 *    FAQ questions are H3s under an FAQ H2 so FAQPage schema generates
 *  - affiliate disclosure placed before the first affiliate link (the table)
 *  - ColonBroom table cell linked like the other rows; CTA reworded to the
 *    approved no-retailer-name style
 *  - meta description trimmed to fit 155 chars ("where to buy" isn't covered)
 *  - no manual jsonLd: Article + FAQPage generate automatically
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

const POST_ID = 'f63a810f-0248-44e5-a806-404aa14df583'
const SLUG = 'colonbroom-review-2026'
const PILLAR_SLUG = 'psyllium-husk-supplement-benefits'
const PILLAR_BLOCK = '55037dccff4a'
const STUB_LINK_REVERT = path.resolve('scripts/data/colonbroom-stub-link-revert-2026-09-26.json')
const REVERT_FILE = path.resolve('scripts/data/colonbroom-review-rebuild-2026-09-26-revert.json')
const SITE = 'https://www.spartanshopper.com'
const GO = (s: string) => `${SITE}/go/${s}`

const TITLE = 'ColonBroom Review 2026: What’s Actually in It (and Who It’s For)'
const META = 'ColonBroom review 2026: what’s in it, how the psyllium husk fiber works, how it compares to Metamucil and Benefiber, side effects, and who it’s for.'
const EXCERPT = 'ColonBroom shows up everywhere from Bing AI answers to your group chat, usually with big promises attached. Here’s what’s actually in the scoop, how it stacks up against the fiber supplements you already know, and what to expect if you try it.'
const BODY_CAPTION = 'ColonBroom fiber supplement powder with a glass of water and fresh strawberries on a marble surface.'
const DISCLOSURE = 'Disclosure: SpartanShopper may earn a commission on qualifying purchases made through links on this page, at no extra cost to you.'

// ── Portable Text helpers: **bold** and [text](href) ─────────────────────────
const k = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12)
type Span = { _type: 'span'; _key: string; text: string; marks: string[] }
type LinkDef = { _key: string; _type: 'link'; href: string }
type Block = { _type: 'block'; _key: string; style: string; children: Span[]; markDefs: LinkDef[]; listItem?: 'bullet'; level?: number }

function rich(src: string, style = 'normal', listItem?: 'bullet', marks: string[] = []): Block {
  const children: Span[] = []
  const markDefs: LinkDef[] = []
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    if (m.index > last) children.push({ _type: 'span', _key: k(), text: src.slice(last, m.index), marks: [...marks] })
    if (m[1] !== undefined) children.push({ _type: 'span', _key: k(), text: m[1], marks: ['strong', ...marks] })
    else {
      const key = k()
      markDefs.push({ _key: key, _type: 'link', href: m[3] })
      children.push({ _type: 'span', _key: k(), text: m[2], marks: [key, ...marks] })
    }
    last = re.lastIndex
  }
  if (last < src.length) children.push({ _type: 'span', _key: k(), text: src.slice(last), marks: [...marks] })
  return { _type: 'block', _key: k(), style, children, markDefs, ...(listItem && { listItem, level: 1 }) }
}
const p = (s: string) => rich(s)
const li = (s: string) => rich(s, 'normal', 'bullet')
const h2 = (s: string) => rich(s, 'h2')
const h3 = (s: string) => rich(s, 'h3')
const em = (s: string) => rich(s, 'normal', undefined, ['em'])

function buildBody(coverRef: string): any[] {
  return [
    p('If you’ve searched “ColonBroom review” hoping for a straight answer instead of another sales page dressed up as journalism, you’re not alone — most of what ranks for this term is written by people trying to sell you the product, not tell you about it. Here’s what ColonBroom actually contains, how it works, and how it compares to fiber supplements you may already know.'),
    { _type: 'image', _key: k(), asset: { _type: 'reference', _ref: coverRef }, alt: 'ColonBroom fiber supplement powder in strawberry flavor on white marble with a glass of water', caption: BODY_CAPTION },
    // Disclosure BEFORE the first affiliate link (the comparison table)
    em(DISCLOSURE),

    h2('ColonBroom at a Glance'),
    p('ColonBroom is a powdered fiber supplement built around **psyllium husk**, the same soluble fiber found in long-standing products like Metamucil. Each serving (one scoop, about 5.7 grams) is mixed into water and delivers roughly 3.6 grams of psyllium husk fiber, along with citric acid, stevia leaf extract, sea salt, and natural flavoring — most commonly strawberry. The formula is vegan, gluten-free, non-GMO, and sugar-free, with about 20 calories per serving.'),
    p('It’s sold as a subscription or bulk multi-pack, and like most direct-to-consumer supplements, the per-unit price drops significantly the more you buy upfront.'),

    h2('The Psyllium Husk Mechanism'),
    p('Psyllium husk is a soluble fiber that absorbs water and forms a gel-like substance as it moves through your digestive tract. That’s the mechanism behind why fiber supplements in general are associated with:'),
    li('**Softer, more regular bowel movements** — the gel adds bulk and moisture to stool, making it easier to pass'),
    li('**A feeling of fullness** — soluble fiber slows digestion, which is why fiber supplements are often taken around mealtimes'),
    li('**Feeding gut bacteria** — soluble fiber acts as a prebiotic, meaning it’s a food source for the beneficial bacteria already in your gut'),
    p('These are established properties of psyllium husk as an ingredient, not claims specific to ColonBroom. The formula itself doesn’t do anything psyllium husk from another brand wouldn’t also do — the differentiators are taste, mixability, and packaging, not the underlying mechanism.'),

    h2('ColonBroom vs. Other Fiber Supplements'),
    p('If you’re already fiber-curious, here’s how ColonBroom’s core ingredient compares to the psyllium-based options we’ve covered before:'),
    {
      _type: 'table', _key: k(), caption: 'ColonBroom compared with four other fiber supplements',
      rows: [
        ['Product', 'Fiber Source', 'Format', 'Flavor', 'Dietary Notes'],
        [`ColonBroom||${GO('colonbroom-fiber')}`, 'Psyllium husk', 'Powder, mix with water', 'Strawberry', 'Vegan, gluten-free, sugar-free'],
        [`Metamucil 4-in-1||${GO('metamucil-psyllium-husk')}`, 'Psyllium husk', 'Powder or capsules', 'Orange, unflavored', 'Sugar-free options available'],
        [`Benefiber Prebiotic Fiber||${GO('benefiber-prebiotic-fiber')}`, 'Wheat dextrin', 'Powder, dissolves clear', 'Unflavored', 'Gluten-free (despite wheat source)'],
        [`NOW Psyllium Husk Caps||${GO('now-psyllium-husk-caps')}`, 'Psyllium husk', 'Capsules', 'N/A', 'No additives, no flavoring'],
        [`Organic India Psyllium||${GO('organic-india-psyllium')}`, 'Psyllium husk', 'Powder', 'Unflavored', 'Organic, minimal ingredients'],
      ].map((cells) => ({ _type: 'tableRow', _key: k(), cells })),
    },
    p('The honest takeaway: if you want psyllium husk with no flavoring or added ingredients, NOW or Organic India get you there for less. ColonBroom’s pitch is convenience and taste — it’s positioned as an easier daily habit to stick with than mixing plain psyllium powder into water, which admittedly has a gritty texture and mild bitterness some people don’t love.'),

    h2('Honest Limitations'),
    p('A few things worth knowing before you buy:'),
    li('**It’s not a unique formula.** The active ingredient is the same psyllium husk you’d get from a $10 bottle of NOW Foods capsules. You’re paying a premium for flavor and brand, not a proprietary breakthrough.'),
    li('**Results depend on consistency and water intake.** Psyllium husk needs adequate fluid to work as intended; taken without enough water, fiber supplements can worsen bloating rather than relieve it.'),
    li('**It’s not a fast fix.** Like any fiber supplement, effects on regularity typically build over several days of consistent use, not a single dose.'),
    li('**Fiber alone doesn’t address diagnosed digestive conditions.** If you’re dealing with IBS, chronic constipation, or another ongoing GI issue, talk to a doctor before self-treating with any fiber supplement.'),

    h2('Dose and Timing'),
    p('Most people start with one scoop (5.7g) mixed into 8 oz of water, taken once daily. Manufacturer guidance suggests increasing to two scoops daily after about five days if it’s well tolerated. As with any fiber supplement, starting low and increasing gradually helps your digestive system adjust and reduces the chance of gas or bloating during the first week.'),

    h2('Side Effects and Precautions'),
    p('Psyllium husk is generally well tolerated, but possible side effects include:'),
    li('Gas or bloating, especially in the first few days'),
    li('Stomach cramping if taken without enough water'),
    li('Reduced absorption of some medications if taken too close together — space psyllium husk at least a couple of hours apart from any prescription medication'),
    li('Not recommended if you have a diagnosed bowel obstruction or swallowing difficulty'),
    p('If you’re pregnant, nursing, or managing a chronic condition, check with a doctor before adding any fiber supplement to your routine.'),

    h2('FAQ'),
    h3('Is ColonBroom just psyllium husk?'),
    p('Psyllium husk is the primary active ingredient, along with citric acid, stevia, sea salt, and natural flavoring for taste.'),
    h3('How is it different from Metamucil?'),
    p('Both use psyllium husk as the core fiber source. The differences come down to flavor, mixability, and price per serving rather than the underlying ingredient.'),
    h3('Can I take it every day?'),
    p('Fiber supplements are generally intended for daily use, but check with a doctor if you plan to take it long-term or have an existing GI condition.'),
    h3('Does it taste like a supplement?'),
    p('It’s flavored (commonly strawberry) specifically to be more palatable than unflavored psyllium powder, which many people find gritty and bitter on its own.'),

    h2('Final Verdict'),
    p('ColonBroom is a legitimate psyllium husk fiber supplement — the ingredient itself is well-established for supporting digestive regularity. Whether it’s worth the price over a plainer psyllium product comes down to how much you value flavor and convenience over cost. If you’ve tried plain psyllium husk and couldn’t get past the texture, ColonBroom solves that specific problem. If price per serving matters more to you, ' + `[NOW Psyllium Husk Caps](${GO('now-psyllium-husk-caps')}) or [Organic India Psyllium](${GO('organic-india-psyllium')}) deliver the same core ingredient for less.`),
    p(`[Check current pricing](${GO('colonbroom-fiber')})`),
    em('Disclosure: SpartanShopper may earn a commission on qualifying purchases made through links on this page, at no extra cost to you. This article is for informational purposes only and is not a substitute for professional medical advice. Talk to a doctor before starting any new supplement, especially if you’re pregnant, nursing, or managing a health condition.'),
  ]
}

async function main() {
  if (process.argv.includes('--revert')) {
    const saved = JSON.parse(readFileSync(REVERT_FILE, 'utf8'))
    const { _createdAt, _updatedAt, _rev, ...post } = saved.post
    void _createdAt; void _updatedAt; void _rev
    const tx = client.transaction().createOrReplace(post)
    tx.patch(saved.pillar._id, (pt) => pt.set({ body: saved.pillar.body }))
    await tx.commit()
    console.log('Restored ColonBroom post and psyllium pillar from', REVERT_FILE)
    return
  }

  const post = await client.fetch<any>(`*[_id == $id][0]`, { id: POST_ID })
  const draft = await client.fetch<number>(`count(*[_id == $d])`, { d: `drafts.${POST_ID}` })
  if (!post || post.slug?.current !== SLUG) throw new Error('post not found / slug mismatch')
  if (draft) throw new Error('post has an unpublished draft')
  const pillar = await client.fetch<any>(`*[_type == "post" && slug.current == $s && !(_id in path("drafts.**"))][0]{ _id, _rev, body }`, { s: PILLAR_SLUG })
  const saved = JSON.parse(readFileSync(STUB_LINK_REVERT, 'utf8')) as { block: any }
  const cur = pillar.body.find((b: any) => b._key === PILLAR_BLOCK)
  const text = (b: any) => b.children.map((c: any) => c.text).join('')
  if (!cur || text(cur) !== text(saved.block)) throw new Error('pillar paragraph changed since the link was removed — refusing to restore blindly')
  if ((cur.markDefs ?? []).some((d: any) => d.href?.includes('colonbroom'))) throw new Error('pillar already has a ColonBroom link')

  const body = buildBody(post.coverImage.asset._ref)
  const headings = body.filter((b) => b.style === 'h2' || b.style === 'h3').map((b) => `${b.style}: ${b.children.map((c: any) => c.text).join('')}`)
  const QUESTION = /^(what|how|why|is|are|can|does|do|when|where|which|who|will|should)\b|\?$/i
  const h2Offenders = body.filter((b) => b.style === 'h2' && QUESTION.test(b.children.map((c: any) => c.text).join('')))
  console.log(headings.join('\n'))
  console.log(`\nblocks: ${body.length}; meta ${META.length} chars; title ${TITLE.length} chars; question-style H2s: ${h2Offenders.length}`)
  console.log(`disclosure before first affiliate link: ${JSON.stringify(body.findIndex((b) => b.children?.[0]?.text?.startsWith('Disclosure:'))) } < table at ${body.findIndex((b) => b._type === 'table')}`)
  if (META.length > 155 || h2Offenders.length) throw new Error('validation failed')
  if (!process.argv.includes('--execute')) { console.log('DRY RUN — nothing written'); return }

  mkdirSync(path.dirname(REVERT_FILE), { recursive: true })
  if (existsSync(REVERT_FILE)) throw new Error(`${REVERT_FILE} exists — refusing to overwrite an earlier revert record`)
  writeFileSync(REVERT_FILE, JSON.stringify({ post, pillar: { _id: pillar._id, body: pillar.body } }, null, 1))

  const restored = pillar.body.map((b: any) => (b._key === PILLAR_BLOCK ? saved.block : b))
  await client.transaction()
    .patch(POST_ID, (pt) => pt.ifRevisionId(post._rev)
      .set({ title: TITLE, excerpt: EXCERPT, 'seo.metaTitle': TITLE, 'seo.metaDescription': META, body })
      .unset(['jsonLd']))
    .patch(pillar._id, (pt) => pt.ifRevisionId(pillar._rev).set({ body: restored }))
    .commit()
  console.log(`published ${SLUG} and restored the pillar link; revert record: ${REVERT_FILE}`)
  await pingIndexNow([`/blog/${SLUG}`, `/blog/${PILLAR_SLUG}`])
}

main().catch((e) => { console.error(e); process.exit(1) })
