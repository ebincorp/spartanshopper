# Affiliate click analytics

`/go/[slug]` redirects are the source of truth for human affiliate-navigation counts. Each accepted navigation is aggregated in Upstash Redis by Pacific date, page path, affiliate slug, merchant, and Amazon ASIN where one is present. The tracker retains aggregates for 180 days and never stores IP addresses, cookies, raw user agents, referrer query strings, or destination query strings.

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

The command returns the first-party human redirect count, Amazon gap, and ranked source pages and `/go/` slugs. Investigate a gap above 10%; GA blockers, client-side navigation failures, and scanner traffic are the usual causes.
