import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isCouponEnded, isSweepstakeEnded, isPostPastNoindexDate } from '../lib/offer-status'

const now = Date.parse('2026-09-26T12:00:00Z')

test('coupons end when deactivated or past expiry; date-only expiry lasts the whole UTC day', () => {
  assert.equal(isCouponEnded({ active: true }, now), false)
  assert.equal(isCouponEnded({ active: false, expiryDate: '2026-11-25' }, now), true)
  assert.equal(isCouponEnded({ active: true, expiryDate: '2026-09-26' }, now), false)
  assert.equal(isCouponEnded({ active: true, expiryDate: '2026-09-25' }, now), true)
  assert.equal(isCouponEnded({ active: true, expiryDate: '2026-09-26T11:00:00Z' }, now), true)
})

test('sweepstakes end when deactivated or past the entry deadline', () => {
  assert.equal(isSweepstakeEnded({ active: true, entryDeadline: '2027-01-01T04:59:59Z' }, now), false)
  assert.equal(isSweepstakeEnded({ active: true, entryDeadline: '2026-09-01T00:00:00Z' }, now), true)
  assert.equal(isSweepstakeEnded({ active: false, entryDeadline: '2027-01-01T00:00:00Z' }, now), true)
})

test('posts are noindexed only after an explicit noindexAfter date', () => {
  assert.equal(isPostPastNoindexDate(undefined, now), false)
  assert.equal(isPostPastNoindexDate('2026-10-08T00:00:00Z', now), false)
  assert.equal(isPostPastNoindexDate('2026-09-01T00:00:00Z', now), true)
})
