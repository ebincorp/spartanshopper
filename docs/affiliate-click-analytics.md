# Affiliate click analytics

`/go/[slug]` redirects measure retailer redirects issued by SpartanShopper. They can include automated traffic and cannot confirm that the browser reached the retailer. Accepted navigations are aggregated in Upstash Redis by Pacific date, page path, affiliate slug, merchant, and Amazon ASIN where one is present. The tracker retains aggregates for 180 days and never stores raw IP addresses, cookies, raw user agents, referrer query strings, or destination query strings.

## Redirect filter counters

Read the daily hash `affiliate-guard:v1:YYYY-MM-DD:outcomes` with `HGETALL`. It has `pass`, `check-passed`, `check-abandoned` and `blocked` fields, plus `outcome:reason` breakdowns. A check is provisionally abandoned until a signed continuation gets a retailer redirect. Read a closed day at least five minutes after midnight Pacific to exclude still-pending checks. Replays leave the outcome count unchanged. Counts omit HEAD, prefetch and redirects to the site's homepage.

An ambiguous burst receives a 403 with a manual recovery link and is recorded under `blocked:burst`. A shopper taking that link is recorded under `check-passed:burst-recovery`. That sequence counts across two outcomes because it contains a block response and a later retailer redirect.

The guard counts outcome requests before the legacy report's 90-second dedupe. The legacy report dedupes with a UTC-day-salted HMAC of the Vercel client address and browser header, when available. The guards store no raw identity and skip the per-visitor check if the trusted identity is unavailable.

## GA4 one-time configuration

In **Admin → Custom definitions**, create these event-scoped dimensions with event parameter names exactly as shown:

| Dimension name | Event parameter | Scope |
| --- | --- | --- |
| Affiliate slug | `affiliate_slug` | Event |
| Source page path | `source_page_path` | Event |

GA4 only applies custom definitions to future events. Use the redirect aggregates for historical and reconciliation reporting.

## Daily reconciliation

After exporting the Amazon daily click total, run:

```powershell
npx tsx scripts/reconcile-affiliate-clicks.ts --date=2026-09-28 --amazon-clicks=123
```

The command returns the recorded retailer redirect count, Amazon gap, and ranked source pages and `/go/` slugs. The legacy `firstPartyHumanRedirects` label refers to redirects issued by SpartanShopper and can include automation. Investigate a large gap using the guard outcomes, GA4 click events and affiliate-network totals for the same dates.
