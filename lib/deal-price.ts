/**
 * Price freshness for Amazon deals.
 *
 * Stored prices are only shown while the daily verification job has recently
 * confirmed them against the Creators API (it stamps `priceVerifiedAt`). Once
 * that lapses — API outage, cron failure, or a hand-entered price ageing out —
 * cards and deal pages stop presenting the stored price as current and send
 * shoppers to Amazon to check it instead. The deal and its affiliate link stay up.
 *
 * 25h = the daily cron cadence plus an hour of slack for run-time drift, so a
 * normal day never flickers a deal into the fallback.
 */
export const PRICE_FRESH_HOURS = 25

export function isPriceFresh(priceVerifiedAt: string | undefined, now = Date.now()): boolean {
  if (!priceVerifiedAt) return false
  const verified = Date.parse(priceVerifiedAt)
  return !Number.isNaN(verified) && now - verified <= PRICE_FRESH_HOURS * 60 * 60 * 1000
}
