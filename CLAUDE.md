# SpartanShopper — Claude Code Context

## Stack

- **Framework**: Next.js 16 / Turbopack
- **CMS**: Sanity v4
- **Styling**: Tailwind CSS
- **Language**: TypeScript (strict)
- **Hosting**: Vercel
- **Sanity Studio**: Deployed separately via `npx sanity deploy`

---

## Sanity Content Types

| Type | Purpose |
|---|---|
| `post` | Blog articles |
| `affiliateLink` | `/go/` redirect targets |
| `deal` | Product deals |
| `coupon` | Coupon cards (see promotions.json) |
| `sweepstake` | Giveaways |

---

## /go/ Redirect System

Affiliate links are cloaked via `/go/[slug]` routes.

- Slugs are managed in Sanity as `affiliateLink` documents
- Resolution happens in `lib/redirects.ts` using a GROQ `coalesce()` query
- Example: `/go/zeronder-ear-camera` → resolves to the full Amazon affiliate URL
- **Resolution priority** (first non-null wins):
  1. `affiliateLink.destination` (dedicated Affiliate Link document)
  2. `sweepstake.entryUrl` (where `affiliateSlug.current == slug`)
  3. Any other content type's `affiliateUrl` (deals, coupons, posts)

**When adding a new affiliate link:**
1. Create a new `affiliateLink` document in Sanity with the slug and destination URL
2. The `/go/` route picks it up automatically — no code changes needed
3. Always use the `/go/` slug in articles rather than raw affiliate URLs where possible

---

## Scripts

Located in `scripts/`. Three utilities for coupon management:

| Script | Purpose |
|---|---|
| `add-coupons.ts` | Programmatically add new entries to `promotions.json` |
| `scan-coupons.ts` | Scan for expired or upcoming coupons |
| `promotions.json` | Source of truth for all coupon data (lives here, not root) |

Run with: `npx tsx scripts/add-coupons.ts`

Requires `SANITY_API_TOKEN` in `.env.local`.

---

## promotions.json

`scripts/promotions.json` is the input file for `add-coupons.ts`. The script reads it and creates draft documents in Sanity — the coupon card components read from Sanity, not this file directly.

### Required fields:

```json
[
  {
    "brand": "Brand Name",
    "code": "COUPONCODE",
    "discount": "20% off",
    "category": "beauty",
    "expiryDate": "2026-04-30",
    "affiliateUrl": "https://www.amazon.com/promocode/XXXXX?tag=sku18798384-20"
  }
]
```

### Optional fields:

- `startDate` — coupon hidden on site until this date; blog embeds show "Deal available [date]" placeholder
- `description` — auto-generated from other fields if omitted
- Both dates use ISO format: `YYYY-MM-DD`

### Valid `category` values:
`health` | `tech` | `home` | `food` | `beauty` | `fitness` | `pets` | `travel` | `fashion` | `amazon`

---

## Revalidation

- A revalidation route handles on-demand ISR for blog slug paths automatically
- Do not remove or modify the revalidation handler without understanding the full impact
- `useCdn: false` is intentional — it bypasses Sanity's CDN cache so publishes are instant. **Do not revert this.**

---

## Deploy Workflow

```bash
# Deploy site
git push origin main        # triggers Vercel auto-deploy

# Deploy Sanity Studio (schema changes only)
npx sanity deploy
```

**Key gotchas:**
- `studio/` is excluded from TypeScript — schema changes require a separate `npx sanity deploy` and will not be caught by the TS compiler
- Untracked local files do not exist on Vercel — always run `git status` before pushing to confirm everything is committed

---

## Brand

- **Primary red**: `#E63946`
- **Dark navy**: `#1A1A2E`
- **Site URL**: SpartanShopper.com
- **Sanity Studio URL**: https://spartanshopper.sanity.studio
- **Amazon Associates tag**: `sku18798384-20` — must be present on all Amazon affiliate URLs
