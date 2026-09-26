import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isPriceFresh, PRICE_FRESH_HOURS } from '../lib/deal-price'
import { decide } from '../lib/verify-deals'

const HOUR = 60 * 60 * 1000

test('stored prices are fresh only within the verification window', () => {
  const now = Date.parse('2026-09-26T12:00:00Z')
  assert.equal(isPriceFresh(undefined, now), false)
  assert.equal(isPriceFresh('not a date', now), false)
  assert.equal(isPriceFresh(new Date(now - 2 * HOUR).toISOString(), now), true)
  assert.equal(isPriceFresh(new Date(now - PRICE_FRESH_HOURS * HOUR).toISOString(), now), true)
  assert.equal(isPriceFresh(new Date(now - (PRICE_FRESH_HOURS + 1) * HOUR).toISOString(), now), false)
})

const clipDeal = { _id: 'd', _type: 'deal' as const, title: 'Cream', asin: 'B01EXQ582Q', salePrice: 20.4, originalPrice: 24, clipCoupon: true }
const item = (currentPrice: number) => ({ asin: 'B01EXQ582Q', currentPrice, savingsPercent: 0, available: true })

test('clip-coupon deals verify against the pre-coupon price and are never auto-deactivated for 0% savings', () => {
  assert.equal(decide(clipDeal, item(24)).action, 'OK')
  assert.equal(decide(clipDeal, item(24.9)).action, 'OK')
  assert.equal(decide(clipDeal, item(28)).action, 'REVIEW')
  assert.equal(decide(clipDeal, undefined).action, 'DEACTIVATED')
})

test('regular deals keep the existing rules', () => {
  const deal = { ...clipDeal, clipCoupon: false }
  assert.equal(decide(deal, item(20.4)).action, 'OK')
  assert.equal(decide(deal, { ...item(22), savingsPercent: 8 }).action, 'DEACTIVATED')
  assert.equal(decide(deal, { ...item(18), savingsPercent: 25 }).action, 'UPDATED')
})

test('broad deal categories get no automatic guides; specific ones map to close post categories', async () => {
  const { autoGuideCategoriesForDeal } = await import('../lib/deal-categories')
  assert.deepEqual(autoGuideCategoriesForDeal('health-beauty'), [])
  assert.deepEqual(autoGuideCategoriesForDeal('fashion'), [])
  assert.deepEqual(autoGuideCategoriesForDeal(undefined), [])
  assert.deepEqual(autoGuideCategoriesForDeal('automotive'), ['automotive'])
  assert.deepEqual(autoGuideCategoriesForDeal('home-garden'), ['home'])
})
