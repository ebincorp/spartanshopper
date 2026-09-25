# Saved Finds and Deal Health

## Saved Finds

`/my-finds` stores up to 100 deal/coupon references and titles in localStorage. It does not store coupon codes, prices, affiliate URLs, or images. Tabs synchronize through storage events. Storage errors are visible to the shopper.

`POST /api/saved-finds` resolves references using the published-only Sanity client with no caching. Expired, inactive, future, and unpublished offers have no shopping CTA. Fetch failures retain the list but hide unverified shopping links. Offers refresh on return to the window and every minute while visible.

Analytics uses the existing gtag context: `save_find`, `remove_saved_find`, and `saved_find: true` on `outbound_affiliate_click` from the shortlist. Register the event parameters in GA if reports need custom dimensions. No new user identifiers are created.

## Deal Health

Open `/internal/deal-health`. Set server-only `DEAL_HEALTH_TOKEN` to a random secret of at least 32 characters in `.env.local` (restart development server) and in Vercel for production. Enter that value in the dashboard. There is no development bypass. The API fails closed when unset. Never use a NEXT_PUBLIC variable for this key. The page shell contains no report data; both API methods require the key, compare it in constant time, and return no-store responses.

The default review queue examines published deal/coupon records, expiry dates, stored prices, and /go/ destination resolution using the site's priority order. It does not fetch arbitrary retailer URLs or claim that destinations return HTTP 200. Open the provided Sanity links to fix records through the normal editorial workflow.

The explicit Amazon check reuses `runVerifyDeals` in dry-run mode, scoped to published documents. Its suggested actions are review inputs, never mutations. Coupon eligibility is not verified by the list-price discount. API eligibility failures and mass-unavailability warnings remain visible. Reports can be exported as JSON.

No publishing, deactivation, deployment, or scheduled job changes are performed by these features.
