import { SaxesParser } from 'saxes'
import { endTime } from './offerExpiry'
import type { CouponVerification } from './couponVerification'

// The advertiser and creative IDs are from the November 21 CJ evidence.
// Multiple IDs here are reviewed duplicates of the same general offer.
export const couponCampaigns: Record<string, { advertiser: string; links: string[] }> = {
  '10-off-velocity-outdoor': { advertiser: '6038648', links: ['15263929'] },
  'switchbot-15-off-coupon': { advertiser: '5661292', links: ['15310710'] },
  'discount-budget-pet-care': { advertiser: '4250177', links: ['15581166'] },
  'budget-pet-care-summer12-coupon': { advertiser: '4250177', links: ['17079095', '17079102', '17079097'] },
  'oedro-20-off-coupon': { advertiser: '7455332', links: ['17045166', '17045169', '17045170'] },
  'oedro-pallet-forks-coupon': { advertiser: '7455332', links: ['17050551'] },
  'oedro-tonneau-cover-coupon': { advertiser: '7455332', links: ['17050548'] },
  'oedro-floor-mats-10-off': { advertiser: '7455332', links: ['17050549'] },
  'oedro-running-boards-30-off': { advertiser: '7455332', links: ['17050550'] },
}

type FeedLink = Record<string, string>
type FeedPage = { total: number; number: number; links: FeedLink[] }

export function parseCouponFeedPage(xml: string): FeedPage {
  const links: FeedLink[] = []
  let counts: Record<string, string> | undefined
  let link: FeedLink | undefined
  let field: string | undefined
  let value = ''
  const stack: string[] = []
  const parser = new SaxesParser()
  parser.on('doctype', () => { throw new Error('Unexpected document type in CJ feed') })
  parser.on('opentag', tag => {
    stack.push(tag.name)
    const path = stack.join('/')
    if (path === 'cj-api/links') counts = tag.attributes
    if (path === 'cj-api/links/link') link = {}
    if (link && stack.length === 4) {
      field = tag.name
      value = ''
    }
  })
  const readValue = (chunk: string) => { if (field) value += chunk }
  parser.on('text', readValue)
  parser.on('cdata', readValue)
  parser.on('closetag', tag => {
    if (field === tag.name && link) {
      link[field] = value.trim()
      field = undefined
    }
    if (stack.join('/') === 'cj-api/links/link' && link) {
      if (!link['advertiser-id'] || !link['link-id'] || !link['promotion-type'] || !link['relationship-status']) {
        throw new Error('CJ feed contains a link with missing identity fields')
      }
      links.push(link)
      link = undefined
    }
    stack.pop()
  })
  parser.write(xml).close()

  function readCount(name: string) {
    const count = counts?.[name]
    if (!count || !/^\d+$/.test(count) || !Number.isSafeInteger(Number(count))) {
      throw new Error('CJ feed is missing pagination metadata')
    }
    return Number(count)
  }
  const total = readCount('total-matched')
  const number = readCount('page-number')
  if (number < 1 || readCount('records-returned') !== links.length || links.length > total) {
    throw new Error('CJ feed returned inconsistent counts')
  }
  return { total, number, links }
}

export async function collectCouponFeed(readPage: (number: number) => Promise<string>): Promise<FeedLink[]> {
  const links: FeedLink[] = []
  const seen = new Set<string>()
  let total: number | undefined
  for (let number = 1; number <= 20; number++) {
    const page = parseCouponFeedPage(await readPage(number))
    total ??= page.total
    if (page.number !== number || page.total !== total || (!page.links.length && links.length < total)) {
      throw new Error('CJ feed pagination changed during the check')
    }
    for (const link of page.links) {
      const key = `${link['advertiser-id']}:${link['link-id']}`
      if (seen.has(key)) throw new Error('CJ feed duplicated a link across pages')
      seen.add(key)
      links.push(link)
    }
    if (links.length === total) return links
    if (links.length > total) break
  }
  throw new Error('CJ feed ended before the full result was read')
}

export interface CouponFeedRecord {
  slug: string
  code?: string
  startDate?: string
  expiryDate?: string
  verification?: CouponVerification | null
}

function withinFeedDates(link: FeedLink, today: string) {
  const start = link['promotion-start-date'] || link['start-date']
  const end = link['promotion-end-date'] || link['end-date']
  // CJ supplies wall-clock timestamps without a timezone. Near an end-date
  // boundary, hold the latest result for review instead of assuming an hour.
  const day = (value: string) => value.match(/^\d{4}-\d{2}-\d{2}(?=$|[ T])/)?.[0]
  if ((start && !day(start)) || (end && !day(end))) return false
  return (!start || day(start)! <= today) && (!end || day(end)! > today)
}

export function checkCouponFeed(record: CouponFeedRecord, links: FeedLink[], now: Date) {
  const campaign = couponCampaigns[record.slug]
  const code = record.code?.trim().toUpperCase()
  if (!campaign || !code || record.verification?.status !== 'advertiser-listed') return 'skip'
  const cutoff = endTime(record.expiryDate)
  if (record.startDate && (!Number.isFinite(Date.parse(record.startDate)) || Date.parse(record.startDate) > now.getTime())) return 'skip'
  if (record.expiryDate && (cutoff === null || cutoff <= now.getTime())) return 'skip'
  const today = now.toISOString().slice(0, 10)
  return links.some(link =>
    link['advertiser-id'] === campaign.advertiser &&
    campaign.links.includes(link['link-id']) &&
    link['promotion-type'].toLowerCase() === 'coupon' &&
    link['relationship-status'].toLowerCase() === 'joined' &&
    (link['coupon-code'] || link['promotion-code'])?.trim().toUpperCase() === code &&
    withinFeedDates(link, today)
  ) ? 'matched' : 'missing'
}
