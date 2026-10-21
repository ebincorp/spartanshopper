const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function load(file) {
  const exports = {}
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  vm.runInNewContext(source, { exports, require: name => name === './offer-status' ? load('lib/offer-status.ts') : require(name) })
  return exports
}
const { socialProductFeatures: features, buildSocialProductCards: build, filterSocialProducts: filter } = load('lib/social-products.ts')
const now = Date.parse('2026-10-20T12:00:00Z')
const feature = { id: 'sample', title: 'Shark FlexStyle Copper', description: 'HD433CP hair styler', category: 'Beauty', dealSlug: 'sample', affiliateSlug: 'sample', postedAt: '2026-10-19' }
const record = { _type: 'deal', slug: 'sample', active: true, imageUrl: 'https://cdn.sanity.io/sample.jpg', imageWidth: 600 }

test('featured products have unique IDs, exact mappings and no old price claims', () => {
  assert.equal(new Set(features.map(f => f.id)).size, features.length)
  assert.equal(features.length, 21)
  for (const f of features) {
    assert(Boolean(f.dealSlug) !== Boolean(f.guideSlug))
    assert.match(f.affiliateSlug, /^[a-z0-9-]+$/)
    assert(!/\$\d|\d+%/.test(f.title + f.description))
    if (f.fallbackImage) assert(fs.existsSync('public' + f.fallbackImage))
  }
})
test('published product maps to exact detail and verified redirect', () => {
  const card = build([feature], [record], ['sample'], now)[0]
  assert.equal(card.detailHref, '/deals/sample')
  assert.equal(card.affiliateHref, '/go/sample')
  assert.equal(card.offerEnded, false)
  assert.equal(build([feature], [record], [], now)[0].affiliateHref, undefined)
})
test('ended, inactive and invalid-expiry offers remain recognizable without purchase CTA', () => {
  for (const change of [{ active: false }, { expiryDate: '2026-10-19' }, { expiryDate: 'invalid' }]) {
    const card = build([feature], [{ ...record, ...change }], ['sample'], now)[0]
    assert.equal(card.offerEnded, true)
    assert.equal(card.affiliateHref, undefined)
    assert.equal(card.title, feature.title)
  }
  assert.equal(build([feature], [{ ...record, expiryDate: '2026-10-20' }], ['sample'], now)[0].offerEnded, false)
})
test('unpublished, future and invalid-start products cannot leak onto the page', () => {
  assert.equal(build([feature], [], ['sample'], now).length, 0)
  for (const startDate of ['2026-10-21', 'invalid']) assert.equal(build([feature], [{ ...record, startDate }], ['sample'], now).length, 0)
  const guide = { ...feature, dealSlug: undefined, guideSlug: 'sample' }
  for (const publishedAt of [undefined, 'invalid', '2026-10-21']) assert.equal(build([guide], [{ ...record, _type: 'post', publishedAt }], ['sample'], now).length, 0)
  assert.equal(build([guide], [{ ...record, _type: 'post', publishedAt: '2026-10-19' }], ['sample'], now)[0].detailHref, '/blog/sample')
})
test('search combines case-insensitive terms with category filtering and preserves newest order', () => {
  const cards = build([feature, { ...feature, id: 'older', title: 'Keurig K-Express Coffee Maker', category: 'Kitchen', postedAt: '2026-10-18' }], [record], ['sample'], now)
  assert.equal(cards[0].id, 'sample')
  assert.equal(filter(cards, '  COPPER shark ', 'Beauty').length, 1)
  assert.equal(filter(cards, 'coffee-maker', 'Kitchen')[0].id, 'older')
  assert.equal(filter(cards, 'shark', 'Kitchen').length, 0)
  assert.equal(filter(cards, 'not-a-product').length, 0)
  assert.equal(filter(cards, '').length, 2)
})
test('placeholder images are omitted; exact reference assets may supply a fallback', () => {
  assert.equal(build([feature], [{ ...record, imageWidth: 1 }], [], now)[0].imageUrl, undefined)
  assert.equal(build([{ ...feature, fallbackImage: '/images/exact.jpg' }], [record], [], now)[0].imageUrl, '/images/exact.jpg')
})
test('social hub keeps noindex, one H1, disclosure, and published-only data client', () => {
  const page = fs.readFileSync('app/videos/page.tsx', 'utf8')
  assert(page.includes('noIndex: true'))
  assert.equal((page.match(/<h1\b/g) || []).length, 1)
  assert(page.indexOf('As an Amazon Associate') < page.indexOf('<SocialProductFinder products='))
  assert(fs.readFileSync('lib/sanity.client.ts', 'utf8').includes("perspective: 'published'"))
  assert(!fs.readFileSync('app/sitemap.ts', 'utf8').includes("'/videos'"))
})
