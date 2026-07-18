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
function link(text: string, href: string): { span: Span; def: LinkDef } {
  const lk = k(); return { span: s(text, [lk]), def: { _key: lk, _type: 'link', href } }
}
function img(ref: string, alt: string, caption: string): ImageBlock {
  return { _type: 'image', _key: k(), asset: { _type: 'reference', _ref: ref }, alt, caption }
}
function table(caption: string, rows: string[][]): TableBlock {
  return { _type: 'table', _key: k(), caption, rows: rows.map((cells) => ({ _type: 'tableRow', _key: k(), cells })) }
}
const lead = (boldText: string, rest: string): Block => p([s(boldText, ['strong']), s(rest)])

// ── Constants ─────────────────────────────────────────────────────────────────
const SLUG = 'best-electrolyte-powder'
const COVER_ASSET = 'image-6acea93e0baf8dc3bd8e67466f0faad7add79ab5-1448x1086-png'
const COVER_ALT = 'Electrolyte powder packets and glass of citrus water flat lay on white marble'
const BODY_CAPTION = 'Electrolyte powder stick packs beside a glass of water with citrus — comparing hydration mixes by sodium, sugar, and serving cost.'
const SITE = 'https://www.spartanshopper.com'
const GO = (slug: string) => `${SITE}/go/${slug}`
const LMNT = 'lmnt-electrolytes', LIV = 'liquid-iv', ULTIMA = 'ultima-replenisher', NUUN = 'nuun-sport', RELYTE = 'redmond-relyte'
const MAG_URL = `${SITE}/blog/magnesium-glycinate-for-sleep-the-natural-melatonin-alternative-you-ve-been-looking-for`

const AFFILIATE_LINKS = [
  { slug: LMNT, title: 'LMNT Zero Sugar Electrolytes — Amazon', destination: 'https://www.amazon.com/dp/B0F8R8D9M7?tag=sku18798384-20' },
  { slug: LIV, title: 'Liquid I.V. Hydration Multiplier — Amazon', destination: 'https://www.amazon.com/dp/B01IT9NLHW?tag=sku18798384-20' },
  { slug: ULTIMA, title: 'Ultima Replenisher Variety — Amazon', destination: 'https://www.amazon.com/dp/B08XQZX9K3?tag=sku18798384-20' },
  { slug: NUUN, title: 'Nuun Sport Electrolyte Tablets — Amazon', destination: 'https://www.amazon.com/dp/B0CYJKKLZB?tag=sku18798384-20' },
  { slug: RELYTE, title: 'Redmond Re-Lyte Electrolyte Mix — Amazon', destination: 'https://www.amazon.com/dp/B088GJ7VK6?tag=sku18798384-20' },
]

const EXCERPT = "Half the electrolyte powders on Amazon are candy with a salt shaker's worth of minerals. The other half could make a cardiologist wince. Here's how the five best sellers actually differ — and how to pick the right one for how you actually sweat."

// ── Body ─────────────────────────────────────────────────────────────────────
function buildBody(imageRef: string): (Block | ImageBlock | TableBlock)[] {
  const ctaLmnt = link('See how much it is right now', GO(LMNT))
  const ctaLiv = link('Check the current price', GO(LIV))
  const ctaUltima = link('See if it’s still this price', GO(ULTIMA))
  const ctaNuun = link('Check availability', GO(NUUN))
  const ctaRelyte = link('See the current price', GO(RELYTE))
  const magLink = link('magnesium glycinate for sleep', MAG_URL)

  return [
    p([s("The best electrolyte powder for you depends on one number nobody puts on the front of the packet: how much sodium you actually lose. Get that wrong in either direction and you’ve either bought expensive flavored water or a salt bomb you didn’t need. This summer, electrolyte mixes are dominating Amazon’s entire supplement category — seven of the top thirty best sellers as I write this — which means more choices and more marketing fog than ever.")]),
    p([s("Here’s the honest breakdown of the five that dominate the category, by the numbers that matter: sodium, sugar, and cost per serving.")]),

    img(imageRef, COVER_ALT, BODY_CAPTION),

    p([s('Disclosure: SpartanShopper participates in the Amazon Associates Program. We may earn a small commission on qualifying purchases at no extra cost to you.', ['em'])]),

    h2('First: Do You Even Need One?'),
    p([s("If you drink water and eat normal food, your electrolytes are probably fine for everyday life. The research is clear that electrolyte replacement earns its keep in specific situations: workouts over an hour (especially in heat), heavy sweating, low-carb or fasting protocols where sodium excretion increases, illness with fluid loss, long flights, and — no judgment — rough mornings after a night out.")]),
    p([s("If none of those describe your week, save the money. If several do, the right mix genuinely helps — studies consistently show sodium-containing fluids restore hydration status faster than water alone after significant sweat loss.")]),

    h2('The Two Philosophies: High-Sodium vs. Low-and-Light'),
    p([s("Modern electrolyte products split into two camps. The high-sodium camp (LMNT, Re-Lyte) follows the newer sports-science thinking: sweat is mostly sodium loss, so replace it aggressively — 800–1,000mg per serving — with zero sugar. The low-and-light camp (Ultima, Nuun) offers 55–300mg sodium with broader trace minerals, aimed at everyday sippers rather than heavy sweaters. Liquid I.V. sits in its own lane: moderate sodium plus sugar, on purpose, because glucose actively speeds water absorption (the same oral-rehydration principle the WHO uses).")]),
    p([s('None of these is “best.” They’re tools for different jobs.')]),

    h2('Quick Comparison'),
    table('The five best-selling electrolyte mixes by the numbers', [
      ['Product', 'Sodium/Serving', 'Sugar', '~Cost/Serving', 'Best For'],
      [`LMNT||${GO(LMNT)}`, '1,000mg', '0g', '~$1.50', 'Heavy sweaters, keto, fasting'],
      [`Liquid I.V.||${GO(LIV)}`, '500mg', '11g', '~$1.45', 'Rapid rehydration, illness, travel'],
      [`Ultima||${GO(ULTIMA)}`, '55mg', '0g', '~$1.05', 'Daily flavor-water upgrade'],
      [`Nuun Sport||${GO(NUUN)}`, '300mg', '1g', '~$0.52', 'Workouts, portability, fizz fans'],
      [`Re-Lyte||${GO(RELYTE)}`, '810mg', '0g', '~$0.75', 'LMNT results at a better price'],
    ]),

    h2('1. LMNT — Best for Heavy Sweaters and Low-Carb Lifestyles'),
    p([s("The category’s cult favorite, now its overall best seller. Each stick delivers 1,000mg sodium, 200mg potassium, and 60mg magnesium with zero sugar and no filler ingredients. The formulation is built on the argument that conventional sports drinks dramatically under-replace sodium.")]),
    lead('Why it leads: ', "if you train hard, sweat heavily, sit in saunas, or eat keto/low-carb (where the kidneys dump sodium), LMNT’s dosing matches your actual losses. The salty-sweet flavors are polarizing at first and then weirdly addictive — raspberry and citrus lead the lineup."),
    lead('The honest catch: ', "1,000mg of sodium is a therapeutic dose for sweat loss, not a desk-day sipper. If you’re sedentary, have hypertension, or are sodium-sensitive, this is the wrong product — and it’s the most expensive per serving here."),
    p([ctaLmnt.span], [ctaLmnt.def]),

    h2('2. Liquid I.V. — Best for Rapid Rehydration'),
    p([s("The mainstream giant, with over 113,000 reviews. Liquid I.V.’s pitch is “Cellular Transport Technology,” which is marketing language for a real thing: a precise glucose-sodium ratio that accelerates water uptake through the gut wall — the same mechanism behind medical oral rehydration solutions.")]),
    lead('Why it’s here: ', "when you’re genuinely depleted — stomach bug, food poisoning, a long-haul flight, a brutal hangover — the sugar isn’t a flaw, it’s the mechanism. This is the one to keep in the medicine cabinet rather than the gym bag."),
    lead('The honest catch: ', "11g of sugar per stick is 11g of sugar, every day, if you make it a habit. For daily use, the sugar-free version exists but relies on the sodium alone, which undercuts the absorption pitch. Use the original as a recovery tool, not a beverage."),
    p([ctaLiv.span], [ctaLiv.def]),

    h2('3. Ultima Replenisher — Best Everyday Sipper'),
    p([s("The gentlest option: 55mg sodium, six electrolytes and trace minerals, zero sugar, zero calories, plant-based sweetening, and the best flavor variety of the group (the variety stickpack is the smart first buy).")]),
    lead('Why it’s here: ', "most people buying electrolyte powder aren’t marathoners — they’re people who won’t drink plain water but will happily drink grape-flavored water. Ultima makes that habit cheap and harmless, with a modest mineral bonus. Popular with the same 30–55 women’s wellness audience that drives its 20,000+ reviews."),
    lead('The honest catch: ', "55mg of sodium will not rehydrate you after real sweat loss. This is a hydration habit product, not a hydration repair product. Buy it for taste, not therapy."),
    p([ctaUltima.span], [ctaUltima.def]),

    h2('4. Nuun Sport — Best for Workouts and Travel'),
    p([s("The tablet format is the quiet advantage: a tube of ten fizzy tabs weighs nothing, survives a gym bag, and turns any water bottle into a sports drink with a satisfying fizz. 300mg sodium hits the sweet spot for sub-two-hour workouts, with only 1g of sugar.")]),
    lead('Why it’s here: ', "at roughly 52 cents a serving, it’s the value pick of the legitimate sports options, and the effervescent format genuinely encourages drinking more. Vegan, gluten-free, Informed Sport certified — the box-checker of the category."),
    lead('The honest catch: ', "tablets take a minute to dissolve and the fizz isn’t for everyone. Flavor intensity is mild — if you want flavor flavor, Ultima wins."),
    p([ctaNuun.span], [ctaNuun.def]),

    h2('5. Redmond Re-Lyte — Best Value in the High-Sodium Camp'),
    p([s("From the Utah company behind Real Salt, Re-Lyte delivers 810mg sodium from unrefined ancient sea salt plus potassium, magnesium, and calcium — LMNT’s philosophy at roughly half the per-serving price when bought as a canister.")]),
    lead('Why it’s here: ', "functionally, this is the budget LMNT, and the mixed-berry and strawberry-lemonade flavors are (whisper it) arguably better. The unrefined-salt angle also brings trace minerals the lab-formulated competitors skip."),
    lead('The honest catch: ', "the scoop-from-canister format is less travel-friendly than sticks, and the brand’s crunchy wellness marketing occasionally outruns the evidence. Judge it on the mineral panel, which is excellent."),
    p([ctaRelyte.span], [ctaRelyte.def]),

    h2('Signs You’re Actually Running Low'),
    p([s("Electrolyte marketing thrives on vague symptoms, so here’s the honest checklist. Genuine low-sodium signals during or after heavy sweating: headache that water doesn’t touch, lightheadedness on standing, muscle cramps, unusual fatigue mid-workout, and — the classic — white salt crust on your hat brim or shirt after training. If you finish long hot workouts with crusted salt lines, you’re a “salty sweater,” and you’re the person the high-sodium camp was built for.")]),
    p([s("Low potassium and magnesium rarely announce themselves through workouts; they build from diet over time (few vegetables, few nuts and beans) and show up as cramping, twitching eyelids, and poor sleep. A powder helps at the margins, but it’s worth saying plainly: no stick pack out-supplements an actual banana-and-vegetables habit. And persistent symptoms deserve a doctor and a blood panel, not a bigger canister.")]),

    h2('The Detail That Matters for Women 30–55'),
    p([s("Since most of you reading this are women — a few specifics the packaging never mentions. Estrogen and progesterone shifts across the monthly cycle measurably affect fluid and sodium regulation; many women find sweat rate and cramping risk climb in the high-hormone luteal phase, making pre-workout electrolytes more useful in the ten days before a period than the ten after. Perimenopause adds its own wrinkle: night sweats and hot flashes are genuine fluid-and-sodium losses, and several of the “why do I feel wrung out every morning” stories in these products’ reviews read exactly like unreplaced overnight sweat. A modest-sodium option (Nuun, or half a high-sodium stick) in the morning is a low-risk experiment worth trying. During pregnancy or breastfeeding, hydration needs rise — but run any daily electrolyte habit past your OB first, since sodium targets get individual fast.")]),

    h2('The DIY Option, Honestly'),
    p([s("You can make a functional electrolyte drink for pennies: a quarter teaspoon of salt, a squeeze of citrus, optionally a little sugar and a magnesium capsule cracked into a liter of water. It works. Almost nobody sticks with it, because it tastes like penance and requires measuring at 6 a.m. The commercial products’ real value isn’t secret minerals — it’s flavor engineering good enough that you’ll actually do the habit. Pay for it or don’t, but be honest with yourself about which version of you shows up on a Tuesday.")]),

    h2('How to Choose'),
    p([s('Ask two questions. '), s('How much do you sweat?', ['strong']), s(' An hour-plus of hard training, hot climates, sauna habits, or physical work: go high-sodium (LMNT or Re-Lyte). Casual workouts: Nuun. Barely breaking a sweat: Ultima, or honestly, water. '), s('Is this for a moment or a habit?', ['strong']), s(' Acute depletion (illness, travel, the morning after): Liquid I.V. Daily use: anything zero-sugar.')]),
    p([s("One safety note worth repeating: if you have high blood pressure, kidney disease, or take medications affecting sodium or potassium balance, talk to your doctor before adding a high-sodium mix — 1,000mg per stick is a meaningful dietary change, not a flavor choice.")]),

    h2('FAQ'),
    h3('What’s the best electrolyte powder overall?'),
    p([s("For genuine sweat replacement, LMNT — with Re-Lyte as the value alternative. For everyday sipping, Ultima. There’s no single winner because sodium needs vary tenfold between users.")]),
    h3('Are electrolyte powders safe every day?'),
    p([s("The zero-sugar, moderate-sodium options are fine daily for most healthy people. Daily 1,000mg-sodium sticks make sense only if you’re actually losing that much through sweat or a low-carb diet.")]),
    h3('Electrolyte powder vs. sports drinks like Gatorade?'),
    p([s("Powders beat bottled sports drinks on cost, sugar control, and sodium dosing flexibility. Gatorade’s 160mg sodium and 34g sugar per bottle is the worst of both worlds for most adults.")]),
    h3('Do electrolytes help with hangovers?'),
    p([s("They help with the dehydration component — Liquid I.V.’s glucose-sodium combo is the best suited of this group. Nothing here fixes the rest of the damage.")]),
    h3('Can kids have electrolyte powder?'),
    p([s("For illness-related rehydration, pediatric formulas (Pedialyte) are dosed for small bodies — use those, not adult sticks, and loop in your pediatrician. The adult high-sodium products are genuinely inappropriate for children.")]),
    h3('Do electrolytes break a fast?'),
    p([s("The zero-sugar options (LMNT, Re-Lyte, Ultima, Nuun) contain no meaningful calories and are broadly considered fast-safe — fasting communities practically run on them, since sodium needs rise when insulin drops. Liquid I.V.’s 11g of sugar, on the other hand, is unambiguously food.")]),
    h3('Why do I feel better within minutes of drinking one?'),
    p([s("Partly real (sodium restores blood volume quickly when you’re depleted), partly the placebo-flavored ritual of drinking anything cold and salty-sweet. Both count. Just make sure the habit is solving a real loss and not just an acquired taste at $1.50 a stick.")]),

    h2('Final Verdict'),
    p([s('LMNT', ['strong']), s(' if you sweat like you mean it, '), s('Re-Lyte', ['strong']), s(' for the same physiology on a budget, '), s('Liquid I.V.', ['strong']), s(' for the medicine cabinet, '), s('Nuun', ['strong']), s(' for the gym bag, and '), s('Ultima', ['strong']), s(' for the desk. Hydration pairs with everything else your body’s asking for — if better sleep is on that list too, our guide to '), magLink.span, s(' covers the mineral these mixes only gesture at.')], [magLink.def]),

    p([s('Disclosure: SpartanShopper participates in the Amazon Associates Program. We may earn a small commission on qualifying purchases at no extra cost to you. This article is for informational purposes only and is not a substitute for professional medical advice.', ['em'])]),
  ]
}

// ── JSON-LD (manual @graph: ItemList + FAQPage). No ratings/prices yet — awaiting listing data. ──
const PRODUCTS = [
  { name: 'LMNT Zero Sugar Electrolytes', brand: 'LMNT', image: 'https://m.media-amazon.com/images/I/71W9ckcA79L._AC_SX679_.jpg', url: GO(LMNT), description: 'Zero-sugar high-sodium electrolyte mix — 1,000mg sodium, 200mg potassium, 60mg magnesium per stick. Built for heavy sweaters, keto, and fasting.' },
  { name: 'Liquid I.V. Hydration Multiplier', brand: 'Liquid I.V.', image: 'https://m.media-amazon.com/images/I/71uzLBMH8ZL._AC_SX679_.jpg', url: GO(LIV), description: 'Hydration Multiplier with a glucose-sodium ratio (500mg sodium, 11g sugar) that speeds water absorption — best for acute rehydration, illness, and travel.' },
  { name: 'Ultima Replenisher', brand: 'Ultima', image: 'https://m.media-amazon.com/images/I/711WJgJ7LzL._AC_SX679_.jpg', url: GO(ULTIMA), description: 'Zero-sugar, zero-calorie everyday sipper — 55mg sodium plus six electrolytes and trace minerals, with the best flavor variety of the group.' },
  { name: 'Nuun Sport Electrolyte Tablets', brand: 'Nuun', image: 'https://m.media-amazon.com/images/I/81tXNugiNHL._AC_SX679_.jpg', url: GO(NUUN), description: 'Effervescent electrolyte tablets — 300mg sodium, 1g sugar, Informed Sport certified. The portable value pick for sub-two-hour workouts.' },
  { name: 'Redmond Re-Lyte Electrolyte Mix', brand: 'Redmond', image: 'https://m.media-amazon.com/images/I/61ugYB-3-eL._AC_SX679_.jpg', url: GO(RELYTE), description: 'High-sodium mix from Redmond Real Salt — 810mg sodium plus potassium, magnesium, and calcium from unrefined sea salt. LMNT’s philosophy at a lower per-serving cost.' },
]

const FAQ: [string, string][] = [
  ['What is the best electrolyte powder overall?', 'For genuine sweat replacement, LMNT — with Re-Lyte as the value alternative. For everyday sipping, Ultima. There is no single winner because sodium needs vary tenfold between users.'],
  ['Are electrolyte powders safe every day?', 'The zero-sugar, moderate-sodium options are fine daily for most healthy people. Daily 1,000mg-sodium sticks make sense only if you are actually losing that much through sweat or a low-carb diet.'],
  ['Electrolyte powder vs. sports drinks like Gatorade — which is better?', 'Powders beat bottled sports drinks on cost, sugar control, and sodium dosing flexibility. Gatorade’s 160mg sodium and 34g sugar per bottle is the worst of both worlds for most adults.'],
  ['Do electrolytes help with hangovers?', 'They help with the dehydration component — Liquid I.V.’s glucose-sodium combo is the best suited of this group. Nothing here fixes the rest of the damage.'],
  ['Can kids have electrolyte powder?', 'For illness-related rehydration, pediatric formulas (Pedialyte) are dosed for small bodies — use those, not adult sticks, and loop in your pediatrician. The adult high-sodium products are genuinely inappropriate for children.'],
  ['Do electrolytes break a fast?', 'The zero-sugar options (LMNT, Re-Lyte, Ultima, Nuun) contain no meaningful calories and are broadly considered fast-safe, since sodium needs rise when insulin drops. Liquid I.V.’s 11g of sugar, on the other hand, is unambiguously food.'],
  ['Why do I feel better within minutes of drinking an electrolyte mix?', 'Partly real (sodium restores blood volume quickly when you are depleted), partly the ritual of drinking anything cold and salty-sweet. Both count. Just make sure the habit is solving a real loss and not just an acquired taste.'],
]

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ItemList',
      name: 'Best Electrolyte Powder 2026',
      description: EXCERPT,
      url: `${SITE}/blog/${SLUG}`,
      numberOfItems: PRODUCTS.length,
      itemListElement: PRODUCTS.map((prod, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: prod.name,
          description: prod.description,
          image: prod.image,
          brand: { '@type': 'Brand', name: prod.brand },
          offers: { '@type': 'Offer', priceCurrency: 'USD', availability: 'https://schema.org/InStock', url: prod.url },
        },
      })),
    },
    { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ],
}, null, 2)

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══ SpartanShopper — Best Electrolyte Powder 2026 (roundup) ═══\n')

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
    title: 'Best Electrolyte Powder 2026: 5 Mixes Actually Worth Your Money',
    slug: { _type: 'slug', current: SLUG },
    publishedAt: '2026-07-18T00:00:00Z',
    author: 'SpartanShopper',
    category: 'Reviews',
    relatedCategory: 'health',
    excerpt: EXCERPT,
    coverImage: { _type: 'image', asset: { _type: 'reference', _ref: COVER_ASSET }, alt: COVER_ALT },
    seo: { metaDescription: 'The best electrolyte powder in 2026, compared by sodium, sugar, and cost: LMNT, Liquid I.V., Ultima, Nuun, and Re-Lyte — and which fits your routine.' },
    jsonLd,
    body: buildBody(COVER_ASSET),
  }

  process.stdout.write(`  Publishing post: ${SLUG}… `)
  const result = await client.create(post)
  console.log(`✓  ID: ${result._id}`)
  console.log(`\n  Live at: ${SITE}/blog/${SLUG}`)
}

main().catch((err) => { console.error('\n[fatal]', err.message ?? err); process.exit(1) })
