// ── DEALS ──────────────────────────────────────────────────────────────────
export const dealsQuery = `
  *[_type == "deal" && active == true] | order(_createdAt desc) {
    _id, title, slug, store, salePrice, originalPrice,
    description, image, affiliateUrl, category, expiryDate, active
  }
`

export const featuredDealsQuery = `
  *[_type == "deal" && active == true] | order(_createdAt desc)[0...3] {
    _id, title, slug, store, salePrice, originalPrice,
    image, affiliateUrl, category, expiryDate, active
  }
`

export const dealsByCategoryQuery = `
  *[_type == "deal" && active == true && category == $category] | order(_createdAt desc) {
    _id, title, slug, store, salePrice, originalPrice,
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
export const couponsQuery = `
  *[_type == "coupon" && active == true] | order(_createdAt desc) {
    _id, title, slug, store, code, discount,
    affiliateUrl, expiryDate, verified, active
  }
`

export const featuredCouponsQuery = `
  *[_type == "coupon" && active == true] | order(_createdAt desc)[0...3] {
    _id, title, slug, store, code, discount,
    affiliateUrl, expiryDate, verified, active
  }
`

export const couponBySlugQuery = `
  *[_type == "coupon" && slug.current == $slug][0] {
    _id, title, slug, store, code, discount,
    affiliateUrl, expiryDate, verified, active
  }
`

// ── SWEEPSTAKES ──────────────────────────────────────────────────────────────
export const sweepstakesQuery = `
  *[_type == "sweepstake" && active == true] | order(entryDeadline asc) {
    _id, title, slug, sponsor, prize, entryUrl,
    entryDeadline, entryFrequency, description, image, active
  }
`

export const featuredSweepstakesQuery = `
  *[_type == "sweepstake" && active == true] | order(entryDeadline asc)[0...3] {
    _id, title, slug, sponsor, prize, entryUrl,
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

export const sweepstakeSlugsQuery = `
  *[_type == "sweepstake" && active == true && defined(slug.current)] {
    "slug": slug.current, _updatedAt
  }
`
