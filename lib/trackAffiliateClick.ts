/**
 * Server-side GA4 tracking for /go/ affiliate redirects.
 *
 * Named "outbound_affiliate_click" to match the custom key event already
 * configured in GA4 admin for the site's regular (client-side) outbound
 * clicks, so both paths roll up into the same key event automatically.
 */

import { after } from 'next/server';

const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID; // G-E99ZPSFNFS
const GA4_MP_API_SECRET = process.env.GA4_MP_API_SECRET;

/**
 * TEMPORARY — diagnostic only. Added 2026-07-31 to root-cause a click-tracking
 * anomaly (94 GA4 outbound_affiliate_click events vs 73 real Amazon Associates
 * clicks same day, ~13 events/session, repeated same-slug hits within seconds,
 * missing geo on ~93/94 events). Vercel's runtime logs don't expose request
 * IP/UA at all, and GA4 has no BigQuery export configured, so there is
 * currently no way to see who/what is hitting /go/ repeatedly. This logs
 * method + UA + best-effort IP for every /go/ hit, tracked or not, so a
 * `vercel logs` pull during the observation window shows the real traffic
 * shape. REMOVE this flag and the logDiagnostic() call+function once the
 * source is identified — do not leave this permanently enabled.
 */
const TEMP_DIAGNOSTIC_LOGGING = true;

function logDiagnostic(request: Request, slug: string, tracked: boolean) {
  if (!TEMP_DIAGNOSTIC_LOGGING) return;
  const ua = request.headers.get('user-agent') ?? '(none)';
  // Vercel forwards the real client IP via x-forwarded-for (first hop = client).
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '(unknown)';
  const referer = request.headers.get('referer') ?? '(none)';
  console.log(
    `[DIAG /go] slug="${slug}" method=${request.method} tracked=${tracked} ip=${ip} referer="${referer}" ua="${ua}"`
  );
}

/**
 * Bot / automation user-agent filter for the GA4 send.
 *
 * Why this exists: crawlers hammer /go/ affiliate URLs and each hit was firing
 * a server-side outbound_affiliate_click. GA4 showed ~685 click events against
 * only 65 pageviews over 4 days (Jul 3–6 2026) — vs Amazon's own count of 618
 * clicks in 30 days — i.e. bots inflated the metric ~10x over real traffic.
 * We NEVER skip the 302 redirect (bots still get redirected); we only skip the
 * analytics event so the GA4 number tracks humans. Do not delete this.
 */
const BOT_UA_RE =
  /bot|crawl|spider|slurp|scrape|curl|wget|python-requests|httpx|node-fetch|axios|headless|lighthouse|pingdom|uptime|monitor|preview|facebookexternalhit|whatsapp|telegram|discord|skype|embed|vkshare|ahrefs|semrush|mj12|dotbot|petalbot|bytespider|gptbot|ccbot|claudebot|perplexity|amazonbot|applebot|bingpreview/i;

/**
 * Returns true only for requests we believe are real humans worth tracking.
 * Skips (returns false) for known bots, missing UAs, and HEAD link-checkers.
 */
function shouldTrack(request: Request): boolean {
  // HEAD requests are almost always link checkers / uptime monitors.
  if (request.method === 'HEAD') return false;

  const ua = request.headers.get('user-agent');

  // Empty / missing UA is almost always automation.
  if (!ua || ua.trim() === '') return false;

  if (BOT_UA_RE.test(ua)) return false;

  return true;
}

export function trackAffiliateClick(
  request: Request,
  { slug, destination }: { slug: string; destination: string }
) {
  if (!GA4_MEASUREMENT_ID || !GA4_MP_API_SECRET) return;

  const tracked = shouldTrack(request);
  logDiagnostic(request, slug, tracked);

  if (!tracked) {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[trackAffiliateClick] skipped GA4 send (bot/automation) for slug="${slug}" ua="${request.headers.get('user-agent') ?? ''}" method=${request.method}`
      );
    }
    return;
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  const match = cookieHeader.match(/_ga=GA\d\.\d\.(\d+\.\d+)/);
  const clientId = match ? match[1] : `${Date.now()}.${Math.floor(Math.random() * 1e9)}`;

  const payload = {
    client_id: clientId,
    events: [
      {
        name: 'outbound_affiliate_click',
        params: {
          link_url: destination,
          link_domain: safeHostname(destination),
          affiliate_slug: slug,
          outbound: true,
        },
      },
    ],
  };

  if (process.env.NODE_ENV === 'development') {
    console.log(`[trackAffiliateClick] sending GA4 event for slug="${slug}" (human)`);
  }

  after(async () => {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_MP_API_SECRET}`,
      { method: 'POST', body: JSON.stringify(payload) }
    ).catch(() => {});
  });
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}
