export interface SanityImage {
  _type: 'image'
  asset: { _ref: string; _type: 'reference' }
  alt?: string
}

export interface Deal {
  _id: string
  title: string
  slug: { current: string }
  store: string
  salePrice: number
  originalPrice?: number
  description?: string
  image?: SanityImage
  affiliateUrl: string
  category?: string
  expiryDate?: string
  active: boolean
}

export interface Coupon {
  _id: string
  title: string
  slug: { current: string }
  store: string
  code: string
  discount?: string
  description?: string
  image?: SanityImage
  affiliateUrl: string
  expiryDate?: string
  verified?: boolean
  active: boolean
}

export interface Post {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  author?: string
  category?: string
  excerpt?: string
  coverImage?: SanityImage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any[]
}

export interface Sweepstake {
  _id: string
  title: string
  slug: { current: string }
  sponsor: string
  prize: string
  entryUrl: string
  entryDeadline: string
  entryFrequency?: string
  description?: string
  image?: SanityImage
  active: boolean
}
