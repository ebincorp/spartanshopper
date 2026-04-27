import { client, urlFor } from '@/lib/sanity.client'
import { couponBySlugQuery, couponSlugsQuery } from '@/lib/queries'
import type { Coupon } from '@/lib/types'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import CopyButton from '@/components/CopyButton'
import RelatedCoupons from '@/components/RelatedCoupons'

export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await client
    .fetch<{ slug: string }[]>(couponSlugsQuery)
    .catch(() => [])
  return slugs.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const coupon = await client
    .fetch<Coupon | null>(couponBySlugQuery, { slug })
    .catch(() => null)

  if (!coupon) return {}

  const title = `${coupon.title} — SpartanShopper`
  const description = `Use code ${coupon.code} at ${coupon.store}${coupon.discount ? ` for ${coupon.discount}` : ''}. Verified coupon on SpartanShopper.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://spartanshopper.com/coupons/${slug}`,
      siteName: 'SpartanShopper',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function CouponPage({ params }: Props) {
  const { slug } = await params
  const coupon = await client
    .fetch<Coupon | null>(couponBySlugQuery, { slug })
    .catch(() => null)

  if (!coupon) notFound()

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        <Link
          href="/coupons"
          className="inline-flex items-center gap-1 text-sm font-semibold mb-6 transition hover:underline"
          style={{ color: '#E63946' }}
        >
          ← Back to Coupons
        </Link>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden">

          {coupon.image && (
            <div className="relative w-full h-64 sm:h-80 bg-gray-100">
              <Image
                src={urlFor(coupon.image).width(800).url()}
                alt={coupon.title}
                fill
                className="object-contain"
                priority
              />
            </div>
          )}

          <div className="p-6 sm:p-8">

            <div className="flex items-center gap-3 mb-4">
              <span
                className="text-xs font-bold uppercase tracking-widest text-white px-3 py-1 rounded-full"
                style={{ backgroundColor: '#E63946' }}
              >
                Coupon
              </span>
              {coupon.verified && (
                <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                  ✓ Verified
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
              {coupon.title}
            </h1>

            <p className="text-gray-500 text-sm font-medium mb-6">Store: {coupon.store}</p>

            {coupon.discount && (
              <p className="text-2xl font-extrabold mb-4" style={{ color: '#E63946' }}>
                {coupon.discount}
              </p>
            )}

            {coupon.code && (
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="flex-1 border-2 border-dashed rounded-xl px-5 py-4 font-mono font-bold text-2xl tracking-widest"
                  style={{ borderColor: '#E63946', color: '#E63946' }}
                >
                  {coupon.code}
                </div>
                <CopyButton code={coupon.code} />
              </div>
            )}

            {coupon.expiryDate && (
              <p className="text-sm text-gray-400 mb-6">
                Expires:{' '}
                {new Date(coupon.expiryDate).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </p>
            )}

            <a
              href={coupon.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="block w-full text-center font-extrabold py-4 rounded-xl text-lg tracking-wide transition text-white hover:opacity-90 active:scale-95"
              style={{ backgroundColor: '#E63946' }}
            >
              🏷️ Shop Now →
            </a>

          </div>
        </div>

        <RelatedCoupons currentId={coupon._id} category={coupon.category} />
      </div>
    </main>
  )
}
