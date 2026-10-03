import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import { offerExpiryLabel } from '../lib/offerExpiry'
import InlineCouponCard from '../components/InlineCouponCard'

test('timestamp deadlines display the actual Pacific closing date and time', () => {
  assert.equal(offerExpiryLabel('2026-10-08T06:59:00.000Z'), 'Oct 7, 2026, 11:59 PM PDT')
  assert.equal(offerExpiryLabel('2026-12-01T07:59:00.000Z'), 'Nov 30, 2026, 11:59 PM PST')
})

test('date-only deadlines preserve the calendar day; unknown expiries stay hidden', () => {
  assert.equal(offerExpiryLabel('2026-10-08'), 'Oct 8, 2026')
  for (const date of [undefined, '', 'invalid', '2099-12-31']) {
    assert.equal(offerExpiryLabel(date), null)
  }
})

const base = { _id: 'test', title: 'Test coupon', store: 'Test store', active: true, affiliateUrl: 'https://example.com', affiliateSlug: 'test-offer', code: 'TEST' }

test('embedded coupons hide expired, inactive, and future offers', () => {
  for (const changes of [{ expiryDate: '2000-01-01' }, { active: false }, { startDate: '2099-01-01' }]) {
    assert.equal(renderToStaticMarkup(<InlineCouponCard coupon={{ ...base, ...changes }} />), '')
  }
})

test('an active embedded coupon uses its cloaked link and hides unspecified expiry', () => {
  const html = renderToStaticMarkup(<InlineCouponCard coupon={{ ...base, expiryDate: '2099-12-31' }} />)
  assert.match(html, /href="\/go\/test-offer"/)
  assert.match(html, /TEST/)
  assert.doesNotMatch(html, /Expires|2099|Expired/)
})
