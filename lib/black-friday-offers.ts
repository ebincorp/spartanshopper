export type StoredBlackFridayOffer = {
  name: string
  kind: 'black-friday' | 'limited-time'
  checkedAt: string
  goSlugs: string[]
  endsAt?: string
  withdrawnAt?: string
}

export type BlackFridayOffer = StoredBlackFridayOffer & { asin: string }

export type OfferTarget =
  | { goSlug: string; asin?: string }
  | { goSlug?: string; asin: string }

export const BLACK_FRIDAY_FRESHNESS_MS = 26 * 60 * 60 * 1000
export const BLACK_FRIDAY_END_MS = Date.parse('2026-12-02T08:00:00.000Z')

export const BLACK_FRIDAY_LAUNCH_ASINS = [
  'B00I7PK3GQ',
  'B07NRB4NB6',
  'B01HGSJPMW',
  'B003MUTDUI',
  'B08MJZYW8P',
  'B0DC156Y5X',
  'B0GD6R7CFJ',
  'B0B2RM68G2',
] as const

export function isBlackFridayLaunchAsin(asin: string): boolean {
  return BLACK_FRIDAY_LAUNCH_ASINS.some(allowed => allowed === asin)
}

export function blackFridayCutoff(offer: StoredBlackFridayOffer): number {
  return Math.min(
    Date.parse(offer.checkedAt) + BLACK_FRIDAY_FRESHNESS_MS,
    offer.endsAt ? Date.parse(offer.endsAt) : Infinity,
    offer.withdrawnAt ? Date.parse(offer.withdrawnAt) : Infinity,
    BLACK_FRIDAY_END_MS,
  )
}

export function isBlackFridayOfferLive(offer: StoredBlackFridayOffer, now: number): boolean {
  return Date.parse(offer.checkedAt) <= now && now < blackFridayCutoff(offer)
}

export function getBlackFridayTarget(href?: string, knownAsin?: string): OfferTarget | undefined {
  if (!href) return undefined

  let url: URL
  try {
    url = new URL(href, 'https://www.spartanshopper.com')
  } catch {
    return undefined
  }
  if (url.protocol !== 'https:') return undefined

  if (url.hostname === 'www.spartanshopper.com' || url.hostname === 'spartanshopper.com') {
    const goSlug = /^\/go\/([a-z0-9-]+)\/?$/.exec(url.pathname)?.[1]
    return goSlug ? { goSlug, asin: knownAsin?.toUpperCase() } : undefined
  }
  if (url.hostname !== 'www.amazon.com' && url.hostname !== 'amazon.com') return undefined

  const asin = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:\/|$)/i.exec(url.pathname)?.[1]?.toUpperCase()
  if (!asin || (knownAsin && knownAsin.toUpperCase() !== asin)) return undefined
  return { asin }
}

export function matchBlackFridayOffer(offers: BlackFridayOffer[], target?: OfferTarget): BlackFridayOffer | undefined {
  if (!target) return undefined

  const matches = offers.filter(offer =>
    (!target.asin || offer.asin === target.asin) &&
    (!target.goSlug || offer.goSlugs.includes(target.goSlug)),
  )
  return matches.length === 1 ? matches[0] : undefined
}
