import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { runVerifyDeals } from '@/lib/verify-deals'
import { sendVerifyAlert } from '@/lib/verify-deals-notify'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Daily price/availability verification against the Amazon Creators API.
// Runs in execute mode: repriced deals are patched, dead deals deactivated.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runVerifyDeals({ execute: true })

    // Eligibility regression: the API was live, now it's rejecting again. Nothing
    // was mutated, but verification has silently stopped — make it loud.
    if (result.status === 'NOT_YET_ELIGIBLE') {
      console.error('[/api/cron/verify-deals] NOT_YET_ELIGIBLE — verification is not running')
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
      return NextResponse.json({ success: true, status: 'NOT_YET_ELIGIBLE', mutated: 0 })
    }

    // No ASIN-bearing records at all — likely a Sanity query/schema problem.
    if (result.status === 'NO_RECORDS') {
      console.error('[/api/cron/verify-deals] NO_RECORDS — nothing to verify')
      await sendVerifyAlert({
        severity: 'alert',
        subject: '⚠️ Deal verification found 0 deals to check',
        heading: 'No active deals/coupons with an ASIN were found',
        lines: [
          'The verification query returned <strong>0 records</strong>.',
          'Either every ASIN-bearing deal is inactive, or the Sanity query/connection is broken.',
        ],
      })
      return NextResponse.json({ success: true, status: 'NO_RECORDS', mutated: 0 })
    }

    // Suspected API fault: an implausible share of items came back "unavailable".
    // runVerifyDeals refused to commit — alert loudly and fail the run (500) so
    // Vercel also flags it. Committing here would have blanked the deals page.
    if (result.status === 'SUSPECTED_FAULT') {
      console.error(
        `[/api/cron/verify-deals] SUSPECTED_FAULT — ${result.unavailable}/${result.checked} unavailable, NOT committing`
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
        { error: 'SUSPECTED_FAULT', checked: result.checked, unavailable: result.unavailable },
        { status: 500 }
      )
    }

    const updated = result.rows.filter((r) => r.action === 'UPDATED').length
    const deactivated = result.rows.filter((r) => r.action === 'DEACTIVATED').length

    if (updated + deactivated > 0) {
      revalidatePath('/deals')
      revalidatePath('/coupons')
      revalidatePath('/')
    }

    // Digest sent on EVERY successful run — a daily heartbeat. If this email
    // stops arriving, the cron itself is down (schedule deleted, route broken),
    // which no exception/500 would otherwise surface. See verify-deals-notify.ts.
    const changes = result.rows
      .filter((r) => r.action !== 'OK')
      .map((r) => `<code>${r.action}</code> ${r.title} (${r.asin}) — ${r.reason}`)
    await sendVerifyAlert({
      severity: 'digest',
      subject:
        updated + deactivated > 0
          ? `✅ Deal verification: ${updated} repriced, ${deactivated} deactivated`
          : `✅ Deal verification: all ${result.rows.length} deals OK`,
      heading: `Checked ${result.rows.length} deals`,
      lines: [
        `<strong>${result.rows.length}</strong> checked · <strong>${updated}</strong> repriced · <strong>${deactivated}</strong> deactivated.`,
        ...(changes.length > 0
          ? changes
          : ['No changes — all active deals still valid at their stored price. (Heartbeat: cron ran.)']),
      ],
    })

    console.log(
      `[/api/cron/verify-deals] checked ${result.rows.length} — updated ${updated}, deactivated ${deactivated}`
    )
    return NextResponse.json({
      success: true,
      status: 'DONE',
      checked: result.rows.length,
      updated,
      deactivated,
    })
  } catch (err) {
    console.error('[/api/cron/verify-deals]', err)
    // Hard crash — network, Sanity write, throttle-after-retries. Already 500s
    // (Vercel flags it), but email too so it doesn't depend on dashboard alerts.
    await sendVerifyAlert({
      severity: 'alert',
      subject: '🚨 Deal verification crashed',
      heading: 'verify-deals cron threw an exception',
      lines: [
        'The daily verification run failed with an error:',
        `<code>${err instanceof Error ? err.message : String(err)}</code>`,
        'No guarantee any deals were verified today. Check Vercel logs.',
      ],
    }).catch((e) => console.error('[/api/cron/verify-deals] alert failed:', e))
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
