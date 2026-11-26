import blogRedirects from './blog-redirects.json'
import { SITE_URL } from './seo'

export const redirectedPostSlugs = Object.keys(blogRedirects)

export function canonicalBlogLink(href: string | undefined): string | undefined {
  if (!href) return href
  const local = href.replace(/^https?:\/\/(?:www\.)?spartanshopper\.com(?=\/)/i, '')
  const match = /^\/blog\/([^/?#]+)\/?([?#].*)?$/.exec(local)
  if (!match) return href
  const destination = (blogRedirects as Record<string, string>)[match[1]]
  if (!Object.hasOwn(blogRedirects, match[1]) || !destination) return href
  return `${local === href ? '' : SITE_URL}${destination}${match[2] ?? ''}`
}

export const getAllPostsQuery = `
  *[_type == "post" && defined(slug.current) && publishedAt <= now()
    && !(slug.current in $redirectedSlugs)] | order(publishedAt desc) {
    _id,
    _updatedAt,
    title,
    slug,
    publishedAt,
    author,
    category,
    relatedCategory,
    excerpt,
    coverImage
  }
`

export const getPostBySlugQuery = `
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    _updatedAt,
    title,
    slug,
    publishedAt,
    author,
    category,
    relatedCategory,
    seo,
    jsonLd,
    excerpt,
    coverImage,
    buyingSummary {
      verdict,
      details,
      evidence,
      picks[] { _key, name, fit, check, "affiliateSlug": affiliateLink->slug.current }
    },
    products[] {
      name, brand, price, affiliateUrl, image,
      ratingValue, reviewCount, description
    },
    body[] {
      ...,
      _type == "couponEmbed" => {
        "coupon": coupon-> {
          _id, title, store, code, discount, description, affiliateUrl, "affiliateSlug": affiliateSlug.current, expiryDate, expiryConfirmedFor, startDate, active,
          verification{status, checkedOn, advertiserMatchMissing},
          "imageUrl": image.asset->url
        }
      }
    }
  }
`

export const getAllPostSlugsQuery = `
  *[_type == "post" && defined(slug.current) && !(slug.current in $redirectedSlugs)] {
    "slug": slug.current
  }
`
