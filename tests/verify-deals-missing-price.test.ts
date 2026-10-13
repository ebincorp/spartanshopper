import assert from 'node:assert/strict'
import test from 'node:test'
import { decide } from '../lib/verify-deals'
import type { CreatorItem } from '../lib/creators-api'

const deal = {
  _id: 'deal-example',
  _type: 'deal' as const,
  title: 'Example deal',
  asin: 'B000000000',
  salePrice: 29.99,
  originalPrice: 39.99,
}

test('missing Amazon listing or price requires review without deactivation', () => {
  assert.equal(decide(deal, undefined).action, 'REVIEW')
  assert.equal(
    decide(deal, { asin: deal.asin, savingsPercent: 0, available: false }).action,
    'REVIEW'
  )
})

test('explicit out-of-stock listing with a price can be deactivated', () => {
  const item: CreatorItem = {
    asin: deal.asin,
    currentPrice: 29.99,
    savingsPercent: 25,
    available: false,
  }
  assert.equal(decide(deal, item).action, 'DEACTIVATED')
})

test('verified price changes still update and clip coupons remain reviewable', () => {
  const item: CreatorItem = {
    asin: deal.asin,
    currentPrice: 24.99,
    listPrice: 39.99,
    savingsPercent: 38,
    available: true,
  }
  assert.equal(decide(deal, item).action, 'UPDATED')
  assert.equal(decide({ ...deal, clipCoupon: true }, item).action, 'REVIEW')
})
