export const couponVerificationLabels = {
  'advertiser-listed': 'Listed by advertiser',
  'owner-confirmed': 'Confirmed by offer owner',
  'checkout-worked': 'Code worked at checkout',
  'checkout-failed': 'Code failed at checkout',
} as const

export interface CouponVerification {
  status?: keyof typeof couponVerificationLabels | null
  checkedOn?: string | null
  advertiserMatchMissing?: boolean | null
}

const checkDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
})

export function formatCouponVerificationDate(checkedOn?: string | null): string | null {
  if (!checkedOn || !/^\d{4}-\d{2}-\d{2}$/.test(checkedOn)) return null
  const date = new Date(`${checkedOn}T00:00:00Z`)
  const timestamp = date.getTime()
  if (!Number.isFinite(timestamp) || timestamp > Date.now() || date.toISOString().slice(0, 10) !== checkedOn) return null
  return checkDateFormatter.format(date)
}

export function getCouponVerification(verification?: CouponVerification | null) {
  const { status, checkedOn, advertiserMatchMissing } = verification ?? {}
  if (!status || !Object.hasOwn(couponVerificationLabels, status) || !checkedOn) return null
  if (status === 'advertiser-listed' && advertiserMatchMissing) return null
  const dateLabel = formatCouponVerificationDate(checkedOn)
  if (!dateLabel) return null
  return { status, label: couponVerificationLabels[status], checkedOn, dateLabel }
}
