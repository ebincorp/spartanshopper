export const getAllPostsQuery = `
  *[_type == "post"] | order(publishedAt desc) {
    _id,
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
    title,
    slug,
    publishedAt,
    author,
    category,
    relatedCategory,
    jsonLd,
    excerpt,
    coverImage,
    body[] {
      ...,
      _type == "couponEmbed" => {
        "coupon": coupon-> {
          _id, title, store, code, discount, description, affiliateUrl, expiryDate, startDate, active,
          "imageUrl": image.asset->url
        }
      }
    }
  }
`

export const getAllPostSlugsQuery = `
  *[_type == "post" && defined(slug.current)] {
    "slug": slug.current
  }
`
