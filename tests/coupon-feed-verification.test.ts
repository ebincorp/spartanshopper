import assert from 'node:assert/strict'
import { test } from 'node:test'
import { checkCouponFeed, collectCouponFeed, parseCouponFeedPage } from '../lib/coupon-feed-verification'
import { getCouponVerification } from '../lib/couponVerification'
import { couponExpiryDisplay, endTime, offerExpiryGroq } from '../lib/offerExpiry'

const now = new Date('2026-11-21T20:00:00Z')
const coupon = {
  slug: '10-off-velocity-outdoor', code: 'fixture',
  verification: { status: 'advertiser-listed' as const, checkedOn: '2026-11-18' },
}
const row = `<link><advertiser-id>6038648</advertiser-id><link-id>15263929</link-id>
  <promotion-type>Coupon</promotion-type><relationship-status>joined</relationship-status>
  <coupon-code>FIXTURE</coupon-code><promotion-end-date>2030-12-01 16:00:00.0</promotion-end-date></link>`
const feed = (links: string, total = 1, returned = 1, page = 1) =>
  `<cj-api><links total-matched="${total}" records-returned="${returned}" page-number="${page}">${links}</links></cj-api>`

test('requires the reviewed campaign, matching code, active dates and joined advertiser', async () => {
  const links = await collectCouponFeed(async () => feed(row))
  assert.equal(checkCouponFeed(coupon, links, now), 'matched')
  assert.equal(checkCouponFeed({ ...coupon, code: 'different' }, links, now), 'missing')
  assert.equal(checkCouponFeed(coupon, links, new Date('2030-12-01T00:00:00Z')), 'missing')
  assert.equal(checkCouponFeed({ ...coupon, expiryDate: '2026-11-20' }, links, now), 'skip')
  assert.equal(checkCouponFeed({ ...coupon, verification: { status: 'checkout-worked' } }, links, now), 'skip')
  assert.equal(checkCouponFeed(coupon, parseCouponFeedPage(feed(row.replace('15263929', '123'))).links, now), 'missing')
})

test('requires complete, consistent pagination before reporting missing campaigns', async () => {
  await assert.rejects(collectCouponFeed(async page => page === 1 ? feed(row, 2) : feed('', 2, 0, 2)))
  await assert.rejects(collectCouponFeed(async page => feed(row, 2, 1, page)), /duplicated/)
  await assert.rejects(collectCouponFeed(async () => '<error>not authorized</error>'))
  assert.deepEqual(await collectCouponFeed(async () => feed('', 0, 0)), [])
})

test('a missed match removes the public dated claim and leaves stronger evidence alone', () => {
  assert.equal(getCouponVerification({ ...coupon.verification, advertiserMatchMissing: true }), null)
  assert.equal(getCouponVerification({ ...coupon.verification, status: 'checkout-worked', advertiserMatchMissing: true })?.status, 'checkout-worked')
})

test('a verified deadline and the internal cutoff share the same instant', () => {
  assert.equal(endTime('2026-12-31'), Date.parse('2026-12-31T23:59:59.999Z'))
  assert.equal(endTime('2026-12-31T00:00:00.000Z'), Date.parse('2026-12-31T00:00:00.000Z'))
  assert.match(offerExpiryGroq, /T23:59:59.999Z/)
  assert.deepEqual(couponExpiryDisplay({ expiryDate: '2026-12-31' }), { text: 'End date unconfirmed. Check with the retailer.' })
  assert.equal(couponExpiryDisplay({ expiryDate: '2026-12-31', expiryConfirmedFor: '2026-12-31' }).validThrough, '2026-12-31T23:59:59.999Z')
  assert.equal(couponExpiryDisplay({ expiryDate: '2026-12-31', expiryConfirmedFor: '2026-12-30' }).validThrough, undefined)
  assert.equal(endTime('2026-02-31'), null)
})
