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

export function trackAffiliateClick(
  request: Request,
  { slug, destination }: { slug: string; destination: string }
) {
  if (!GA4_MEASUREMENT_ID || !GA4_MP_API_SECRET) return;

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
          debug_mode: true, // TEMP: remove after DebugView verification
        },
      },
    ],
  };

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
