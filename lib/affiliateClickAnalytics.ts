import { createHash } from 'node:crypto'
import { after } from 'next/server'
import { Redis } from '@upstash/redis'

const PREFIX = 'affiliate-clicks:v1'
const RETENTION_SECONDS = 180 * 24 * 60 * 60
const DEDUP_SECONDS = 90

function redis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  return url && token ? new Redis({ url, token }) : null
}

function reportDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const value = (type: string) => parts.find(part => part.type === type)?.value
  return `${value('year')}-${value('month')}-${value('day')}`
}

function sourcePath(request: Request) {
  const referer = request.headers.get('referer')
  if (!referer) return '(unknown)'
  try {
    const source = new URL(referer)
    const site = new URL(request.url)
    return source.hostname === site.hostname ? source.pathname : '(external)'
  } catch { return '(unknown)' }
}

function merchant(destination: string) {
  try { return new URL(destination).hostname.replace(/^www\./, '') } catch { return 'unknown' }
}

function asin(destination: string) {
  const match = destination.match(/(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})(?:[/?]|$)/i)
  return match?.[1]?.toUpperCase() || '(none)'
}

/**
 * Stores only aggregate, human redirect navigation counts. Never persist IPs,
 * cookies, referrer query strings, full user agents, or destination query strings.
 */
export function recordAffiliateNavigation(request: Request, input: { slug: string; destination: string }) {
  const db = redis()
  if (!db) return

  const date = reportDate()
  const page = sourcePath(request)
  const host = merchant(input.destination)
  const productAsin = asin(input.destination)
  const uaHash = createHash('sha256').update(request.headers.get('user-agent') || '').digest('hex').slice(0, 16)
  const dedupKey = `${PREFIX}:dedup:${input.slug}:${uaHash}`

  after(async () => {
    try {
      // A short behavioral dedupe filters link-security prefetches that mimic a browser.
      if (await db.set(dedupKey, '1', { nx: true, ex: DEDUP_SECONDS }) !== 'OK') return
      const base = `${PREFIX}:${date}`
      const pipeline = db.pipeline()
      pipeline.incr(`${base}:total`)
      pipeline.zincrby(`${base}:slugs`, 1, input.slug)
      pipeline.zincrby(`${base}:pages`, 1, page)
      pipeline.zincrby(`${base}:merchants`, 1, host)
      if (productAsin !== '(none)') pipeline.zincrby(`${base}:asins`, 1, productAsin)
      pipeline.zincrby(`${base}:page-slug`, 1, `${page}\t${input.slug}`)
      for (const suffix of ['total', 'slugs', 'pages', 'merchants', 'asins', 'page-slug']) {
        pipeline.expire(`${base}:${suffix}`, RETENTION_SECONDS)
      }
      await pipeline.exec()
    } catch {
      // Analytics must never delay or prevent an affiliate redirect.
    }
  })
}
