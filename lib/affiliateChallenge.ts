import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { isIP } from 'node:net'
import { AFFILIATE_RESPONSE_HEADERS, affiliateSourcePage, type CheckReason } from './affiliateRequest'

export const CHECK_TTL_SECONDS = 300
export type CheckClaims = { issuedAt: number; nonce: string; reason: CheckReason; page: string }

export function affiliateGuardSecret() {
  return process.env.AFFILIATE_GUARD_SECRET?.trim() || process.env.CRON_SECRET?.trim()
}

function dailyDigest(secret: string, purpose: string, now: number, value: string) {
  const day = new Date(now).toISOString().slice(0, 10)
  const dailyKey = createHmac('sha256', secret).update(`affiliate-guard:v1:${purpose}:${day}`).digest()
  return createHmac('sha256', dailyKey).update(value).digest('base64url')
}

export function affiliateVisitorHash(
  request: Request, secret: string | undefined, now = Date.now(), onVercel = process.env.VERCEL === '1',
) {
  if (!secret || !onVercel) return null
  const ip = request.headers.get('x-vercel-forwarded-for')?.trim()
  const agent = request.headers.get('user-agent')?.trim().slice(0, 512)
  if (!ip || !isIP(ip) || !agent) return null
  return dailyDigest(secret, 'visitor', now, JSON.stringify([ip, agent]))
}

function signature(secret: string, slug: string, issuedAt: number, payload: string) {
  return dailyDigest(secret, 'continuation', issuedAt, JSON.stringify([slug, payload]))
}

export function checkReceiptHash(claims: CheckClaims, secret: string) {
  return dailyDigest(secret, 'receipt', claims.issuedAt, claims.nonce)
}

export function issueAffiliateCheck(request: Request, slug: string, reason: CheckReason, secret: string, now = Date.now()) {
  const claims: CheckClaims = {
    issuedAt: now, nonce: randomBytes(16).toString('base64url'), reason, page: affiliateSourcePage(request),
  }
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url')
  return { claims, proof: `${payload}.${signature(secret, slug, now, payload)}` }
}

export function validateAffiliateCheck(proof: string, slug: string, secret: string, now = Date.now()): CheckClaims | null {
  if (!/^[\w-]{1,512}\.[\w-]{43}$/.test(proof)) return null
  const [payload, signed] = proof.split('.')
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString()) as CheckClaims
    if (!Number.isSafeInteger(claims.issuedAt) || claims.issuedAt > now || now - claims.issuedAt >= CHECK_TTL_SECONDS * 1000 ||
        !/^[\w-]{22}$/.test(claims.nonce) ||
        !['missing-navigation', 'no-user-activation', 'burst-recovery'].includes(claims.reason) ||
        !/^(?:\/(?:[a-z0-9/_-]{0,200})|\((?:unknown|external)\))$/i.test(claims.page)) return null
    const expected = signature(secret, slug, claims.issuedAt, payload)
    return timingSafeEqual(Buffer.from(signed), Buffer.from(expected)) ? claims : null
  } catch {
    return null
  }
}

export function affiliateCheckPage(proof: string, manualOnly = false) {
  const continuation = `?continue=${encodeURIComponent(proof)}`
  const nonce = randomBytes(16).toString('base64')
  return new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Continue to the retailer</title>
</head>
<body>
  <main>
    <h1>${manualOnly ? 'Continue to the retailer' : 'Opening the retailer'}</h1>
    <p><a rel="nofollow sponsored" href="${continuation}">Continue to the retailer</a></p>
  </main>
  ${manualOnly ? '' : `<script nonce="${nonce}">setTimeout(function () { location.replace(${JSON.stringify(continuation)}); }, 120);</script>`}
</body>
</html>`, {
    status: manualOnly ? 403 : 200,
    headers: {
      ...AFFILIATE_RESPONSE_HEADERS,
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'`,
      'Referrer-Policy': 'no-referrer',
    },
  })
}
