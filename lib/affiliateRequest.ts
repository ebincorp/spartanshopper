// Only explicit automation signals are blocked. Missing headers, location,
// cookies, or referrers alone must not lock legitimate visitors out of deals.
const BOT_UA_RE = /bot|crawl|spider|slurp|scrape|curl|wget|python-requests|httpx|node-fetch|axios|headless|lighthouse|pingdom|uptime|monitor|preview|facebookexternalhit|whatsapp|telegram|discord|skype|embed|vkshare|ahrefs|semrush|mj12|dotbot|petalbot|bytespider|gptbot|ccbot|claudebot|perplexity|amazonbot|applebot|bingpreview/i;

export function affiliateRequestPolicy(request: Request): 'head' | 'prefetch' | 'bot' | 'navigate' {
  if (request.method === 'HEAD') return 'head';
  const purpose = `${request.headers.get('purpose') ?? ''} ${request.headers.get('sec-purpose') ?? ''}`;
  if (/prefetch|prerender/i.test(purpose) || request.headers.has('next-router-prefetch')) return 'prefetch';
  if (BOT_UA_RE.test(request.headers.get('user-agent') ?? '')) return 'bot';
  return 'navigate';
}

export const AFFILIATE_RESPONSE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow',
};
