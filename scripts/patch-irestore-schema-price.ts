import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true })

const client = createClient({
  projectId: 'eohdr7jw',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
})

const SLUG = 'irestore-hair-wellness-review'
const SITE_URL = 'https://www.spartanshopper.com'

const PRODUCTS = [
  {
    name: 'iRestore Essential Laser Hair Growth System',
    price: 499.00,
    url: `${SITE_URL}/go/irestore-essential`,
    image: 'https://cdn.sanity.io/images/eohdr7jw/production/0d265c27e35878853fb0994fbe22829f79ca11ba-1376x768.png',
    description: 'FDA-cleared 51-laser helmet for mild to moderate hair loss. Entry-level iRestore model with hands-free treatment.',
    ratingValue: 3.9,
    reviewCount: 4200,
  },
  {
    name: 'iRestore Professional Laser Hair Growth System',
    price: 899.00,
    url: `${SITE_URL}/go/irestore-professional`,
    image: 'https://cdn.sanity.io/images/eohdr7jw/production/0d265c27e35878853fb0994fbe22829f79ca11ba-1376x768.png',
    description: 'FDA-cleared 282-laser and LED helmet for moderate to advanced hair loss. Higher photon count than Essential.',
    ratingValue: 4.1,
    reviewCount: 980,
  },
  {
    name: 'iRestore Elite Laser Hair Growth System',
    price: 1899.00,
    url: `${SITE_URL}/go/irestore-elite`,
    image: 'https://cdn.sanity.io/images/eohdr7jw/production/0d265c27e35878853fb0994fbe22829f79ca11ba-1376x768.png',
    description: 'iRestore\'s top-tier 320-laser and LED helmet for all hair loss stages. Includes smartphone control and premium build.',
    ratingValue: 4.3,
    reviewCount: 210,
  },
]

async function main() {
  console.log(`\n🔍 Fetching iRestore article...`)

  const doc = await client.fetch(
    `*[_type == "post" && slug.current == $slug][0]{ _id, title, slug, excerpt, publishedAt }`,
    { slug: SLUG }
  )

  if (!doc) {
    console.error(`❌ Article not found: ${SLUG}`)
    return
  }

  console.log(`✅ Found: ${doc.title}`)

  const pageUrl = `${SITE_URL}/blog/${SLUG}`

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: doc.title,
        description: doc.excerpt ?? '',
        url: pageUrl,
        datePublished: doc.publishedAt,
        dateModified: doc.publishedAt,
        author: { '@type': 'Organization', name: 'SpartanShopper', url: SITE_URL },
        publisher: {
          '@type': 'Organization',
          name: 'SpartanShopper',
          url: SITE_URL,
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
        },
      },
      ...PRODUCTS.map((p, i) => ({
        '@type': 'Product',
        name: p.name,
        description: p.description,
        image: p.image,
        brand: { '@type': 'Brand', name: 'iRestore' },
        offers: {
          '@type': 'Offer',
          price: p.price,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: p.url,
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: p.ratingValue,
          reviewCount: p.reviewCount,
          bestRating: 5,
          worstRating: 1,
        },
      })),
    ],
  }

  const jsonLd = JSON.stringify(schema)

  await client.patch(doc._id).set({ jsonLd }).commit()

  console.log(`\n✅ Stored JSON-LD override with @graph containing:`)
  console.log(`   • Article schema`)
  PRODUCTS.forEach(p => console.log(`   • Product: ${p.name} → $${p.price}`))
  console.log(`\n📋 Deploy to Vercel, then request indexing in GSC for:\n   ${pageUrl}\n`)
}

main()
