import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@sanity/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Write client — useCdn:false so the freshest data is patched.
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'eohdr7jw',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

// Daily sweep: deactivate any active deal OR coupon whose expiryDate has passed.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const expired = await client.fetch<{ _id: string; _type: string }[]>(
      `*[_type in ["deal", "coupon"] && active == true && defined(expiryDate) && dateTime(expiryDate) < dateTime(now())]{ _id, _type }`
    )

    if (expired.length > 0) {
      let tx = client.transaction()
      for (const doc of expired) tx = tx.patch(doc._id, (p) => p.set({ active: false }))
      await tx.commit()

      revalidatePath('/deals')
      revalidatePath('/coupons')
      revalidatePath('/')
    }

    const deals = expired.filter((d) => d._type === 'deal').length
    const coupons = expired.filter((d) => d._type === 'coupon').length
    console.log(`[/api/cron/expire-coupons] deactivated ${expired.length} (deals: ${deals}, coupons: ${coupons})`)

    return NextResponse.json({ success: true, deactivated: expired.length, deals, coupons })
  } catch (err) {
    console.error('[/api/cron/expire-coupons]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
