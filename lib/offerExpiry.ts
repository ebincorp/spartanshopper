/** Sentinel year 2099 represents an unspecified expiry in imported offers. */
export function offerExpiryLabel(value?: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() >= 2099) return null
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
