import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { client, urlFor } from '@/lib/sanity.client'
import { getPostBySlugQuery, getAllPostSlugsQuery } from '@/lib/blogQueries'
import type { Post } from '@/lib/types'

export const revalidate = 3600

const CATEGORY_COLORS: Record<string, string> = {
  Deals: '#E63946',
  Coupons: '#2A9D8F',
  Sweepstakes: '#E9C46A',
  'Saving Tips': '#457B9D',
  News: '#6D6875',
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await client
    .fetch<{ slug: string }[]>(getAllPostSlugsQuery)
    .catch(() => [])
  return slugs.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await client
    .fetch<Post | null>(getPostBySlugQuery, { slug })
    .catch(() => null)

  if (!post) return { title: 'Post Not Found — SpartanShopper' }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImage
        ? [{ url: urlFor(post.coverImage).width(1200).url() }]
        : [],
    },
  }
}

const portableTextComponents: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      const imageUrl = value?.asset ? urlFor(value).width(800).url() : null
      if (!imageUrl) return null
      return (
        <figure className="my-8">
          <div className="relative w-full rounded-xl overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
            <Image src={imageUrl} alt={value.alt ?? ''} fill className="object-contain" />
          </div>
          {value.caption && (
            <figcaption className="text-center text-sm text-gray-400 mt-2">{value.caption}</figcaption>
          )}
        </figure>
      )
    },
  },
  block: {
    h2: ({ children }) => (
      <h2 className="text-2xl font-extrabold text-gray-900 mt-10 mb-4">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">{children}</h3>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className="border-l-4 pl-5 py-2 my-6 italic text-gray-600"
        style={{ borderColor: '#E63946' }}
      >
        {children}
      </blockquote>
    ),
    normal: ({ children }) => (
      <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-inside space-y-1 mb-4 text-gray-700">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside space-y-1 mb-4 text-gray-700">{children}</ol>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ value, children }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:opacity-80 transition"
        style={{ color: '#E63946' }}
      >
        {children}
      </a>
    ),
  },
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await client
    .fetch<Post | null>(getPostBySlugQuery, { slug })
    .catch(() => null)

  if (!post) notFound()

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Cover image */}
      {post.coverImage && (
        <div className="relative w-full h-64 sm:h-80 bg-gray-200 overflow-hidden">
          <Image
            src={urlFor(post.coverImage).width(1200).url()}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div
        style={{ backgroundColor: '#1A1A2E' }}
        className={`px-4 py-10 ${post.coverImage ? '-mt-16 relative' : ''}`}
      >
        <div className="max-w-3xl mx-auto">
          {post.category && (
            <span
              className="inline-block text-white text-xs font-bold px-3 py-1 rounded-full mb-4"
              style={{ backgroundColor: CATEGORY_COLORS[post.category] ?? '#E63946' }}
            >
              {post.category}
            </span>
          )}
          <h1 className="text-white text-3xl sm:text-4xl font-extrabold leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-white/50 text-sm">
            {post.author && <span>{post.author} · </span>}
            {new Date(post.publishedAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        {post.excerpt && (
          <p className="text-lg text-gray-500 leading-relaxed mb-8 pb-8 border-b border-gray-200">
            {post.excerpt}
          </p>
        )}

        {post.body && (
          <div className="prose-custom">
            <PortableText value={post.body} components={portableTextComponents} />
          </div>
        )}

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link
            href="/blog"
            className="inline-block font-bold text-sm px-5 py-2.5 rounded-xl text-white transition hover:opacity-90"
            style={{ backgroundColor: '#1A1A2E' }}
          >
            ← Back to Blog
          </Link>
        </div>
      </div>
    </main>
  )
}
