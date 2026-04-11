import { client, urlFor } from '@/lib/sanity.client'
import {
  dealBySlugQuery,
  couponBySlugQuery,
  sweepstakeBySlugQuery,
} from '@/lib/queries'
import type { Deal, Coupon, Sweepstake } from '@/lib/types'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import CopyButton from '@/components/CopyButton'
import { notFound } from 'next/navigation'

export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const [deal, coupon, sweep] = await Promise.all([
    client.fetch<Deal | null>(dealBySlugQuery, { slug }).catch(() => null),
    client.fetch<Coupon | null>(couponBySlugQuery, { slug }).catch(() => null),
    client.fetch<Sweepstake | null>(sweepstakeBySlugQuery, { slug }).catch(() => null),
  ])

  const item = deal ?? coupon ?? sweep
  if (!item) return {}

  const isDeal = deal !== null
  const isSweep = sweep !== null

  const title = isDeal
    ? `${deal.title} — SpartanShopper`
    : coupon
    ? `${coupon.title} — SpartanShopper`
    : `${sweep!.title} — SpartanShopper`

  const description = isDeal
    ? `Get ${deal.title} at ${deal.store} for $${deal.salePrice.toFixed(2)}. Shop now on SpartanShopper.`
    : coupon
    ? `Use code ${coupon.code} at ${coupon.store}${coupon.discount ? ` for ${coupon.discount}` : ''}. Verified coupon on SpartanShopper.`
    : `Enter to win ${sweep!.prize} from ${sweep!.sponsor}. Free sweepstake on SpartanShopper.`

  const imageUrl =
    isDeal && deal.image
      ? urlFor(deal.image).width(1200).height(630).url()
      : isSweep && sweep!.image
      ? urlFor(sweep!.image).width(1200).height(630).url()
      : 'https://spartanshopper.com/og-default.png'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://spartanshopper.com/post/${slug}`,
      siteName: 'SpartanShopper',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params

  // Try each content type in order
  const [deal, coupon, sweep] = await Promise.all([
    client.fetch<Deal | null>(dealBySlugQuery, { slug }).catch(() => null),
    client.fetch<Coupon | null>(couponBySlugQuery, { slug }).catch(() => null),
    client.fetch<Sweepstake | null>(sweepstakeBySlugQuery, { slug }).catch(() => null),
  ])

  const item = deal ?? coupon ?? sweep

  if (!item) return notFound()

  const isDeal = deal !== null
  const isCoupon = coupon !== null
  const isSweep = sweep !== null

  const backHref = isDeal ? '/deals' : isCoupon ? '/coupons' : '/sweepstakes'
  const backLabel = isDeal ? '← Back to Deals' : isCoupon ? '← Back to Coupons' : '← Back to Sweepstakes'

  const imageUrl =
    isDeal && deal.image
      ? urlFor(deal.image).width(800).url()
      : isSweep && sweep.image
      ? urlFor(sweep.image).width(800).url()
      : null

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Back button */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm font-semibold mb-6 transition hover:underline"
          style={{ color: '#E63946' }}
        >
          {backLabel}
        </Link>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden">

          {/* Hero image */}
          {imageUrl && (
            <div className="relative w-full h-64 sm:h-80">
              <Image
                src={imageUrl}
                alt={(isDeal ? deal.title : isSweep ? sweep.title : coupon?.title) ?? ''}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="p-6 sm:p-8">

            {/* Type badge */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className="text-xs font-bold uppercase tracking-widest text-white px-3 py-1 rounded-full"
                style={{ backgroundColor: '#E63946' }}
              >
                {isDeal ? 'Deal' : isCoupon ? 'Coupon' : 'Sweepstake'}
              </span>
              {isCoupon && coupon.verified && (
                <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                  ✓ Verified
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
              {isDeal ? deal.title : isCoupon ? coupon.title : sweep!.title}
            </h1>

            {/* Store / Sponsor */}
            <p className="text-gray-500 text-sm font-medium mb-6">
              {isDeal ? `Store: ${deal.store}` : isCoupon ? `Store: ${coupon.store}` : `Sponsor: ${sweep!.sponsor}`}
            </p>

            {/* Deal details */}
            {isDeal && (
              <div className="flex items-baseline gap-3 mb-6">
                <span style={{ color: '#E63946' }} className="text-4xl font-extrabold">
                  ${deal.salePrice.toFixed(2)}
                </span>
                {deal.originalPrice && deal.originalPrice > deal.salePrice && (
                  <>
                    <span className="text-xl text-gray-400 line-through">${deal.originalPrice.toFixed(2)}</span>
                    <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      Save {Math.round(((deal.originalPrice - deal.salePrice) / deal.originalPrice) * 100)}%
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Coupon code */}
            {isCoupon && (
              <div className="mb-6">
                {coupon.discount && (
                  <p className="text-2xl font-extrabold mb-3" style={{ color: '#E63946' }}>
                    {coupon.discount}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 border-2 border-dashed rounded-xl px-5 py-4 font-mono font-bold text-2xl tracking-widest"
                    style={{ borderColor: '#E63946', color: '#E63946' }}
                  >
                    {coupon.code}
                  </div>
                  <CopyButton code={coupon.code} />
                </div>
              </div>
            )}

            {/* Sweepstake prize */}
            {isSweep && (
              <div className="bg-gray-50 rounded-xl p-5 mb-6 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Prize</p>
                  <p className="text-2xl font-extrabold" style={{ color: '#E63946' }}>{sweep!.prize}</p>
                </div>
                <div className="flex gap-6 flex-wrap text-sm">
                  <div>
                    <p className="text-gray-400">Deadline</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(sweep!.entryDeadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  {sweep!.entryFrequency && (
                    <div>
                      <p className="text-gray-400">Entry Frequency</p>
                      <p className="font-semibold text-gray-800">{sweep!.entryFrequency}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {(isDeal && deal.description) || (isSweep && sweep!.description) ? (
              <div className="text-gray-600 text-sm leading-relaxed mb-6 border-t pt-5">
                <p>{isDeal ? deal.description : sweep!.description}</p>
              </div>
            ) : null}

            {/* Expiry */}
            {(isDeal && deal.expiryDate) || (isCoupon && coupon.expiryDate) ? (
              <p className="text-sm text-gray-400 mb-6">
                Expires:{' '}
                {new Date((isDeal ? deal.expiryDate : coupon!.expiryDate)!).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </p>
            ) : null}

            {/* CTA Button */}
            <a
              href={isDeal ? deal.affiliateUrl : isCoupon ? coupon.affiliateUrl : sweep!.entryUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="block w-full text-center text-white font-extrabold py-4 rounded-xl text-lg tracking-wide transition hover:opacity-90 active:scale-95"
              style={{ backgroundColor: '#E63946' }}
            >
              {isDeal ? '🛒 Get This Deal →' : isCoupon ? '🏷️ Shop Now →' : '🏆 Enter Now — FREE →'}
            </a>

          </div>
        </div>
      </div>
    </main>
  )
}
