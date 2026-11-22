import { readFile } from 'node:fs/promises'
import { createClient } from '@sanity/client'
import { config } from 'dotenv'
import { checkCouponFeed, collectCouponFeed, couponCampaigns, type CouponFeedRecord } from '../lib/coupon-feed-verification'

interface PublishedCoupon extends CouponFeedRecord { _id: string; _rev: string }

async function main() {
  const args = process.argv.slice(2)
  const apply = args.length === 1 && args[0] === '--apply'
  const fixture = args.length === 2 && args[0] === '--fixture' ? args[1] : undefined
  if (args.length && !apply && !fixture) {
    throw new Error('Usage: npx tsx scripts/recheck-coupon-feed.ts [--apply | --fixture path]')
  }

  config({ path: '.env.local', quiet: true })
  if ((!fixture && (!process.env.CJ_API_TOKEN || !process.env.CJ_PROPERTY_ID)) ||
      (apply && !process.env.SANITY_API_TOKEN)) {
    throw new Error('Required CJ or Sanity credential is missing')
  }
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'eohdr7jw',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    perspective: 'published',
    token: process.env.SANITY_API_TOKEN,
  })
  const records = await client.fetch<PublishedCoupon[]>(
    `*[_type == "coupon" && active == true && slug.current in $slugs && verification.status == "advertiser-listed"]{
      _id, _rev, "slug": slug.current, code, startDate, expiryDate, verification{status, checkedOn, advertiserMatchMissing}
    }`,
    { slugs: Object.keys(couponCampaigns) },
  )
  const advertisers = [...new Set(Object.values(couponCampaigns).map(campaign => campaign.advertiser))]
  const links = await collectCouponFeed(async number => {
    if (fixture) {
      if (number !== 1) throw new Error('The fixture must contain a complete one-page feed')
      return readFile(fixture, 'utf8')
    }
    const params = new URLSearchParams({
      'website-id': process.env.CJ_PROPERTY_ID!,
      'advertiser-ids': advertisers.join(','),
      'promotion-type': 'coupon',
      'records-per-page': '100',
      'page-number': String(number),
    })
    const response = await fetch(`https://link-search.api.cj.com/v2/link-search?${params}`, {
      headers: { Authorization: `Bearer ${process.env.CJ_API_TOKEN!}` },
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) throw new Error(`CJ link search failed with HTTP ${response.status}`)
    return response.text()
  })
  if (records.length && !links.length) throw new Error('CJ returned an empty feed for the enrolled advertisers')
  const now = new Date()
  const checkedOn = now.toISOString().slice(0, 10)
  const results = records.map(record => ({ record, result: checkCouponFeed(record, links, now) }))

  if (apply) {
    const transaction = client.transaction()
    let changed = 0
    for (const { record, result } of results) {
      if (result === 'matched' && (record.verification?.checkedOn !== checkedOn || record.verification.advertiserMatchMissing)) {
        transaction.patch(record._id, patch => patch.ifRevisionId(record._rev).set({
          'verification.checkedOn': checkedOn,
          'verification.evidenceNote': `Matched the coupon to its advertiser promotion in the CJ feed on ${checkedOn}.`,
        }).unset(['verification.advertiserMatchMissing']))
        changed++
      }
      if (result === 'missing' && !record.verification?.advertiserMatchMissing) {
        transaction.patch(record._id, patch => patch.ifRevisionId(record._rev).set({ 'verification.advertiserMatchMissing': true }))
        changed++
      }
    }
    if (changed) await transaction.commit()
  }
  console.log(JSON.stringify({ mode: fixture ? 'fixture' : apply ? 'apply' : 'dry-run', checkedOn,
    coupons: results.map(({ record, result }) => ({ slug: record.slug, result })) }, null, 2))
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Coupon feed verification failed')
  process.exitCode = 1
})
