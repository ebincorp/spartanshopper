import { NextRequest, NextResponse } from 'next/server'
import { runCouponScan } from '@/lib/coupon-scanner'

// Allow up to 5 minutes — Vercel Pro required for > 60s
export const maxDuration = 300

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Use @sparticuz/chromium for the serverless environment
    const chromium = await import('@sparticuz/chromium')
    const executablePath = await chromium.default.executablePath()

    const result = await runCouponScan({ executablePath, headless: true })

    return NextResponse.json({
      success: true,
      found:   result.found.length,
      added:   result.added.length,
      skipped: result.skipped.length,
      errors:  result.errors,
    })
  } catch (err) {
    console.error('[/api/cron/coupon-scan]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
