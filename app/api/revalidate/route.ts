import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')

  if (secret !== process.env.SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
  }

  revalidatePath('/')
  revalidatePath('/deals')
  revalidatePath('/coupons')
  revalidatePath('/sweepstakes')

  return NextResponse.json({ revalidated: true, now: Date.now() })
}
