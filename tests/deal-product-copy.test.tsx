import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import DealCard from '../components/DealCard'
import { dealCardFacts, dealDisplayTitle, dealProductDescription } from '../lib/deal-product-copy'
import { CREATORS_API_PRICE_SOURCE, hasFreshApiPrice } from '../lib/deal-price'

const product = {
  title: 'Test Camera S340',
  store: 'Amazon',
  slug: 'test-camera',
  affiliateSlug: 'test-camera',
  affiliateUrl: 'https://example.com/product',
  description: 'The camera includes a detachable solar panel. Check sunlight at the mounting spot before installing. On Nov. 20, 2026, it was $19.99. Price and availability may change.',
  salePrice: 24,
  priceVerifiedAt: new Date(Date.now() - 1000).toISOString(),
}

test('renders specific fit and included parts without reproducing stale price prose', () => {
  assert.deepEqual(dealCardFacts(product.title, product.description), [
    'The camera includes a detachable solar panel.',
    'Check sunlight at the mounting spot before installing.',
  ])
  assert.deepEqual(dealProductDescription('See the retailer. Checked November 20: $12. Confirm the selected variant.'), [])
  assert.equal(dealDisplayTitle('Test Camera S340 — 20% Off'), product.title)
  const html = renderToStaticMarkup(createElement(DealCard, { ...product, priceVerificationSource: 'manual-amazon-browser' }))
  assert.match(html, /detachable solar panel/)
  assert.match(html, /Check price at Amazon/)
  assert.match(html, /See product &amp; offer details/)
  assert.doesNotMatch(html, /\$\d|Price checked|% OFF/)
})

test('requires a fresh Creators API observation for the exact Amazon price', () => {
  const api = {
    ...product, priceVerificationSource: CREATORS_API_PRICE_SOURCE,
    priceApiObservation: { amount: product.salePrice, checkedAt: product.priceVerifiedAt },
  }
  assert.equal(hasFreshApiPrice(api), true)
  assert.equal(hasFreshApiPrice(product), false)
  assert.equal(hasFreshApiPrice({ ...api, salePrice: Number.NaN }), false)
  assert.equal(hasFreshApiPrice({ ...api, salePrice: 27 }), false)
  assert.equal(hasFreshApiPrice({ ...api, store: 'Another retailer' }), false)
  assert.equal(hasFreshApiPrice({ ...api, clipCoupon: true }), false)
  assert.equal(hasFreshApiPrice({ ...api, priceVerifiedAt: '2099-01-01T00:00:00Z' }), false)
  assert.equal(hasFreshApiPrice({ ...api, priceVerifiedAt: '2020-01-01T00:00:00Z' }), false)
  const html = renderToStaticMarkup(createElement(DealCard, api))
  assert.match(html, /\$24\.00/)
  assert.match(html, /Price checked <time dateTime=/)
  assert.doesNotMatch(html, /19\.99/)
})
