/**
 * Fetch active coupon promotions from CJ (Commission Junction) for target advertisers.
 * Outputs JSON compatible with scripts/add-coupons.ts PromoInput format.
 *
 * Usage:
 *   npx tsx scripts/fetch-cj-coupons.ts --rest           # fetch + write scripts/cj-coupons.json (default)
 *   npx tsx scripts/fetch-cj-coupons.ts --rest --out scripts/my-coupons.json  # custom output path
 *   npx tsx scripts/fetch-cj-coupons.ts --rest --debug   # dump raw CJ response to stderr
 *   npx tsx scripts/fetch-cj-coupons.ts --probe          # test auth + list available Query fields
 *
 * Then feed into the pipeline:
 *   npx tsx scripts/add-coupons.ts scripts/cj-coupons.json
 *
 * Note: always use --rest. The GraphQL endpoint (ads.api.cj.com/query) is advertiser-side
 * only (product catalog management) and has no publisher link or promotion queries.
 *
 * Required env vars (add to .env.local):
 *   CJ_API_TOKEN     — Personal Access Token from CJ Account Manager → API Keys
 *   CJ_COMPANY_ID    — Publisher Company ID (shown in CJ Account Manager URL)
 *   CJ_PROPERTY_ID   — Publisher Website/Property ID (required for --rest)
 */

import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// ── Config ────────────────────────────────────────────────────────────────────

const GQL_ENDPOINT  = 'https://ads.api.cj.com/query'
const REST_ENDPOINT = 'https://link-search.api.cj.com/v2/link-search'

const TOKEN       = process.env.CJ_API_TOKEN!
const COMPANY_ID  = process.env.CJ_COMPANY_ID!
const PROPERTY_ID = process.env.CJ_PROPERTY_ID!

const DEBUG    = process.argv.includes('--debug')
const PROBE    = process.argv.includes('--probe')
const USE_REST = process.argv.includes('--rest')

const outFlagIdx = process.argv.indexOf('--out')
const OUT_FILE   = outFlagIdx !== -1
  ? path.resolve(process.cwd(), process.argv[outFlagIdx + 1])
  : path.resolve(process.cwd(), 'scripts/cj-coupons.json')

if (!TOKEN)      { console.error('[fatal] CJ_API_TOKEN not set in .env.local'); process.exit(1) }
if (!COMPANY_ID) { console.error('[fatal] CJ_COMPANY_ID not set in .env.local'); process.exit(1) }

// ── Target advertisers ────────────────────────────────────────────────────────
// category must be a valid add-coupons.ts category value

const ADVERTISERS = [
  { id: '5725175', brand: 'BraceAbility',    category: 'health'     },
  { id: '4250177', brand: 'Budget Pet Care', category: 'pets'       },
  { id: '4247933', brand: 'Canada Pet Care', category: 'pets'       },
  { id: '4297609', brand: 'Click & Grow',    category: 'home'       },
  { id: '7297203', brand: 'FragranceShop',   category: 'beauty'     },
  { id: '5324242', brand: 'NordPass',        category: 'tech'       },
  { id: '4837117', brand: 'NordVPN',         category: 'tech'       },
  { id: '7455332', brand: 'Oedro',           category: 'automotive' },
  { id: '3056145', brand: 'Power Systems',   category: 'fitness'    },
  { id: '5357356', brand: 'Rexing',          category: 'tech'       },
  { id: '4441453', brand: 'Russell Stover',  category: 'food'       },
  { id: '6282055', brand: 'Surfshark',       category: 'tech'       },
  { id: '5661292', brand: 'SwitchBot',       category: 'tech'       },
  { id: '5824323', brand: 'UNice',           category: 'beauty'     },
  { id: '6038648', brand: 'Velocity Outdoor', category: 'outdoor'   },
] as const

const ADVERTISER_IDS = ADVERTISERS.map(a => a.id)
const ADVERTISER_MAP = Object.fromEntries(ADVERTISERS.map(a => [a.id, a]))

// ── Types ─────────────────────────────────────────────────────────────────────

interface PromoInput {
  brand: string
  code: string
  discount: string
  category: string
  startDate?: string
  expiryDate: string
  affiliateUrl: string
  description?: string
}

interface CJLink {
  advertiserId: string
  advertiserName: string
  linkId?: string
  linkName?: string
  description: string | null
  promotionType?: string
  couponCode: string | null
  startDate: string | null
  endDate: string | null
  clickUrl: string
}

// ── GraphQL helpers ───────────────────────────────────────────────────────────

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(GQL_ENDPOINT, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`CJ GraphQL HTTP ${res.status}:\n${text}`)
  }

  let json: { data?: T; errors?: Array<{ message: string }> }
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`CJ GraphQL returned non-JSON (HTTP ${res.status}):\n${text.slice(0, 400)}`)
  }

  if (json.errors?.length) {
    throw new Error(`CJ GraphQL errors:\n${json.errors.map(e => e.message).join('\n')}`)
  }
  if (!json.data) throw new Error('CJ GraphQL returned empty data')
  return json.data
}

// ── Probe mode — test auth + schema ──────────────────────────────────────────

const PROBE_QUERY = `
  {
    __type(name: "Query") {
      fields {
        name
        description
        args { name type { name kind ofType { name kind } } }
      }
    }
  }
`

// ── GraphQL promotions query ──────────────────────────────────────────────────
// CJ publisher API: publisherAccount → links filtered by promotion type
// Field names follow CJ's documented GraphQL schema for publisher link search.
// If field names differ, run --probe to inspect available fields.

const LINKS_QUERY = `
  query CouponLinks($cid: String!, $advertiserIds: [String]!) {
    publisherAccount(id: $cid) {
      links(
        advertiserIds: $advertiserIds
        promotionType: COUPON
        status: ACTIVE
      ) {
        resultList {
          advertiserId
          advertiserName
          linkId
          linkName
          description
          promotionType
          couponCode
          startDate
          endDate
          clickUrl
        }
      }
    }
  }
`

// ── Classic REST link-search (--rest fallback) ────────────────────────────────

async function fetchViaRest(): Promise<CJLink[]> {
  if (!PROPERTY_ID) throw new Error('CJ_PROPERTY_ID not set in .env.local (required for --rest)')

  const params = new URLSearchParams({
    'website-id':      PROPERTY_ID,
    'advertiser-ids':  ADVERTISER_IDS.join(','),
    'promotion-type':  'coupon',
    'records-per-page': '100',
    'page-number':     '1',
  })

  const res = await fetch(`${REST_ENDPOINT}?${params}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`CJ REST HTTP ${res.status}:\n${text}`)

  // CJ REST returns XML — parse manually
  const links: CJLink[] = []
  const linkBlocks = text.match(/<link>([\s\S]*?)<\/link>/g) ?? []

  for (const block of linkBlocks) {
    const get = (tag: string) => block.match(new RegExp(`<${tag}>(.*?)</${tag}>`, 's'))?.[1]?.trim() ?? null
    const code = get('coupon-code') ?? get('promotion-code')
    if (!code) continue
    links.push({
      advertiserId:  get('advertiser-id') ?? '',
      advertiserName: get('advertiser-name') ?? '',
      linkName:      get('link-name') ?? undefined,
      description:   get('description') ?? undefined,
      promotionType: get('promotion-type') ?? undefined,
      couponCode:    code,
      startDate:     get('promotion-start-date') ?? get('start-date'),
      endDate:       get('promotion-end-date') ?? get('end-date'),
      // CJ XML uses camelCase <clickUrl> not kebab-case <click-url>
      clickUrl: get('clickUrl') ?? get('click-url') ?? '',
    })
  }

  // Deduplicate by coupon code (CJ sometimes returns the same code on multiple link records)
  const seen = new Set<string>()
  return links.filter(l => {
    const key = l.couponCode?.toUpperCase() ?? ''
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── Data mapping ──────────────────────────────────────────────────────────────

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function parseDiscount(description: string | null, linkName: string | null): string {
  const text = [description, linkName].filter(Boolean).join(' ')
  const pct    = text.match(/(\d+)\s*%\s*off/i)
  if (pct)    return `${pct[1]}% Off`
  const dollar = text.match(/\$(\d+(?:\.\d+)?)\s*off/i)
  if (dollar) return `$${dollar[1]} Off`
  const save   = text.match(/save\s+\$(\d+(?:\.\d+)?)/i)
  if (save)   return `$${save[1]} Off`
  return 'Discount'
}

function toISODate(raw: string | null): string | null {
  if (!raw) return null
  try {
    const d = new Date(raw)
    if (isNaN(d.getTime())) return null
    return d.toISOString().split('T')[0]
  } catch { return null }
}

function sanitizeDescription(text: string | null, code: string): string {
  if (!text) return 'Visit the page for the code.'
  // Remove "Code: CODENAME" / "CODE: CODENAME" patterns, then strip bare code occurrences
  let clean = text
    .replace(new RegExp(`\\bCodes?:\\s*${code}\\b`, 'gi'), '')
    .replace(new RegExp(`\\b${code}\\b`, 'gi'), '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/[:.]+$/, '')
    .trim()
  if (!clean) clean = text.trim()
  // Ensure it ends with the code CTA, not exposing the code
  if (!clean.toLowerCase().includes('visit the page') && !clean.toLowerCase().includes('for the code')) {
    clean = `${clean}. Visit the page for the code.`
  }
  return clean
}

function mapLink(link: CJLink): PromoInput | null {
  const code = link.couponCode?.trim()
  if (!code) return null

  const expiryDate = toISODate(link.endDate)
  if (!expiryDate) return null
  const expiryMs = new Date(expiryDate).getTime()
  if (expiryMs < Date.now()) return null                        // already expired
  if (expiryMs - Date.now() < SEVEN_DAYS_MS) return null       // expires within 7 days

  const advertiser = ADVERTISER_MAP[link.advertiserId]
  const brand      = advertiser?.brand    ?? link.advertiserName
  const category   = advertiser?.category ?? 'amazon'
  const startDate  = toISODate(link.startDate)
  const discount   = parseDiscount(link.description, link.linkName ?? null)
  const rawDesc   = link.description ?? link.linkName ?? null
  const description = sanitizeDescription(rawDesc, code)

  return {
    brand,
    code,
    discount,
    category,
    ...(startDate ? { startDate } : {}),
    expiryDate,
    affiliateUrl: link.clickUrl,
    description,
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // ── Probe: test auth and print available query fields ─────────────────────
  if (PROBE) {
    console.error('── CJ GraphQL probe ─────────────────────────────────────')
    const data = await gql<{ __type: { fields: Array<{ name: string; description: string }> } }>(PROBE_QUERY)
    const fields = data.__type?.fields ?? []
    if (fields.length === 0) {
      console.error('  No Query fields visible — token may lack publisher scope')
    } else {
      console.error(`  ${fields.length} Query field(s) available:`)
      fields.forEach(f => console.error(`    ${f.name}${f.description ? ` — ${f.description}` : ''}`))
    }
    return
  }

  // ── Fetch links ───────────────────────────────────────────────────────────
  let links: CJLink[] = []

  if (USE_REST) {
    console.error('── Fetching via CJ REST link-search API ─────────────────')
    links = await fetchViaRest()
  } else {
    console.error('── Fetching via CJ GraphQL API ───────────────────────────')
    console.error(`   Company ID:  ${COMPANY_ID}`)
    console.error(`   Advertisers: ${ADVERTISER_IDS.join(', ')}\n`)

    type GQLResponse = {
      publisherAccount: {
        links: { resultList: CJLink[] }
      }
    }

    const data = await gql<GQLResponse>(LINKS_QUERY, {
      cid:           COMPANY_ID,
      advertiserIds: ADVERTISER_IDS,
    })

    if (DEBUG) {
      console.error('\n── Raw CJ response ──────────────────────────────────────')
      console.error(JSON.stringify(data, null, 2))
      console.error()
    }

    links = data?.publisherAccount?.links?.resultList ?? []
  }

  console.error(`  Raw links returned: ${links.length}`)

  // ── Map to PromoInput ─────────────────────────────────────────────────────
  const promos = links.map(mapLink).filter((p): p is PromoInput => p !== null)

  console.error(`  Mapped to promos:   ${promos.length}\n`)

  for (const adv of ADVERTISERS) {
    const count = promos.filter(p => p.brand === adv.brand).length
    console.error(`  ${adv.brand.padEnd(14)} ${count} coupon(s)`)
  }

  if (promos.length === 0) {
    console.error('\n  No coupons found. Try --debug or --probe to diagnose.')
    console.error('  Ensure --rest flag is set — GraphQL endpoint is advertiser-side only.')
  }

  // Write UTF-8 (no BOM) directly — avoids PowerShell > redirect encoding issues
  fs.writeFileSync(OUT_FILE, JSON.stringify(promos, null, 2) + '\n', 'utf8')

  console.error(`\n── Written to ${OUT_FILE}`)
  console.error(`  Next: npx tsx scripts/add-coupons.ts ${path.relative(process.cwd(), OUT_FILE)}`)
}

main().catch(err => {
  console.error('\n[fatal]', err.message ?? err)
  process.exit(1)
})
