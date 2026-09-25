import { offerStatus } from './saved-finds'

export interface HealthRecord {
  _id: string; _type: 'deal' | 'coupon'; title: string; active: boolean
  slug?: string; affiliateSlug?: string; destination?: string
  expiryDate?: string; startDate?: string; salePrice?: number; originalPrice?: number; asin?: string
}
export interface HealthIssue { severity: 'urgent' | 'review'; message: string }
export interface HealthRow extends HealthRecord { issues: HealthIssue[] }
export function inspectOffer(record: HealthRecord, now = Date.now()): HealthRow {
  const issues: HealthIssue[] = []
  const add = (severity: HealthIssue['severity'], message: string) => issues.push({ severity, message })
  if (record.active) {
    const status = offerStatus(true, record.startDate, record.expiryDate, now)
    if (status === 'expired') add('urgent', 'Expired offer is still marked active')
    if (status === 'upcoming') add('review', 'Scheduled for a future start date')
    if (!record.expiryDate) add('review', 'No expiry date supplied')
    else {
      const expiry = Date.parse(record.expiryDate.length === 10 ? `${record.expiryDate}T23:59:59.999Z` : record.expiryDate)
      if (!Number.isFinite(expiry)) add('urgent', 'Invalid expiry date')
      else if (expiry > now && expiry - now <= 7 * 86400000) add('review', 'Expires within seven days')
    }
    if (!record.slug) add('urgent', 'Missing page slug')
    if (!record.affiliateSlug) add('urgent', 'Missing /go/ slug')
    if (!record.destination) add('urgent', 'Affiliate destination does not resolve')
    else {
      try {
        const url = new URL(record.destination)
        if (!['https:', 'http:'].includes(url.protocol)) add('urgent', 'Unsafe destination protocol')
        if (/(^|\.)spartanshopper\.com$/i.test(url.hostname) && url.pathname.startsWith('/go/')) add('urgent', 'Destination points back to a /go/ redirect')
        if (/(^|\.)amazon\.com$/i.test(url.hostname)) {
          const campaign = url.searchParams.get('campaignId')
          const issuedCampaign = campaign?.startsWith('amzn1.campaign.') && url.searchParams.get('linkId')?.startsWith(`${campaign}_`)
          if (url.searchParams.get('tag') !== 'sku18798384-20' && !(url.searchParams.get('tag') === 'spartan03-20' && issuedCampaign)) add('urgent', 'Amazon attribution needs review')
        }
      } catch { add('urgent', 'Invalid affiliate destination') }
    }
    if (record._type === 'deal' && (!Number.isFinite(record.salePrice) || (record.salePrice ?? 0) <= 0)) add('urgent', 'Missing or invalid sale price')
    if (record.salePrice && record.originalPrice && record.salePrice >= record.originalPrice) add('review', 'Stored price does not show a discount')
  }
  return { ...record, issues }
}
