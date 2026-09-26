/**
 * Publish "Luxury Beauty Products Worth the Money: 8 Splurges That Earn Their Price".
 *
 *   npx tsx scripts/publish-luxury-beauty-splurges.ts                     # dry run (prints outline, writes nothing)
 *   npx tsx scripts/publish-luxury-beauty-splurges.ts --execute <cover>   # upload cover, create + publish the post
 *   npx tsx scripts/publish-luxury-beauty-splurges.ts --link-deals        # add the post to the 8 deals' relatedGuides
 *
 * Product images are the brand-sourced assets already on the matching deal docs
 * (never Amazon image URLs). Products carry no price: the article keeps prices
 * general so it can't go stale, and deal cards show live prices.
 */
import dotenv from 'dotenv'
import path from 'path'
import { createReadStream, existsSync } from 'fs'
import { createClient } from '@sanity/client'
import { createImageUrlBuilder } from '@sanity/image-url'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'eohdr7jw',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token: process.env.SANITY_API_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn: false,
})
const imageUrl = createImageUrlBuilder(client)

// ── Portable-text helpers ────────────────────────────────────────────────────

const k = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12)
type Span = { _type: 'span'; _key: string; text: string; marks: string[] }
type LinkDef = { _key: string; _type: 'link'; href: string }
type Block = { _type: 'block'; _key: string; style: string; children: Span[]; markDefs: LinkDef[]; listItem?: 'bullet'; level?: number }
type Part = string | { b: string } | { a: string; href: string }

// Rich line: plain strings, {b} bold, {a, href} links.
function rich(parts: Part[], style = 'normal', listItem?: 'bullet'): Block {
  const children: Span[] = []
  const markDefs: LinkDef[] = []
  for (const part of parts) {
    if (typeof part === 'string') children.push({ _type: 'span', _key: k(), text: part, marks: [] })
    else if ('b' in part) children.push({ _type: 'span', _key: k(), text: part.b, marks: ['strong'] })
    else {
      const key = k()
      markDefs.push({ _key: key, _type: 'link', href: part.href })
      children.push({ _type: 'span', _key: k(), text: part.a, marks: [key] })
    }
  }
  return { _type: 'block', _key: k(), style, children, markDefs, ...(listItem && { listItem, level: 1 }) }
}
const p = (...parts: Part[]) => rich(parts)
const h2 = (text: string) => rich([text], 'h2')
const h3 = (text: string) => rich([text], 'h3')
const li = (...parts: Part[]) => rich(parts, 'normal', 'bullet')
const lead = (label: string, text: string) => p({ b: label }, ' ', text)
const em = (text: string): Block => ({ _type: 'block', _key: k(), style: 'normal', children: [{ _type: 'span', _key: k(), text, marks: ['em'] }], markDefs: [] })
type Table = { _type: 'table'; _key: string; caption: string; rows: { _type: 'tableRow'; _key: string; cells: string[] }[] }
type BodyImage = { _type: 'image'; _key: string; asset: { _type: 'reference'; _ref: string }; alt: string; caption: string }
type BodyItem = Block | Table | BodyImage
const table = (caption: string, rows: string[][]): Table => ({
  _type: 'table', _key: k(), caption, rows: rows.map((cells) => ({ _type: 'tableRow', _key: k(), cells })),
})

// ── Constants ────────────────────────────────────────────────────────────────

const SITE = 'https://www.spartanshopper.com'
const SLUG = 'luxury-beauty-products-worth-the-money'
const TITLE = 'Luxury Beauty Products Worth the Money: 8 Splurges That Earn Their Price'
const EXCERPT = 'Luxury beauty is full of $70 products that do exactly what a $15 one does. But a handful really do earn the markup. Here are eight splurges that justify their price and how to tell the difference before you buy.'
const META = 'Which luxury beauty products are worth the money? 8 premium picks across skincare, fragrance, makeup and body care, plus when a cheaper dupe makes sense.'
const COVER_ALT = 'Luxury beauty products worth the money: cleansing balm, facial oil, mascara, perfume bottles and body cream on white marble'
const BODY_CAPTION = 'Luxury skincare, fragrance and body care products arranged on a marble vanity, including a cleansing balm, facial oil, mascara and perfume bottles.'
const DISCLOSURE = 'Disclosure: SpartanShopper participates in the Amazon Associates Program. We may earn a small commission on qualifying purchases at no extra cost to you.'

const GO = (slug: string) => `${SITE}/go/${slug}`
const DEALS_PAGE = `${SITE}/deals`
const KOREAN_GUIDE = `${SITE}/blog/best-korean-skincare-products-2026`

// Article order. `slug` is both the deal slug and its /go/ slug.
const PICKS = [
  { slug: 'elemis-pro-collagen-cleansing-balm', name: 'ELEMIS Pro-Collagen Cleansing Balm', brand: 'ELEMIS', description: 'A melt-away cleansing balm that removes long-wear makeup, mascara and SPF in one step and rinses clean without stripping skin.' },
  { slug: 'elemis-superfood-facial-oil', name: 'ELEMIS Superfood Facial Oil', brand: 'ELEMIS', description: 'A nourishing plant-oil blend for dry or dull skin; a few drops go a long way in the 15 ml bottle.' },
  { slug: 'first-aid-beauty-kp-bump-eraser-body-scrub', name: 'First Aid Beauty KP Bump Eraser Body Scrub', brand: 'First Aid Beauty', description: 'A 10% AHA body scrub for rough, bumpy skin on arms and legs.' },
  { slug: 'sol-de-janeiro-brazilian-bum-bum-cream', name: 'Sol de Janeiro Brazilian Bum Bum Cream', brand: 'Sol de Janeiro', description: 'A fast-absorbing body cream with a lingering pistachio-and-salted-caramel scent that doubles as a signature fragrance.' },
  { slug: 'sol-de-janeiro-bum-bum-jet-set', name: 'Sol de Janeiro Bum Bum Jet Set', brand: 'Sol de Janeiro', description: 'A TSA-friendly travel set with Bum Bum Cream, body wash and perfume mist; a low-risk way to try the line.' },
  { slug: 'lancome-lash-idole-mascara', name: 'Lancôme Lash Idôle Mascara', brand: 'Lancôme', description: 'A lifting, volumizing mascara that keeps lashes separated without clumping.' },
  { slug: 'lancome-la-vie-est-belle-eau-de-parfum-1-oz', name: 'Lancôme La Vie Est Belle Eau de Parfum', brand: 'Lancôme', description: 'A warm, sweet floral signature scent; the 1 fl oz bottle is the smart entry point.' },
  { slug: 'armani-acqua-di-gioia-eau-de-parfum-1-oz', name: 'Armani Acqua di Gioia Eau de Parfum', brand: 'Armani Beauty', description: 'A fresh, aquatic everyday scent for people who prefer light fragrances.' },
] as const
const [BALM, OIL, FAB, BUMBUM, JETSET, LASH, LVEB, ADG] = PICKS.map((x) => x.slug)

// ── Body ─────────────────────────────────────────────────────────────────────

function buildBody(coverRef: string): BodyItem[] {
  return [
    p('Luxury beauty products are worth the money only some of the time. A lot of prestige pricing pays for the bottle, the counter and the ad campaign, not what’s inside. But certain categories reward spending more: formulas that are hard to copy, fragrances you’ll wear for years, and products you use daily for months. Those are where a premium price can actually work out cheaper per use than the budget version you keep replacing.'),
    p('This guide covers eight premium beauty products across skincare, body care, makeup and fragrance, all from established brands with thousands of verified reviews. For each one, we’ll explain why it earns a spot, who it’s best for, and when you’d be better off buying something cheaper.'),
    p('Prices on luxury beauty move a lot, especially around sales events, so we don’t list them here. Each product links to its current price, and our ', { a: 'deals page', href: DEALS_PAGE }, ' shows which ones are marked down right now.'),

    { _type: 'image', _key: k(), asset: { _type: 'reference', _ref: coverRef }, alt: COVER_ALT, caption: BODY_CAPTION },

    // Disclosure BEFORE the first affiliate link (the comparison table)
    em(DISCLOSURE),

    h2('The Four-Question Splurge Test'),
    p('Before splurging on a single product, run it through these four questions.'),
    li({ b: 'Is the formula hard to replicate?' }, ' Cleansing balms, well-built fragrances and precision mascara brushes are hard to copy cheaply. Basic moisturizers and micellar water mostly are not.'),
    li({ b: 'How long does it last?' }, ' A 1 oz perfume worn a few sprays at a time can last most of a year. A product you’ll finish in two weeks rarely justifies a premium.'),
    li({ b: 'What’s the cost per use?' }, ' A premium balm used every night for three months can cost less per use than a cheaper cleanser you go through twice as fast.'),
    li({ b: 'Is there proof beyond the marketing?' }, ' Tens of thousands of ratings and consistent repeat purchases tell you more than any ad. Every pick below has a large review base.'),
    p('If a product fails most of these, look for a dupe. If it passes, it’s likely a smart splurge.'),

    h2('Quick Comparison Table'),
    table('Eight luxury beauty splurges compared', [
      ['Product', 'Category', 'Best For', 'Size'],
      [`ELEMIS Pro-Collagen Cleansing Balm||${GO(BALM)}`, 'Skincare', 'Removing makeup and SPF without stripping skin', '100 g'],
      [`ELEMIS Superfood Facial Oil||${GO(OIL)}`, 'Skincare', 'Dry or dull skin that needs extra nourishment', '15 ml'],
      [`First Aid Beauty KP Bump Eraser||${GO(FAB)}`, 'Body care', 'Rough, bumpy skin on arms and legs', '8 oz'],
      [`Sol de Janeiro Brazilian Bum Bum Cream||${GO(BUMBUM)}`, 'Body care', 'A body cream that doubles as a signature scent', '2.5 fl oz'],
      [`Sol de Janeiro Bum Bum Jet Set||${GO(JETSET)}`, 'Body care', 'Trying the line or traveling', 'Travel set'],
      [`Lancôme Lash Idôle Mascara||${GO(LASH)}`, 'Makeup', 'Lifted, separated lashes without clumping', 'Full size'],
      [`Lancôme La Vie Est Belle EDP||${GO(LVEB)}`, 'Fragrance', 'A warm, sweet floral signature scent', '1 fl oz'],
      [`Armani Acqua di Gioia EDP||${GO(ADG)}`, 'Fragrance', 'A fresh, aquatic everyday scent', '1 fl oz'],
    ]),

    h2('Skincare Splurges'),
    p('Skincare is where luxury pricing is most often wasted, and also where the right product makes the biggest daily difference. These two are worth it because they do something cheaper versions struggle to match.'),

    h3('1. ELEMIS Pro-Collagen Cleansing Balm'),
    lead('Why it’s worth it:', 'A good cleansing balm melts off long-wear makeup, mascara and sunscreen in one step, then rinses clean without the tight, stripped feeling foaming cleansers can leave. That’s harder to formulate than it sounds. Plenty of cheaper balms leave a greasy film or need a second cleanse to remove.'),
    lead('Best for:', 'Anyone who wears daily SPF or makeup and wants a gentler first cleanse. It’s especially suited to normal-to-dry skin that dislikes foaming cleansers.'),
    lead('The cost-per-use math:', 'A 100 g tub used nightly with a small scoop lasts a long time. Spread across months of use, the per-night cost comes in far lower than the sticker price suggests.'),
    lead('When to skip it:', 'If you wear little makeup and your skin is oily, a basic gel cleanser will do the job for much less.'),
    p({ a: 'See today’s price', href: GO(BALM) }),

    h3('2. ELEMIS Superfood Facial Oil'),
    lead('Why it’s worth it:', 'Face oils come down to the blend. This one is built around a mix of plant oils meant to nourish and add radiance without feeling heavy. A few drops go a long way, which is why the 15 ml bottle, though small, lasts longer than you’d expect.'),
    lead('Best for:', 'Dry, dull or dehydrated skin, particularly in colder months. It works as the last step of a night routine or mixed into moisturizer.'),
    lead('Worth knowing:', 'This is a 15 ml bottle, a smaller size than many skincare products. It’s the standard size for this oil, but check the size before buying so you know what you’re getting.'),
    lead('When to skip it:', 'Very oily or breakout-prone skin may be better off with a lightweight serum instead of an oil.'),
    p('If you’re building a full skincare routine, our ', { a: 'guide to the best Korean skincare products', href: KOREAN_GUIDE }, ' covers affordable options that pair well with one or two luxury splurges like these.'),
    p({ a: 'Check current pricing', href: GO(OIL) }),

    h2('Body Care Splurges'),
    p('Body care is an underrated place to spend a little more. You use it daily over a large area, so texture and scent matter more than people expect.'),

    h3('3. First Aid Beauty KP Bump Eraser Body Scrub'),
    lead('Why it’s worth it:', 'This body scrub pairs 10% AHA with an exfoliating scrub texture to target rough, bumpy skin, the kind often seen on the backs of arms and thighs. Tackling that texture takes more than a sugar scrub, and with nearly 30,000 ratings on Amazon, it’s one of the most-reviewed body treatments you can buy.'),
    lead('Best for:', 'Rough, bumpy or uneven skin texture on the body.'),
    lead('How to use it:', 'Use it in the shower a few times a week rather than daily, and follow with a moisturizer. AHAs can make skin more sensitive to the sun, so use sunscreen on treated areas that are exposed.'),
    lead('When to skip it:', 'If you have sensitive skin, eczema or a diagnosed skin condition, check with a dermatologist before using an acid-based scrub.'),
    p({ a: 'See if it’s still on sale', href: GO(FAB) }),

    h3('4. Sol de Janeiro Brazilian Bum Bum Cream'),
    lead('Why it’s worth it:', 'This cream built a cult following for two reasons: a fast-absorbing, non-greasy texture, and a gourmand pistachio-and-salted-caramel scent that lingers for hours. For many people it replaces a separate body fragrance, which makes the price easier to justify. The formula includes caffeine-rich guaraná and cupuaçu butter.'),
    lead('Best for:', 'Anyone who wants their body cream to smell great, and people who layer scents.'),
    lead('Tip:', 'The 2.5 fl oz size is the easiest way to try the scent before committing to a larger jar. Check the listing for a clip coupon before adding it to your cart.'),
    p({ a: 'See the Bum Bum Cream deal', href: `${SITE}/deals/${BUMBUM}` }),

    h3('5. Sol de Janeiro Bum Bum Jet Set'),
    lead('Why it’s worth it:', 'If you’re curious about the scent but hesitant about the full routine, this travel set bundles the Bum Bum Cream with a matching body wash and perfume mist in TSA-friendly sizes. It’s a lower-risk way to try the line, and it doubles as an easy gift.'),
    lead('Best for:', 'First-time buyers, frequent travelers and gift shopping.'),
    p({ a: 'Check availability', href: GO(JETSET) }),

    h2('Makeup Splurge'),
    h3('6. Lancôme Lash Idôle Mascara'),
    lead('Why it’s worth it:', 'Mascara is where the brush matters as much as the formula. Lash Idôle is designed to lift and volumize while keeping lashes separated, avoiding the clumpy, spidery look many drugstore volumizers leave. With more than 20,000 bought on Amazon in the past month alone, it’s clearly a repeat favorite.'),
    lead('Best for:', 'Anyone who wants volume and lift without clumps, and people who’ve struggled with mascaras that smudge or flake.'),
    lead('When to skip it:', 'Mascara should be replaced every few months, so the cost-per-use argument is weaker than for skincare. If you go through mascara quickly, a well-reviewed drugstore formula may make more sense.'),
    p({ a: 'See how much it is right now', href: GO(LASH) }),

    h2('Fragrance Splurges'),
    // Baccarat sentence + link added in internal-links batch 1 (2026-09-26).
    p('Fragrance is one of the best-value luxury categories when you pick well. A good eau de parfum lasts longer on skin than cheaper body sprays, and a 1 oz bottle worn a few sprays at a time lasts a long time. And when the scent you want is a niche bottle priced out of reach, a well-chosen dupe can get surprisingly close. See our ', { a: 'Baccarat Rouge 540 dupe guide', href: `${SITE}/blog/baccarat-rouge-540-dupe-dossier` }, '.'),

    h3('7. Lancôme La Vie Est Belle Eau de Parfum'),
    lead('Why it’s worth it:', 'With more than 30,000 ratings on Amazon, this is one of the most-reviewed prestige fragrances on the site. It’s a warm, sweet floral that’s easy to wear and recognizable without being overpowering.'),
    lead('Best for:', 'Anyone who likes sweeter, cozier scents and wants one signature fragrance for daily wear.'),
    lead('Size tip:', 'The 1 fl oz bottle is the smart entry point. It costs much less than the larger sizes and lets you live with the scent before committing to a big bottle.'),
    p({ a: 'Find out if it’s still this price', href: GO(LVEB) }),

    h3('8. Armani Acqua di Gioia Eau de Parfum'),
    lead('Why it’s worth it:', 'Where La Vie Est Belle is warm and sweet, Acqua di Gioia is fresh and aquatic, a clean, light scent that works in warm weather and at the office. It’s a long-running favorite for people who don’t like heavy perfumes.'),
    lead('Best for:', 'Anyone who prefers fresh, clean scents, and anyone looking for an easy everyday fragrance.'),
    lead('Size tip:', 'As with La Vie Est Belle, the 1 fl oz bottle keeps the cost down while you decide if it’s your scent.'),
    p({ a: 'Check the current price before it changes', href: GO(ADG) }),

    h2('Choosing Your First Splurge'),
    p('If you’re only buying one luxury beauty product, match it to what you use most and what cheaper products haven’t solved.'),
    li({ b: 'You wear makeup or SPF daily:' }, ' Start with the ', { b: 'ELEMIS Pro-Collagen Cleansing Balm' }, '. It’s the most-used product on this list, so the cost per use drops fastest.'),
    li({ b: 'Your skin feels dry or dull:' }, ' The ', { b: 'ELEMIS Superfood Facial Oil' }, ' adds nourishment in just a few drops.'),
    li({ b: 'Rough texture on your arms or legs:' }, ' The ', { b: 'First Aid Beauty KP Bump Eraser' }, ' is a targeted fix a basic scrub can’t match.'),
    li({ b: 'You want to smell great without perfume:' }, ' The ', { b: 'Sol de Janeiro Bum Bum Cream' }, '. Try the Jet Set first if you’re unsure about the scent.'),
    li({ b: 'Mascara always clumps on you:' }, ' ', { b: 'Lancôme Lash Idôle' }, ' is the one to try.'),
    li({ b: 'You want a signature scent:' }, ' ', { b: 'La Vie Est Belle' }, ' if you like warm and sweet, ', { b: 'Acqua di Gioia' }, ' if you like fresh and clean.'),
    p('One rule of thumb: splurge on what you use daily and for months, and save on anything you finish fast or that’s mostly water and marketing.'),

    h2('Frequently Asked Questions'),
    h3('Are luxury beauty products really better than drugstore ones?'),
    p('Sometimes. In categories like cleansing balms, fragrance and certain mascaras, premium formulas often perform noticeably better. For basics like simple moisturizers, micellar water and cotton pads, the difference is usually small. The smartest approach is a mix: spend on products that do something hard to replicate, and save on the rest.'),
    h3('What is the best way to save on luxury beauty?'),
    p('Buy smaller sizes first, like 1 oz fragrances and travel sets, to test before committing. Watch for sales events and clip coupons on Amazon, which sometimes apply to premium beauty brands. Our ', { a: 'deals page', href: DEALS_PAGE }, ' tracks current markdowns.'),
    h3('Is a 1 oz perfume worth it?'),
    p('For most people, yes. A 1 oz bottle worn a few sprays a day lasts many months, costs much less than larger sizes, and lets you confirm you love the scent before buying a bigger bottle.'),
    h3('Are travel-size beauty sets a good deal?'),
    p('Often. Sets like the Sol de Janeiro Jet Set bundle several products at a lower entry price than buying each full size. They’re a low-risk way to try a brand and make easy gifts.'),
    h3('Are luxury beauty products on Amazon authentic?'),
    p('Buy from listings ', { a: 'sold or shipped by Amazon', href: `${SITE}/blog/is-amazon-luxury-authentic` }, ' or by the brand itself, and look for Amazon’s “Premium Brand Sourced” badge on premium beauty items. The products in this guide were chosen from listings with that badge.'),

    h2('Final Verdict'),
    p('Luxury beauty products are worth the money when they solve a problem cheaper ones can’t, or when you use them long enough to bring the cost per use down. The ', { b: 'ELEMIS Pro-Collagen Cleansing Balm' }, ' is the strongest all-around splurge on this list because you’ll use it every day. For fragrance, a 1 oz bottle of ', { b: 'La Vie Est Belle' }, ' or ', { b: 'Acqua di Gioia' }, ' delivers months of wear. And if you want a luxury product that feels like a treat every day, the ', { b: 'Sol de Janeiro Bum Bum Cream' }, ' is hard to beat.'),
    p('Pair one or two splurges with affordable basics, and see our ', { a: 'Korean skincare guide', href: KOREAN_GUIDE }, ' for high-performing products that won’t strain your budget.'),
    em(`${DISCLOSURE} This article is for informational purposes only and is not a substitute for professional medical advice.`),
  ]
}

// ── Products (ItemList schema): brand images + verified ratings from the deal docs ──

type DealDoc = { slug: string; asin: string; rating: number; reviewCount: number; image: { asset?: { _ref: string } } & Record<string, unknown> }

async function buildProducts() {
  const deals = await client.fetch<DealDoc[]>(
    `*[_type == "deal" && slug.current in $slugs && !(_id in path("drafts.**"))]{ "slug": slug.current, asin, rating, reviewCount, image }`,
    { slugs: PICKS.map((x) => x.slug) }
  )
  return PICKS.map((pick) => {
    const deal = deals.find((d) => d.slug === pick.slug)
    if (!deal?.image?.asset) throw new Error(`No deal image for ${pick.slug}`)
    return {
      _type: 'productItem', _key: k(), name: pick.name, brand: pick.brand, asin: deal.asin,
      affiliateUrl: GO(pick.slug),
      image: imageUrl.image(deal.image).width(800).url(),
      ratingValue: deal.rating, reviewCount: deal.reviewCount, description: pick.description,
    }
  })
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const execute = process.argv.includes('--execute')
  const linkDeals = process.argv.includes('--link-deals')

  if (linkDeals) {
    const post = await client.fetch<{ _id: string } | null>(`*[_type == "post" && slug.current == $slug && !(_id in path("drafts.**"))][0]{ _id }`, { slug: SLUG })
    if (!post) throw new Error('Post not published yet')
    const deals = await client.fetch<{ _id: string; slug: string; refs: string[] | null }[]>(
      `*[_type == "deal" && slug.current in $slugs && !(_id in path("drafts.**"))]{ _id, "slug": slug.current, "refs": relatedGuides[]._ref }`,
      { slugs: PICKS.map((x) => x.slug) }
    )
    const tx = client.transaction()
    for (const d of deals) {
      if (d.refs?.includes(post._id)) { console.log(`  ${d.slug}: already linked`); continue }
      if ((d.refs?.length ?? 0) >= 3) { console.log(`  ${d.slug}: already has 3 guides, skipped`); continue }
      // Append: existing hand-picked guides (Korean pillar) stay first.
      tx.patch(d._id, (pt) => pt.setIfMissing({ relatedGuides: [] }).append('relatedGuides', [{ _key: k(), _type: 'reference', _ref: post._id, _weak: true }]))
      console.log(`  ${d.slug}: + guide (now ${(d.refs?.length ?? 0) + 1})`)
    }
    await tx.commit()
    console.log(`Linked ${deals.length} deals.`)
    return
  }

  const existing = await client.fetch<number>(`count(*[_type == "post" && slug.current == $slug])`, { slug: SLUG })
  if (existing > 0) throw new Error(`Slug "${SLUG}" already in use`)
  const products = await buildProducts()

  if (!execute) {
    const body = buildBody('image-dryrun')
    const blocks = body.filter((b): b is Block => b._type === 'block')
    const headings = blocks.filter((b) => b.style === 'h2' || b.style === 'h3').map((b) => `${b.style}: ${b.children[0].text}`)
    const links = blocks.flatMap((b) => b.markDefs).map((d) => d.href)
    const tableLinks = body.filter((b): b is Table => b._type === 'table').flatMap((t) => t.rows.flatMap((r) => r.cells.filter((c) => c.includes('||')).map((c) => c.split('||')[1])))
    console.log('DRY RUN — nothing written\n')
    console.log(headings.join('\n'))
    console.log(`\nblocks: ${body.length}, inline links: ${links.length}, table links: ${tableLinks.length}`)
    console.log('unique link targets:\n  ' + [...new Set([...links, ...tableLinks])].join('\n  '))
    console.log('\nproducts:\n  ' + products.map((x) => `${x.name} | ${x.ratingValue}★ ${x.reviewCount} | ${x.image.slice(0, 90)}`).join('\n  '))
    return
  }

  const coverPath = process.argv[process.argv.indexOf('--execute') + 1]
  if (!coverPath || !existsSync(coverPath)) throw new Error(`Cover image not found: ${coverPath}`)
  const cover = await client.assets.upload('image', createReadStream(coverPath), { filename: `${SLUG}.png` })
  console.log(`cover asset: ${cover._id}`)

  const doc = {
    _id: crypto.randomUUID(),
    _type: 'post',
    title: TITLE,
    slug: { _type: 'slug', current: SLUG },
    publishedAt: new Date().toISOString(),
    author: 'SpartanShopper',
    category: 'beauty',
    relatedCategory: 'beauty',
    excerpt: EXCERPT,
    coverImage: { _type: 'image', asset: { _type: 'reference', _ref: cover._id }, alt: COVER_ALT },
    seo: { metaDescription: META },
    products,
    body: buildBody(cover._id),
  }
  const created = await client.create(doc)
  console.log(`published: ${created._id} → ${SITE}/blog/${SLUG}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
