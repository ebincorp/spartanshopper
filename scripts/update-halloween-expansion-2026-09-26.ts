/**
 * Halloween roundup expansion (2026-09-26): kids + adults + pets.
 * Post: /blog/halloween-costumes-without-surprise-extras (_id halloween-costumes-2026-roundup)
 *
 *   npx tsx scripts/update-halloween-expansion-2026-09-26.ts            # dry run: print the new outline
 *   npx tsx scripts/update-halloween-expansion-2026-09-26.ts --execute  # snapshot, create /go links, patch post, ping IndexNow
 *   npx tsx scripts/update-halloween-expansion-2026-09-26.ts --revert   # restore the post from the snapshot
 *
 * Copy for the new sections is the reviewer's draft, verbatim, except one
 * sentence naming the COSUSKET variant the link opens (as requested).
 * All new picks were verified on Amazon 2026-09-26 (docs/halloween-recheck-2026-09-26.md).
 * New sections carry no product photo: no exact brand photo exists for these
 * products, and Amazon listing images aren't used (spartan-seo image rule).
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- the post body is heterogeneous Portable Text (blocks, tables, images) edited in place */
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

const POST_ID = 'halloween-costumes-2026-roundup'
const SLUG = 'halloween-costumes-without-surprise-extras'
const REVERT_FILE = path.resolve('scripts/data/halloween-expansion-2026-09-26-revert.json')
const SITE = 'https://www.spartanshopper.com'
const GO = (s: string) => `${SITE}/go/${s}`

const NEW_LINKS = [
  { slug: 'spooktacular-fairytale-witch-costume', title: 'Spooktacular Creations Fairytale Witch Deluxe Set', asin: 'B075BP3WXQ' },
  { slug: 'cosusket-adult-animal-onesie', title: 'COSUSKET Unisex Adult Animal Onesie (Bear, Red/Yellow)', asin: 'B0D77K99ZR' },
  { slug: 'inflatable-dinosaur-costume-adult', title: 'Inflatable T-Rex Dinosaur Costume (Adult)', asin: 'B0CWTNMDVD' },
  { slug: 'pet-bat-wings-costume', title: 'Pet Bat Wings Costume (Cats & Small Dogs)', asin: 'B07GFND8ZC' },
  { slug: 'cat-lion-mane-costume', title: 'Lion Mane Wig for Cats', asin: 'B01M71UWHK' },
  { slug: 'dog-lion-mane-costume', title: 'Lion Mane Wig for Dogs', asin: 'B075CGKXSV' },
]

// ── Portable Text helpers: **bold** and [text](href) inline markup ───────────
const k = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12)
type Span = { _type: 'span'; _key: string; text: string; marks: string[] }
type LinkDef = { _key: string; _type: 'link'; href: string }
type Block = { _type: 'block'; _key: string; style: string; children: Span[]; markDefs: LinkDef[]; listItem?: 'bullet'; level?: number }

function rich(src: string, style = 'normal', listItem?: 'bullet'): Block {
  const children: Span[] = []
  const markDefs: LinkDef[] = []
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    if (m.index > last) children.push({ _type: 'span', _key: k(), text: src.slice(last, m.index), marks: [] })
    if (m[1] !== undefined) children.push({ _type: 'span', _key: k(), text: m[1], marks: ['strong'] })
    else {
      const key = k()
      markDefs.push({ _key: key, _type: 'link', href: m[3] })
      children.push({ _type: 'span', _key: k(), text: m[2], marks: [key] })
    }
    last = re.lastIndex
  }
  if (last < src.length) children.push({ _type: 'span', _key: k(), text: src.slice(last), marks: [] })
  return { _type: 'block', _key: k(), style, children, markDefs, ...(listItem && { listItem, level: 1 }) }
}
const p = (s: string) => rich(s)
const li = (s: string) => rich(s, 'normal', 'bullet')
const h2 = (s: string) => rich(s, 'h2')
const h3 = (s: string) => rich(s, 'h3')

// ── New / replaced sections (reviewer draft) ─────────────────────────────────
const INTRO = [
  p('We picked costumes for kids, adults and pets, and for each one we noted what comes in the package, what you’ll still need, and the sizing details that cause most returns. The kids’ picks are sorted by how the listings are labeled, but those labels are a starting point, not a rule about who can wear what.'),
  p('Prices move constantly in October, so we don’t list them here. Each pick links to its current price.'),
]

const WITCH = [
  h2('Fairytale witch: the whole look, broom included'),
  p('The Spooktacular Creations Fairytale Witch set is one of the few kids’ costumes where the photo and the box match. You get the **hat, a full-skirted dress and a broom**, so there’s no separate trip for the prop that makes a witch a witch.'),
  li('**In the box:** matching hat, dress, broom.'),
  li('**Still to plan for:** shoes and tights, plus a warm layer. The dress isn’t made for a cold evening of trick-or-treating.'),
  li('**Sizing:** toddler (3–4) through XL (12–14). It’s machine washable, which matters more than it sounds after a night of candy.'),
  li('**Why it’s here:** thousands of ratings, steady sales, and it’s from the same maker as the pirate set above.'),
  p(`[See current price →](${GO('spooktacular-fairytale-witch-costume')})`),
]

const ADULTS_PETS_GROUPS = [
  h2('Adult costumes: low effort, high payoff'),
  p('The adult split-sleeve dress above is the “build a look from what you own” option. These two sit at the other end: put it on and you’re done.'),
  h3('Animal onesie: a costume you’ll wear again'),
  p('The COSUSKET adult onesie is a **one-piece zip-up flannel** in a range of animals and colors, from XS to XXL. It’s the most reusable costume here. After Halloween it’s just very committed loungewear.'),
  li('**In the box:** the onesie. That’s the whole costume.'),
  li('**Still to plan for:** nothing, unless you want face paint.'),
  li('**Watch for:** the listing groups several animals under one set of ratings, so check that the photos and reviews you’re reading match the animal you pick. Our link opens the bear in red and yellow.'),
  li('**Care:** machine washable.'),
  p(`[See current price →](${GO('cosusket-adult-animal-onesie')})`),
  h3('Inflatable dinosaur: the one everyone photographs'),
  p('A blow-up T-rex suit is guaranteed to get a reaction, and this one is a steady seller for good reason. The catch is exactly the kind this guide is about.'),
  li('**In the box:** the inflatable suit and a built-in fan.'),
  li('**Still to plan for:** **4 AA batteries for the fan, not included.** Buy them now, not at 6 p.m. on the 31st.'),
  li('**Sizing:** fits roughly 5\'0" to 6\'2".'),
  li('**Care:** hand wash only.'),
  li('**Honest note:** inflatables are warm inside and wide outside. Plan around doorways, car rides and crowded parties.'),
  p(`[See current price →](${GO('inflatable-dinosaur-costume-adult')})`),

  h2('Pet costumes: measure first, then shop'),
  p('Most returned pet costumes come down to fit. Before you order, **measure your pet’s neck and chest** with a soft tape and compare them to the listing. These three picks all list their measurements clearly.'),
  h3('Bat wings: the easiest pet costume to get right'),
  p('Felt wings on an adjustable harness. They weigh about an ounce, so most pets tolerate them better than a full outfit.'),
  li('**Fits:** chest 14–17 in, neck 9–14 in. **Cats and small dogs only.**'),
  li('**Why it works:** nothing on the head, nothing on the legs, and it’s off in seconds if your pet isn’t having it.'),
  p(`[See current price →](${GO('pet-bat-wings-costume')})`),
  h3('Lion mane for cats (and small dogs)'),
  p('The classic photo-op costume. A soft mane wig that turns a house cat into a very small, very unimpressed lion.'),
  li('**Fits:** neck 10–12 in, so average cats and small dogs.'),
  li('**Care:** hand washable.'),
  p(`[See current price →](${GO('cat-lion-mane-costume')})`),
  h3('Lion mane for dogs'),
  p('The same idea sized up, with ears and a button closure.'),
  li('**Sizes:** M and L, for medium-to-large dogs.'),
  li('**Watch for:** it isn’t water resistant, so skip the rainy-night walk in it.'),
  p(`[See current price →](${GO('dog-lion-mane-costume')})`),
  p('**A quick pet-comfort rule:** if your pet freezes, paws at the costume or tries to back out of it, take it off. A few photos are plenty.'),

  h2('Costume ideas for groups and families'),
  p('You don’t need a matching set to look coordinated. A few combinations from the picks in this guide:'),
  li('**Witch and familiar:** the fairytale witch set plus a cat in bat wings.'),
  li('**Pride of lions:** a kid in the leopard onesie with a lion-maned dog or cat.'),
  li('**Onesie crew:** the adult animal onesie comes in kids’ sizes too, so the whole family can go as different animals from one listing.'),
  li('**Pirate and dinosaur:** it makes no sense, and that’s the point.'),
]

const FAQ = [
  h2('Frequently Asked Questions'),
  h3('How do I measure my pet for a costume?'),
  p('Use a soft tape measure around the base of the neck where a collar sits, then around the widest part of the chest just behind the front legs. Compare both to the listing. If your pet falls between sizes, size up.'),
  h3('What extras do Halloween costumes usually need?'),
  p('Most often: shoes, tights or leggings, a warm layer, face paint, and batteries for light-up or inflatable costumes. Check the “what’s included” section of any listing before ordering, not just the photos.'),
  h3('Can adults wear onesies as Halloween costumes?'),
  p('Yes. Animal onesies are one of the easiest adult costumes, since they’re a complete look in one piece and you can wear them afterward.'),
]

const TABLE_ROWS: string[][] = [
  ['Costume', 'Option checked', 'In the box / what else to plan for'],
  [`GIFTINBOX leopard onesie||${GO('giftinbox-leopard-onesie')}`, 'Leopard, S (5–6 years)', 'Hooded onesie with ears, tail and claw gloves; plan for footwear, check tail and glove attachment'],
  [`Spooktacular Creations fairytale witch||${GO('spooktacular-fairytale-witch-costume')}`, 'Purple, Small (5–7 years)', 'Hat, full-skirted dress and broom; plan for shoes, tights and a warm layer'],
  [`GIFTINBOX light-up cat set||${GO('giftinbox-light-up-cat-costume')}`, 'Small (3–4 years)', 'Bodysuit, tights, tutu, tail, ears and light string; plan for footwear, confirm battery details'],
  [`GIFTINBOX firefighter set||${GO('giftinbox-firefighter-costume')}`, 'Yellow, 3T (3–4 years)', 'Outfit, hat and toy props; plan for footwear and a way to carry the props'],
  [`Spooktacular Creations pirate set||${GO('spooktacular-boys-pirate-costume')}`, 'Black, Medium (8–10 years)', 'Hat, jacket, vest, pants and accessories; plan for footwear, check measurements (tight fit flagged)'],
  [`Bosvin vampire set||${GO('bosvin-boys-vampire-costume')}`, 'Black & Red, 10–12 years', 'Shirt with vest, pants, cape, cane and teeth; plan for footwear, check that the cane and teeth arrive'],
  [`Scarlet Darkness split-sleeve dress||${GO('scarlet-darkness-split-sleeve-dress')}`, 'Olive Green, Large (adult)', 'The dress only; plan for shoes and accessories'],
  [`COSUSKET animal onesie||${GO('cosusket-adult-animal-onesie')}`, 'Bear, Red/Yellow (adult)', 'The whole costume in one piece; nothing else needed'],
  [`Inflatable dinosaur||${GO('inflatable-dinosaur-costume-adult')}`, 'Adult, fits about 5\'0"–6\'2"', 'Suit with built-in fan; plan for 4 AA batteries (not included)'],
  [`Pet bat wings||${GO('pet-bat-wings-costume')}`, 'One size (chest 14–17 in)', 'Wings on a harness; cats and small dogs only'],
  [`Lion mane for cats||${GO('cat-lion-mane-costume')}`, 'Neck 10–12 in', 'Mane wig; average cats and small dogs'],
  [`Lion mane for dogs||${GO('dog-lion-mane-costume')}`, 'M or L', 'Mane with ears; medium-to-large dogs, not water resistant'],
]

// Price sentences removed from existing sections; everything else kept verbatim.
const TEXT_EDITS: Record<string, [string, string]> = {
  'cover-illustration-note': ['Cover: AI-generated illustration. Each product section below shows the actual listing photo.', 'Cover: AI-generated illustration, not product photography.'],
  hw8: ['We checked these listings on September 20, 2026. This is a listing-and-review buying guide, not a hands-on test. Prices below apply to the specific options checked and can change by size, color, seller, or membership. Check the final price and delivery estimate for your address before ordering.',
        'We checked these listings on September 26, 2026. This is a listing-and-review buying guide, not a hands-on test. Check the final price and delivery estimate for your address before ordering.'],
  hw51: ['The checked Small was $28.99. Several sizes shared that offer, but a separately labeled Large option cost more. ', 'Not every size costs the same, so check the price of the option you select. '],
  hw71: ['The checked Black, Medium (8–10 years) was $34.99. ', ''],
  hw82: ['We checked Black & Red in 10–12 Years at $28.50. The 5–7 Years option displayed a higher price, so do not assume every size costs the same. ', 'Not every size costs the same, so check the price of the option you select. '],
  hw95: ['The checked Olive Green, Large was $39.99. Its earlier $33.99 timed offer had ended. Other colors were more expensive, so choose', 'Prices vary by color, so choose'],
}
const REMOVE = new Set(['hw21', 'hw34', 'costume-photo-1', 'hw36', 'hw38', 'hw40', 'hw43']) // price note + purple cat section

type Doc = { _id: string; _rev: string; body: any[]; [k: string]: unknown }

function editText(block: any, from: string, to: string) {
  const full = block.children.map((c: any) => c.text).join('')
  if (!full.includes(from)) throw new Error(`[${block._key}] text to replace not found: "${from.slice(0, 50)}…"`)
  // These paragraphs are single plain runs (verified in dry run); rewrite the run.
  if (block.children.length !== 1) throw new Error(`[${block._key}] expected one text run, found ${block.children.length}`)
  block.children[0].text = full.replace(from, to)
}

function buildBody(body: any[]): any[] {
  const out: any[] = []
  for (const b of body) {
    if (REMOVE.has(b._key)) {
      if (b._key === 'hw34') out.push(...WITCH) // witch takes the purple cat's slot
      continue
    }
    if (b._key === 'hw4') { out.push(...INTRO); continue }
    if (b._key === 'hw19') { out.push({ ...b, caption: 'Picks checked September 26, 2026; availability can change.', rows: TABLE_ROWS.map((cells) => ({ _type: 'tableRow', _key: k(), cells })) }); continue }
    const copy = JSON.parse(JSON.stringify(b))
    if (TEXT_EDITS[b._key]) editText(copy, ...TEXT_EDITS[b._key])
    out.push(copy)
    if (b._key === 'hw100') out.push(...ADULTS_PETS_GROUPS) // after the adult dress CTA
    if (b._key === 'hw112') out.push(...FAQ) // after the "Before you click buy" list, before the closing line
  }
  return out
}

async function main() {
  if (process.argv.includes('--revert')) {
    const saved: Doc = JSON.parse(readFileSync(REVERT_FILE, 'utf8'))
    const { _id, _rev, _createdAt, _updatedAt, ...rest } = saved as any
    void _rev; void _createdAt; void _updatedAt
    await client.createOrReplace({ _id, ...rest })
    console.log(`Restored ${_id} from ${REVERT_FILE}`)
    return
  }

  const post = await client.fetch<Doc>(`*[_id == $id][0]`, { id: POST_ID })
  const draft = await client.fetch<number>(`count(*[_id == $d])`, { d: `drafts.${POST_ID}` })
  if (!post) throw new Error('post not found')
  if (draft) throw new Error('post has an unpublished draft — resolve it first')
  const keys = new Set(post.body.map((b: any) => b._key))
  for (const key of [...REMOVE, 'hw4', 'hw19', 'hw100', 'hw112', ...Object.keys(TEXT_EDITS)]) if (!keys.has(key)) throw new Error(`expected block ${key} missing`)
  const taken = await client.fetch<string[]>(`*[slug.current in $s].slug.current`, { s: NEW_LINKS.map((l) => l.slug) })

  const body = buildBody(post.body)
  const text = JSON.stringify(body)
  const leftoverPrices = [...text.matchAll(/\$\d+(\.\d{2})?/g)].map((m) => m[0])
  const headings = body.filter((b) => b.style === 'h2' || b.style === 'h3').map((b) => `${b.style}: ${b.children.map((c: any) => c.text).join('')}`)
  console.log(headings.join('\n'))
  console.log(`\nblocks ${post.body.length} → ${body.length}; images kept: ${body.filter((b) => b._type === 'image').length}`)
  console.log(`dollar amounts left in body: ${leftoverPrices.length ? leftoverPrices.join(', ') : 'none'}`)
  console.log(`new /go/ links: ${NEW_LINKS.map((l) => l.slug).join(', ')}${taken.length ? `  (ALREADY EXIST: ${taken.join(', ')})` : ''}`)
  if (!process.argv.includes('--execute')) { console.log('DRY RUN — nothing written'); return }
  if (taken.length) throw new Error('slug collision')

  mkdirSync(path.dirname(REVERT_FILE), { recursive: true })
  if (existsSync(REVERT_FILE)) throw new Error(`${REVERT_FILE} exists — refusing to overwrite an earlier revert record`)
  writeFileSync(REVERT_FILE, JSON.stringify(post, null, 1))

  const tx = client.transaction()
  for (const l of NEW_LINKS) tx.createIfNotExists({ _id: `affiliateLink-${l.slug}`, _type: 'affiliateLink', title: l.title, slug: { _type: 'slug', current: l.slug }, destination: `https://www.amazon.com/dp/${l.asin}?tag=sku18798384-20` })
  tx.patch(POST_ID, (pt) => pt.ifRevisionId(post._rev)
    .set({
      title: 'Halloween Costumes for Kids, Adults & Pets: What’s Actually in the Box',
      'seo.metaTitle': 'Halloween Costumes for Kids, Adults & Pets: What’s Actually in the Box',
      'seo.metaDescription': 'Halloween costumes for kids, adults and pets, with what’s included in each set, what you’ll still need to buy, and sizing tips before you order.',
      excerpt: 'A costume can look complete in the photo and still send you hunting for shoes, batteries and a wig. We checked what comes in the box for kids’, adult and pet costumes, so the only surprise on Halloween is the doorbell.',
      body,
    })
    // The manual BlogPosting jsonLd carried the old kids-only headline and blocked
    // auto FAQ schema; without it the site generates Article + FAQPage itself.
    .unset(['jsonLd']))
  await tx.commit()
  console.log(`updated ${SLUG}; revert record: ${REVERT_FILE}`)
  await pingIndexNow([`/blog/${SLUG}`])
}

main().catch((e) => { console.error(e); process.exit(1) })
