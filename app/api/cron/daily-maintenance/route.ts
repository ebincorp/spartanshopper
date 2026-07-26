import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { runExpireCoupons } from '@/lib/expire-coupons'
import { runVerifyDeals } from '@/lib/verify-deals'
import { sendVerifyAlert } from '@/lib/verify-deals-notify'
import { formatError } from '@/lib/format-error'

export const dynamic = 'force-dynamic'
// The coupon scrape needs minutes, not seconds. Vercel Pro honours this; Hobby
// clamps to 60s — which is precisely why the scrape runs LAST (see below).
export const maxDuration = 300

/**
 * Combined daily maintenance — replaces three separate cron entries.
 *
 * WHY: vercel.json declared three crons (coupon-scan, expire-coupons,
 * verify-deals). Vercel's Hobby plan allows two per project, so one was likely
 * never scheduled — the probable reason /deals pricing sat 7–21 days stale
 * while the verify-deals logic worked perfectly on manual invocation.
 *
 * ORDER IS DELIBERATE AND LOad-BEARING. The two fast Sanity/API tasks run first
 * and commit their writes before the long headless-Chromium scrape starts. If
 * the function is killed mid-scrape (Hobby's 60s ceiling, a Chromium hang, an
 * Amazon login wall), the daily price verification has already been committed.
 * Running the scrape first would risk losing it every single day.
 *
 * The scrape is additionally:
 *   - gated to Mondays, preserving its original weekly cadence rather than
 *     multiplying a browser scrape by seven;
 *   - wrapped so any failure is reported but never fails the run or masks the
 *     two operations that already succeeded.
 *
 * Schedule: daily 08:00 UTC — the tightest of the three originals
 * (expire-coupons 08:00 daily, verify-deals 09:00 daily, coupon-scan 09:00 Mon),
 * so nothing runs less often, or later, than it did before.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  // ?scan=1 forces the scrape off-schedule; ?scan=0 suppresses it entirely.
  const scanParam = url.searchParams.get('scan')
  const isMonday = new Date().getUTCDay() === 1
  const shouldScan = scanParam === '1' || (scanParam !== '0' && isMonday)

  const summary: Record<string, unknown> = { success: true }

  try {
    // ── 1. Expiry sweep (fast, commits immediately) ─────────────────────────
    const expire = await runExpireCoupons()
    summary.expired = expire
    console.log(
      `[daily-maintenance] expire: deactivated ${expire.deactivated} (deals ${expire.deals}, coupons ${expire.coupons})`
    )

    // ── 2. Price/availability verification (fast, commits immediately) ──────
    const result = await runVerifyDeals({ execute: true })

    if (result.status === 'NOT_YET_ELIGIBLE') {
      console.error('[daily-maintenance] verify: NOT_YET_ELIGIBLE — verification is not running')
      await sendVerifyAlert({
        severity: 'alert',
        subject: '🚨 Deal verification STOPPED — Amazon eligibility regressed',
        heading: 'Creators API returned AssociateNotEligible',
        lines: [
          'The daily price/availability check verified <strong>0 deals</strong>.',
          'Amazon has revoked (or is re-reviewing) product-data API access for tag <code>sku18798384-20</code>.',
          'No deals were mutated. Until this clears, stored prices are NOT being verified — do not drop expiry-date backstops.',
        ],
      })
      summary.verify = { status: 'NOT_YET_ELIGIBLE', checked: 0, updated: 0, deactivated: 0 }
    } else if (result.status === 'NO_RECORDS') {
      console.error('[daily-maintenance] verify: NO_RECORDS — nothing to verify')
      await sendVerifyAlert({
        severity: 'alert',
        subject: '⚠️ Deal verification found 0 deals to check',
        heading: 'No active deals/coupons with an ASIN were found',
        lines: [
          'The verification query returned <strong>0 records</strong>.',
          'Either every ASIN-bearing deal is inactive, or the Sanity query/connection is broken.',
        ],
      })
      summary.verify = { status: 'NO_RECORDS', checked: 0, updated: 0, deactivated: 0 }
    } else if (result.status === 'SUSPECTED_FAULT') {
      // Mass-deactivation guard tripped: nothing was mutated. Surface loudly and
      // fail the run so Vercel flags it too.
      console.error(
        `[daily-maintenance] verify: SUSPECTED_FAULT — ${result.unavailable}/${result.checked} unavailable, NOT committing`
      )
      await sendVerifyAlert({
        severity: 'alert',
        subject: '🚨 Deal verification ABORTED — suspected Amazon API fault',
        heading: 'Refused to mass-deactivate deals',
        lines: [
          `<strong>${result.unavailable} of ${result.checked}</strong> deals came back "unavailable" — implausibly high.`,
          'This looks like a partial Amazon outage or malformed response, not a real mass-expiry.',
          'The run was <strong>aborted with zero mutations</strong> to protect the deals page.',
          'If Amazon really did pull these, re-run <code>scripts/verify-amazon-deals.ts --execute</code> manually after confirming.',
        ],
      })
      return NextResponse.json(
        {
          error: 'SUSPECTED_FAULT',
          expired: expire,
          checked: result.checked,
          unavailable: result.unavailable,
        },
        { status: 500 }
      )
    } else {
      const updated = result.rows.filter((r) => r.action === 'UPDATED').length
      const deactivated = result.rows.filter((r) => r.action === 'DEACTIVATED').length
      summary.verify = { status: 'DONE', checked: result.rows.length, updated, deactivated }

      // Digest on EVERY successful run — a heartbeat. If this stops arriving the
      // cron itself is down, which no exception or 500 would otherwise surface.
      const changes = result.rows
        .filter((r) => r.action !== 'OK')
        .map((r) => `<code>${r.action}</code> ${r.title} (${r.asin}) — ${r.reason}`)
      await sendVerifyAlert({
        severity: 'digest',
        subject:
          updated + deactivated > 0
            ? `✅ Daily maintenance: ${updated} repriced, ${deactivated + expire.deactivated} deactivated`
            : `✅ Daily maintenance: all ${result.rows.length} deals OK`,
        heading: `Checked ${result.rows.length} deals · expiry sweep removed ${expire.deactivated}`,
        lines: [
          `<strong>${result.rows.length}</strong> checked · <strong>${updated}</strong> repriced · <strong>${deactivated}</strong> deactivated by price.`,
          `Expiry sweep deactivated <strong>${expire.deactivated}</strong> (deals ${expire.deals}, coupons ${expire.coupons}).`,
          ...(changes.length > 0
            ? changes
            : ['No price changes — all active deals still valid at their stored price. (Heartbeat: cron ran.)']),
        ],
      })

      console.log(
        `[daily-maintenance] verify: checked ${result.rows.length} — updated ${updated}, deactivated ${deactivated}`
      )
    }

    // Revalidate once, after both mutating steps.
    revalidatePath('/deals')
    revalidatePath('/coupons')
    revalidatePath('/')

    // ── 3. Coupon scrape — LAST, weekly, best-effort ────────────────────────
    // Everything above is already committed. A failure here is reported but
    // never fails the run.
    if (!shouldScan) {
      summary.scan = { ran: false, reason: scanParam === '0' ? 'suppressed via ?scan=0' : 'not Monday' }
    } else {
      try {
        const chromium = await import('@sparticuz/chromium')
        const executablePath = await chromium.default.executablePath()
        const scan = await runCouponScanSafely(executablePath)
        summary.scan = { ran: true, ...scan }
        console.log(
          `[daily-maintenance] scan: found ${scan.found}, added ${scan.added}, skipped ${scan.skipped}`
        )
      } catch (err) {
        const message = formatError(err)
        console.error('[daily-maintenance] scan failed (non-fatal):', message)
        summary.scan = { ran: true, failed: true, error: message }
      }
    }

    return NextResponse.json(summary)
  } catch (err) {
    const message = formatError(err)
    console.error('[daily-maintenance]', message, err)
    await sendVerifyAlert({
      severity: 'alert',
      subject: '🚨 Daily maintenance cron FAILED',
      heading: 'daily-maintenance threw an exception',
      lines: [
        'The combined daily maintenance run failed with an error:',
        `<code>${message}</code>`,
        'Deals may not have been verified today. Check Vercel logs.',
      ],
    }).catch((e) => console.error('[daily-maintenance] alert failed:', formatError(e)))
    return NextResponse.json({ error: message, partial: summary }, { status: 500 })
  }
}

/** Thin wrapper so the scrape's shape is flattened for the summary. */
async function runCouponScanSafely(executablePath: string) {
  const { runCouponScan } = await import('@/lib/coupon-scanner')
  const result = await runCouponScan({ executablePath, headless: true })
  return {
    found: result.found.length,
    added: result.added.length,
    skipped: result.skipped.length,
    errors: result.errors,
  }
}
