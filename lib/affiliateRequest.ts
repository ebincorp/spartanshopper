const BOT_UA = /bot|crawl|spider|slurp|scrape|curl|wget|python-requests|httpx|node-fetch|axios|headless|lighthouse|pingdom|uptime|monitor|facebookexternalhit|ahrefs|semrush|mj12|bytespider|bingpreview/i
const PREVIEW_UA = /preview|whatsapp|telegram|discord|skype|embed|vkshare|perplexity/i
const BROWSER_UA = /^(Mozilla\/5\.0|Opera\/).*\b(AppleWebKit|Gecko|Chrome|Safari)\//i
const PRODUCTION_HOSTS = new Set(['spartanshopper.com', 'www.spartanshopper.com'])

export function affiliateSourcePage(request: Request): string {
  const referer = request.headers.get('referer')
  if (!referer) return '(unknown)'
  try {
    const source = new URL(referer)
    const site = new URL(request.url)
    const sameSite = source.origin === site.origin ||
      (source.protocol === 'https:' && site.protocol === 'https:' && !source.port &&
        PRODUCTION_HOSTS.has(site.hostname) && PRODUCTION_HOSTS.has(source.hostname))
    if (!sameSite) return '(external)'
    const page = source.pathname
    if (/^\/(?:go|api|studio)(?:\/|$)/i.test(page)) return '(unknown)'
    return /^\/[a-z0-9/_-]{0,200}$/i.test(page) ? page : '(unknown)'
  } catch {
    return '(unknown)'
  }
}

export type PassReason = 'same-site' | 'user-navigation' | 'signer-unavailable'
export type CheckReason = 'missing-navigation' | 'no-user-activation' | 'burst-recovery'
export type BlockReason = 'known-agent' | 'missing-agent' | 'non-navigation' | 'burst'
export type AffiliatePolicy =
  | { outcome: 'ignore'; reason: 'head' | 'prefetch' }
  | { outcome: 'block'; reason: BlockReason }
  | { outcome: 'pass'; reason: PassReason }
  | { outcome: 'check'; reason: CheckReason }

export function affiliateRequestPolicy(request: Request): AffiliatePolicy {
  if (request.method === 'HEAD') return { outcome: 'ignore', reason: 'head' }
  const { headers } = request
  const purpose = `${headers.get('purpose') ?? ''} ${headers.get('sec-purpose') ?? ''}`
  if (/prefetch|prerender/i.test(purpose) || headers.has('next-router-prefetch')) {
    return { outcome: 'ignore', reason: 'prefetch' }
  }

  const ua = headers.get('user-agent')?.trim() ?? ''
  // Several in-app browsers append app names to their genuine browser UA.
  if (BOT_UA.test(ua) || (PREVIEW_UA.test(ua) && !BROWSER_UA.test(ua))) {
    return { outcome: 'block', reason: 'known-agent' }
  }
  const mode = headers.get('sec-fetch-mode')
  const dest = headers.get('sec-fetch-dest')
  if ((mode !== null && mode !== 'navigate') || (dest !== null && dest !== 'document')) {
    return { outcome: 'block', reason: 'non-navigation' }
  }
  if (affiliateSourcePage(request).startsWith('/')) return { outcome: 'pass', reason: 'same-site' }
  if (mode === 'navigate' && dest === 'document' && headers.get('sec-fetch-user') === '?1') {
    return { outcome: 'pass', reason: 'user-navigation' }
  }
  // Sparse identity alone does not override credible click signals above.
  if (ua.length < 12 && ua !== 'Mozilla/5.0') return { outcome: 'block', reason: 'missing-agent' }

  return { outcome: 'check', reason: mode === null || dest === null ? 'missing-navigation' : 'no-user-activation' }
}

export const AFFILIATE_RESPONSE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow',
};
