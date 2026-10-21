/*
 * Read-only companion to Bing Webmaster Tools' "Title too long" report.
 * Requires SANITY_API_TOKEN in .env.local.
 */
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@sanity/client')

const slugs = new Set([
  'at-home-laser-skin-resurfacing',
  'best-at-home-skin-devices-2026',
  'best-blood-sugar-supplements-2026',
  'best-dyson-hair-tools-2026',
  'best-fda-cleared-led-face-masks-wrinkles-2026',
  'best-japanese-exfoliating-shower-towels-2026',
  'best-online-pet-pharmacy-2026',
  'best-sea-moss-gel',
  'best-sleep-drinks-2026',
  'biodance-bio-collagen-real-deep-mask-review',
  'biodance-eye-patches-review',
  'canada-pet-care-review-2026',
  'colonbroom-review-2026',
  'currentbody-vs-irestore-vs-dr-dennis-gross-led-mask',
  'duffel-bag-airline-personal-item-size',
  'hypochlorous-acid-rosacea',
  'irestore-hair-wellness-review',
  'jiyu-toning-polish-pads-review',
  'mechanic-shop-organization',
  'metamucil-for-constipation',
  'psyllium-husk-how-to-use',
  'psyllium-husk-vs-miralax',
  'psyllium-husk-weight-loss',
  'sea-moss-side-effects',
  'sea-moss-supplement',
])

const client = createClient({
  projectId: 'eohdr7jw',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  perspective: 'published',
})

async function main() {
  const posts = await client.fetch(`*[_type == "post"]{_id, _updatedAt, "slug": slug.current, title, seo}`)
  const report = posts
    .filter((post) => slugs.has(post.slug))
    .map((post) => {
      const sourceTitle = post.seo?.metaTitle || post.title
      const liveTitle = `${sourceTitle} — SpartanShopper`
      return { ...post, sourceTitle, sourceLength: sourceTitle.length, liveTitle, liveLength: liveTitle.length }
    })
    .sort((a, b) => a.slug.localeCompare(b.slug))

  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
