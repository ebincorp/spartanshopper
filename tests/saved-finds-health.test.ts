import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseSavedFinds, offerStatus } from '../lib/saved-finds'
import { inspectOffer, type HealthRecord } from '../lib/deal-health'
import { healthAuthorized } from '../lib/deal-health-auth'

test('saved references recover from corrupt storage, reject unsafe slugs and discard extra fields', () => {
  assert.deepEqual(parseSavedFinds('{'), [])
  assert.deepEqual(parseSavedFinds('{}'), [])
  const find = { kind: 'deal', slug: 'valid', title: 'A find', code: 'secret', image: 'old', salePrice: 5 }
  assert.deepEqual(parseSavedFinds(JSON.stringify([find, find, null, { ...find, slug: '../oops' }])), [{ kind: 'deal', slug: 'valid', title: 'A find' }])
  assert.equal(parseSavedFinds(JSON.stringify(Array.from({ length: 120 }, (_, i) => ({ ...find, slug: `item-${i}` })))).length, 100)
})
test('availability respects date-only end of day, future dates and inactive records', () => {
  const now = Date.parse('2026-09-25T12:00:00Z')
  assert.equal(offerStatus(true, undefined, '2026-09-25', now), 'available')
  assert.equal(offerStatus(true, undefined, '2026-09-24', now), 'expired')
  assert.equal(offerStatus(true, '2026-09-26', undefined, now), 'upcoming')
  assert.equal(offerStatus(false, undefined, undefined, now), 'unavailable')
  assert.equal(offerStatus(true, undefined, 'invalid-date', now), 'unavailable')
})
const good: HealthRecord = { _id: 'offer', _type: 'deal', title: 'Offer', active: true, slug: 'offer', affiliateSlug: 'offer', salePrice: 20, originalPrice: 40, expiryDate: '2026-12-31', destination: 'https://www.amazon.com/dp/TEST?tag=sku18798384-20' }
const now = Date.parse('2026-09-25T12:00:00Z')
test('health review catches stale offers and missing redirects without treating future starts as expired', () => {
  assert.equal(inspectOffer(good, now).issues.length, 0)
  assert.ok(inspectOffer({ ...good, expiryDate: '2026-09-24' }, now).issues.some(i => i.message.includes('Expired')))
  assert.ok(inspectOffer({ ...good, destination: undefined }, now).issues.some(i => i.message.includes('does not resolve')))
  assert.ok(inspectOffer({ ...good, startDate: '2026-10-01' }, now).issues.some(i => i.message.includes('future')))
  assert.equal(inspectOffer({ ...good, active: false, destination: undefined }, now).issues.length, 0)
})
test('campaign attribution exception requires paired campaign and link identifiers', () => {
  const campaign = 'https://www.amazon.com/dp/TEST?tag=spartan03-20&campaignId=amzn1.campaign.abc&linkId=amzn1.campaign.abc_123'
  assert.equal(inspectOffer({ ...good, destination: campaign }, now).issues.length, 0)
  assert.ok(inspectOffer({ ...good, destination: campaign.replace('abc_123', 'other_123') }, now).issues.some(i => i.message.includes('attribution')))
  assert.ok(inspectOffer({ ...good, destination: 'javascript:alert(1)' }, now).issues.some(i => i.severity === 'urgent'))
})
test('dashboard authorization fails closed and requires exact bearer secret', () => {
  const secret = 'test-secret-with-more-than-32-characters'
  assert.equal(healthAuthorized(null, secret), false)
  assert.equal(healthAuthorized('Bearer undefined', ''), false)
  assert.equal(healthAuthorized('Bearer short', 'short'), false)
  assert.equal(healthAuthorized(`Bearer ${secret}x`, secret), false)
  assert.equal(healthAuthorized(`Bearer ${secret}`, secret), true)
})
