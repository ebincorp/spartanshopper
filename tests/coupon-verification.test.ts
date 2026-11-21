import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import CouponCard from '../components/CouponCard'
import CouponVerificationLabel from '../components/CouponVerificationLabel'
import { getCouponVerification, type CouponVerification } from '../lib/couponVerification'

test('coupon verification distinguishes the source and outcome on the recorded calendar date', () => {
  const expected = [
    ['advertiser-listed', 'Listed by advertiser'],
    ['owner-confirmed', 'Confirmed by offer owner'],
    ['checkout-worked', 'Code worked at checkout'],
    ['checkout-failed', 'Code failed at checkout'],
  ] as const
  for (const [status, label] of expected) {
    const verification = { status, checkedOn: '2026-01-08' }
    assert.deepEqual(getCouponVerification(verification), {
      status, label, checkedOn: '2026-01-08', dateLabel: 'Jan 8, 2026',
    })
    assert.match(renderToStaticMarkup(createElement(CouponVerificationLabel, { verification })),
      new RegExp(`${label}</strong> on <time dateTime="2026-01-08">Jan 8, 2026</time>`))
  }
})

test('missing, partial, future, or invalid evidence renders without claiming a date or result', () => {
  const inputs = [
    undefined,
    null,
    { status: 'checkout-worked' },
    { checkedOn: '2026-01-08' },
    { status: 'unknown', checkedOn: '2026-01-08' },
    { status: 'constructor', checkedOn: '2026-01-08' },
    { status: 'checkout-worked', checkedOn: '2026-02-30' },
    { status: 'checkout-worked', checkedOn: '2026-01-08T00:00:00Z' },
    { status: 'checkout-worked', checkedOn: '2200-01-01' },
  ] as Array<CouponVerification | null | undefined>
  for (const verification of inputs) {
    const html = renderToStaticMarkup(createElement(CouponVerificationLabel, { verification }))
    assert.match(html, /No dated check on file\./)
    assert.doesNotMatch(html, /<time\b|worked at checkout/)
  }
})

test('an imageless Velocity card has one named detail link and keeps the affiliate route', () => {
  const title = 'Velocity Outdoor — Listed 10% Off at Ravin'
  const html = renderToStaticMarkup(createElement(CouponCard, {
    title,
    store: 'Velocity Outdoor',
    slug: '10-off-velocity-outdoor',
    affiliateSlug: 'velocity-outdoor-welcome10',
    affiliateUrl: 'https://example.com',
    verification: { status: 'advertiser-listed', checkedOn: '2026-01-08' },
  }))
  assert.equal([...html.matchAll(/href="\/coupons\/10-off-velocity-outdoor"/g)].length, 1)
  assert.match(html, /<a[^>]*href="\/coupons\/10-off-velocity-outdoor"[^>]*><h3[^>]*>Velocity Outdoor — Listed 10% Off at Ravin<\/h3><\/a>/)
  assert.match(html, /<div aria-hidden="true"[^>]*><svg/)
  assert.match(html, /href="\/go\/velocity-outdoor-welcome10"/)
})
