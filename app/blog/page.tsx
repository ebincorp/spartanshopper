import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { client, urlFor } from '@/lib/sanity.client'
import { getAllPostsQuery } from '@/lib/blogQueries'
import type { Post } from '@/lib/types'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Blog — SpartanShopper',
  description: 'Saving tips, deal guides, and news from the SpartanShopper team.',
}

const CATEGORY_COLORS: Record<string, string> = {
  Deals: '#E63946',
  Coupons: '#2A9D8F',
  Sweepstakes: '#E9C46A',
  'Saving Tips': '#457B9D',
  News: '#6D6875',
}

export default async function BlogPage() {
  const posts = await client
    .fetch<Post[]>(getAllPostsQuery)
    .catch(() => [] as Post[])

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ backgroundColor: '#1A1A2E' }} className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-white text-4xl font-extrabold mb-2">📝 Blog</h1>
          <p className="text-white/60">
            Saving tips, deal guides, and news — {posts.length} article{posts.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article
                key={post._id}
                className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-200"
              >
                {/* Cover image */}
                <div className="relative w-full h-44 bg-gray-100 overflow-hidden">
                  {post.coverImage ? (
                    <Image
                      src={urlFor(post.coverImage).width(600).url()}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-4xl"
                      style={{ backgroundColor: '#1A1A2E' }}
                    >
                      📝
                    </div>
                  )}
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
                  <p className="text-xs text-gray-400 mb-2">
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
                  <Link
                    href={`/blog/${post.slug.current}`}
                    className="inline-block text-center text-white font-bold py-2.5 rounded-xl text-sm hover:opacity-90 active:scale-95 transition"
                    style={{ backgroundColor: '#E63946' }}
                  >
                    Read More →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No posts yet</h2>
            <p className="text-gray-400 mb-6">Check back soon for saving tips and deal guides.</p>
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
  )
}
