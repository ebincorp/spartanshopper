import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@sanity/client'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token: process.env.SANITY_API_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// ── Portable-text helpers ────────────────────────────────────────────────────
const k = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12)
type Span = { _type: 'span'; _key: string; text: string; marks: string[] }
type LinkDef = { _key: string; _type: 'link'; href: string }
type Block = { _type: 'block'; _key: string; style: string; children: Span[]; markDefs: LinkDef[]; listItem?: 'bullet' | 'number'; level?: number }
type ImageBlock = { _type: 'image'; _key: string; asset: { _type: 'reference'; _ref: string }; alt?: string; caption?: string }

const s = (text: string, marks: string[] = []): Span => ({ _type: 'span', _key: k(), text, marks })
const p = (spans: Span[], defs: LinkDef[] = []): Block => ({ _type: 'block', _key: k(), style: 'normal', children: spans, markDefs: defs })
const h2 = (text: string): Block => ({ _type: 'block', _key: k(), style: 'h2', children: [s(text)], markDefs: [] })
const h3 = (text: string): Block => ({ _type: 'block', _key: k(), style: 'h3', children: [s(text)], markDefs: [] })
const bullet = (spans: Span[], defs: LinkDef[] = []): Block => ({ _type: 'block', _key: k(), style: 'normal', listItem: 'bullet', level: 1, children: spans, markDefs: defs })
function img(ref: string, alt: string, caption: string): ImageBlock {
  return { _type: 'image', _key: k(), asset: { _type: 'reference', _ref: ref }, alt, caption }
}
function link(text: string, href: string): { span: Span; def: LinkDef } {
  const lk = k(); return { span: s(text, [lk]), def: { _key: lk, _type: 'link', href } }
}
// bold + linked span (product-name anchor)
function boldLink(text: string, href: string): { span: Span; def: LinkDef } {
  const lk = k(); return { span: s(text, [lk, 'strong']), def: { _key: lk, _type: 'link', href } }
}
const lead = (boldText: string, rest: string): Block => p([s(boldText, ['strong']), s(rest)])

// ── Constants ─────────────────────────────────────────────────────────────────
const SLUG = 'creatine-for-women'
const COVER_ASSET = 'image-839d5cccd535dd1995e10decebe91876ac1e4bd0-1448x1086-png'
const COVER_CDN = 'https://cdn.sanity.io/images/eohdr7jw/production/839d5cccd535dd1995e10decebe91876ac1e4bd0-1448x1086.png'
const COVER_ALT = 'Creatine powder scoop and glass with light dumbbells flat lay on white marble'
const BODY_CAPTION = 'Creatine powder in a glass with a scoop and dumbbells on white marble — the most researched supplement in sports nutrition, finally marketed honestly to women.'
const SITE = 'https://www.spartanshopper.com'
const GO = (slug: string) => `${SITE}/go/${slug}`
const THORNE = 'thorne-creatine', CREATE = 'create-creatine-gummies', ON = 'optimum-nutrition-creatine', NUTRICOST = 'nutricost-creatine'
const MAG_URL = `${SITE}/blog/magnesium-glycinate-for-sleep-the-natural-melatonin-alternative-you-ve-been-looking-for`
const ELECTROLYTE_URL = `${SITE}/blog/best-electrolyte-powder`

const AFFILIATE_LINKS = [
  { slug: THORNE, title: 'THORNE Creatine (NSF Certified) — Amazon', destination: 'https://www.amazon.com/dp/B07978VPPH?tag=sku18798384-20' },
  { slug: CREATE, title: 'Create Creatine Monohydrate Gummies — Amazon', destination: 'https://www.amazon.com/dp/B0CP9XPYX6?tag=sku18798384-20' },
  { slug: ON, title: 'Optimum Nutrition Micronized Creatine — Amazon', destination: 'https://www.amazon.com/dp/B002DYIZEE?tag=sku18798384-20' },
  { slug: NUTRICOST, title: 'Nutricost Creatine Monohydrate 500g — Amazon', destination: 'https://www.amazon.com/dp/B00GL2HMES?tag=sku18798384-20' },
]

const EXCERPT = "Creatine spent twenty years marketed at gym bros, and women got told it would make them bulky and bloated. The research says almost the opposite. Here's what creatine actually does for women — including the brain and bone benefits nobody advertises."

// ── Body ─────────────────────────────────────────────────────────────────────
function buildBody(imageRef: string): (Block | ImageBlock)[] {
  const thorne = boldLink('THORNE Creatine', GO(THORNE))
  const create = boldLink('Create Creatine Gummies', GO(CREATE))
  const on = boldLink('Optimum Nutrition Micronized Creatine', GO(ON))
  const nutricost = boldLink('Nutricost Creatine', GO(NUTRICOST))
  const magLink = link('magnesium glycinate guide', MAG_URL)
  const elecLink = link('electrolyte powder guide', ELECTROLYTE_URL)

  return [
    p([s("Creatine for women is having a moment, and it’s about time. For two decades this was the most researched supplement in sports nutrition — hundreds of human trials, one of the few supplements with effects large enough to feel — while being marketed exclusively to twenty-something men in stringer tanks. Women were warned off with talk of bulk, bloat, and water weight.")]),
    p([s("The science says those warnings got it almost exactly backwards. Here’s what creatine actually does for women, what it doesn’t, and how to take it without overthinking.")]),

    img(imageRef, COVER_ALT, BODY_CAPTION),

    p([s('Disclosure: SpartanShopper participates in the Amazon Associates Program. We may earn a small commission on qualifying purchases at no extra cost to you.', ['em'])]),

    h2('What Creatine Actually Is'),
    p([s("Creatine is a compound your body already makes (about a gram a day) and stores in muscle, where it regenerates ATP — the energy currency your cells burn during short, intense efforts. You also eat it in meat and fish, which matters here: women on average carry 70–80% lower creatine stores than men and consume less in food, which is part of why research suggests women may respond more noticeably to supplementation, not less.")]),
    p([s("Supplementing tops off those stores. That’s the whole mechanism. It isn’t a hormone, a stimulant, or a steroid-adjacent anything.")]),

    h2('What the Research Shows for Women'),
    lead('Strength and lean muscle. ', "Clinical studies consistently show women gain strength and lean mass faster with creatine plus resistance training than training alone. “Lean mass” here means firmer, stronger muscle — the physical adaptation most women lifting weights are explicitly chasing. The bulky look requires years of dedicated training and eating; three to five grams of creatine will not do it to you by accident."),
    lead('The brain angle. ', "This is the part nobody advertised. Because the brain is a heavy ATP consumer, creatine’s cognitive effects have become a serious research area — with studies suggesting benefits for mental fatigue, working memory, and mood support, and particular interest in sleep-deprived and vegetarian populations (both low-creatine states). Research in this area is younger than the muscle research and effect sizes are more modest — but “clearer head under fatigue” is the commonly reported experience."),
    lead('Perimenopause and bone. ', "Emerging research suggests creatine paired with resistance training may support bone mineral density in post-menopausal women — a genuinely important area, since bone loss accelerates sharply after estrogen declines. The evidence isn’t settled enough for promises, but it’s promising enough that researchers in women’s health keep funding trials."),
    lead('Where it won’t help: ', "endurance performance sees minimal benefit, and creatine is not a weight-loss aid. Anyone selling it as a fat burner is selling something else."),

    h2('The Myths, Handled'),
    lead('“It causes bloating.” ', "The persistent one. Creatine pulls water into muscle cells — intracellular water, which reads as firm, not puffy. The subcutaneous “soft” water retention women fear isn’t the mechanism. Some people notice a pound or two on the scale in week one; that’s muscle hydration, and it’s part of how the supplement works."),
    lead('“It’ll make me bulky.” ', "Covered above — muscle bulk is built with years of heavy training and caloric surplus. Creatine makes the training a few percent more productive. A few percent of “toned” is more toned."),
    lead('“It’s bad for your kidneys.” ', "In healthy people, decades of research at standard doses show no kidney harm — this myth grew from confusing creatine with creatinine (a lab marker) plus a few case reports in people with pre-existing kidney disease. If you have kidney disease, this supplement is genuinely not for you without a doctor’s sign-off. Everyone else: the safety record is among the best of any supplement."),
    lead('“Women need special ‘women’s creatine.’” ', "No. Creatine monohydrate is creatine monohydrate. Pink labels charge more for the same molecule — the only differences worth paying for are third-party testing and format."),

    h2('How to Take It'),
    bullet([s('Dose: ', ['strong']), s("3–5g of creatine monohydrate daily. Skip the “loading phase” — it just gets you saturated a week faster with more GI grumbling.")]),
    bullet([s('When: ', ['strong']), s("whenever you’ll remember. Timing effects are trivial compared to consistency effects.")]),
    bullet([s('How long: ', ['strong']), s("stores take three to four weeks to saturate. Judge it at week six, not day four.")]),
    bullet([s('With what: ', ['strong']), s("anything. Coffee, smoothie, water. The “caffeine cancels creatine” claim comes from one 1996 study nobody has convincingly replicated.")]),
    bullet([s('Drink water', ['strong']), s(" — your muscles are literally storing more of it.")]),
    p([s("Skip it (or ask your doctor first) if you have kidney disease, are pregnant or nursing (not enough data, not worth it), or are under 18.")]),

    h2('The Best Creatine for Women in 2026'),
    p([thorne.span, s(' — best overall.', ['strong']), s(" NSF Certified for Sport (third-party tested batch by batch), micronized for easier mixing, single-ingredient, from a brand practitioners actually use. At around $44 for 90 servings it’s pricier than commodity creatine — you’re paying for the testing, which for a daily-forever supplement is the right thing to pay for.")], [thorne.def]),
    p([create.span, s(' — best if powder is why you’ll quit.', ['strong']), s(" The honest case for gummies: the best creatine is the one you take daily, and 1.5g gummies you actually enjoy beat a tub gathering dust. The honest case against: you’ll pay roughly triple per gram, and hitting 3g means multiple gummies. A compliance tool, priced like one.")], [create.def]),
    p([on.span, s(' — the reliable middle.', ['strong']), s(" The 56,000-review standby from a legacy brand; banned-substance tested; about $16 for 60 servings. If THORNE feels precious and bulk bags feel sketchy, this is the sensible default.")], [on.def]),
    p([nutricost.span, s(' — best value.', ['strong']), s(" Around $21 for 100 servings — about 21 cents a day. Third-party tested, no frills, 58,000 reviews. The pick if you’ve decided creatine is a lifetime habit and want the per-gram math to reflect that.")], [nutricost.def]),

    h2('Creatine by Life Stage'),
    p([
      s('In your 20s and 30s', ['strong']),
      s(", creatine is a training amplifier — the strength and lean-mass research applies most directly, and starting the habit early means never fighting the low-baseline problem. "),
      s('Vegetarians and vegans', ['strong']),
      s(" of any age are the special case: with near-zero dietary creatine, studies show the largest supplementation responses — both muscular and cognitive — in exactly this group. If you’re plant-based and lifting, creatine is arguably the single highest-value supplement available to you. "),
      s('In your 40s and through perimenopause', ['strong']),
      s(", the calculus shifts from performance to preservation: muscle mass declines roughly 3–8% per decade after 30 and accelerates as estrogen falls, and estrogen’s decline also affects the pathways creatine supports. This is where the bone-density and mood research is concentrated, and why women’s-health researchers have become the loudest voices in creatine science. "),
      s('Post-menopause', ['strong']),
      s(", creatine plus twice-weekly resistance training is one of the better-evidenced combinations for maintaining the strength that keeps falls, fractures, and frailty at bay — the stakes stop being aesthetic and start being independence."),
    ]),

    h2('FAQ'),
    h3('Will creatine make me gain weight?'),
    p([s("Expect one to three pounds of intramuscular water in the first weeks — that’s the mechanism working, not fat gain. Clothes fit the same or better.")]),
    h3('Can I take creatine while trying to lose weight?'),
    p([s("Yes — it helps preserve muscle and training quality in a calorie deficit, which is exactly when muscle is hardest to keep.")]),
    h3('Does creatine help with brain fog?'),
    p([s("Early but growing research suggests cognitive benefits, especially under sleep deprivation and in low-meat diets. It’s a reasonable experiment; it’s not a guarantee.")]),
    h3('Powder or gummies?'),
    p([s("Powder for value and dosing precision; gummies if convenience is the difference between daily and never.")]),

    h2('Final Verdict'),
    p([s("Creatine is arguably the best-evidenced supplement a woman who lifts (or wants to start) can take: meaningful strength support, possible brain and bone benefits, and a safety record most supplements can only envy — for about the price of one latte a month at the value end. Start with 3–5g of tested monohydrate daily and give it six weeks.")]),
    p([s("Building the rest of the foundation? Recovery runs on sleep — our "), magLink.span, s(" covers the mineral side — and if you’re training in summer heat, pair your sessions with the right mix from our "), elecLink.span, s('.')], [magLink.def, elecLink.def]),

    p([s('Disclosure: SpartanShopper participates in the Amazon Associates Program. We may earn a small commission on qualifying purchases at no extra cost to you. This article is for informational purposes only and is not a substitute for professional medical advice.', ['em'])]),
  ]
}

// ── JSON-LD (manual @graph: Article + FAQPage) ────────────────────────────────
const FAQ: [string, string][] = [
  ['Will creatine make me gain weight?', 'Expect one to three pounds of intramuscular water in the first weeks — that is the mechanism working, not fat gain. Clothes fit the same or better.'],
  ['Can I take creatine while trying to lose weight?', 'Yes — it helps preserve muscle and training quality in a calorie deficit, which is exactly when muscle is hardest to keep.'],
  ['Does creatine help with brain fog?', 'Early but growing research suggests cognitive benefits, especially under sleep deprivation and in low-meat diets. It is a reasonable experiment, not a guarantee.'],
  ['Is creatine powder or gummies better?', 'Powder for value and dosing precision; gummies if convenience is the difference between taking it daily and never.'],
]

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Creatine for Women: What It Actually Does (and the Myths That Kept You Away)',
      description: EXCERPT,
      url: `${SITE}/blog/${SLUG}`,
      datePublished: '2026-07-18T00:00:00Z',
      dateModified: '2026-07-18T00:00:00Z',
      author: { '@type': 'Organization', name: 'SpartanShopper', url: SITE },
      publisher: { '@type': 'Organization', name: 'SpartanShopper', url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/logo.png` } },
      image: COVER_CDN,
    },
    { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ],
}, null, 2)

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══ SpartanShopper — Creatine for Women (Article) ═══\n')

  process.stdout.write('  Confirming cover asset… ')
  const asset = await client.fetch<{ _id: string } | null>(`*[_id == $id][0]{ _id }`, { id: COVER_ASSET })
  if (!asset) { console.error('\n  ✗ Cover asset not found.'); process.exit(1) }
  console.log('✓')

  process.stdout.write('  Checking slug… ')
  const existing = await client.fetch<{ _id: string }[]>(`*[_type == "post" && slug.current == $slug]{ _id }`, { slug: SLUG })
  if (existing.length > 0) { console.error(`\n  ✗ Slug "${SLUG}" in use.`); process.exit(1) }
  console.log('✓')

  for (const al of AFFILIATE_LINKS) {
    const dupe = await client.fetch<{ _id: string }[]>(`*[_type == "affiliateLink" && slug.current == $slug]{ _id }`, { slug: al.slug })
    if (dupe.length > 0) { console.log(`  /go/${al.slug} exists — skipping`); continue }
    process.stdout.write(`  Creating /go/${al.slug}… `)
    await client.create({ _id: crypto.randomUUID(), _type: 'affiliateLink', title: al.title, slug: { _type: 'slug', current: al.slug }, destination: al.destination })
    console.log('✓')
  }

  const post = {
    _id: crypto.randomUUID(),
    _type: 'post',
    title: 'Creatine for Women: What It Actually Does (and the Myths That Kept You Away)',
    slug: { _type: 'slug', current: SLUG },
    publishedAt: '2026-07-18T00:00:00Z',
    author: 'SpartanShopper',
    category: 'Reviews',
    relatedCategory: 'health',
    excerpt: EXCERPT,
    coverImage: { _type: 'image', asset: { _type: 'reference', _ref: COVER_ASSET }, alt: COVER_ALT },
    seo: { metaDescription: 'Creatine for women: what studies show for strength, brain fog, and bone health, the bloating myth debunked, plus the best creatine supplements of 2026.' },
    jsonLd,
    body: buildBody(COVER_ASSET),
  }

  process.stdout.write(`  Publishing post: ${SLUG}… `)
  const result = await client.create(post)
  console.log(`✓  ID: ${result._id}`)
  console.log(`\n  Live at: ${SITE}/blog/${SLUG}`)
}

main().catch((err) => { console.error('\n[fatal]', err.message ?? err); process.exit(1) })
