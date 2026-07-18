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
type Block = {
  _type: 'block'; _key: string; style: string
  children: Span[]; markDefs: LinkDef[]
  listItem?: 'bullet' | 'number'; level?: number
}
type ImageBlock = {
  _type: 'image'; _key: string
  asset: { _type: 'reference'; _ref: string }
  alt?: string; caption?: string
}
type TableRow = { _type: 'tableRow'; _key: string; cells: string[] }
type TableBlock = { _type: 'table'; _key: string; caption?: string; rows: TableRow[] }

const s = (text: string, marks: string[] = []): Span =>
  ({ _type: 'span', _key: k(), text, marks })

const p = (spans: Span[], defs: LinkDef[] = []): Block =>
  ({ _type: 'block', _key: k(), style: 'normal', children: spans, markDefs: defs })

const h2 = (text: string): Block =>
  ({ _type: 'block', _key: k(), style: 'h2', children: [s(text)], markDefs: [] })

const bullet = (spans: Span[], defs: LinkDef[] = []): Block =>
  ({ _type: 'block', _key: k(), style: 'normal', listItem: 'bullet', level: 1, children: spans, markDefs: defs })

function link(text: string, href: string): { span: Span; def: LinkDef } {
  const lk = k()
  return { span: s(text, [lk]), def: { _key: lk, _type: 'link', href } }
}

function img(ref: string, alt: string, caption: string): ImageBlock {
  return { _type: 'image', _key: k(), asset: { _type: 'reference', _ref: ref }, alt, caption }
}

function table(caption: string, rows: string[][]): TableBlock {
  return {
    _type: 'table', _key: k(), caption,
    rows: rows.map((cells) => ({ _type: 'tableRow', _key: k(), cells })),
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GO = 'https://www.spartanshopper.com/go/medicube-kojic-body-wash'
const KOREAN_GUIDE = 'https://www.spartanshopper.com/blog/best-korean-skincare-products-2026'
const COVER_ASSET = 'image-a82f7d42fc72338d1b4c1e016fde9ac9ada5b6bb-1448x1086-png'
const COVER_ALT = 'Kojic acid turmeric body wash bottle with turmeric root flat lay on white marble'
const BODY_CAPTION =
  "medicube Kojic Acid Turmeric Body Wash bottle with turmeric root and lathered washcloth on white marble — K-beauty's take on the classic brightening soap."
const SLUG = 'medicube-kojic-acid-body-wash-review'

// ── Body ─────────────────────────────────────────────────────────────────────

function buildBody(imageRef: string): (Block | ImageBlock | TableBlock)[] {
  const cta1 = link('See how much it is right now', GO)
  const cta2 = link('see how much it is right now', GO)
  const koreanLink = link('the Korean skincare guide', KOREAN_GUIDE)

  return [
    // Verdict up front
    p([s("The verdict up front: medicube's Kojic Acid Turmeric Brightening Body Wash is the most convenient way to get kojic acid into a daily routine, the formula is smarter than the classic bars, and at around $15 it's fairly priced for what it is. It is not faster than the bars — wash-off kojic acid is a slow game no matter the format — and if maximum strength per dollar is your only metric, a $7 bar of Kojie San still wins. This is the comfort-and-consistency pick, and consistency is what actually fades dark spots.")]),

    img(imageRef, COVER_ALT, BODY_CAPTION),

    // Disclosure BEFORE the first affiliate link (Amazon Associates requirement)
    p([s('Disclosure: SpartanShopper participates in the Amazon Associates Program. We may earn a small commission on qualifying purchases at no extra cost to you.', ['em'])]),

    p([s('Now the details.')]),

    h2('What It Is'),
    p([s("medicube is the Korean skincare brand currently steamrolling Amazon's beauty best-seller list — their toner pads and collagen creams hold multiple top-ten spots. This body wash is their entry into the kojic acid category that Southeast Asian brands have owned for decades: a 13.5oz pump-style shower gel promising brightening for uneven tone, dark spots, and body acne marks, moving over 20,000 bottles a month within months of launch.")]),
    p([s('If the daily-use angle is what sells you, price is the next question. '), cta1.span, s('.')], [cta1.def]),

    h2('The Ingredient List, Analyzed'),
    p([s("The headline pairing is familiar to anyone who's used the classic kojic acid soap bars: kojic acid to slow melanin production in marks, turmeric to calm the inflammation that creates them. What makes the formula genuinely more modern than the bars:")]),
    bullet([s('Niacinamide', ['strong']), s(' — the best-studied brightening ingredient in mainstream skincare, with solid evidence for reducing the transfer of pigment into skin cells. Kojic slows pigment production; niacinamide slows its delivery. Complementary mechanisms, smart stack.')]),
    bullet([s('AHA/BHA blend', ['strong']), s(' — mild chemical exfoliation to lift the stained, dead surface cells faster. This is the piece bar soaps usually skip, and it matters for how quickly you see change.')]),
    bullet([s('Hydrating base', ['strong']), s(' — this is where K-beauty formulation shows. The classic kojic bars are drying enough that Filipinos treat them as short-contact products; this washes like a normal moisturizing shower gel.')]),
    p([s("The honest read on concentrations: medicube doesn't publish percentages, and a rinse-off product spends under a minute on your skin. Expect ingredient-list science at wash-off contact times — real, but gradual.")]),

    h2('What Users Are Actually Saying'),
    p([s('Across the first thousand-plus reviews (4.6 stars as I write this), the consistent patterns:')]),
    p([s('The praise clusters around three things: the scent and lather ("doesn\'t smell like medicine, unlike the bars" comes up a lot), gentleness (no post-shower tightness, which is the classic kojic bar complaint), and gradual improvement in body acne marks and underarm/inner-thigh darkness over four to eight weeks. The complaint clusters: price per wash versus a bar, and a vocal minority seeing nothing after a month — which tracks with rinse-off kinetics and with dark spots that were never kojic-responsive to begin with (older sun damage, melasma).')]),
    p([s("Nobody credible is reporting overnight transformation. That's a point in the reviews' favor, not against.")]),

    h2('medicube vs. the Kojic Bars'),
    table('medicube body wash vs. the classic kojic acid bars', [
      ['Feature', 'medicube Body Wash', 'Classic bars (VALITIC, Kojie San)'],
      ['Format', 'Pump gel', 'Bar'],
      ['Extra actives', 'Niacinamide, AHA/BHA', 'Varies (vitamin C, retinol)'],
      ['Dryness risk', 'Low', 'Moderate–high'],
      ['Cost per month', '~$15', '~$5–8'],
      ['Best for', 'Daily whole-body use, sensitive skin', 'Targeted spots, budget, tradition'],
    ]),
    p([s("The bars hit harder per session and per dollar; the gel is the one you'll still be using in month three. Plenty of people will do best with both: gel daily, bar a few times a week on stubborn areas. (The classic bars still win on raw per-dollar strength.)")]),

    h2('How to Use It for Real Results'),
    p([s('Lather onto damp skin, let it sit 30–60 seconds while you do everything else, rinse. Daily is fine — that\'s the format\'s advantage. Moisturize after, and wear sunscreen on exposed areas or the sun will re-deposit everything you\'re fading. Judge results at week six with before photos, because gradual change is invisible in the mirror and obvious in photos.')]),
    p([s('Patch-test if you\'re sensitive; skip it on broken or eczema-flared skin; and as with any brightening product, new or changing spots belong in front of a dermatologist, not under a body wash.')]),

    h2('About medicube (and Why That Matters Here)'),
    p([s('Brand pedigree matters more than usual in the kojic category, which is flooded with white-label bars from anonymous sellers. medicube started as a Korean dermatology-clinic spinoff and built its US reputation the hard way — its Zero Pore toner pads and Collagen Jelly Cream currently sit in the top ten of the entire Beauty category, with tens of thousands of reviews apiece. That history matters for two reasons: K-beauty brands live and die on formulation elegance (texture, scent, skin-feel — the things that keep you using a product), and an established brand has a reputation to lose from a bad batch. Neither guarantees results, but in a category full of mystery bars, it meaningfully lowers the odds of buying nothing in a nice wrapper.')]),

    h2('What to Expect, Week by Week'),
    p([s("Set your expectations like this: weeks one and two deliver exactly what a good shower gel delivers — clean, soft, non-tight skin and a pleasant scent — and zero visible spot change. This is where impatient buyers quit and leave the two-star \"doesn't work\" reviews. Weeks three and four, fresh post-acne marks (the pink-to-light-brown recent ones) start looking slightly softer at the edges; underarm and inner-thigh darkness may look marginally more even in photos, though the mirror won't convince you. Weeks five through eight are where the before/after photos earn their keep: recent PIH visibly faded, tone more uniform, stubborn older spots merely dented. Beyond that, progress continues but flattens — deep sun damage and melasma will not surrender to any wash-off product, and chasing them with more scrubbing backfires. Take the day-one photo. It's the only honest referee.")]),

    h2('Final Verdict'),
    p([s('Buy it if: ', ['strong']), s("you want kojic acid benefits without the dry-skin tax, you prefer gels to managing a soap dish, or the bars' medicinal smell killed your consistency before results arrived. It's the best-formulated entry point into body brightening the K-beauty wave has produced so far.")]),
    p([s('Skip it if: ', ['strong']), s("you're targeting a few stubborn spots on a budget — a classic bar delivers more actives per dollar — or you're expecting serum-speed results from a shower product.")]),
    p([s("It's frequently on deal, and at the sale price the value argument mostly evaporates — "), cta2.span, s('.')], [cta2.def]),
    p([s('For the rest of the even-tone toolkit, start with our kojic acid soap rankings and '), koreanLink.span, s('.')], [koreanLink.def]),

    p([s('Disclosure: SpartanShopper participates in the Amazon Associates Program. We may earn a small commission on qualifying purchases at no extra cost to you. This article is for informational purposes only and is not a substitute for professional medical advice.', ['em'])]),
  ]
}

// ── JSON-LD (Product + Review, manual — bypasses ItemList/FAQ auto-detection) ──

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'medicube Kojic Acid Turmeric Brightening Body Wash',
  description:
    'Korean kojic acid + turmeric brightening body wash with niacinamide and an AHA/BHA blend, formulated to fade dark spots, post-acne marks, and uneven tone without the dryness of classic kojic bars.',
  brand: { '@type': 'Brand', name: 'medicube' },
  url: `https://www.spartanshopper.com/blog/${SLUG}`,
  image: ['https://m.media-amazon.com/images/I/61Dwt2d+SJL._AC_SX679_.jpg'],
  offers: {
    '@type': 'Offer',
    priceCurrency: 'USD',
    price: '15.00',
    availability: 'https://schema.org/InStock',
    url: GO,
  },
  review: {
    '@type': 'Review',
    reviewRating: { '@type': 'Rating', ratingValue: '4.3', bestRating: '5' },
    author: { '@type': 'Organization', name: 'SpartanShopper' },
    reviewBody:
      "medicube's Kojic Acid Turmeric Body Wash is the most convenient way to get kojic acid into a daily routine — a smarter formula than the classic bars thanks to niacinamide and an AHA/BHA blend, and gentle enough to use daily without the dryness the bars are known for. It won't work faster than a bar, and per dollar the bars deliver more actives. But for comfort, consistency, and whole-body daily use, it's the best-formulated entry point into body brightening the K-beauty wave has produced.",
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.6',
    reviewCount: '1000',
  },
}, null, 2)

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  SpartanShopper — medicube Kojic Acid Body Wash Review')
  console.log('═══════════════════════════════════════════════════════════\n')

  // 1. Confirm cover image asset
  process.stdout.write(`  Confirming cover asset ${COVER_ASSET.slice(0, 22)}…… `)
  const asset = await client.fetch<{ _id: string } | null>(`*[_id == $id][0]{ _id }`, { id: COVER_ASSET })
  if (!asset) { console.error('\n  ✗ Cover image asset not found. Aborting.'); process.exit(1) }
  console.log('✓')

  // 2. Slug conflict
  process.stdout.write('  Checking slug availability… ')
  const existing = await client.fetch<{ _id: string }[]>(
    `*[_type == "post" && slug.current == $slug]{ _id }`, { slug: SLUG }
  )
  if (existing.length > 0) { console.error(`\n  ✗ Slug "${SLUG}" already in use. Aborting.`); process.exit(1) }
  console.log('✓')

  // 3. Affiliate link (/go/medicube-kojic-body-wash)
  process.stdout.write('  Creating /go/medicube-kojic-body-wash… ')
  await client.createOrReplace({
    _id: crypto.randomUUID(),
    _type: 'affiliateLink',
    title: 'medicube Kojic Acid Turmeric Body Wash — Amazon',
    slug: { _type: 'slug', current: 'medicube-kojic-body-wash' },
    destination: 'https://www.amazon.com/dp/B0FNWJFQFM?tag=sku18798384-20',
  })
  console.log('✓')

  // 4. Publish post
  const post = {
    _id: crypto.randomUUID(),
    _type: 'post',
    title: 'medicube Kojic Acid Turmeric Body Wash Review: Worth the Hype? (2026)',
    slug: { _type: 'slug', current: SLUG },
    publishedAt: '2026-07-18T00:00:00Z',
    author: 'SpartanShopper',
    category: 'Reviews',
    relatedCategory: 'beauty',
    excerpt:
      "medicube's kojic acid body wash is selling 20,000 bottles a month before most people have heard of it. We broke down the ingredient list, the reviews, and the K-beauty hype to answer the only question that matters: will it actually fade your dark spots?",
    coverImage: {
      _type: 'image',
      asset: { _type: 'reference', _ref: COVER_ASSET },
      alt: COVER_ALT,
    },
    affiliateUrl: 'https://www.amazon.com/dp/B0FNWJFQFM?tag=sku18798384-20',
    affiliateSlug: { _type: 'slug', current: 'medicube-kojic-body-wash' },
    seo: {
      metaDescription:
        "medicube Kojic Acid Turmeric Body Wash review: ingredients, real results for dark spots, how it compares to kojic bars, and whether it's worth $15.",
    },
    jsonLd,
    body: buildBody(COVER_ASSET),
  }

  process.stdout.write(`  Publishing post: ${SLUG}… `)
  const result = await client.create(post)
  console.log('✓')
  console.log(`  ID: ${result._id}\n`)

  console.log('── Done ────────────────────────────────────────────────────')
  console.log('  Verify at: https://spartanshopper.sanity.studio')
  console.log(`  Live at:   https://www.spartanshopper.com/blog/${SLUG}`)
}

main().catch((err) => { console.error('\n[fatal]', err.message ?? err); process.exit(1) })
