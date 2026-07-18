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
type TableRow = { _type: 'tableRow'; _key: string; cells: string[] }
type TableBlock = { _type: 'table'; _key: string; caption?: string; rows: TableRow[] }

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
function boldLink(text: string, href: string): { span: Span; def: LinkDef } {
  const lk = k(); return { span: s(text, [lk, 'strong']), def: { _key: lk, _type: 'link', href } }
}
function table(caption: string, rows: string[][]): TableBlock {
  return { _type: 'table', _key: k(), caption, rows: rows.map((cells) => ({ _type: 'tableRow', _key: k(), cells })) }
}
const lead = (boldText: string, rest: string): Block => p([s(boldText, ['strong']), s(rest)])

// ── Constants ─────────────────────────────────────────────────────────────────
const SLUG = 'magnesium-l-threonate-vs-glycinate'
const COVER_ASSET = 'image-dbccaece45502d6d4d430cf527bf95c02aa5753a-1448x1086-png'
const COVER_CDN = 'https://cdn.sanity.io/images/eohdr7jw/production/dbccaece45502d6d4d430cf527bf95c02aa5753a-1448x1086.png'
const COVER_ALT = 'Two dishes of magnesium capsules with lavender and sleep mask flat lay on white marble'
const BODY_CAPTION = 'Magnesium supplement capsules beside lavender and a sleep mask on white marble — comparing glycinate for sleep with L-threonate for cognitive support.'
const SITE = 'https://www.spartanshopper.com'
const GO = (slug: string) => `${SITE}/go/${slug}`
const NEUROMAG = 'neuro-mag-threonate', DOUBLEWOOD = 'double-wood-threonate'
const PILLAR = `${SITE}/blog/magnesium-glycinate-for-sleep-the-natural-melatonin-alternative-you-ve-been-looking-for`
const ANXIETY = `${SITE}/blog/magnesium-glycinate-for-sleep-and-anxiety`

const AFFILIATE_LINKS = [
  { slug: NEUROMAG, title: 'Life Extension Neuro-Mag Magnesium L-Threonate — Amazon', destination: 'https://www.amazon.com/dp/B006P536E6?tag=sku18798384-20' },
  { slug: DOUBLEWOOD, title: 'Double Wood Magnesium L-Threonate (Magtein) — Amazon', destination: 'https://www.amazon.com/dp/B07BKPR76B?tag=sku18798384-20' },
]

const EXCERPT = "Two magnesiums, two very different jobs. Glycinate is the sleep workhorse; L-threonate is the pricey newcomer with brain-boosting claims and real-but-early science. Here's how to tell which one your symptoms are actually asking for."

// ── Body ─────────────────────────────────────────────────────────────────────
function buildBody(imageRef: string): (Block | ImageBlock | TableBlock)[] {
  const introGuide = link('guide to magnesium glycinate for sleep', PILLAR)
  const neuromag = boldLink('Life Extension Neuro-Mag', GO(NEUROMAG))
  const doublewood = boldLink('Double Wood Magnesium L-Threonate', GO(DOUBLEWOOD))
  const fullGuide = link('full magnesium sleep guide', PILLAR)
  const anxietyLink = link('magnesium for sleep and anxiety', ANXIETY)

  return [
    p([s("If you’ve read our "), introGuide.span, s(", you know why glycinate became the go-to form for people who want calmer evenings and deeper sleep. But lately a different name keeps showing up in your searches and your supplement aisle: magnesium L-threonate, the form behind Life Extension’s Neuro-Mag — currently sitting on Amazon’s supplement best-seller list at nearly twice glycinate’s price.")], [introGuide.def]),
    p([s('Same mineral. Very different pitch. Here’s the honest comparison.')]),

    img(imageRef, COVER_ALT, BODY_CAPTION),

    p([s('Disclosure: SpartanShopper participates in the Amazon Associates Program. We may earn a small commission on qualifying purchases at no extra cost to you.', ['em'])]),

    h2('The Short Answer'),
    p([s('Glycinate is for your evenings; L-threonate is for your brain.', ['strong']), s(' Magnesium glycinate pairs magnesium with glycine, a calming amino acid, and is the better-supported choice for sleep quality, relaxation, and topping up a genuine magnesium deficiency. Magnesium L-threonate was engineered to cross the blood-brain barrier and raise magnesium levels '), s('in the brain', ['em']), s(', with early research pointing at memory, learning, and cognitive flexibility — but it delivers less elemental magnesium to the rest of your body and costs two to three times more.')]),
    p([s("If you’re choosing your first magnesium: glycinate, almost every time. L-threonate is the specialist’s second supplement, not the generalist’s first.")]),

    h2('What Makes L-Threonate Different'),
    p([s("Most magnesium forms struggle to move the needle inside the brain because the blood-brain barrier tightly regulates mineral transport. L-threonate — developed by MIT researchers and patented as Magtein — uses threonic acid (a vitamin C metabolite) as its carrier, and animal studies showed it raised brain magnesium where other forms didn’t, improving synaptic density and memory performance in aging rats.")]),
    p([s("Human evidence is younger but real: small controlled trials in older adults with cognitive complaints reported improvements in executive function and processing speed — with researchers framing the effect as shaving years off “cognitive age.” Newer trials have also explored sleep quality and daytime alertness with encouraging early results.")]),
    p([s("The honest caveats: the human trials are small, several were industry-funded, and the effects are modest — “sharper on demanding days,” not “limitless.” The research shows genuine promise; it has not yet shown the kind of replicated, large-trial certainty glycinate’s sleep-and-relaxation use enjoys for deficiency-related symptoms.")]),

    h2('What Glycinate Still Does Better'),
    bullet([s('More elemental magnesium per dose.', ['strong']), s(' Threonate is a bulky molecule — a full three-capsule serving of Neuro-Mag delivers only ~144mg elemental magnesium, versus 200–400mg from a typical glycinate dose. For correcting the widespread shortfall in dietary magnesium, glycinate is simply more efficient.')]),
    bullet([s('The glycine bonus.', ['strong']), s(' Glycine itself has evidence for improving sleep quality — glycinate is a two-for-one evening formula.')]),
    bullet([s('Gentleness at full dose.', ['strong']), s(' Both forms are easy on the stomach (unlike citrate or oxide), but glycinate’s track record at higher doses is longer.')]),
    bullet([s('Price.', ['strong']), s(' Two to three times cheaper per month. For a supplement you’ll take indefinitely, that compounds.')]),

    h2('Head to Head'),
    table('Magnesium glycinate vs. L-threonate at a glance', [
      ['', 'Glycinate', 'L-Threonate'],
      ['Primary use', 'Sleep, relaxation, deficiency', 'Memory, cognition'],
      ['Elemental Mg/dose', 'High (200–400mg)', 'Low (~144mg)'],
      ['Brain penetration', 'Standard', 'Enhanced (the whole point)'],
      ['Human evidence', 'Extensive for form + use', 'Small, early, promising'],
      ['Stomach comfort', 'Excellent', 'Excellent'],
      ['Monthly cost', '~$10–15', '~$28–40'],
      ['Take it', 'Evening', 'Morning or split'],
    ]),

    h2('Can You Take Both?'),
    p([s("Yes — and this is quietly how many people in the longevity crowd actually use them: glycinate in the evening for sleep, a smaller threonate dose in the morning for the cognitive angle. Total elemental magnesium stays comfortably under the supplemental ceiling (350mg/day from supplements is the standard conservative guidance — your food doesn’t count toward it). If you try both, add one at a time, two weeks apart, so you know what’s doing what.")]),
    p([s("As always: magnesium supplements interact with certain antibiotics, bisphosphonates, and blood pressure medications, and anyone with kidney disease should not supplement without medical guidance.")]),

    h2('Which L-Threonate to Buy'),
    p([neuromag.span, s(' — the standard.', ['strong']), s(" The best-selling threonate on Amazon (24,000+ reviews), built on the patented Magtein form used in the actual studies, from a brand with unusually good testing practices. Capsules or a powdered drink-mix version if three capsules feels like a chore.")], [neuromag.def]),
    p([doublewood.span, s(' — the value alternative.', ['strong']), s(" Also Magtein inside, third-party tested, typically meaningfully cheaper per month. Fewer frills, same molecule.")], [doublewood.def]),
    p([s('For glycinate picks, dosage detail, and the melatonin comparison, the '), fullGuide.span, s(' has you covered — and if racing thoughts are the specific enemy, our '), anxietyLink.span, s(' deep-dive is the companion read.')], [fullGuide.def, anxietyLink.def]),

    h2('Where the Other Forms Fit'),
    p([
      s('Since the supplement aisle won’t stop at two: '),
      s('citrate', ['strong']), s(' is the affordable all-rounder with decent absorption and a mild laxative lean — fine for general use, counterproductive if loose digestion is already your baseline. '),
      s('Oxide', ['strong']), s(', the gas-station form, is poorly absorbed and mostly useful as a laxative; if your current magnesium “isn’t doing anything,” check the label for this first. '),
      s('Malate', ['strong']), s(' gets picked for daytime energy support, '),
      s('taurate', ['strong']), s(' shows up in heart-health stacks, and '),
      s('chloride sprays', ['strong']), s(' absorb too little to matter despite the marketing. The practical hierarchy for this article’s readers stays simple: glycinate for the body and evenings, threonate for the brain, citrate if budget rules, and oxide for nobody.'),
    ]),

    h2('Signs You’re Low on Magnesium in the First Place'),
    p([s("Roughly half of Americans under-consume magnesium, and the early signals are unglamorous: muscle twitches and eyelid flutters, night-time leg cramps, tension that lives in your shoulders, restless unrefreshing sleep, and craving chocolate (cocoa is one of the richest food sources — your body has good instincts). Food fixes matter more than capsules: pumpkin seeds, almonds, spinach, black beans, and dark chocolate carry serious amounts. The supplement’s job is closing the gap between a decent diet and your actual need — which rises with sweat, stress, alcohol, and certain medications like PPIs and diuretics. If several of those describe you, that’s the deficiency picture where any well-absorbed form helps noticeably, and the glycinate-vs-threonate question becomes the refinement, not the foundation.")]),

    h2('FAQ'),
    h3('Is magnesium L-threonate better than glycinate?'),
    p([s('Better '), s('at reaching the brain', ['em']), s(', per early research. Worse at efficiently supplying magnesium to the rest of you, and pricier. Different tools.')]),
    h3('Does L-threonate help sleep?'),
    p([s("Some early trial data and plenty of anecdotes say it can improve sleep quality — but glycinate remains the better-supported, cheaper first choice for sleep specifically.")]),
    h3('How long does L-threonate take to work?'),
    p([s("The human studies ran 6–12 weeks. Give it at least a month before judging, ideally with something measurable (word-recall games, task focus) rather than vibes.")]),
    h3('Can L-threonate cause side effects?'),
    p([s("It’s well tolerated; the most commonly reported effects are mild headache or drowsiness in the first days, which usually resolve. Taking it with food helps.")]),

    h2('Final Verdict'),
    p([s('Buy '), s('glycinate', ['strong']), s(' if your problem lives in the evening: poor sleep, tension, restless nights. Add or switch to '), s('L-threonate', ['strong']), s(' only if your problem lives in the daytime — word-finding, focus, mental stamina — and you’ve already got the sleep foundation handled. The research on threonate is genuinely exciting; just remember that no capsule out-performs the free interventions it sits on top of: sleep, movement, and eating like you mean it.')]),

    p([s('Disclosure: SpartanShopper participates in the Amazon Associates Program. We may earn a small commission on qualifying purchases at no extra cost to you. This article is for informational purposes only and is not a substitute for professional medical advice.', ['em'])]),
  ]
}

// ── JSON-LD (manual @graph: Article + FAQPage) ────────────────────────────────
const FAQ: [string, string][] = [
  ['Is magnesium L-threonate better than glycinate?', 'Better at reaching the brain, per early research. Worse at efficiently supplying magnesium to the rest of you, and pricier. They are different tools.'],
  ['Does magnesium L-threonate help sleep?', 'Some early trial data and plenty of anecdotes say it can improve sleep quality — but glycinate remains the better-supported, cheaper first choice for sleep specifically.'],
  ['How long does magnesium L-threonate take to work?', 'The human studies ran 6–12 weeks. Give it at least a month before judging, ideally with something measurable (word-recall games, task focus) rather than vibes.'],
  ['Can magnesium L-threonate cause side effects?', 'It is well tolerated; the most commonly reported effects are mild headache or drowsiness in the first days, which usually resolve. Taking it with food helps.'],
]

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Magnesium L-Threonate vs Glycinate: Which One Do You Actually Need?',
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
  console.log('═══ SpartanShopper — Magnesium L-Threonate vs Glycinate (Article) ═══\n')

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
    title: 'Magnesium L-Threonate vs Glycinate: Which One Do You Actually Need?',
    slug: { _type: 'slug', current: SLUG },
    publishedAt: '2026-07-18T00:00:00Z',
    author: 'SpartanShopper',
    category: 'Reviews',
    relatedCategory: 'health',
    excerpt: EXCERPT,
    coverImage: { _type: 'image', asset: { _type: 'reference', _ref: COVER_ASSET }, alt: COVER_ALT },
    seo: { metaDescription: 'Magnesium L-threonate vs glycinate: one aids sleep, one targets memory. How they differ, what studies show, and which form fits your symptoms in 2026.' },
    jsonLd,
    body: buildBody(COVER_ASSET),
  }

  process.stdout.write(`  Publishing post: ${SLUG}… `)
  const result = await client.create(post)
  console.log(`✓  ID: ${result._id}`)
  console.log(`\n  Live at: ${SITE}/blog/${SLUG}`)
}

main().catch((err) => { console.error('\n[fatal]', err.message ?? err); process.exit(1) })
