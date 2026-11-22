const DAY_END = 'T23:59:59.999Z'
const calendarDay = /^\d{4}-\d{2}-\d{2}$/

/** A date-only offer runs through the end of its stated UTC day. */
export function endTime(value?: string | null): number | null {
  if (!value) return null
  const date = new Date(calendarDay.test(value) ? value + DAY_END : value)
  if (!Number.isFinite(date.getTime())) return null
  if (calendarDay.test(value) && date.toISOString().slice(0, 10) !== value) return null
  return date.getTime()
}

export const offerExpiryGroq = `dateTime(select(length(expiryDate) == 10 => expiryDate + "${DAY_END}", expiryDate))`
export const offerHasNotExpiredGroq = `(!defined(expiryDate) || ${offerExpiryGroq} > dateTime(now()))`

export interface CouponExpiry {
  expiryDate?: string | null
  /** An editor confirmed this exact stored deadline with the merchant. */
  expiryConfirmedFor?: string | null
}

export function couponExpiryDisplay({ expiryDate, expiryConfirmedFor }: CouponExpiry) {
  const label = expiryDate && expiryDate === expiryConfirmedFor ? offerExpiryLabel(expiryDate) : null
  return label && expiryDate
    ? { text: `Expires: ${label}`, validThrough: calendarDay.test(expiryDate) ? expiryDate + DAY_END : expiryDate }
    : { text: 'End date unconfirmed. Check with the retailer.' }
}

/** Sentinel year 2099 represents an unspecified expiry in imported offers. */
export function offerExpiryLabel(value?: string, timeZone?: string): string | null {
  const timestamp = endTime(value)
  if (!value || timestamp === null) return null
  const date = new Date(timestamp)
  if (date.getUTCFullYear() >= 2099) return null
  if (timeZone) return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone,
  })
  // Date-only imports describe a calendar day. Timestamped campaign deadlines
  // describe an instant: display its Pacific time explicitly, rather than the
  // server's UTC date (which can suggest the offer lasts an extra day).
  if (value.length === 10) {
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    })
  }
  return date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    timeZone: 'America/Los_Angeles',
  })
}
