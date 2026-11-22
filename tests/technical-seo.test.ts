import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalBlogLink } from '../lib/blogQueries'
import { sanityImageSrcSet, sanityImageVariant, socialImageUrl } from '../lib/editorial-image'
import { articleDescription, generateJsonLd, generatePageJsonLd } from '../lib/generateJsonLd'
import type { Post } from '../lib/types'

const post: Post = {
  _id: 'fixture',
  title: 'Compare test organizers',
  slug: { current: 'test-organizers' },
  publishedAt: '2026-10-01T00:00:00Z',
}

test('empty blog descriptions fall through to visible copy', () => {
  assert.equal(articleDescription({
    ...post,
    seo: { metaDescription: ' ' },
    excerpt: '',
    body: [{ _type: 'block', style: 'normal', children: [{ text: 'Measure your drawer before buying.' }] }],
  }), 'Measure your drawer before buying.')
})

test('article supplements its CMS schema without duplicating an explicit article', () => {
  const legacy = JSON.parse(generateJsonLd({
    ...post,
    jsonLd: '{"@context":"https://schema.org","@type":"ItemList","name":"Organizers"}',
  }))
  assert.deepEqual(legacy['@graph'].map((node: { '@type': string }) => node['@type']), ['BlogPosting', 'ItemList'])

  const explicit = JSON.parse(generateJsonLd({
    ...post,
    jsonLd: '{"@type":"Article","publisher":{"logo":{"@type":"ImageObject","url":"/logo.png"}}}',
  }))
  assert.equal(explicit['@type'], 'Article')
  assert.equal(explicit.publisher.logo.url, 'https://www.spartanshopper.com/android-chrome-512x512.png')
})

test('authored article markup uses smaller images and correct dimensions', () => {
  const png = 'https://cdn.sanity.io/images/example/production/cover-1408x768.png'
  const rendition = png + '?w=1200&fm=webp&q=78'
  const portrait = 'https://cdn.sanity.io/images/example/production/portrait-1024x1536.png'
  const external = 'https://example.com/cover-1408x768.png'
  const crop = png + '?rect=0,0,800,600&w=800'
  const markup = JSON.parse(generateJsonLd({
    ...post,
    jsonLd: JSON.stringify({ '@graph': [
      { '@type': 'BlogPosting', image: [png, portrait, external, crop] },
      { '@type': 'Article', image: { '@type': 'ImageObject', url: png, contentUrl: png, width: 1408, height: 768, caption: 'Original caption' } },
      { '@type': 'ItemList', image: png },
    ] }),
  }))
  assert.deepEqual(markup['@graph'][0].image, [rendition, portrait + '?w=1024&fm=webp&q=78', external, crop])
  assert.deepEqual(markup['@graph'][1].image, {
    '@type': 'ImageObject', url: rendition, contentUrl: rendition, width: 1200, height: 655, caption: 'Original caption',
  })
  assert.equal(markup['@graph'][2].image, png)
})

test('malformed CMS JSON-LD falls back to escaped article markup', () => {
  const markup = generateJsonLd({ ...post, title: 'Compare <script> examples', jsonLd: '{invalid' })
  assert.ok(!markup.includes('<'))
  assert.equal(JSON.parse(markup)['@type'], 'BlogPosting')
})

test('canonical links resolve retired posts and preserve fragments and queries', () => {
  assert.equal(canonicalBlogLink('/blog/sea-moss-gummies#serving'), '/blog/sea-moss-supplement#serving')
  assert.equal(canonicalBlogLink('https://spartanshopper.com/blog/sea-moss-gummies?q=a'),
    'https://www.spartanshopper.com/blog/sea-moss-supplement?q=a')
  assert.equal(canonicalBlogLink('https://example.com/blog/sea-moss-gummies'), 'https://example.com/blog/sea-moss-gummies')
  assert.equal(canonicalBlogLink('/go/sea-moss-gummies'), '/go/sea-moss-gummies')
})

test('responsive Sanity widths honor crops and social renditions use JPEG', () => {
  const src = 'https://cdn.sanity.io/images/example/production/image-1024x768.png?rect=0,20,500,600&w=800'
  const variants = sanityImageSrcSet(src, [320, 480, 640, 960])?.split(', ') ?? []
  assert.deepEqual(variants.map(variant => variant.split(' ').at(-1)), ['320w', '480w', '500w'])
  assert.equal(new URL(sanityImageVariant(src, 320)).searchParams.get('rect'), '0,20,500,600')
  assert.equal(new URL(socialImageUrl(src)).searchParams.get('fm'), 'jpg')
  assert.equal(sanityImageSrcSet('/og-default.png', [320]), undefined)
})

test('a WebPage remains a factual fallback without commerce assertions', () => {
  const data = JSON.parse(generatePageJsonLd('/deals/test', 'Test deal'))
  assert.equal(data['@type'], 'WebPage')
  assert.equal(data.url, 'https://www.spartanshopper.com/deals/test')
  assert.equal(data.offers, undefined)
})
