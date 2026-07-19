/**
 * Amazon Creators API wrapper (permanent).
 *
 * Wraps the vendored SDK (vendor/creatorsapi-sdk) to fetch live product data
 * for a set of ASINs. The SDK handles OAuth token fetch, 1h caching, and
 * renewal automatically from the Credential ID / Secret / Version.
 *
 * getItems() returns a discriminated union: on a fresh/ineligible credential
 * the Creators API rejects GetItems with reason "AssociateNotEligible" — we
 * catch that specifically and return { status: 'NOT_YET_ELIGIBLE' } instead of
 * throwing, so callers can no-op cleanly during the up-to-48h review window.
 */
import { ApiClient, DefaultApi, GetItemsRequestContent } from '../vendor/creatorsapi-sdk/dist/index.js'

const MARKETPLACE = 'www.amazon.com'
const PARTNER_TAG = 'sku18798384-20'
const BATCH_SIZE = 10 // GetItems accepts up to 10 ASINs per call
const THROTTLE_MS = 1000

const RESOURCES = [
  'itemInfo.title',
  'images.primary.highRes',
  'images.primary.large',
  'images.primary.medium',
  'offersV2.listings.price',
  'offersV2.listings.availability',
  // Live rating/review count, so content never has to hardcode them.
  'customerReviews.starRating',
  'customerReviews.count',
]

export interface CreatorItem {
  asin: string
  title?: string
  currentPrice?: number
  listPrice?: number
  savingsPercent: number
  primaryImageUrl?: string
  detailPageUrl?: string
  available: boolean
  /** Live star rating, e.g. 4.6. Undefined when Amazon returns no review data. */
  rating?: number
  /** Live review count. Undefined when Amazon returns no review data. */
  reviewCount?: number
}

export type GetItemsResult =
  | { status: 'OK'; items: CreatorItem[] }
  | { status: 'NOT_YET_ELIGIBLE'; message: string }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function isNotEligible(err: unknown): boolean {
  // callApi rejects with { status, statusText, body, response, error };
  // body is the parsed AccessDeniedException { type, message, reason }.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = err as any
  const reason = e?.body?.reason ?? e?.response?.body?.reason
  if (reason === 'AssociateNotEligible') return true
  const blob = JSON.stringify(e?.body ?? e?.response?.body ?? e?.message ?? '')
  return /AssociateNotEligible/i.test(blob)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapItem(item: any): CreatorItem {
  const listing = item?.offersV2?.listings?.[0]
  const price = listing?.price
  const currentPrice: number | undefined = price?.money?.amount
  const listPrice: number | undefined = price?.savingBasis?.money?.amount
  const apiSavings: number | undefined = price?.savings?.percentage

  const savingsPercent =
    typeof apiSavings === 'number'
      ? apiSavings
      : typeof listPrice === 'number' && typeof currentPrice === 'number' && listPrice > currentPrice
        ? Math.round(((listPrice - currentPrice) / listPrice) * 100)
        : 0

  const primary = item?.images?.primary
  const primaryImageUrl: string | undefined =
    primary?.hiRes?.url ?? primary?.large?.url ?? primary?.medium?.url

  // In stock when a listing carries a price and availability isn't a hard OOS state.
  const availType: string | undefined = listing?.availability?.type
  const available =
    currentPrice != null && (availType == null || !/unavailable|outofstock/i.test(availType))

  // customerReviews.starRating is a Rating object ({ value }), count is a plain Number.
  const rating: number | undefined = item?.customerReviews?.starRating?.value
  const reviewCount: number | undefined = item?.customerReviews?.count

  return {
    asin: item?.asin,
    title: item?.itemInfo?.title?.displayValue,
    currentPrice,
    listPrice: listPrice ?? currentPrice,
    savingsPercent,
    primaryImageUrl,
    detailPageUrl: item?.detailPageURL,
    available,
    rating: typeof rating === 'number' ? rating : undefined,
    reviewCount: typeof reviewCount === 'number' ? reviewCount : undefined,
  }
}

function makeApi() {
  const id = process.env.CREATORS_API_CLIENT_ID
  const secret = process.env.CREATORS_API_CLIENT_SECRET
  const version = process.env.CREATORS_API_VERSION
  if (!id || !secret || !version) {
    throw new Error('Missing CREATORS_API_CLIENT_ID / CLIENT_SECRET / VERSION in environment')
  }
  const client = new ApiClient()
  client.credentialId = id
  client.credentialSecret = secret
  client.version = version
  return new DefaultApi(client)
}

/**
 * Fetch live data for the given ASINs. Batches by 10, throttles ~1s between
 * calls. Returns one CreatorItem per requested ASIN (unavailable=false for any
 * the API didn't return). Surfaces AssociateNotEligible as NOT_YET_ELIGIBLE.
 */
export async function getItems(asins: string[]): Promise<GetItemsResult> {
  const unique = [...new Set(asins.filter(Boolean))]
  if (unique.length === 0) return { status: 'OK', items: [] }

  const api = makeApi()
  const byAsin = new Map<string, CreatorItem>()

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE)
    const req = new GetItemsRequestContent()
    req.partnerTag = PARTNER_TAG
    req.itemIds = batch
    req.resources = RESOURCES

    try {
      const resp = await api.getItems(MARKETPLACE, req)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: any[] = resp?.itemsResult?.items ?? []
      for (const it of items) {
        const mapped = mapItem(it)
        if (mapped.asin) byAsin.set(mapped.asin, mapped)
      }
    } catch (err) {
      if (isNotEligible(err)) {
        return {
          status: 'NOT_YET_ELIGIBLE',
          message: 'Creators API returned AssociateNotEligible — credential still in review window.',
        }
      }
      throw err
    }

    if (i + BATCH_SIZE < unique.length) await sleep(THROTTLE_MS)
  }

  // Ensure one entry per requested ASIN; missing ones are treated as unavailable.
  const items: CreatorItem[] = unique.map(
    (asin) =>
      byAsin.get(asin) ?? {
        asin,
        savingsPercent: 0,
        available: false,
      }
  )

  return { status: 'OK', items }
}
