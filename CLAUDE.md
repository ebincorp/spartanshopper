# SpartanShopper — Claude Code Instructions

This file is read automatically by Claude Code at the start of every session. Follow all rules here without being reminded.

---

## Project Overview

- **Site**: SpartanShopper.com — an all-encompassing deals, coupons, and affiliate site
- **Stack**: Next.js 16 / Turbopack + Sanity v4 + Tailwind CSS + TypeScript (strict) + Vercel
- **Sanity project**: `eohdr7jw`
- **Sanity Studio URL**: https://spartanshopper.sanity.studio
- **Site URL**: SpartanShopper.com
- **Amazon Store ID**: `spartan03-20`
- **Amazon tag**: `sku18798384-20` — append as `?tag=sku18798384-20` to all Amazon affiliate URLs
- **Primary red**: `#E63946` | **Dark navy**: `#1A1A2E`

---

## Coupon Mission

SpartanShopper is building an all-encompassing deals destination. The coupons page covers every category — automotive, pet supplies, beauty, home improvement, sports, tech, anything. Never filter out a coupon based on category. Any legitimate product with strong reviews, a real discount, and sufficient runway belongs on the site.

---

## Amazon Commission Tiers — Prioritize Higher Commission Categories

When evaluating or adding coupons, note the commission tier. Higher commission = higher priority.

| Priority | Category | Commission |
|---|---|---|
| 🔥 Highest | Luxury Beauty | 10% |
| 🔥 Highest | Amazon Games | 20% |
| ✅ High | Furniture, Home, Home Improvement, Lawn & Garden, Pets, Pantry | 3% |
| ✅ High | Headphones, Beauty, Musical Instruments, Business & Industrial | 3% |
| ✅ High | Outdoors, Tools | 3% |
| ⚠️ Low | Grocery, Health & Personal Care, Sports, Baby | 1% |
| ⚠️ Low | Electronics, Toys, Video Games, Computers | 1% |

A 50% off deal in Luxury Beauty (10%) is worth far more than a 50% off deal in Electronics (1%). When two deals are otherwise equal, always pick the higher commission category. Low-commission deals are still worth adding if the discount is exceptional (50%+) and the product has strong reviews.

---

## Coupon Vetting Criteria

Before adding any coupon, verify all of the following:

| Criteria | Threshold |
|---|---|
| Review count | 50+ minimum, 200+ preferred |
| Star rating | 4.0★ minimum, 4.3★+ preferred |
| Sales velocity | "X+ bought in past month" visible |
| Discount depth | 15%+ preferred, 10% acceptable for strong brands |
| Expiry runway | 2+ weeks minimum |
| Brand legitimacy | Real storefront, real product photos |

**Auto-skip if any of these apply:**
- Under 25 reviews
- Expires within 7 days
- Brand new product with no sales history
- 5% or 10% discount on a low-commission category

---

## Coupon Field Rules — CRITICAL

### Description field

NEVER include the coupon code in the Description. The description teases the deal — the code is the reward for visiting the page.

❌ Wrong: `"Save 15% with code 3Z8M4NTG at checkout."`
✅ Right: `"Save 15% on the Libbipaw Windproof Elevated Dog Bed — UV-blocking, chew-proof, built for large dogs up to 150lbs. Visit the page for the code."`

### Why We Like This field

NEVER include the coupon code in this field either. ~100 words, editorial tone, sell the product not the discount.

❌ Wrong: `"Use code DRGDEWYGLOW for 10% off through June 30."`
✅ Right: `"Pick it up while the discount is active."` or `"Visit the page for the code."`

### All other fields

The coupon code lives only in the **Coupon Code** field. Nowhere else.

---

## Sanity Coupon Schema Fields (in order)

Title, Slug, Store, Coupon Code, Discount Label, Description, Image, Alt Text, Affiliate URL, Affiliate Link Slug, Start Date, Expiry Date, Verified/Working (toggle), Active (toggle), Category, Tags, Why We Like This (~100 words)

---

## Workflow for Adding Coupons

1. Run `npx tsx scripts/add-coupons.ts` to create Sanity draft records
2. Verify drafts in Sanity Studio
3. Publish records
4. Create `/go/[slug]` cloaked redirect slugs for each affiliate URL
5. If product images are in `public/`, run `npx tsx scripts/upload-coupon-images.ts` to upload to Sanity and patch records
6. Confirm `/coupons` page reflects new entries on live site

**Image filenames** must match the affiliate link slug exactly, e.g. `luffwell-dog-runner.jpg` for slug `luffwell-dog-runner`.

### Slug Mismatch Fallback

If a coupon slug doesn't match in Sanity, fall back to querying by title keyword and patching by `_id` directly. Always log which method was used.

### Start Dates

Respect start dates — do not override them unless explicitly instructed. A coupon with a future start date means the promotion isn't valid yet. The site hides coupons before their start date automatically.

---

## Affiliate Link Format

- Standard Amazon product: `https://www.amazon.com/dp/[ASIN]?tag=sku18798384-20`
- Promocode landing page: `https://www.amazon.com/promocode/[CODE]?tag=sku18798384-20`
- Always append `?tag=sku18798384-20` to any raw Amazon URL missing the tag
- Use `/go/[slug]` cloaked links on the site — never raw Amazon URLs in content

---

## Sanity Content Types

| Type | Purpose |
|---|---|
| `post` | Blog articles |
| `affiliateLink` | `/go/` redirect targets |
| `deal` | Product deals |
| `coupon` | Coupon cards |
| `sweepstake` | Giveaways |

---

## /go/ Redirect System

Affiliate links are cloaked via `/go/[slug]` routes.

- Slugs are managed in Sanity as `affiliateLink` documents
- Resolution happens in `lib/redirects.ts` using a GROQ `coalesce()` query
- **Resolution priority** (first non-null wins):
  1. `affiliateLink.destination` (dedicated Affiliate Link document)
  2. `sweepstake.entryUrl` (where `affiliateSlug.current == slug`)
  3. Any other content type's `affiliateUrl` (deals, coupons, posts)

When adding a new affiliate link: create a new `affiliateLink` document in Sanity with the slug and destination URL — the `/go/` route picks it up automatically, no code changes needed.

---

## Scripts

Located in `scripts/`. Key utilities:

| Script | Purpose |
|---|---|
| `add-coupons.ts` | Create coupon draft records in Sanity from a JSON input file |
| `upload-coupon-images.ts` | Upload images from `public/` to Sanity and patch coupon records |
| `scan-coupons.ts` | Scan for expired or upcoming coupons |
| `fetch-cj-coupons.ts` | Fetch active coupon promotions from CJ affiliate network |

**CJ coupon fetching — always use `--rest`:**
```bash
npx tsx scripts/fetch-cj-coupons.ts --rest
npx tsx scripts/add-coupons.ts scripts/cj-coupons.json
```
The script writes `scripts/cj-coupons.json` directly (UTF-8, no BOM). Never use `>` redirect — PowerShell writes UTF-16 with BOM which corrupts the file.
The GraphQL endpoint (`ads.api.cj.com/query`) is advertiser-side only (product catalog management) — it has no publisher link or promotion queries. The classic REST link-search API is the correct path for fetching publisher coupon links. Use `--probe` to test auth, `--debug` to inspect raw responses.

Run with: `npx tsx scripts/<script>.ts`

Requires `SANITY_API_TOKEN` in `.env.local`.

### promotions.json input format

`scripts/promotions.json` is the default input file for `add-coupons.ts`. Pass a different path as an argument to use a separate file.

**Required fields:**
```json
{
  "brand": "Brand Name",
  "code": "COUPONCODE",
  "discount": "20% off",
  "category": "beauty",
  "expiryDate": "2026-04-30",
  "affiliateUrl": "https://www.amazon.com/promocode/XXXXX?tag=sku18798384-20"
}
```

**Optional fields:** `startDate`, `description` (both ISO `YYYY-MM-DD`)

**Valid `category` values:** `health` | `tech` | `home` | `food` | `beauty` | `fitness` | `pets` | `travel` | `fashion` | `amazon` | `korean-skincare` | `automotive`

---

## Revalidation

- A revalidation route handles on-demand ISR for blog slug paths automatically
- Do not remove or modify the revalidation handler without understanding the full impact
- `useCdn: false` is intentional — bypasses Sanity's CDN cache so publishes are instant. **Do not revert this.**

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

## Environment

- PowerShell is the preferred shell
- Environment variables are in `.env.local` and Vercel dashboard
- Always load `.env.local` before running Sanity queries
