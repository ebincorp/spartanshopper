import { timingSafeEqual } from 'node:crypto'

export function healthAuthorized(authorization: string | null, secret = process.env.DEAL_HEALTH_TOKEN): boolean {
  if (!secret || secret.length < 32) return false
  const supplied = Buffer.from(authorization || '')
  const expected = Buffer.from(`Bearer ${secret}`)
  return supplied.length === expected.length && timingSafeEqual(supplied, expected)
}
