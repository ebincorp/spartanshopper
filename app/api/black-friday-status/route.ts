import { readLiveBlackFridayOffers } from '@/lib/black-friday-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const now = Date.now()
  const headers = { 'Cache-Control': 'no-store' }
  try {
    return Response.json({ now, offers: await readLiveBlackFridayOffers(now) }, { headers })
  } catch {
    return Response.json({ now, offers: [] }, { headers, status: 503 })
  }
}
