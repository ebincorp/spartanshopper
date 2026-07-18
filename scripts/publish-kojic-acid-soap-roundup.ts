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
type ImageBlock = { _type: 'image'; _key: string; asset: { _type: 'reference'; _ref: string }; alt?: string; caption?: string }
type TableRow = { _type: 'tableRow'; _key: string; cells: string[] }
type TableBlock = { _type: 'table'; _key: string; caption?: string; rows: TableRow[] }

const s = (text: string, marks: string[] = []): Span => ({ _type: 'span', _key: k(), text, marks })
const p = (spans: Span[], defs: LinkDef[] = []): Block => ({ _type: 'block', _key: k(), style: 'normal', children: spans, markDefs: defs })
const h2 = (text: string): Block => ({ _type: 'block', _key: k(), style: 'h2', children: [s(text)], markDefs: [] })
const h3 = (text: string): Block => ({ _type: 'block', _key: k(), style: 'h3', children: [s(text)], markDefs: [] })
const bullet = (spans: Span[], defs: LinkDef[] = []): Block => ({ _type: 'block', _key: k(), style: 'normal', listItem: 'bullet', level: 1, children: spans, markDefs: defs })
function link(text: string, href: string): { span: Span; def: LinkDef } {
  const lk = k()
  return { span: s(text, [lk]), def: { _key: lk, _type: 'link', href } }
}
function img(ref: string, alt: string, caption: string): ImageBlock {
  return { _type: 'image', _key: k(), asset: { _type: 'reference', _ref: ref }, alt, caption }
}
function table(caption: string, rows: string[][]): TableBlock {
  return { _type: 'table', _key: k(), caption, rows: rows.map((cells) => ({ _type: 'tableRow', _key: k(), cells })) }
}
// bold lead-in + rest paragraph
const lead = (boldText: string, rest: string): Block => p([s(boldText, ['strong']), s(rest)])

// ── Constants ─────────────────────────────────────────────────────────────────

const SLUG = 'kojic-acid-soap-for-dark-spots'
const COVER_ASSET = 'image-c09a7cf4d8f610282ab7335b51f25ce70bd9f9ff-1448x1086-png'
const COVER_ALT = 'Kojic acid and turmeric soap bars with turmeric root flat lay on white marble'
const BODY_CAPTION = 'Kojic acid and turmeric soap bars with fresh turmeric root on white marble — traditional brightening ingredients for fading dark spots.'

const GO = (slug: string) => `https://www.spartanshopper.com/go/${slug}`
const VALITIC = 'valitic-kojic-soap'
const KOJIE = 'kojie-san-soap'
const MEDICUBE = 'medicube-kojic-body-wash'
const KITSCH = 'kitsch-kojic-soap'
const ARTNATURALS = 'artnaturals-kojic-soap'
const KOREAN_GUIDE = 'https://www.spartanshopper.com/blog/best-korean-skincare-products-2026'
const BIODANCE = 'https://www.spartanshopper.com/blog/biodance-eye-patches-review'

// Affiliate links to ensure (medicube already exists — do not recreate/duplicate)
const AFFILIATE_LINKS = [
  { slug: VALITIC, title: 'VALITIC Kojic Acid Soap 2-Pack — Amazon', destination: 'https://www.amazon.com/dp/B09MFMCTRK?tag=sku18798384-20' },
  { slug: KOJIE, title: 'Kojie San Brightening Soap — Amazon', destination: 'https://www.amazon.com/dp/B00R602KOQ?tag=sku18798384-20' },
  { slug: KITSCH, title: 'Kitsch Kojic Acid Soap — Amazon', destination: 'https://www.amazon.com/dp/B0D827ZY5Y?tag=sku18798384-20' },
  { slug: ARTNATURALS, title: 'artnaturals Kojic + Turmeric Soap — Amazon', destination: 'https://amzn.to/4uzhrsPi' },
]

// ── Body ─────────────────────────────────────────────────────────────────────

function buildBody(imageRef: string): (Block | ImageBlock | TableBlock)[] {
  const ctaValitic = link('See how much it is right now', GO(VALITIC))
  const ctaKojie = link('Check the current price', GO(KOJIE))
  const ctaMedicube = link('See if it’s still this price', GO(MEDICUBE))
  const ctaKitsch = link('Check availability', GO(KITSCH))
  const ctaArt = link('See the current price', GO(ARTNATURALS))
  const koreanLink = link('our Korean skincare guide', KOREAN_GUIDE)
  const biodanceLink = link('our BIODANCE eye patch review', BIODANCE)

  return [
    p([s("If you’ve ever stood in a Manila drugstore, you already know kojic acid soap. It sits by the register, wrapped in orange paper, and it costs less than a cup of coffee. My girlfriend Lea grew up with it in the Philippines, where kojic acid soap for dark spots isn’t a TikTok discovery — it’s what your mom hands you when you complain about acne marks. The US market has finally caught on, and Amazon now moves tens of thousands of these bars every month.")]),
    p([s("Here’s the honest version of what they can and can’t do, and which of the five best-selling options deserves a spot in your shower.")]),

    img(imageRef, COVER_ALT, BODY_CAPTION),

    // Disclosure BEFORE the first affiliate link (the comparison table)
    p([s('Disclosure: SpartanShopper participates in the Amazon Associates Program. We may earn a small commission on qualifying purchases at no extra cost to you.', ['em'])]),

    h2('What Is Kojic Acid — and Why Soap?'),
    p([s("Kojic acid is a compound produced during the fermentation of rice wine and soy sauce (Japanese sake brewers noticed their hands stayed remarkably even-toned — that’s the origin story). It works by inhibiting tyrosinase, the enzyme your skin uses to produce melanin. Less tyrosinase activity means less new pigment deposited in a healing acne mark, sun spot, or patch of melasma.")]),
    p([s("The research shows kojic acid is a legitimate, dermatologist-recognized brightening ingredient — typically studied at 1–4% concentrations, often alongside ingredients like vitamin C or glycolic acid. It’s considered one of the gentler alternatives to hydroquinone, though it works more slowly.")]),
    p([s("Why a soap instead of a serum? Two honest reasons: cost and coverage. A serum treats your face; a bar treats the dark spots on your back, shoulders, underarms, and legs for a fraction of the price. The trade-off is contact time — a wash-off product spends seconds on your skin, so results take longer. Consistency matters more than concentration here.")]),

    h2('What to Look For'),
    bullet([s('Kojic acid paired with turmeric or vitamin C.', ['strong']), s(' The best bars stack complementary brightening ingredients. Turmeric (curcumin) has its own evidence for calming inflammation — and inflammation is what creates post-acne marks in the first place.')]),
    bullet([s('Moisturizers built in.', ['strong']), s(' Kojic acid can be drying. Shea butter, glycerin, hyaluronic acid, or coconut oil in the formula make daily use sustainable.')]),
    bullet([s('Realistic branding.', ['strong']), s(' “Dark spot remover” is achievable. Anything promising dramatic all-over lightening in days is a red flag — and not the goal. Even tone, not a different tone.')]),
    bullet([s('A brand with history or volume.', ['strong']), s(' This category is flooded with white-label bars. Stick with proven names.')]),

    h2('Quick Comparison'),
    table('The five best-selling kojic acid soaps compared', [
      ['Soap', 'Best For', 'Key Ingredients', 'Price Range', 'Reviews'],
      [`VALITIC (2-pack)||${GO(VALITIC)}`, 'Overall / body', 'Kojic, turmeric, vitamin C, retinol, collagen', '~$15', '47,000+'],
      [`Kojie San||${GO(KOJIE)}`, 'Authenticity on a budget', 'Kojic, coconut oil, tea tree', '~$7.50', '31,000+'],
      [`medicube Body Wash||${GO(MEDICUBE)}`, 'Shower-gel format', 'Kojic, turmeric, niacinamide, AHA/BHA', '~$15', '1,000+ (20K+ sold/mo)'],
      [`Kitsch||${GO(KITSCH)}`, 'Sensitive skin', 'Kojic, turmeric, hyaluronic acid, shea', '~$10', '10,000+'],
      [`artnaturals||${GO(ARTNATURALS)}`, 'Value bundle', 'Kojic, turmeric, retinol + net sponge', '~$13', '2,200+'],
    ]),

    h2('1. VALITIC Kojic Acid Soap — Best Overall'),
    p([s('The category king, and the sales numbers are absurd: over 50,000 packs a month on Amazon. VALITIC stacks kojic acid with turmeric, vitamin C, retinol, collagen, hyaluronic acid, and shea butter — a kitchen-sink formula that shouldn’t work as well as it does.')]),
    lead('Why it’s first: ', 'the ingredient stack covers both halves of the dark-spot problem — inhibiting new pigment (kojic, vitamin C) while supporting turnover of the marked skin you already have (retinol). Users consistently report visible fading of post-acne marks on the body within four to six weeks of daily use.'),
    lead('The honest catch: ', 'at 4.2 stars, its rating runs slightly below the boutique bars, mostly complaints about dryness with twice-daily use and bars that soften quickly in a wet dish. Use once daily, keep it drained, and both problems disappear.'),
    p([ctaValitic.span], [ctaValitic.def]),

    h2('2. Kojie San — The Filipino Classic'),
    p([s('This is the original. Kojie San has been the best-selling kojic acid soap in the Philippines for decades, and it’s what half the “kojic acid before and after” photos you’ve seen were actually taken with. The formula is simpler than VALITIC’s — kojic acid with coconut oil and tea tree — and the bars are smaller, but so is the price.')]),
    lead('Why it earns the spot: ', 'track record. This isn’t an Amazon-era brand engineered for search results; it’s a legacy product that earned its reputation one sari-sari store at a time. Lea swears the orange-wrapped bar smell is the smell of every Filipino bathroom, and there’s something to be said for a product that stayed popular for thirty years in the country that takes this category most seriously.'),
    lead('The honest catch: ', 'it’s the most drying bar here. Filipinos famously use it in short contact — lather, thirty seconds, rinse — and follow with lotion. Do that, not a long scrub.'),
    p([ctaKojie.span], [ctaKojie.def]),

    h2('3. medicube Kojic Acid Turmeric Body Wash — The Trending Pick'),
    p([s('The newest product on this list and the one moving fastest — over 20,000 bottles a month within its first months on the US market. medicube is the K-beauty brand currently dominating Amazon’s skincare best-seller list, and this body wash brings their formulation polish to the kojic category: kojic acid and turmeric backed by niacinamide (another proven brightener) and a gentle AHA/BHA blend for exfoliation.')]),
    lead('Why it’s here: ', 'if you prefer a shower gel to a bar — no soap dish, no mushy bar, easier to lather over large areas — this is the only serious kojic option in that format from a major brand. The niacinamide inclusion is smart; it’s one of the best-studied ingredients for uneven tone.'),
    lead('The honest catch: ', 'it’s new. A thousand reviews is promising, not proven, and per-wash cost runs higher than any bar here.'),
    p([ctaMedicube.span], [ctaMedicube.def]),

    h2('4. Kitsch Kojic Acid Soap — Best for Sensitive Skin'),
    p([s('Kitsch built its reputation on hair accessories, then quietly became one of the better-reviewed skincare bar makers in the US. Their kojic bar is formulated noticeably gentler — hyaluronic acid and shea butter carry more of the formula, and it’s made in the USA with a 4.5-star average across 10,000 reviews, the highest of any bar on this list.')]),
    lead('Why it’s here: ', 'if VALITIC or Kojie San leave your skin tight, this is the bar that won’t. It’s the one I’d point a first-timer to, especially for facial use.'),
    lead('The honest catch: ', 'gentler formula, gentler results. Expect the slow route to fading spots.'),
    p([ctaKitsch.span], [ctaKitsch.def]),

    h2('5. artnaturals Kojic Acid Soap — Best Value Bundle'),
    p([s('Two full-size kojic-turmeric bars plus an African net exfoliating sponge for around $13. The formula reads like VALITIC’s (kojic, turmeric, vitamin C, retinol, collagen), and the included net sponge matters more than it looks — gentle physical exfoliation measurably speeds up how fast marked skin turns over.')]),
    lead('The honest catch: ', 'the brand is quieter and the review base smaller. But the subscribe-and-save discount makes it the cheapest per-wash option of the premium-formula bars.'),
    p([ctaArt.span], [ctaArt.def]),

    h2('How to Use Kojic Acid Soap (Without Wrecking Your Skin)'),
    bullet([s('Start with 3–4 uses a week, once daily at most.', ['strong']), s(' Kojic acid can irritate if you sprint.')]),
    bullet([s('Short contact.', ['strong']), s(' Lather, leave 30–60 seconds, rinse thoroughly. Longer does not mean faster — it means irritated.')]),
    bullet([s('Moisturize after, every time.', ['strong']), s(' Dry, irritated skin produces more pigment, not less. Skipping lotion actively works against you.')]),
    bullet([s('Sunscreen is non-negotiable.', ['strong']), s(' Kojic acid makes skin more sun-sensitive, and UV exposure is what created most of your dark spots. Without SPF you’re bailing water with the tap running.')]),
    bullet([s('Expect 4–8 weeks for visible change', ['strong']), s(' on post-acne marks; melasma and older sun spots take longer and may need professional treatment.')]),

    h2('Know Your Dark Spots — It Changes Everything'),
    p([s('Not all hyperpigmentation responds the same way, and knowing which kind you have sets honest expectations before you spend a dime.')]),
    lead('Post-inflammatory hyperpigmentation (PIH) ', '— the flat brown or purple marks left after acne, bug bites, waxing bumps, or scratches — is the best responder. These marks are recent, shallow, and actively fading on their own; kojic acid accelerates a process already underway. This is where the four-to-six-week success stories come from, and it’s the most common concern on deeper skin tones, where even minor breakouts can leave months of marks.'),
    lead('Sun spots (solar lentigines) ', '— the scattered flat spots on shoulders, chest, and hands from years of UV — respond, but slowly. The pigment sits denser and deeper. Think two to three months of consistency for visible softening, and understand that without daily sunscreen they will simply rebuild.'),
    lead('Melasma ', '— the symmetrical patches across cheeks, forehead, or upper lip, usually hormonal in origin — is the stubborn one. Kojic acid appears in dermatologist-prescribed melasma formulas, but as one ingredient among several, and wash-off soap alone rarely moves it much. If this is your pattern, a soap is a supporting player at best; a dermatologist visit is the real move.'),
    lead('Friction darkness ', '— underarms, inner thighs, knuckles, knees — is half pigment, half thickened skin from rubbing. The soap-plus-net-sponge combos (artnaturals ships one) are genuinely well suited here, which is why this use case fills so many kojic reviews.'),

    h2('Kojic Acid vs. the Other Brighteners'),
    p([s('Where does kojic sit in the crowded brightening aisle? Vitamin C is the antioxidant all-rounder — great in serums, unstable in soap, better as a daytime layer than a competitor. Niacinamide blocks pigment transfer rather than production, which is why smart formulas (like medicube’s above) stack it with kojic instead of choosing between them. Alpha arbutin is kojic’s gentler cousin — slower, milder, pricier, mostly found in leave-on serums. Hydroquinone remains the heavyweight, available OTC at 2% in the US — more powerful, but with enough irritation and rebound-pigmentation baggage that most people should treat it as a dermatologist-supervised tool, not a shower staple. The honest summary: for an inexpensive, whole-body, daily-habit format, kojic soap is the category winner — and for the face, it plays best as one layer in a routine rather than the whole plan.')]),

    h2('Who Should Skip It'),
    p([s('Pregnant or nursing women should clear any brightening routine with their doctor. Anyone with eczema, broken skin, or a known kojic acid sensitivity (it’s a fermentation product — mold-allergy adjacent reactions happen) should patch-test on the inner arm for three days first. And if a spot is new, growing, or irregular, see a dermatologist before trying to fade it — dark spots are cosmetic; changing moles are medical.')]),

    h2('FAQ'),
    h3('Does kojic acid soap really work on dark spots?'),
    p([s('Yes, with caveats: clinical studies support kojic acid as a tyrosinase inhibitor, but wash-off formats work slower than leave-on serums. Consistent daily use for one to two months is the realistic window.')]),
    h3('Is kojic acid soap safe for dark skin tones?'),
    p([s('Kojic acid targets excess pigment in marks rather than bleaching surrounding skin, which is why it’s been popular in Southeast Asia for decades. That said, deeper skin tones are also more prone to irritation-triggered pigmentation — so the start-slow rules above matter more, not less.')]),
    h3('Can I use it on my face?'),
    p([s('Yes — Kitsch is the gentlest option here for that. Avoid the eye area, and don’t combine with retinoids or exfoliating acids on the same night until your skin proves it can handle both.')]),
    h3('Kojic acid soap vs. serum?'),
    p([s('Soap for body and budget, serum for face and speed. Many people do both.')]),
    h3('How long do results last after I stop?'),
    p([s('Kojic acid pauses pigment production; it doesn’t fire the workers. Stop using it and keep the sun exposure or breakouts that caused the marks, and new pigment gradually returns over months. Most long-term users shift to a maintenance rhythm — two or three washes a week — once spots fade, and lean on sunscreen to hold the line.')]),
    h3('Why is my skin purging or breaking out?'),
    p([s('It usually isn’t the kojic acid — bars with added retinol (VALITIC, artnaturals) can cause a brief adjustment period, and any new bar can clash with an existing routine. Drop to twice a week, cut other actives for a fortnight, and reintroduce slowly. If irritation persists past two weeks, that soap isn’t your soap.')]),

    h2('Final Verdict'),
    p([s('For most people fading post-acne marks or sun spots on the body, VALITIC is the pick — the ingredient stack and the mountain of consistent reviews justify its best-seller status. Go Kojie San if you want the authentic classic at the lowest price, Kitsch for sensitive skin, and medicube if you’d rather pump a gel than manage a bar.')]),
    p([s('Building a full brightening routine? Pair whichever bar you choose with the ingredient know-how in '), koreanLink.span, s(', and if under-eye darkness is part of your battle, '), biodanceLink.span, s(' covers the other half of the even-tone equation.')], [koreanLink.def, biodanceLink.def]),

    p([s('Disclosure: SpartanShopper participates in the Amazon Associates Program. We may earn a small commission on qualifying purchases at no extra cost to you. This article is for informational purposes only and is not a substitute for professional medical advice.', ['em'])]),
  ]
}

// ── JSON-LD (manual @graph: ItemList w/ Product items + FAQPage) ──────────────

const PRODUCTS = [
  { name: 'VALITIC Kojic Acid Soap (2-Pack)', brand: 'VALITIC', price: '15.00', image: 'https://m.media-amazon.com/images/I/71FF60ZljPL._AC_SX679_.jpg', url: GO(VALITIC), ratingValue: '4.2', reviewCount: '47000', description: 'Kitchen-sink brightening bar stacking kojic acid, turmeric, vitamin C, retinol, collagen, and shea butter — the best-selling kojic soap for fading post-acne marks on the body.' },
  { name: 'Kojie San Skin Lightening Soap', brand: 'Kojie San', price: '7.50', image: 'https://m.media-amazon.com/images/I/61Q4cjSM+mL._AC_SX679_.jpg', url: GO(KOJIE), description: 'The original Filipino kojic acid soap — kojic acid with coconut oil and tea tree, a legacy budget bar with decades of track record.' },
  { name: 'medicube Kojic Acid Turmeric Brightening Body Wash', brand: 'medicube', price: '15.00', image: 'https://m.media-amazon.com/images/I/61Dwt2d+SJL._AC_SX679_.jpg', url: GO(MEDICUBE), ratingValue: '4.6', reviewCount: '1000', description: 'K-beauty kojic acid + turmeric body wash with niacinamide and an AHA/BHA blend, in a shower-gel format for daily whole-body use.' },
  { name: 'Kitsch Kojic Acid Soap', brand: 'Kitsch', price: '10.00', image: 'https://m.media-amazon.com/images/I/71OViVkrDxL._AC_SX679_.jpg', url: GO(KITSCH), ratingValue: '4.5', reviewCount: '10000', description: 'Gentle USA-made kojic acid bar with hyaluronic acid and shea butter — the highest-rated pick and best for sensitive skin and facial use.' },
  { name: 'artnaturals Kojic Acid + Turmeric Soap', brand: 'artnaturals', price: '13.00', image: 'https://m.media-amazon.com/images/I/81jwQTubzUL._AC_SX679_.jpg', url: GO(ARTNATURALS), description: 'Value bundle of two kojic-turmeric bars plus an African net exfoliating sponge — VALITIC-style formula at the lowest per-wash cost.' },
]

const FAQ = [
  ['Does kojic acid soap really work on dark spots?', 'Yes, with caveats: clinical studies support kojic acid as a tyrosinase inhibitor, but wash-off formats work slower than leave-on serums. Consistent daily use for one to two months is the realistic window.'],
  ['Is kojic acid soap safe for dark skin tones?', 'Kojic acid targets excess pigment in marks rather than bleaching surrounding skin, which is why it has been popular in Southeast Asia for decades. That said, deeper skin tones are also more prone to irritation-triggered pigmentation — so the start-slow rules matter more, not less.'],
  ['Can I use kojic acid soap on my face?', 'Yes — Kitsch is the gentlest option here for that. Avoid the eye area, and do not combine with retinoids or exfoliating acids on the same night until your skin proves it can handle both.'],
  ['Kojic acid soap vs. serum — which is better?', 'Soap for body and budget, serum for face and speed. Many people do both.'],
  ['How long do results last after I stop using kojic acid soap?', 'Kojic acid pauses pigment production; it does not permanently stop it. Keep the sun exposure or breakouts that caused the marks and new pigment gradually returns over months. Most long-term users shift to a maintenance rhythm of two or three washes a week once spots fade, and lean on sunscreen to hold the line.'],
  ['Why is my skin purging or breaking out from kojic acid soap?', 'It usually is not the kojic acid — bars with added retinol (VALITIC, artnaturals) can cause a brief adjustment period, and any new bar can clash with an existing routine. Drop to twice a week, cut other actives for two weeks, and reintroduce slowly. If irritation persists past two weeks, that soap is not your soap.'],
]

const SITE = 'https://www.spartanshopper.com'
const EXCERPT = "Dark spots don’t care how many serums you own. Kojic acid soap is the budget workhorse Southeast Asian skincare has trusted for decades — and it’s finally having its moment in the US. Here’s which bars actually work, and the mistakes that make them backfire."

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ItemList',
      name: 'Best Kojic Acid Soap for Dark Spots (2026)',
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
          offers: {
            '@type': 'Offer',
            price: prod.price,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: prod.url,
          },
          ...(prod.ratingValue && prod.reviewCount
            ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: prod.ratingValue, reviewCount: prod.reviewCount, bestRating: '5', worstRating: '1' } }
            : {}),
        },
      })),
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ],
}, null, 2)

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  SpartanShopper — Best Kojic Acid Soap for Dark Spots (roundup)')
  console.log('═══════════════════════════════════════════════════════════\n')

  process.stdout.write('  Confirming cover asset… ')
  const asset = await client.fetch<{ _id: string } | null>(`*[_id == $id][0]{ _id }`, { id: COVER_ASSET })
  if (!asset) { console.error('\n  ✗ Cover asset not found. Aborting.'); process.exit(1) }
  console.log('✓')

  process.stdout.write('  Checking slug availability… ')
  const existing = await client.fetch<{ _id: string }[]>(`*[_type == "post" && slug.current == $slug]{ _id }`, { slug: SLUG })
  if (existing.length > 0) { console.error(`\n  ✗ Slug "${SLUG}" already in use. Aborting.`); process.exit(1) }
  console.log('✓')

  // Create the four new /go links (medicube already exists — skip to avoid duplicate slug)
  for (const al of AFFILIATE_LINKS) {
    const dupe = await client.fetch<{ _id: string }[]>(`*[_type == "affiliateLink" && slug.current == $slug]{ _id }`, { slug: al.slug })
    if (dupe.length > 0) { console.log(`  /go/${al.slug} already exists — skipping`); continue }
    process.stdout.write(`  Creating /go/${al.slug}… `)
    await client.create({
      _id: crypto.randomUUID(),
      _type: 'affiliateLink',
      title: al.title,
      slug: { _type: 'slug', current: al.slug },
      destination: al.destination,
    })
    console.log('✓')
  }

  const post = {
    _id: crypto.randomUUID(),
    _type: 'post',
    title: 'Best Kojic Acid Soap for Dark Spots: What Actually Fades Hyperpigmentation (2026)',
    slug: { _type: 'slug', current: SLUG },
    publishedAt: '2026-07-18T00:00:00Z',
    author: 'SpartanShopper',
    category: 'Reviews',
    relatedCategory: 'beauty',
    excerpt: EXCERPT,
    coverImage: { _type: 'image', asset: { _type: 'reference', _ref: COVER_ASSET }, alt: COVER_ALT },
    seo: {
      metaDescription: 'The best kojic acid soap for dark spots in 2026: VALITIC, Kojie San, medicube, Kitsch, and artnaturals compared — plus how to use them without irritation.',
    },
    jsonLd,
    body: buildBody(COVER_ASSET),
  }

  process.stdout.write(`  Publishing post: ${SLUG}… `)
  const result = await client.create(post)
  console.log('✓')
  console.log(`  ID: ${result._id}\n`)

  console.log('── Done ────────────────────────────────────────────────────')
  console.log(`  Live at: ${SITE}/blog/${SLUG}`)
}

main().catch((err) => { console.error('\n[fatal]', err.message ?? err); process.exit(1) })
