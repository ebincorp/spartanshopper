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
  && (!defined(expiryDate) || select(length(expiryDate) == 10 => expiryDate + "T23:59:59.999Z", expiryDate) > now())`
// Card surfaces (homepage picks, /deals shelves) need a real uploaded image.
// Bulk imports have saved 1x1 transparent placeholders as the image asset, and
// raw Amazon imageUrls reject hotlinks, so only a Sanity asset wider than 1px counts.
const DEAL_HAS_CARD_IMAGE = `image.asset->metadata.dimensions.width > 1`
export const dealsQuery = `
  *[_type == "deal" && ${DEAL_DATE_FILTER}] | order(_createdAt desc) {
    _id, title, slug, "affiliateSlug": affiliateSlug.current, store, salePrice, originalPrice,
    description, image, imageUrl, affiliateUrl, category, asin, rating, reviewCount, expiryDate, active, priceVerifiedAt, clipCoupon,
    "hasCardImage": ${DEAL_HAS_CARD_IMAGE} == true
  }
`

export const featuredDealsQuery = `
  *[_type == "deal" && ${DEAL_DATE_FILTER} && defined(slug.current) && salePrice > 0 && ${DEAL_HAS_CARD_IMAGE}] | order(_createdAt desc)[0...3] {
    _id, title, slug, "affiliateSlug": affiliateSlug.current, store, salePrice, originalPrice,
    image, imageUrl, affiliateUrl, category, asin, rating, reviewCount, expiryDate, active, priceVerifiedAt, clipCoupon,
    "hasCardImage": ${DEAL_HAS_CARD_IMAGE} == true
  }
`

export const dealsByCategoryQuery = `
  *[_type == "deal" && ${DEAL_DATE_FILTER} && category == $category] | order(_createdAt desc) {
    _id, title, slug, "affiliateSlug": affiliateSlug.current, store, salePrice, originalPrice,
    description, image, imageUrl, affiliateUrl, category, asin, rating, reviewCount, expiryDate, active, priceVerifiedAt, clipCoupon,
    "hasCardImage": ${DEAL_HAS_CARD_IMAGE} == true
  }
`

export const relatedDealsQuery = `
  *[_type == "deal" && ${DEAL_DATE_FILTER} && category == $category && _id != $id && ${DEAL_HAS_CARD_IMAGE}]
  | order(_createdAt desc)[0...3] {
    _id, title, slug, "affiliateSlug": affiliateSlug.current, store, salePrice, originalPrice,
    image, imageUrl, affiliateUrl, category, expiryDate, active, priceVerifiedAt, clipCoupon
  }
`

export const dealBySlugQuery = `
  *[_type == "deal" && slug.current == $slug][0] {
    _id, title, slug, "affiliateSlug": affiliateSlug.current, store, salePrice, originalPrice,
    description, image, imageUrl, affiliateUrl, category, asin, rating, reviewCount, expiryDate, active, priceVerifiedAt, clipCoupon,
    // Filter refs before dereferencing: unpublished/future posts drop out, picked order is kept.
    "relatedGuides": relatedGuides[defined(@->slug.current) && @->publishedAt <= now()]->{ _id, title, slug }
  }
`

// ── COUPONS ─────────────────────────────────────────────────────────────────
const COUPON_DATE_FILTER = `
  active == true
  && (!defined(startDate) || startDate <= now())
  && (!defined(expiryDate) || expiryDate > now())
`

export const couponsQuery = `
  *[_type == "coupon" && ${COUPON_DATE_FILTER}] | order(_createdAt desc) {
    _id, title, slug, "affiliateSlug": affiliateSlug.current, store, code, discount, description,
    image, affiliateUrl, startDate, expiryDate, verified, active, category, tags
  }
`

export const featuredCouponsQuery = `
  *[_type == "coupon" && ${COUPON_DATE_FILTER}] | order(_createdAt desc)[0...3] {
    _id, title, slug, "affiliateSlug": affiliateSlug.current, store, code, discount, description,
    image, affiliateUrl, startDate, expiryDate, verified, active, category, tags
  }
`

export const couponBySlugQuery = `
  *[_type == "coupon" && slug.current == $slug && ${COUPON_DATE_FILTER}][0] {
    _id, title, slug, store, code, discount, description, whyWeLikeThis, seo,
    image, affiliateUrl, "affiliateSlug": affiliateSlug.current, startDate, expiryDate, verified, active, category, tags
  }
`

export const relatedCouponsQuery = `
  *[_type == "coupon" && ${COUPON_DATE_FILTER} && category == $category && _id != $currentId] | order(_createdAt desc) [0...3] {
    _id, title, slug, "affiliateSlug": affiliateSlug.current, store, code, discount, description,
    image, affiliateUrl, startDate, expiryDate, verified, active, category
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
export const couponCountQuery = `count(*[_type == "coupon" && active == true])`
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
  *[_type == "coupon" && active == true && defined(slug.current) && (!defined(expiryDate) || expiryDate > now())] {
    "slug": slug.current, _updatedAt
  }
`

export const sweepstakeSlugsQuery = `
  *[_type == "sweepstake" && active == true && defined(slug.current)] {
    "slug": slug.current, _updatedAt
  }
`
