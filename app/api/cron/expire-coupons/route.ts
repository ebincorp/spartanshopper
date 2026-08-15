import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { runExpireCoupons } from '@/lib/expire-coupons'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * DEPRECATED as a cron entry — no longer listed in vercel.json. The expiry
 * sweep now runs inside /api/cron/daily-maintenance, which combines all three
 * jobs into the single cron the plan tier can guarantee.
 *
 * The route is kept working (sharing lib/expire-coupons.ts with the combined
 * route) so it remains available for manual invocation and so nothing calling
 * it directly breaks.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const expired = await runExpireCoupons()

    if (expired.deactivated > 0) {
      revalidatePath('/deals')
      revalidatePath('/coupons')
      revalidatePath('/')
    }

    console.log(
      `[/api/cron/expire-coupons] deactivated ${expired.deactivated} (deals: ${expired.deals}, coupons: ${expired.coupons})`
    )

    return NextResponse.json({
      success: true,
      deactivated: expired.deactivated,
      deals: expired.deals,
      coupons: expired.coupons,
    })
  } catch (err) {
    console.error('[/api/cron/expire-coupons]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
