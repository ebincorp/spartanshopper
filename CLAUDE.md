# SpartanShopper — Claude Code Instructions

This file is read automatically by Claude Code at the start of every session. Follow all rules here without being reminded.

---

## Project Overview

- **Site**: SpartanShopper.com — an all-encompassing deals, coupons, and affiliate site
- **Stack**: Next.js 16 / Turbopack + Sanity v4 + Tailwind CSS + TypeScript (strict) + Vercel
- **Sanity project**: `eohdr7jw`
- **Sanity Studio URL**: https://spartanshopper.sanity.studio
- **Site URL**: SpartanShopper.com
- **Amazon tag**: `sku18798384-20` — append as `?tag=sku18798384-20` to ALL Amazon affiliate URLs, always
- **Amazon Store ID**: `spartan03-20` — this is the Creator Connections enrolled store ID only. It is NOT used in affiliate URLs. Never use `spartan03-20` as a tag in any URL.
  - **Exception — genuine Creator Connections (Affiliate+) campaign links**: this rule exists to catch someone hand-appending `spartan03-20` onto an arbitrary Amazon product URL, which doesn't attribute correctly. It does NOT apply to links Amazon itself generates via "Get associate link" on an *accepted* Creator Connections campaign page. Those always take the form `https://www.amazon.com/dp/{ASIN}?ref=t_ac_view_request_product_image&campaignId=amzn1.campaign.{ID}&linkCode=tr1&tag=spartan03-20&linkId=amzn1.campaign.{ID}_{timestamp}`. There, `tag=spartan03-20` is required and correct — it only attributes because it's paired with the matching `campaignId` and `linkId` Amazon issued for that specific campaign. Use these exactly as issued: do not strip, rewrite, or shorten the tag, campaignId, or linkId — changing any one of the three breaks attribution back to the campaign. This exception is narrow: it applies only when a link actually contains both `campaignId=amzn1.campaign.…` and a matching `linkId=amzn1.campaign.…_…` — not to any other use of the `spartan03-20` tag.
- **Primary red**: `#E63946` | **Dark navy**: `#1A1A2E`

---

## Coupon Mission

SpartanShopper is building an all-encompassing deals destination. The coupons page covers every category — automotive, pet supplies, beauty, home improvement, sports, tech, anything. Never filter out a coupon based on category. Any legitimate product with strong reviews, a real discount, and sufficient runway belongs on the site.

---

## Amazon Commission Tiers — Prioritize Higher Commission Categories

When evaluating or adding coupons, note the commission tier. Higher commission = higher priority. Table confirmed by James 2026-08-08 from the current Amazon Associates commission schedule — supersedes any earlier version.

| Priority | Category | Commission |
|---|---|---|
| 🔥 Highest | Amazon Games | 20% |
| 🔥 Highest | Luxury Stores Beauty, Premium Beauty | 10% |
| ✅ High | Amazon Essentials: Fashion & Accessories | 7% |
| ✅ High | CDs & Vinyl, Digital Music, Handmade, Video On Demand (Rent/Buy) | 5% |
| ✅ High | Amazon Basics: Home & Tech | 5% |
| ✅ High | Automotive, Books & Textbooks, Kitchen & Dining | 4.5% |
| 🔹 Medium | Amazon Fashion Private Brands, Blink Devices, Clothing & Accessories, Echo Devices, Echo Look, Fire TV Devices, Fire TV Edition Smart TVs, Fire Tablets, Jewelry, Kindle E-readers, Luggage, Luxury Stores Fashion, Ring Accessories, Ring Devices, Shoes/Handbags/Wallets/Sunglasses, Watches | 4% |
| 🔹 Medium | Fine Art | 4% |
| 🔸 Standard | Amazon Coins, Baby & Nursery, Beauty & Grooming, Business & Industrial Supplies, Furniture, Headphones, Home, Home Improvement, Musical Instruments, Outdoor Recreation, Patio/Lawn & Garden, Pet Food & Supplies, Power & Hand Tools, Sports & Fitness, Toys & Games | 3% |

Categories not covered by the table above (e.g. Grocery, Health & Personal Care, Electronics, Video Games, Computers) have unconfirmed commission rates — treat as lower priority than everything listed until confirmed, and don't assume a specific percentage for them.

A 50% off deal in Amazon Games (20%) or Luxury Beauty (10%) is worth far more than a 50% off deal in an unconfirmed-rate category. When two deals are otherwise equal, always pick the higher commission category. Lower-tier deals are still worth adding if the discount is exceptional (50%+) and the product has strong reviews.

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

**Luxury category exemption:** Amazon Luxury Stores listings (boutique/designer ASINs) structurally do not accumulate visible review counts the way standard marketplace listings do — confirmed 2026-07-31 across all 8 then-active `category: 'luxury'` deals (Giuseppe Zanotti, Sergio Hudson, Oscar de la Renta, Clé de Peau, Perfect Moment) returning zero rating/review data via both the site and the Creators API. The review-count and star-rating thresholds above do **not** apply to `category: 'luxury'`. For luxury deals, use brand reputation and official-boutique ASIN sourcing as the trust signal instead. All other criteria (discount depth, expiry runway, brand legitimacy, live price/availability verification) still apply normally.

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
| `verify-amazon-deals.ts` | Verify deal/coupon prices against the Creators API (dry-run default, `--execute` to write) |
| `fetch-cj-coupons.ts` | Fetch active coupon promotions from CJ affiliate network |

> `scan-coupons.ts` and the `lib/coupon-scanner` Associates-dashboard scraper were **removed 2026-07-26**. They had never worked in production: `@sparticuz/chromium` was missing from `serverExternalPackages`, so the Chromium binary was absent from the deployed bundle and every run failed before launching a browser. The scraper also targeted an Associates dashboard page that has since changed and threw unconditionally on any 2FA challenge. If coupon discovery is needed again, build it against Amazon's current tooling rather than restoring that scraper.

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

**Valid `category` values:** `health` | `tech` | `home` | `food` | `beauty` | `fitness` | `pets` | `travel` | `fashion` | `amazon` | `korean-skincare` | `automotive` | `outdoor`

---

## Revalidation

- A revalidation route handles on-demand ISR for blog slug paths automatically
- Do not remove or modify the revalidation handler without understanding the full impact
- `useCdn: false` is intentional — bypasses Sanity's CDN cache so publishes are instant. **Do not revert this.**

---

## Publishing & Unpublishing (Sanity perspective)

- The public read clients (`lib/sanity.client.ts`, `lib/redirects.ts`) use **`perspective: 'published'`** — drafts are **never** served publicly. Do not remove it. Without it the client reads `raw` and exposes unpublished drafts on the live site (this caused a ~7-week draft leak in Jul 2026: two never-published DoorDash draft posts were live and in the sitemap).
- **To unpublish** a post/deal/coupon, use the normal Sanity workflow — Studio "Unpublish", or delete the published doc while keeping a draft. With `published` perspective this hides it from the site immediately (reads are live, `useCdn: false`).
- The `archivedPost` **retype workaround is no longer required** — it only existed because the client previously read `raw` (so moving a post to a draft didn't hide it). A few docs were archived that way in Jul 2026 (2 stale "deals this week" posts + 2 DoorDash drafts); they're fully reversible via `scripts/unpublish-stale-deal-posts.ts --restore` and `scripts/archive-doordash-drafts.ts --restore`, and can be migrated to the normal draft workflow whenever convenient.

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
