/**
 * Server-side GA4 tracking for /go/ affiliate redirects.
 *
 * Named "outbound_affiliate_click" to match the custom key event already
 * configured in GA4 admin for the site's regular (client-side) outbound
 * clicks, so both paths roll up into the same key event automatically.
 */

import { after } from 'next/server';
import { createHash } from 'crypto';
import { Redis } from '@upstash/redis';

const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID; // G-E99ZPSFNFS
const GA4_MP_API_SECRET = process.env.GA4_MP_API_SECRET;

/**
 * Short-window same-slug de-dup (Upstash Redis, provisioned 2026-07-31).
 *
 * Why this exists, and why UA/referer filtering alone can't fix it: a live
 * diagnostic pull on 2026-07-31 caught the same slug (spy-matrix-pro-sweep)
 * hit twice 28s apart with an *identical* real-browser UA and a genuine
 * spartanshopper.com referer, but from two different IPs — consistent with
 * an email/link-security scanner (Safe Links/Proofpoint-style) pre-fetching
 * the link from a rotating IP pool using a consistent browser-template UA.
 * That traffic is indistinguishable from a real click by UA or referer, by
 * design, so the fix is behavioral: don't count a second hit on the same
 * slug within a short window, regardless of IP.
 *
 * Keyed on slug + a UA hash (not slug alone) so two different real visitors
 * clicking the same popular deal within the window still both count.
 */
const DEDUP_WINDOW_SECONDS = 90;
const redis = Redis.fromEnv();

function hashUa(ua: string): string {
  return createHash('sha256').update(ua).digest('hex').slice(0, 16);
}

/** Returns true the FIRST time this slug+UA pair is seen within the window. */
async function claimDedupSlot(slug: string, ua: string): Promise<boolean> {
  const key = `affclick:dedup:${slug}:${hashUa(ua)}`;
  // SET NX — atomic check-and-set. Result is 'OK' only if the key was newly
  // set (i.e. this is the first hit); null means a duplicate within the window.
  const result = await redis.set(key, '1', { nx: true, ex: DEDUP_WINDOW_SECONDS });
  return result === 'OK';
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

  if (!shouldTrack(request)) {
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

  const ua = request.headers.get('user-agent') ?? '';

  after(async () => {
    try {
      const isFirstHit = await claimDedupSlot(slug, ua);
      if (!isFirstHit) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[trackAffiliateClick] deduped (repeat slug+UA within ${DEDUP_WINDOW_SECONDS}s) for slug="${slug}"`);
        }
        return;
      }
    } catch (err) {
      // If Redis is unreachable, fail open — better to occasionally over-count
      // than to lose real click tracking because a dependency hiccuped.
      if (process.env.NODE_ENV === 'development') {
        console.log(`[trackAffiliateClick] dedup check failed, sending anyway: ${err}`);
      }
    }

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
