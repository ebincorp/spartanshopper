/**
 * Robust error-to-string for logs and alert emails.
 *
 * Not everything thrown in JS is an `Error`. The Creators API SDK's callApi
 * rejects with a plain object ({ status, statusText, body, ... }); Sanity and
 * fetch can reject with their own shapes. `String(obj)` on any of those yields
 * the useless "[object Object]" that hid the real cause of a verify-deals crash.
 *
 * This pulls out a human-readable message from whatever it's handed, falling
 * back to a safe generic message instead of serializing request credentials.
 */
export function formatError(err: unknown): string {
  if (err instanceof Error) {
    return err.message || err.name || 'Error (no message)'
  }
  if (err == null) return 'Unknown error (null/undefined thrown)'
  if (typeof err === 'string') return err
  if (typeof err !== 'object') return String(err)

  // Structured rejection (e.g. Creators API SDK, fetch Response-like). Surface
  // the fields that explain the failure without serializing request options.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = err as any
  const parts: string[] = []
  if (e.status != null || e.statusText) {
    parts.push(`HTTP ${e.status ?? '?'}${e.statusText ? ` ${e.statusText}` : ''}`)
  }
  const bodyMsg = e.body?.message ?? e.response?.body?.message ?? e.message
  if (typeof bodyMsg === 'string' && bodyMsg) parts.push(bodyMsg)
  const reason = e.body?.reason ?? e.response?.body?.reason
  if (typeof reason === 'string' && reason) parts.push(`(${reason})`)
  if (parts.length > 0) return parts.join(' ')

  // SDK error objects may contain Authorization headers and credential-bearing
  // request options. Never serialize an unknown object into logs or email.
  return 'Unknown service error (details omitted to protect credentials)'
}
