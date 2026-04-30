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
export const dealsQuery = `
  *[_type == "deal" && active == true] | order(_createdAt desc) {
    _id, title, slug, "affiliateSlug": affiliateSlug.current, store, salePrice, originalPrice,
    description, image, affiliateUrl, category, expiryDate, active
  }
`

export const featuredDealsQuery = `
  *[_type == "deal" && active == true] | order(_createdAt desc)[0...3] {
    _id, title, slug, "affiliateSlug": affiliateSlug.current, store, salePrice, originalPrice,
    image, affiliateUrl, category, expiryDate, active
  }
`

export const dealsByCategoryQuery = `
  *[_type == "deal" && active == true && category == $category] | order(_createdAt desc) {
    _id, title, slug, "affiliateSlug": affiliateSlug.current, store, salePrice, originalPrice,
    description, image, affiliateUrl, category, expiryDate, active
  }
`

export const dealBySlugQuery = `
  *[_type == "deal" && slug.current == $slug][0] {
    _id, title, slug, store, salePrice, originalPrice,
    description, image, affiliateUrl, category, expiryDate, active
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
    _id, title, slug, store, code, discount, description, whyWeLikeThis,
    image, affiliateUrl, affiliateSlug, startDate, expiryDate, verified, active, category, tags
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
  array::unique(*[_type == "deal" && active == true && defined(category)].category)
`

// ── COUNTS ───────────────────────────────────────────────────────────────────
export const dealCountQuery = `count(*[_type == "deal" && active == true])`
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
  *[_type == "deal" && active == true && defined(slug.current)] {
    "slug": slug.current, _updatedAt
  }
`

export const couponSlugsQuery = `
  *[_type == "coupon" && active == true && defined(slug.current)] {
    "slug": slug.current, _updatedAt
  }
`

// Used to distinguish "expired/inactive" from "never existed" on the detail page
export const couponExistsBySlugQuery = `
  defined(*[_type == "coupon" && slug.current == $slug][0]._id)
`

export const sweepstakeSlugsQuery = `
  *[_type == "sweepstake" && active == true && defined(slug.current)] {
    "slug": slug.current, _updatedAt
  }
`
