export const SAVED_FINDS_KEY = 'spartanshopper.saved-finds.v1'
export const SAVED_FINDS_EVENT = 'spartanshopper:saved-finds'
export const MAX_SAVED_FINDS = 100
export type FindKind = 'deal' | 'coupon'
export interface SavedFind { kind: FindKind; slug: string; title: string }
export interface CurrentFind extends SavedFind {
  status: 'available' | 'expired' | 'upcoming' | 'unavailable'
  store?: string
  image?: string
  offer?: string
  affiliateSlug?: string
}
export function validFind(value: unknown): value is SavedFind {
  if (!value || typeof value !== 'object') return false
  const v = value as SavedFind
  return (v.kind === 'deal' || v.kind === 'coupon') && typeof v.slug === 'string' && /^[a-zA-Z0-9_-]{1,200}$/.test(v.slug) && typeof v.title === 'string' && v.title.length <= 500
}
export function findKey(find: Pick<SavedFind, 'kind' | 'slug'>) { return `${find.kind}:${find.slug}` }
export function parseSavedFinds(raw: string | null): SavedFind[] {
  try {
    const values: unknown = JSON.parse(raw || '[]')
    if (!Array.isArray(values)) return []
    const unique = new Map<string, SavedFind>()
    for (const value of values) if (validFind(value)) unique.set(findKey(value), { kind: value.kind, slug: value.slug, title: value.title })
    return [...unique.values()].slice(0, MAX_SAVED_FINDS)
  } catch { return [] }
}
export function offerStatus(active: boolean, start?: string, expiry?: string, now = Date.now()): CurrentFind['status'] {
  if (!active) return 'unavailable'
  if ((start && !Number.isFinite(Date.parse(start))) || (expiry && !Number.isFinite(Date.parse(expiry)))) return 'unavailable'
  if (start && new Date(start).getTime() > now) return 'upcoming'
  if (expiry && new Date(expiry.length === 10 ? `${expiry}T23:59:59.999Z` : expiry).getTime() <= now) return 'expired'
  return 'available'
}
