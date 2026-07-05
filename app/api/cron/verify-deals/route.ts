import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { runVerifyDeals } from '@/lib/verify-deals'

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

    if (result.status === 'NOT_YET_ELIGIBLE') {
      console.log('[/api/cron/verify-deals] NOT_YET_ELIGIBLE — no mutations')
      return NextResponse.json({ success: true, status: 'NOT_YET_ELIGIBLE', mutated: 0 })
    }

    if (result.status === 'NO_RECORDS') {
      return NextResponse.json({ success: true, status: 'NO_RECORDS', mutated: 0 })
    }

    const updated = result.rows.filter((r) => r.action === 'UPDATED').length
    const deactivated = result.rows.filter((r) => r.action === 'DEACTIVATED').length

    if (updated + deactivated > 0) {
      revalidatePath('/deals')
      revalidatePath('/coupons')
      revalidatePath('/')
    }

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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
