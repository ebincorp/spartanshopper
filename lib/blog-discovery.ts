export interface BlogSearchItem {
  id: string
  title: string
  slug: string
  excerpt?: string
  category?: string
  publishedAt: string
  updatedAt?: string
}
export const LABEL_GUIDE_SLUGS = [
  'magnetic-toolbox-labels', 'how-to-label-toolbox-drawers', 'best-magnetic-labels-tool-chest',
  'mechanic-shop-organization', 'husky-toolbox-labels', 'craftsman-toolbox-labels',
  'harbor-freight-toolbox-labels', 'modular-tool-storage-system-labels',
]
const normalize = (text: string) => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
export function findBlogPosts(posts: BlogSearchItem[], query: string, category = 'All', sort = 'published'): BlogSearchItem[] {
  const words = normalize(query).split(' ').filter(Boolean)
  return posts.filter(post => (category === 'All' || post.category === category) && words.every(word =>
    normalize([post.title, post.excerpt, post.category,
      LABEL_GUIDE_SLUGS.includes(post.slug) ? 'VoltariTek magnetic labels toolbox workshop custom label builder organization' : '',
    ].join(' ')).includes(word),
  )).sort((a, b) => {
    const date = (p: BlogSearchItem) => sort === 'updated' ? p.updatedAt || p.publishedAt : p.publishedAt
    return date(b).localeCompare(date(a))
  })
}
