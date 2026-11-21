import { NextRequest, NextResponse } from 'next/server'
import { getRedirectBySlug } from '@/lib/redirects'
import { affiliateRequestPolicy, AFFILIATE_RESPONSE_HEADERS, type BlockReason, type PassReason } from '@/lib/affiliateRequest'
import { affiliateCheckPage, affiliateGuardSecret, issueAffiliateCheck, validateAffiliateCheck } from '@/lib/affiliateChallenge'
import { afterAffiliateResponse, exceedsAffiliateBurst, incrementAffiliateOutcome, recordCheckState } from '@/lib/affiliateGuardStore'
import { recordAffiliateNavigation } from '@/lib/affiliateClickAnalytics'

// Force dynamic — never cache redirect responses
export const dynamic = 'force-dynamic'

const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.spartanshopper.com'

function block(reason: BlockReason, recovery?: Response) {
  afterAffiliateResponse(db => incrementAffiliateOutcome(db, 'blocked', reason))
  console.info(JSON.stringify({ event: 'affiliate_redirect', decision: 'blocked', reason }))
  return recovery ?? new NextResponse(null, { status: 403, headers: AFFILIATE_RESPONSE_HEADERS })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const policy = affiliateRequestPolicy(req)
  if (policy.outcome === 'ignore') return HEAD()
  if (policy.outcome === 'block') return block(policy.reason)

  const secret = affiliateGuardSecret()
  const token = new URL(req.url).searchParams.get('continue')
  const check = token && secret ? validateAffiliateCheck(token, slug, secret) : null
  if (!check && secret && (policy.outcome === 'check' || token !== null)) {
    // Credible clicks and signed continuations never share the ambiguous-traffic limit.
    if (policy.outcome === 'check' && await exceedsAffiliateBurst(req, secret)) {
      // A shared carrier or office address can put shoppers in the same bucket.
      const { proof } = issueAffiliateCheck(req, slug, 'burst-recovery', secret)
      return block('burst', affiliateCheckPage(proof, true))
    }
    const reason = policy.outcome === 'check' ? policy.reason : 'missing-navigation'
    const { claims, proof } = issueAffiliateCheck(req, slug, reason, secret)
    afterAffiliateResponse(db => recordCheckState(db, 'issue', claims, secret))
    return affiliateCheckPage(proof)
  }

  try {
    const redirect = await getRedirectBySlug(slug)
    if (!redirect?.url) {
      return NextResponse.redirect(new URL('/', req.url), { status: 302, headers: AFFILIATE_RESPONSE_HEADERS })
    }

    const destination = new URL(redirect.url)
    if (!['http:', 'https:'].includes(destination.protocol) || destination.username || destination.password) {
      return NextResponse.redirect(new URL('/', req.url), { status: 302, headers: AFFILIATE_RESPONSE_HEADERS })
    }
    const response = NextResponse.redirect(redirect.url, {
      status: 302,
      headers: check ? { ...AFFILIATE_RESPONSE_HEADERS, 'Referrer-Policy': 'no-referrer' } : AFFILIATE_RESPONSE_HEADERS,
    })
    const reason: PassReason = policy.outcome === 'pass' ? policy.reason : 'signer-unavailable'
    const input = { slug, destination }
    if (check && secret) recordAffiliateNavigation(req, { ...input, check, secret })
    else recordAffiliateNavigation(req, { ...input, reason, secret })
    console.info(JSON.stringify({ event: 'affiliate_redirect', decision: check ? 'check-passed' : 'pass',
      reason: check?.reason ?? reason }))
    return response
  } catch {
    console.error('Affiliate redirect lookup failed')
    return NextResponse.redirect(FALLBACK_URL, { status: 302, headers: AFFILIATE_RESPONSE_HEADERS })
  }
}

// Link checks must not resolve or visit the retailer, or generate click events.
export function HEAD() {
  return new NextResponse(null, { status: 204, headers: AFFILIATE_RESPONSE_HEADERS })
}
