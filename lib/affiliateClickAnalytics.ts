import { affiliateVisitorHash, type CheckClaims } from './affiliateChallenge'
import { affiliateSourcePage, type PassReason } from './affiliateRequest'
import {
  afterAffiliateResponse, affiliateReportDate, GUARD_RETENTION_SECONDS, incrementAffiliateOutcome,
  markAffiliateVisitorProven, recordCheckState,
} from './affiliateGuardStore'

const PREFIX = 'affiliate-clicks:v1'
const DEDUP_SECONDS = 90

/**
 * Counts retailer redirects issued by the server. A client may still stop
 * before reaching the merchant. No raw visitor or destination tokens are saved.
 */
export function recordAffiliateNavigation(request: Request, input: {
  slug: string; destination: URL
} & ({ reason: PassReason; secret?: string } | { check: CheckClaims; secret: string })) {
  const date = affiliateReportDate()
  const page = 'check' in input ? input.check.page : affiliateSourcePage(request)
  const host = input.destination.hostname.replace(/^www\./, '')
  const productAsin = input.destination.pathname.match(/(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})(?:\/|$)/i)?.[1]?.toUpperCase()
  const visitor = affiliateVisitorHash(request, input.secret)
  const slug = input.slug

  afterAffiliateResponse(async db => {
    if ('check' in input) {
      if (!await recordCheckState(db, 'complete', input.check, input.secret)) return
    } else {
      await incrementAffiliateOutcome(db, 'pass', input.reason)
    }
    if (visitor) {
      await markAffiliateVisitorProven(db, visitor)
      const dedupKey = `${PREFIX}:dedup:${slug}:${visitor}`
      if (await db.set(dedupKey, '1', { nx: true, ex: DEDUP_SECONDS }) !== 'OK') return
    }
    const base = `${PREFIX}:${date}`
    const pipeline = db.pipeline()
    pipeline.incr(`${base}:total`)
    pipeline.zincrby(`${base}:slugs`, 1, slug)
    pipeline.zincrby(`${base}:pages`, 1, page)
    pipeline.zincrby(`${base}:merchants`, 1, host)
    if (productAsin) pipeline.zincrby(`${base}:asins`, 1, productAsin)
    pipeline.zincrby(`${base}:page-slug`, 1, `${page}\t${slug}`)
    for (const suffix of ['total', 'slugs', 'pages', 'merchants', 'asins', 'page-slug']) {
      pipeline.expire(`${base}:${suffix}`, GUARD_RETENTION_SECONDS)
    }
    await pipeline.exec()
  })
}
