# Technical SEO audit and branch changes

Audit date: November 22, 2026 (Pacific time). Branch: `codex/technical-seo-audit`. Base: `afdde55` on GitHub `main`.

## Verified findings

| Check | Live baseline | Local production build |
| --- | ---: | ---: |
| Sitemap URLs | 322 | 321 |
| Public URL variants checked | 359 | 358 |
| Blank title tags | 0 | 0 |
| Blank meta descriptions | 0 | 0 |
| Internal destinations returning 404 or 410 | 0 | 0 |
| Checked in-page anchors without a target | 0 | 0 |
| Redirect linked from the blog and listed in the sitemap | 1 | 0 |
| Indexable canonical pages with no JSON-LD | 5 | 0 |
| Blog pages without Article, BlogPosting, or NewsArticle | 16 | 0 |
| Active deal pages with breadcrumb-only JSON-LD | 104 | 0 |
| Pages referencing the broken publisher logo in JSON-LD | 39 | 0 |
| Blog, coupon, and sweepstakes details with no visible image | 3 | 0 |
| Distinct visible and social image URLs checked | 1,030 | 1,029 |
| Checked image URLs over 300 KiB | 485 | 0 |
| Largest checked image response | 4,356,713 bytes | 293,848 bytes |

The five pages missing JSON-LD were About, Contact, Affiliate Disclosure, Privacy Policy, and Terms of Service. Eleven filtered deals URLs canonicalize to the main deals directory. That directory carries the list markup. Directly checked 419 linked internal affiliate slugs in published Sanity. All had a valid HTTP or HTTPS destination. Merchant landing pages were outside this check.

The three missing images were on `/blog/black-friday-deals-from-our-reviews`, `/coupons/10-off-velocity-outdoor`, and `/sweepstakes/everydaywinner-500-gas-card`. They now display existing SpartanShopper artwork when a CMS cover is absent. That artwork is decorative and stays out of product and prize markup.

The indoor Halloween decorations cover went from 4,356,713 to 154,762 bytes at the default URL. The responsive source set allows narrower renditions when the browser needs them. Response sizes are individual URL payloads. They do not measure total page transfer or Core Web Vitals.

Live `/logo.png` returned 404. Its replacement, `/android-chrome-512x512.png`, returned 200. The retired `/blog/sea-moss-gummies` URL keeps its permanent redirect to `/blog/sea-moss-supplement` for existing external links.

## Complete change list

| File | Change |
| --- | --- |
| `app/about/page.tsx` | Added `AboutPage` JSON-LD. |
| `app/affiliate-disclosure/page.tsx` | Added `WebPage` JSON-LD. |
| `app/blog/[slug]/page.tsx` | Excluded redirected slugs from static generation. Added a description fallback, consolidated article markup, resolved legacy links directly, and served responsive hero and body images. Reused the branded fallback for posts with no cover. |
| `app/blog/page.tsx` | Excluded redirected article slugs from the directory, search within it, and blog-list schema. Added responsive cover renditions and the existing branded fallback. |
| `app/contact/page.tsx` | Added `ContactPage` JSON-LD. |
| `app/coupons/[slug]/page.tsx` | Added a branded image for active coupons with no asset, checked for a usable asset before generating an image URL, and escaped Offer JSON-LD. |
| `app/custom-organization-labels/page.tsx` | Shared the existing builder screenshot reference and resized its visible and sharing renditions. |
| `app/deals/[slug]/page.tsx` | Added `WebPage` JSON-LD when an active deal cannot support `Product` with a verified offer. Preserved the existing price requirements. |
| `app/page.tsx` | Added stable identifiers for the site and publisher and linked them. |
| `app/privacy-policy/page.tsx` | Added `WebPage` JSON-LD. |
| `app/search/page.tsx` | Kept retired article slugs out of site search results. |
| `app/sitemap.ts` | Omitted registered redirects from the article sitemap. |
| `app/sweepstakes/[slug]/page.tsx` | Added a branded image for an open sweepstakes with no asset, checked the optional image reference, and escaped Offer JSON-LD. |
| `app/terms-of-service/page.tsx` | Added `WebPage` JSON-LD. |
| `components/EditorialImage.tsx` | Added a responsive native image component that requests variants directly from Sanity. |
| `components/InlineCouponCard.tsx` | Requested a 160-pixel CDN rendition for the 64-pixel image and made it lazy-load. |
| `components/PageJsonLd.tsx` | Added a small shared component for informational page markup, using the page’s meta description. |
| `lib/blog-redirects.json` | Centralized the existing blog redirect destinations. |
| `lib/blogQueries.ts` | Shared legacy-slug exclusions and resolved known old links in article content. |
| `lib/editorial-image.ts` | Added the existing fallback constant, crop-aware responsive CDN URLs, and JPEG social-sharing URLs. |
| `lib/generateJsonLd.ts` | Added BlogPosting when an authored article type is absent, preserved authored nodes, and replaced the missing publisher logo. Generated product lists use names and links without inferred ratings, stock, or prices. Malformed overrides fall back to valid article markup. |
| `lib/sanity.client.ts` | Delivered Sanity builder images as WebP at quality 78. |
| `lib/seo.ts` | Ignored whitespace-only title overrides and requested a JPEG for Sanity social images. |
| `next.config.mjs` | Loaded the shared blog redirects while preserving the legacy magnesium `/post/` route. |
| `tests/technical-seo.test.ts` | Added checks for incomplete metadata, JSON-LD fallback, valid publisher logo, redirect preservation, image sizing, and factual deal markup. |

## Verification scope

- OpenSEO independently crawled 356 URLs. It reported no missing titles, missing descriptions, or broken internal page links. Its separate length and editorial flags fall outside the missing-field checks.
- The direct crawls started from the sitemap and public entry points and followed public internal HTML links. They counted returned JSON-LD types and checked HTTP image responses. The image response size threshold is 300 KiB.
- The Next.js production build succeeded, TypeScript passed, and all 23 targeted tests passed.
- Verification used the branch's local production build. Production Sanity content was read only.
