/** Sentinel year 2099 represents an unspecified expiry in imported offers. */
export function offerExpiryLabel(value?: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() >= 2099) return null
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })
}
