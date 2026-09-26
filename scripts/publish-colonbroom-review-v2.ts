/* eslint-disable @typescript-eslint/no-explicit-any -- heterogeneous Portable Text edited in place */
/**
 * ColonBroom review, label-verified version (v2, 2026-09-26). Replaces the body of
 * /blog/colonbroom-review-2026 with the reviewer's corrected draft (built from the
 * supplement facts panel). Same slug; Article + auto FAQPage schema.
 *
 *   npx tsx scripts/publish-colonbroom-review-v2.ts               # dry run + validations
 *   npx tsx scripts/publish-colonbroom-review-v2.ts --execute     # snapshot + publish + IndexNow
 *   npx tsx scripts/publish-colonbroom-review-v2.ts --restore-link  # ONLY after the page is verified live
 *   npx tsx scripts/publish-colonbroom-review-v2.ts --revert      # restore the stub (and unlink the pillar if restored)
 *
 * Copy is the reviewer's draft. Site-rule changes: two question-word H2s renamed
 * (they'd become bogus FAQ schema), CTA reworded to "Check current pricing",
 * meta trimmed to 155 chars ("where to buy" isn't covered), no manual jsonLd.
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
const REVERT_FILE = path.resolve('scripts/data/colonbroom-review-v2-2026-09-26-revert.json')
const PILLAR_FILE = path.resolve('scripts/data/colonbroom-review-v2-pillar-2026-09-26-revert.json')
const SITE = 'https://www.spartanshopper.com'
const GO = (s: string) => `${SITE}/go/${s}`

const TITLE = 'ColonBroom Review 2026: What’s Actually in It (and Who It’s For)'
const META = 'ColonBroom review 2026: full ingredient breakdown, what’s in the formula beyond fiber, how it compares to Metamucil and Benefiber, and side effects.'
const EXCERPT = 'ColonBroom shows up everywhere from Bing AI answers to your group chat, usually with big promises attached. Here’s what’s actually in the scoop — including a few ingredients most reviews don’t mention — and how it compares to fiber supplements you already know.'
const BODY_CAPTION = 'ColonBroom fiber supplement powder with a glass of water and fresh strawberries on a marble surface.'

// ── Portable Text helpers: **bold** and [text](href) ─────────────────────────
const k = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12)
type Span = { _type: 'span'; _key: string; text: string; marks: string[] }
type LinkDef = { _key: string; _type: 'link'; href: string }
type Block = { _type: 'block'; _key: string; style: string; children: Span[]; markDefs: LinkDef[]; listItem?: 'bullet'; level?: number }
const curly = (s: string) => s.replace(/(\w)'(\w)/g, '$1’$2').replace(/(\w)'(\s|$)/g, '$1’$2')

function rich(raw: string, style = 'normal', listItem?: 'bullet', marks: string[] = []): Block {
  const src = curly(raw)
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
    // Disclosure BEFORE the first affiliate link (the comparison table)
    em('Disclosure: SpartanShopper may earn a commission on qualifying purchases made through links on this page, at no extra cost to you. This article is for informational purposes only and is not a substitute for professional medical advice.'),
    p('If you\'ve searched “ColonBroom review” hoping for a straight answer instead of another sales page dressed up as journalism, you\'re not alone — most of what ranks for this term is written by people trying to sell you the product, not tell you about it. Here\'s what\'s actually in a scoop of ColonBroom, based on the current supplement facts panel, and how it compares to fiber supplements you may already know. We haven\'t tried this product ourselves — this breakdown is based on the manufacturer\'s published label.'),
    { _type: 'image', _key: k(), asset: { _type: 'reference', _ref: coverRef }, alt: 'ColonBroom fiber supplement powder in strawberry flavor on white marble with a glass of water', caption: BODY_CAPTION },

    h2('ColonBroom at a Glance'),
    p('Each scoop of ColonBroom (about 6.47 grams, 50 servings per container) provides 20 calories and 4 grams of dietary fiber. But it\'s not a single-ingredient fiber product — the label lists several active ingredients beyond fiber:'),
    li('**Psyllium Seed Husk Powder** — 3.6g'),
    li('**L-Carnitine Tartrate** — 1g'),
    li('**Capsimax® Cayenne Fruit Extract** — 50mg'),
    li('**Chromium (as Chromium Picolinate)** — 200mcg'),
    li('**Vitamin B6** — 50mg'),
    li('**Vitamin B12** — 20mcg'),
    p('Other ingredients: natural flavors, citric acid, stevia leaf extract, silicon dioxide, and fruit and vegetable juice powder for color. The product is gluten-free and non-GMO. It\'s sold as a subscription or bulk multi-pack, and like most direct-to-consumer supplements, the per-unit price drops significantly the more you buy upfront.'),
    p('That combination — fiber plus L-Carnitine, a cayenne extract, and chromium — is a formula pattern more associated with weight-management products than plain fiber supplements. ColonBroom\'s own packaging markets it this way directly, with claims for weight management, appetite control, and energy increase alongside a “clinically proven” label. Those are the manufacturer\'s claims, not ours, and like all supplement marketing they carry the standard disclosure that they haven\'t been evaluated by the FDA. We\'re listing what\'s actually in the scoop below, not repeating what the packaging promises it does.'),

    h2('The Non-Fiber Ingredients, Explained'),
    p('Psyllium husk\'s role in digestion is well-documented (see the next section). The other actives are worth understanding on their own terms, since they\'re not doing the same job:'),
    li('**L-Carnitine Tartrate** is an amino acid derivative involved in how cells convert fat into energy. It\'s commonly added to weight-management and sports-nutrition products, but research on whether an oral dose like this produces a noticeable effect is mixed and often inconclusive.'),
    li('**Capsimax® Cayenne Fruit Extract** is a low-irritation form of capsaicin, the compound that makes chili peppers hot. It\'s also a common ingredient in metabolism-support formulas; evidence for meaningful real-world effects at supplement doses is limited.'),
    li('**Chromium Picolinate** is a mineral sometimes marketed for blood sugar and metabolism support. This serving provides 200mcg, well above the amount typically used as a reference daily value for chromium.'),
    li('**Vitamin B6 and B12** are included at doses far exceeding 100% of their daily values. B vitamins support normal energy metabolism, but taking more than your body needs doesn\'t provide extra energy — it\'s generally excreted.'),
    p('None of this is a claim that these ingredients cause weight loss or work as advertised elsewhere — the research behind several of them, especially at these doses, is limited or mixed. We\'re describing what\'s in the scoop, not endorsing what the marketing around it might promise.'),

    h2('The Psyllium Husk Mechanism'),
    p('Psyllium husk is a soluble fiber that absorbs water and forms a gel-like substance as it moves through your digestive tract. That\'s the mechanism behind why fiber supplements in general are associated with:'),
    li('**Softer, more regular bowel movements** — the gel adds bulk and moisture to stool, making it easier to pass'),
    li('**A feeling of fullness** — soluble fiber slows digestion, which is why fiber supplements are often taken around mealtimes'),
    li('**Feeding gut bacteria** — soluble fiber acts as a prebiotic, meaning it\'s a food source for the beneficial bacteria already in your gut'),
    p('These are established properties of psyllium husk as an ingredient, not claims specific to ColonBroom. At 3.6g of psyllium per scoop, ColonBroom\'s fiber dose is in a similar range to other psyllium products, though it\'s one part of a larger formula rather than the whole product.'),

    h2('ColonBroom vs. Other Fiber Supplements'),
    p('If you\'re mainly after fiber, here\'s how ColonBroom compares to the psyllium-based options we\'ve covered before:'),
    {
      _type: 'table', _key: k(), caption: 'ColonBroom compared with four other fiber supplements',
      rows: [
        ['Product', 'Fiber Source', 'Other Actives', 'Format', 'Flavor', 'Dietary Notes'],
        [`ColonBroom||${GO('colonbroom-fiber')}`, 'Psyllium husk (3.6g)', 'L-Carnitine, Capsimax cayenne, chromium picolinate, high-dose B6/B12', 'Powder, mix with water', 'Strawberry', 'Gluten-free, non-GMO'],
        [`Metamucil 4-in-1||${GO('metamucil-psyllium-husk')}`, 'Psyllium husk', 'None — fiber only', 'Powder or capsules', 'Orange, unflavored', 'Sugar-free options available'],
        [`Benefiber Prebiotic Fiber||${GO('benefiber-prebiotic-fiber')}`, 'Wheat dextrin', 'None — fiber only', 'Powder, dissolves clear', 'Unflavored', 'Gluten-free (despite wheat source)'],
        [`NOW Psyllium Husk Caps||${GO('now-psyllium-husk-caps')}`, 'Psyllium husk', 'None — fiber only', 'Capsules', 'N/A', 'No additives, no flavoring'],
        [`Organic India Psyllium||${GO('organic-india-psyllium')}`, 'Psyllium husk', 'None — fiber only', 'Powder', 'Unflavored', 'Organic, minimal ingredients'],
      ].map((cells) => ({ _type: 'tableRow', _key: k(), cells })),
    },
    p('The honest takeaway: if you specifically want fiber and nothing else, the other four are simpler, single-ingredient formulas. ColonBroom is the option to consider if you want the fiber bundled with the additional ingredients above — not if you\'re trying to avoid them.'),

    h2('Honest Limitations'),
    p('A few things worth knowing before you buy:'),
    li('**It\'s a multi-ingredient formula, not just fiber.** If you\'re specifically looking for a plain fiber supplement, the added ingredients here mean you\'re getting (and paying for) more than that.'),
    li('**The extra ingredients\' effects are less settled than psyllium\'s.** L-Carnitine, Capsimax, and chromium picolinate are common in this product category, but the evidence for what they do at these doses, taken orally, is mixed or limited.'),
    li('**Results depend on consistency and water intake.** Psyllium husk needs adequate fluid to work as intended; taken without enough water, fiber supplements can worsen bloating rather than relieve it.'),
    li('**It\'s not a fast fix.** Like any fiber supplement, effects on regularity typically build over several days of consistent use, not a single dose.'),
    li('**Fiber alone doesn\'t address diagnosed digestive conditions.** If you\'re dealing with IBS, chronic constipation, or another ongoing GI issue, talk to a doctor before self-treating with any supplement.'),

    h2('Dose and Timing'),
    p('The label lists one scoop (about 6.47g) as a serving, with 50 servings per container. Follow the specific daily amount and timing printed on your package, since supplement directions can be updated between production runs. As with any fiber supplement, introducing it gradually and drinking enough water alongside it helps reduce the chance of gas or bloating during the first week.'),

    h2('Side Effects and Precautions'),
    li('Gas or bloating, especially in the first few days of taking any fiber supplement'),
    li('Stomach cramping if taken without enough water'),
    li('Cayenne extract (Capsimax) can cause a warming sensation or stomach upset in sensitive individuals'),
    li('If you already take a multivitamin or another supplement containing B6, B12, or chromium, add up your total intake — this formula provides large amounts of each on its own'),
    li('Psyllium husk can reduce absorption of some medications if taken too close together — space it at least a couple of hours apart from any prescription medication'),
    li('Not recommended if you have a diagnosed bowel obstruction or swallowing difficulty'),
    p('If you\'re pregnant, nursing, or managing a chronic condition, check with a doctor before adding any supplement — especially one with active ingredients beyond fiber — to your routine.'),

    h2('FAQ'),
    h3('Is ColonBroom just psyllium husk?'),
    p('No. Psyllium husk (3.6g per scoop) is the fiber component, but the full formula also includes L-Carnitine Tartrate, Capsimax cayenne fruit extract, chromium picolinate, and high doses of vitamins B6 and B12.'),
    h3('How is it different from Metamucil?'),
    p('Metamucil is a fiber-only product. ColonBroom includes the same type of fiber (psyllium husk) plus several additional ingredients not found in plain psyllium products.'),
    h3('Can I take it every day?'),
    p('Follow the directions on your package. If you\'re also taking other supplements with overlapping ingredients (B vitamins, chromium), factor in your total daily intake, and check with a doctor if you plan to use it long-term.'),
    h3('Does it taste like a supplement?'),
    p('It\'s flavored (strawberry) specifically to be more palatable than unflavored psyllium powder, which many people find gritty and bitter on its own.'),

    h2('Final Verdict'),
    p(`ColonBroom bundles a standard dose of psyllium husk fiber with several additional ingredients — L-Carnitine, a cayenne extract, chromium, and high-dose B vitamins — that are common in weight-management formulas but have more limited evidence behind them than fiber itself. If you want fiber and nothing else, [NOW Psyllium Husk Caps](${GO('now-psyllium-husk-caps')}) or [Organic India Psyllium](${GO('organic-india-psyllium')}) are simpler, single-ingredient options. If you're specifically interested in the fuller formula, ColonBroom is worth knowing what you're actually getting before you buy.`),
    p(`[Check current pricing](${GO('colonbroom-fiber')})`),
  ]
}

// Facts that must appear (from the supplement facts panel per the reviewer) and text that must not.
const MUST_HAVE = ['6.47 grams', '50 servings', '20 calories', '3.6g', '1g', '50mg', '200mcg', '20mcg', 'L-Carnitine', 'Capsimax', 'Chromium', 'Vitamin B6', 'Vitamin B12', 'haven\'t tried', 'clinically proven', 'Other Actives', 'B6, B12, or chromium']
const MUST_NOT = ['$10', 'bottle of NOW', 'just psyllium husk you', '5.7']

async function main() {
  if (process.argv.includes('--revert')) {
    const saved = JSON.parse(readFileSync(REVERT_FILE, 'utf8'))
    const { _createdAt, _updatedAt, _rev, ...post } = saved.post
    void _createdAt; void _updatedAt; void _rev
    const tx = client.transaction().createOrReplace(post)
    if (existsSync(PILLAR_FILE)) { const pl = JSON.parse(readFileSync(PILLAR_FILE, 'utf8')); tx.patch(pl._id, (pt) => pt.set({ body: pl.body })) }
    await tx.commit()
    console.log('Restored the stub' + (existsSync(PILLAR_FILE) ? ' and un-linked the pillar' : ''))
    return
  }

  if (process.argv.includes('--restore-link')) {
    const pillar = await client.fetch<any>(`*[_type == "post" && slug.current == $s && !(_id in path("drafts.**"))][0]{ _id, _rev, body }`, { s: PILLAR_SLUG })
    const saved = JSON.parse(readFileSync(STUB_LINK_REVERT, 'utf8')) as { block: any }
    const cur = pillar.body.find((b: any) => b._key === PILLAR_BLOCK)
    const text = (b: any) => b.children.map((c: any) => c.text).join('')
    if (!cur || text(cur) !== text(saved.block)) throw new Error('pillar paragraph changed — refusing to restore blindly')
    if ((cur.markDefs ?? []).some((d: any) => d.href?.includes('colonbroom'))) throw new Error('pillar already has a ColonBroom link')
    if (existsSync(PILLAR_FILE)) throw new Error(`${PILLAR_FILE} exists`)
    writeFileSync(PILLAR_FILE, JSON.stringify({ _id: pillar._id, body: pillar.body }, null, 1))
    await client.patch(pillar._id).ifRevisionId(pillar._rev).set({ body: pillar.body.map((b: any) => (b._key === PILLAR_BLOCK ? saved.block : b)) }).commit()
    console.log('pillar link restored')
    await pingIndexNow([`/blog/${PILLAR_SLUG}`])
    return
  }

  const post = await client.fetch<any>(`*[_id == $id][0]`, { id: POST_ID })
  const draft = await client.fetch<number>(`count(*[_id == $d])`, { d: `drafts.${POST_ID}` })
  if (!post || post.slug?.current !== SLUG) throw new Error('post not found / slug mismatch')
  if (draft) throw new Error('post has an unpublished draft')

  const body = buildBody(post.coverImage.asset._ref)
  const plain = body.filter((b) => b._type === 'block').map((b: Block) => b.children.map((c) => c.text).join('')).join('\n') + '\n' + JSON.stringify(body.filter((b) => b._type === 'table'))
  const missing = MUST_HAVE.filter((s) => !plain.includes(s.replace(/'/g, '’')) && !plain.includes(s))
  const banned = MUST_NOT.filter((s) => plain.includes(s))
  const QUESTION = /^(what|how|why|is|are|can|does|do|when|where|which|who|will|should)\b|\?$/i
  const h2Bad = body.filter((b) => b.style === 'h2' && QUESTION.test(b.children.map((c: any) => c.text).join('')))
  const table = body.find((b) => b._type === 'table')
  console.log(body.filter((b) => b.style === 'h2' || b.style === 'h3').map((b) => `${b.style}: ${b.children.map((c: any) => c.text).join('')}`).join('\n'))
  console.log(`\nblocks ${body.length}; meta ${META.length} chars; table columns ${table.rows[0].cells.length}; FAQ H3s ${body.filter((b) => b.style === 'h3' && /^(Is|How|Can|Does)\b/.test(b.children[0].text)).length}`)
  console.log(`facts missing: ${missing.length ? missing.join(', ') : 'none'} | banned text present: ${banned.length ? banned.join(', ') : 'none'} | question-style H2s: ${h2Bad.length}`)
  console.log(`disclosure at block 0, first affiliate link at table (block ${body.findIndex((b) => b._type === 'table')})`)
  if (missing.length || banned.length || h2Bad.length || META.length > 155 || table.rows[0].cells.length !== 6) throw new Error('validation failed')
  if (!process.argv.includes('--execute')) { console.log('DRY RUN — nothing written'); return }

  mkdirSync(path.dirname(REVERT_FILE), { recursive: true })
  if (existsSync(REVERT_FILE)) throw new Error(`${REVERT_FILE} exists — refusing to overwrite an earlier revert record`)
  writeFileSync(REVERT_FILE, JSON.stringify({ post }, null, 1))
  await client.patch(POST_ID).ifRevisionId(post._rev)
    .set({ title: TITLE, excerpt: EXCERPT, 'seo.metaTitle': TITLE, 'seo.metaDescription': META, body })
    .unset(['jsonLd']).commit()
  console.log(`published ${SLUG}; revert record: ${REVERT_FILE}`)
  await pingIndexNow([`/blog/${SLUG}`])
}

main().catch((e) => { console.error(e); process.exit(1) })
