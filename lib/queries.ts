import { offerHasNotExpiredGroq } from './offerExpiry'

// ── DEALS ──────────────────────────────────────────────────────────────────
// ── COUPON CATEGORIES (shared list) ─────────────────────────────────────────
export const COUPON_CATEGORIES = [
  { title: 'Health & Wellness', value: 'health' },
  { title: 'Tech & Gadgets',    value: 'tech' },
  { title: 'Home & Kitchen',    value: 'home' },
  { title: 'Food & Grocery',    value: 'food' },
  { title: 'Beauty',            value: 'beauty' },
  { title: 'Fitness',           value: 'fitness' },
  { title: 'Pets',              value: 'pets' },
  { title: 'Travel',            value: 'travel' },
  { title: 'Fashion',           value: 'fashion' },
  { title: 'Amazon Deals',      value: 'amazon' },
] as const

export type CouponCategoryValue = typeof COUPON_CATEGORIES[number]['value']

// ── DEALS ──────────────────────────────────────────────────────────────────
// Do not depend on the daily cleanup job to hide offers that have ended.
// Date-only expiries remain valid through the end of that UTC calendar day.
const DEAL_DATE_FILTER = `active == true
  && (!defined(startDate) || startDate <= now())
  && ${offerHasNotExpiredGroq}`
// Bulk imports can contain 1x1 transparent placeholders. The presentation
// checks both the dimensions and the illustration metadata before showing a photo.
const DEAL_HAS_CARD_IMAGE = `image.asset->metadata.dimensions.width > 1`
const DEAL_IMAGE_FIELDS = `image { ..., "originalFilename": asset->originalFilename }, "hasCardImage": ${DEAL_HAS_CARD_IMAGE} == true`
const DEAL_CLIP_COUPON_FIELDS = `clipCouponObservation { label, checkedAt, terms }`
export const dealsQuery = `
  *[_type == "deal" && ${DEAL_DATE_FILTER}] | order(_createdAt desc) {
    _id, title, slug, "affiliateSlug": affiliateSlug.current, store, salePrice, originalPrice,
    description, imageUrl, affiliateUrl, category, asin, rating, reviewCount, expiryDate, active, priceVerifiedAt, priceVerificationSource, priceApiObservation, clipCoupon,
    ${DEAL_IMAGE_FIELDS}, ${DEAL_CLIP_COUPON_FIELDS}
  }
`

export const featuredDealsQuery = `
  *[_type == "deal" && ${DEAL_DATE_FILTER} && defined(slug.current)] | order(_createdAt desc)[0...3] {
    _id, title, slug, "affiliateSlug": affiliateSlug.current, store, salePrice, originalPrice,
    description, imageUrl, affiliateUrl, category, asin, rating, reviewCount, expiryDate, active, priceVerifiedAt, priceVerificationSource, priceApiObservation, clipCoupon,
    ${DEAL_IMAGE_FIELDS}, ${DEAL_CLIP_COUPON_FIELDS}
  }
`

export const dealsByCategoryQuery = `
  *[_type == "deal" && ${DEAL_DATE_FILTER} && category == $category] | order(_createdAt desc) {
    _id, title, slug, "affiliateSlug": affiliateSlug.current, store, salePrice, originalPrice,
    description, imageUrl, affiliateUrl, category, asin, rating, reviewCount, expiryDate, active, priceVerifiedAt, priceVerificationSource, priceApiObservation, clipCoupon,
    ${DEAL_IMAGE_FIELDS}, ${DEAL_CLIP_COUPON_FIELDS}
  }
`

export const relatedDealsQuery = `
  *[_type == "deal" && ${DEAL_DATE_FILTER} && category == $category && _id != $id && defined(slug.current)]
  | order(_createdAt desc)[0...3] {
    _id, title, slug, "affiliateSlug": affiliateSlug.current, store, salePrice, originalPrice,
    description, imageUrl, affiliateUrl, category, asin, expiryDate, active, priceVerifiedAt, priceVerificationSource, priceApiObservation, clipCoupon,
    ${DEAL_IMAGE_FIELDS}, ${DEAL_CLIP_COUPON_FIELDS}
  }
`

export const dealBySlugQuery = `
  *[_type == "deal" && slug.current == $slug][0] {
    brand,
    _id, title, slug, "affiliateSlug": affiliateSlug.current, store, salePrice, originalPrice,
    description, imageUrl, affiliateUrl, category, asin, rating, reviewCount, expiryDate, active, priceVerifiedAt, priceVerificationSource, priceApiObservation, clipCoupon,
    ${DEAL_IMAGE_FIELDS}, ${DEAL_CLIP_COUPON_FIELDS},
    // Filter refs before dereferencing: unpublished/future posts drop out, picked order is kept.
    "relatedGuides": relatedGuides[defined(@->slug.current) && @->publishedAt <= now()]->{ _id, title, slug }
  }
`

// ── COUPONS ─────────────────────────────────────────────────────────────────
const COUPON_DATE_FILTER = `
  active == true
  && (!defined(startDate) || startDate <= now())
  && ${offerHasNotExpiredGroq}
`

export const couponsQuery = `
  *[_type == "coupon" && ${COUPON_DATE_FILTER}] | order(_createdAt desc) {
    _id, title, slug, "affiliateSlug": affiliateSlug.current, store, code, discount, description,
    image, affiliateUrl, startDate, expiryDate, expiryConfirmedFor, verified, verification{status, checkedOn, advertiserMatchMissing}, active, category, tags
  }
`

export const featuredCouponsQuery = `
  *[_type == "coupon" && ${COUPON_DATE_FILTER}] | order(_createdAt desc)[0...3] {
    _id, title, slug, "affiliateSlug": affiliateSlug.current, store, code, discount, description,
    image, affiliateUrl, startDate, expiryDate, expiryConfirmedFor, verified, verification{status, checkedOn, advertiserMatchMissing}, active, category, tags
  }
`

export const couponBySlugQuery = `
  // Ended coupons are still served (as an "ended", noindexed page); only
  // coupons whose start date hasn't arrived stay hidden.
  *[_type == "coupon" && slug.current == $slug && (!defined(startDate) || startDate <= now())][0] {
    _id, title, slug, store, code, discount, description, whyWeLikeThis, seo,
    image, affiliateUrl, "affiliateSlug": affiliateSlug.current, startDate, expiryDate, expiryConfirmedFor, verified, verification{status, checkedOn, advertiserMatchMissing}, active, category, tags
  }
`

export const relatedCouponsQuery = `
  *[_type == "coupon" && ${COUPON_DATE_FILTER} && category == $category && _id != $currentId] | order(_createdAt desc) [0...3] {
    _id, title, slug, "affiliateSlug": affiliateSlug.current, store, code, discount, description,
    image, affiliateUrl, startDate, expiryDate, expiryConfirmedFor, verified, verification{status, checkedOn, advertiserMatchMissing}, active, category
  }
`

// ── SWEEPSTAKES ──────────────────────────────────────────────────────────────
export const sweepstakesQuery = `
  *[_type == "sweepstake" && active == true] | order(entryDeadline asc) {
    _id, title, slug, "affiliateSlug": affiliateSlug.current, sponsor, prize, entryUrl,
    entryDeadline, entryFrequency, description, image, active
  }
`

export const featuredSweepstakesQuery = `
  *[_type == "sweepstake" && active == true] | order(entryDeadline asc)[0...3] {
    _id, title, slug, "affiliateSlug": affiliateSlug.current, sponsor, prize, entryUrl,
    entryDeadline, entryFrequency, active
  }
`

export const sweepstakeBySlugQuery = `
  *[_type == "sweepstake" && slug.current == $slug][0] {
    _id, title, slug, sponsor, prize, entryUrl,
    entryDeadline, entryFrequency, description, image, active
  }
`

// ── DEAL CATEGORIES (distinct) ───────────────────────────────────────────────
export const dealCategoriesQuery = `
  array::unique(*[_type == "deal" && ${DEAL_DATE_FILTER} && defined(category)].category)
`

// ── COUNTS ───────────────────────────────────────────────────────────────────
export const dealCountQuery = `count(*[_type == "deal" && ${DEAL_DATE_FILTER}])`
export const couponCountQuery = `count(*[_type == "coupon" && ${COUPON_DATE_FILTER}])`
export const sweepstakeCountQuery = `count(*[_type == "sweepstake" && active == true])`

// ── LINK CLOAKER ─────────────────────────────────────────────────────────────
// Returns affiliateUrl (deals/coupons) or entryUrl (sweepstakes) for a given slug
export const affiliateUrlBySlugQuery = `
  *[slug.current == $slug && active == true][0] {
    _type,
    "url": select(
      _type == "sweepstake" => entryUrl,
      affiliateUrl
    )
  }
`

// ── SITEMAP SLUGS ────────────────────────────────────────────────────────────
export const dealSlugsQuery = `
  *[_type == "deal" && ${DEAL_DATE_FILTER} && defined(slug.current)] {
    "slug": slug.current, _updatedAt
  }
`

export const couponSlugsQuery = `
  *[_type == "coupon" && ${COUPON_DATE_FILTER} && defined(slug.current)] {
    "slug": slug.current, _updatedAt
  }
`

export const sweepstakeSlugsQuery = `
  *[_type == "sweepstake" && active == true && defined(slug.current)
    && (!defined(entryDeadline) || select(length(entryDeadline) == 10 => entryDeadline + "T23:59:59.999Z", entryDeadline) > now())] {
    "slug": slug.current, _updatedAt
  }
`
