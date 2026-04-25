import type { AmazonPromotion, ScanResult } from './types'
import { scrapeAmazonPromotions, type LaunchOptions } from './scraper'
import { createSanityDrafts } from './sanity-creator'
import { sendNotification } from './notifier'

const MIN_DISCOUNT_PERCENT = 30
const MIN_DAYS_UNTIL_EXPIRY = 7

function getDaysUntilExpiry(endDate: string): number {
  const now = Date.now()
  const end = new Date(endDate).getTime()
  return Math.floor((end - now) / (1000 * 60 * 60 * 24))
}

export function isWorthAdding(promo: AmazonPromotion): boolean {
  const daysLeft = getDaysUntilExpiry(promo.endDate)
  return (
    promo.discountPercent >= MIN_DISCOUNT_PERCENT &&
    daysLeft >= MIN_DAYS_UNTIL_EXPIRY
  )
}

export async function runCouponScan(launchOpts: LaunchOptions = {}): Promise<ScanResult> {
  console.log('[scanner] Starting coupon scan…')

  // 1 — Scrape
  const found = await scrapeAmazonPromotions(launchOpts)
  console.log(`[scanner] Found ${found.length} total promotions`)

  // 2 — Filter
  const qualifying = found.filter(isWorthAdding)
  const skipped    = found.filter((p) => !isWorthAdding(p))
  console.log(`[scanner] ${qualifying.length} qualifying, ${skipped.length} skipped`)

  // 3 — Create Sanity drafts
  const { added, errors } = await createSanityDrafts(qualifying)
  console.log(`[scanner] Created ${added.length} draft(s) in Sanity`)

  // 4 — Notify
  await sendNotification(found, added, skipped, errors)

  return { found, added, skipped, errors }
}
