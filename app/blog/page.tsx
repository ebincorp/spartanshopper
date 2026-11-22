import type { Metadata } from 'next'
import Link from 'next/link'
import { client, urlFor } from '@/lib/sanity.client'
import { getAllPostsQuery, redirectedPostSlugs } from '@/lib/blogQueries'
import type { Post } from '@/lib/types'
import BlogDiscovery from '@/components/BlogDiscovery'
import LabelGuideFeature from '@/components/LabelGuideFeature'
import VoltariTekOffer from '@/components/VoltariTekOffer'
import { LABEL_GUIDE_SLUGS } from '@/lib/blog-discovery'
import { pageMetadata } from '@/lib/seo'
import EditorialImage from '@/components/EditorialImage'
import { EDITORIAL_PLACEHOLDER } from '@/lib/editorial-image'

export const revalidate = 3600

export const metadata: Metadata = pageMetadata({
  title: 'Buying Guides & Product Comparisons',
  description: 'Compare product differences, check sizes and plan practical projects. Find buying guides for your kitchen, home, hobbies, beauty routine and more.',
  path: '/blog',
})

const CATEGORY_COLORS: Record<string, string> = {
  Deals: '#E63946',
  Coupons: '#2A9D8F',
  Sweepstakes: '#E9C46A',
  'Saving Tips': '#457B9D',
  News: '#6D6875',
}

const GUIDE_TOPICS = [
  {
    name: 'Home security',
    links: [
      ['home-security-deals-and-buying-guides', 'Plan camera placement and power'],
      ['best-security-camera-setup-for-renters', 'Set up a camera in a rental'],
      ['outdoor-security-camera-no-outlet', 'Place a camera without an outlet'],
      ['wired-vs-battery-video-doorbells', 'Choose a wired or battery doorbell'],
    ],
  },
  {
    name: 'Tool storage',
    links: [
      ['modular-tool-storage-system-labels', 'Choose labels for stackable toolboxes'],
      ['how-to-label-toolbox-drawers', 'Map and label toolbox drawers'],
      ['best-magnetic-labels-tool-chest', 'Compare tool chest label formats'],
    ],
  },
  {
    name: 'Holiday setup and storage',
    links: [
      ['christmas-ornament-storage-guide', 'Measure for an ornament storage box'],
      ['christmas-tree-train-set-guide', 'Check train track fit and power'],
      ['christmas-table-decorations-small-table', 'Decorate a small dining table'],
    ],
  },
]

export default async function BlogPage() {
  const posts = await client
    .fetch<Post[]>(getAllPostsQuery, { redirectedSlugs: redirectedPostSlugs })
    .catch(() => [] as Post[])

  const searchItems = posts.map(post => ({ id: post._id, title: post.title, slug: post.slug.current, excerpt: post.excerpt, category: post.category, publishedAt: post.publishedAt, updatedAt: post._updatedAt }))
  const publishedSlugs = new Set(searchItems.map(post => post.slug))
  const topics = GUIDE_TOPICS.map(topic => ({
    ...topic,
    links: topic.links.filter(([slug]) => publishedSlugs.has(slug)),
  })).filter(topic => topic.links.length > 0)
  const labelCover = posts.find(post => post.slug.current === 'magnetic-toolbox-labels')?.coverImage

  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'SpartanShopper Buying Guides & Product Comparisons',
    description: 'Product comparisons, sizing checks and practical project guides to help plan a purchase.',
    url: 'https://www.spartanshopper.com/blog',
    publisher: {
      '@type': 'Organization',
      name: 'SpartanShopper',
      url: 'https://www.spartanshopper.com',
    },
    blogPost: posts.slice(0, 12).map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `https://www.spartanshopper.com/blog/${p.slug.current}`,
      datePublished: p.publishedAt,
      ...(p.excerpt && { description: p.excerpt }),
      author: p.author
        ? { '@type': 'Person', name: p.author }
        : { '@type': 'Organization', name: 'SpartanShopper' },
    })),
  }

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
    />
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ backgroundColor: '#1A1A2E' }} className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-white text-4xl font-extrabold mb-2">Buying Guides &amp; Product Comparisons</h1>
          <p className="max-w-2xl text-white/80 mb-3">Compare similar products, check measurements and plan a project before filling your cart.</p>
          <p className="text-white/60">
            {posts.length} guide{posts.length !== 1 ? 's' : ''} and article{posts.length !== 1 ? 's' : ''}. Search by product, topic or the job you need done.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {posts.length > 0 ? (
          <BlogDiscovery posts={searchItems} featured={
            <>
              {topics.length > 0 && (
                <nav aria-labelledby="guide-topics-heading" className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <h2 id="guide-topics-heading" className="mb-4 text-2xl font-bold text-slate-900">Browse guides by topic</h2>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {topics.map(topic => (
                      <div key={topic.name}>
                        <h3 className="mb-1 font-bold text-slate-900">{topic.name}</h3>
                        <ul className="space-y-1">
                          {topic.links.map(([slug, label]) => (
                            <li key={slug}>
                              <Link href={`/blog/${slug}`} className="inline-block py-1 text-rose-700 underline underline-offset-4">
                                {label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </nav>
              )}
              <LabelGuideFeature posts={searchItems} image={labelCover?.asset ? urlFor(labelCover).width(900).url() : undefined} />
            </>
          }>
            {posts.map((post) => (
              <article
                key={post._id}
                className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-200"
              >
                {/* Cover image */}
                <div className="relative w-full h-44 bg-gray-100 overflow-hidden">
                    <EditorialImage
                      src={post.coverImage?.asset ? urlFor(post.coverImage).width(600).url() : EDITORIAL_PLACEHOLDER}
                      alt={post.coverImage?.asset ? post.coverImage.alt ?? post.title : ''}
                      widths={[320, 480, 640, 960]}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className={`h-full w-full ${!post.coverImage?.asset || post.slug.current === 'holiday-deals-fragrance-coffee-car-gear' ? 'object-contain' : 'object-cover'}`}
                    />
                  {/* Category badge */}
                  {post.category && (
                    <span
                      className="absolute top-3 left-3 text-white text-xs font-bold px-2 py-1 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[post.category] ?? '#E63946' }}
                    >
                      {post.category}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-xs text-gray-500 mb-2">
                    {post.author && <span>{post.author} · </span>}
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <h2 className="text-gray-900 font-bold text-base leading-snug mb-2 flex-1">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  {LABEL_GUIDE_SLUGS.includes(post.slug.current) && <VoltariTekOffer />}
                  <Link
                    href={`/blog/${post.slug.current}`}
                    aria-label={`Read the guide: ${post.title}`}
                    className="inline-block text-center text-white font-bold py-2.5 rounded-xl text-sm hover:opacity-90 active:scale-95 transition"
                    style={{ backgroundColor: '#E63946' }}
                  >
                    Read the guide →
                  </Link>
                </div>
              </article>
            ))}
          </BlogDiscovery>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No posts yet</h2>
            <p className="text-gray-500 mb-6">Check back soon for saving tips and deal guides.</p>
            <Link
              href="/"
              style={{ backgroundColor: '#E63946' }}
              className="inline-block text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition"
            >
              Back to Homepage
            </Link>
          </div>
        )}
      </div>
    </main>
    </>
  )
}
