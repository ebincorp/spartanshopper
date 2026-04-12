export const getAllPostsQuery = `
  *[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    publishedAt,
    author,
    category,
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
    excerpt,
    coverImage,
    body
  }
`

export const getAllPostSlugsQuery = `
  *[_type == "post" && defined(slug.current)] {
    "slug": slug.current
  }
`
