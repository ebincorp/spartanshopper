/**
 * When coupons, sweepstakes and time-bound posts stop being indexable.
 *
 * Ended pages keep their URL (external links, bookmarks, pins) but render an
 * "ended" state, send `noindex, follow`, and drop out of the sitemap — the
 * sitemap queries in lib/queries.ts and app/sitemap.ts mirror these rules.
 * Date-only values stay valid through the end of that UTC day, matching the
 * deal directory queries.
 */
export function endTime(value?: string | null): number | null {
  if (!value) return null
  const iso = value.length === 10 ? `${value}T23:59:59.999Z` : value
  const t = Date.parse(iso)
  return Number.isNaN(t) ? null : t
}

const passed = (value: string | null | undefined, now: number) => {
  const t = endTime(value)
  return t !== null && t <= now
}

/** A coupon has ended once it is deactivated or its expiry has passed. */
export function isCouponEnded(c: { active?: boolean; expiryDate?: string }, now = Date.now()): boolean {
  return c.active !== true || passed(c.expiryDate, now)
}

/** A sweepstake has ended once it is deactivated or its entry deadline has passed. */
export function isSweepstakeEnded(s: { active?: boolean; entryDeadline?: string }, now = Date.now()): boolean {
  return s.active !== true || passed(s.entryDeadline, now)
}

/** Time-bound posts (seo.noindexAfter) stay published but stop being indexed after the date. */
export function isPostPastNoindexDate(noindexAfter?: string | null, now = Date.now()): boolean {
  return passed(noindexAfter, now)
}
