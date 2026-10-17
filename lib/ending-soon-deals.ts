import { isPriceFresh } from './deal-price'
import { endTime } from './offer-status'
import type { Deal } from './types'

/** Real, recently checked deadlines only. Never infer urgency from a sale badge. */
export function endingSoonDeals(deals: Deal[], now = Date.now(), limit = 6): Deal[] {
  return deals
    .filter(deal => {
      const end = endTime(deal.expiryDate)
      return deal.active && deal.hasCardImage === true && deal.salePrice > 0 &&
        isPriceFresh(deal.priceVerifiedAt, now) && end !== null &&
        end > now && end <= now + 48 * 60 * 60 * 1000
    })
    .sort((a, b) => endTime(a.expiryDate)! - endTime(b.expiryDate)! || a._id.localeCompare(b._id))
    .slice(0, limit)
}
