import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { client, urlFor } from '@/lib/sanity.client'
import { getPostBySlugQuery, getAllPostSlugsQuery } from '@/lib/blogQueries'
import type { Post } from '@/lib/types'
import { generateJsonLd, generateJsonLdFromProducts, generateBreadcrumbJsonLd } from '@/lib/generateJsonLd'
import InlineCouponCard from '@/components/InlineCouponCard'
import RelatedCoupons from '@/components/RelatedCoupons'
import EmailSignup from '@/components/EmailSignup'
import TikTokEmbed from '@/components/TikTokEmbed'
import { pageMetadata } from '@/lib/seo'

export const revalidate = 3600
export const dynamicParams = true

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

  if (!post) return { title: { absolute: 'Post Not Found — SpartanShopper' } }

  // metaTitle overrides the post title but is still brand-suffixed, matching
  // the behaviour these posts already shipped with under the layout template.
  const metaTitle = post.seo?.metaTitle || post.title
  const metaDescription = post.seo?.metaDescription || post.excerpt

  return pageMetadata({
    title: metaTitle,
    description: metaDescription ?? '',
    path: `/blog/${slug}`,
    image: post.coverImage ? urlFor(post.coverImage).width(1200).height(630).url() : undefined,
    type: 'article',
    ...(post.seo?.canonicalUrl ? { canonicalPath: post.seo.canonicalUrl } : {}),
  })
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}

function blockText(value: { children?: unknown[] }): string {
  return (value.children ?? [])
    .map((s) => (s && typeof s === 'object' && 'text' in s ? String((s as { text: unknown }).text) : ''))
    .join('')
}

// Components used when rendering Portable Text inside table cells
const cellPtComponents: PortableTextComponents = {
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
  block: {
    normal: ({ children }) => <>{children}</>,
  },
}

function renderTableCell(cell: string | unknown[]) {
  if (Array.isArray(cell)) {
    return <PortableText value={cell as any} components={cellPtComponents} />
  }
  // Legacy plain-string format with optional "text||href" link separator
  const sepIdx = cell.indexOf('||')
  if (sepIdx === -1) return <>{cell}</>
  return (
    <a
      href={cell.slice(sepIdx + 2)}
      target="_blank"
      rel="noopener noreferrer"
      className="underline hover:opacity-80 transition"
      style={{ color: '#E63946' }}
    >
      {cell.slice(0, sepIdx)}
    </a>
  )
}

const portableTextComponents: PortableTextComponents = {
  types: {
    tiktokEmbed: ({ value }) => {
      if (!value?.videoUrl || !value?.videoId) return null
      return <TikTokEmbed videoUrl={value.videoUrl} videoId={value.videoId} />
    },
    couponEmbed: ({ value }) => {
      const coupon = value?.coupon
      if (!coupon) return null

      const now = new Date()
      const startsAt = coupon.startDate ? new Date(coupon.startDate) : null

      if (startsAt && startsAt > now) {
        return (
          <div
            className="my-6 rounded-xl p-5 border-2 border-dashed text-center"
            style={{ borderColor: '#E63946', backgroundColor: '#fff5f5' }}
          >
            <p className="text-sm font-semibold" style={{ color: '#E63946' }}>
              Deal available{' '}
              {startsAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        )
      }

      return <InlineCouponCard coupon={coupon} />
    },
    table: ({ value }) => {
      const rows: { _key: string; cells: (string | unknown[])[] }[] = value?.rows ?? []
      if (!rows.length) return null
      const [header, ...body] = rows
      return (
        <div className="overflow-x-auto my-8">
          <table className="w-full border-collapse text-sm">
            {value?.caption && (
              <caption className="text-xs text-gray-400 mb-2 text-left">{value.caption}</caption>
            )}
            <thead>
              <tr>
                {(header.cells ?? []).map((cell, i) => (
                  <th
                    key={i}
                    className="px-4 py-2.5 text-left text-white font-bold text-xs uppercase tracking-wide"
                    style={{ backgroundColor: '#1A1A2E' }}
                  >
                    {renderTableCell(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={row._key ?? ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {(row.cells ?? []).map((cell, ci) => (
                    <td
                      key={ci}
                      className="px-4 py-2.5 text-gray-700 border-b border-gray-100"
                    >
                      {renderTableCell(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    },
    image: ({ value }) => {
      const imageUrl = value?.asset ? urlFor(value).width(800).url() : null
      if (!imageUrl) return null
      return (
        <figure className="my-8 w-full">
          <div className="w-full rounded-xl overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
            {/* Plain <img> — Sanity CDN already resizes; no Vercel transformation needed. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={value.alt ?? ''}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain"
            />
          </div>
          {value.caption && (
            <figcaption className="text-center text-sm text-gray-400 mt-2">{value.caption}</figcaption>
          )}
        </figure>
      )
    },
  },
  block: {
    h2: ({ value, children }) => (
      <h2 id={slugify(blockText(value))} className="text-2xl font-extrabold text-gray-900 mt-10 mb-4">{children}</h2>
    ),
    h3: ({ value, children }) => (
      <h3 id={slugify(blockText(value))} className="text-xl font-bold text-gray-900 mt-8 mb-3">{children}</h3>
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
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: post.products?.length
          ? generateJsonLdFromProducts(post, post.products)
          : generateJsonLd(post)
      }}
    />
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: generateBreadcrumbJsonLd([
          { name: 'Home', url: 'https://www.spartanshopper.com' },
          { name: 'Blog', url: 'https://www.spartanshopper.com/blog' },
          { name: post.title, url: `https://www.spartanshopper.com/blog/${post.slug.current}` },
        ])
      }}
    />
    <main className="min-h-screen bg-gray-50">
      {/* Cover image */}
      {post.coverImage && (
        <div className="relative w-full max-w-3xl mx-auto h-80 sm:h-96 bg-gray-200 overflow-hidden">
          <Image
            src={urlFor(post.coverImage).width(1200).url()}
            alt={post.title}
            fill
            className={`object-cover ${
              // is-amazon-luxury-authentic: the GZ94 sneaker sits in the
              // bottom ~45% of its 500x500 source frame — lower than the
              // other cover photos on this template — so object-center
              // still crops out most of the shoe. Targeted override rather
              // than a new schema field, since this is a one-off outlier,
              // not a pattern (see the object-center/max-w-3xl commits).
              post.slug.current === 'is-amazon-luxury-authentic' ? 'object-bottom' : 'object-center'
            }`}
            priority
            unoptimized
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

        <EmailSignup />

        {/* Related coupons */}
        <RelatedCoupons currentId={post!._id} category={post!.relatedCategory} />

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
    </>
  )
}
