import { client, urlFor } from '@/lib/sanity.client'
import { dealBySlugQuery, dealSlugsQuery } from '@/lib/queries'
import type { Deal } from '@/lib/types'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await client
    .fetch<{ slug: string }[]>(dealSlugsQuery)
    .catch(() => [])
  return slugs.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const deal = await client
    .fetch<Deal | null>(dealBySlugQuery, { slug })
    .catch(() => null)

  if (!deal) return {}

  const title = `${deal.title} — SpartanShopper`
  const description = `Get ${deal.title} at ${deal.store} for $${deal.salePrice.toFixed(2)}. Shop now on SpartanShopper.`
  const imageUrl = deal.image
    ? urlFor(deal.image).width(1200).height(630).url()
    : 'https://spartanshopper.com/og-default.png'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://spartanshopper.com/deals/${slug}`,
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

export default async function DealPage({ params }: Props) {
  const { slug } = await params
  const deal = await client
    .fetch<Deal | null>(dealBySlugQuery, { slug })
    .catch(() => null)

  if (!deal) notFound()

  const imageUrl = deal.image ? urlFor(deal.image).width(800).url() : null
  const expired = deal.expiryDate ? new Date(deal.expiryDate) < new Date() : false
  const savings =
    deal.originalPrice && deal.originalPrice > deal.salePrice
      ? Math.round(((deal.originalPrice - deal.salePrice) / deal.originalPrice) * 100)
      : null

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        <Link
          href="/deals"
          className="inline-flex items-center gap-1 text-sm font-semibold mb-6 transition hover:underline"
          style={{ color: '#E63946' }}
        >
          ← Back to Deals
        </Link>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden">

          {imageUrl && (
            <div className="relative w-full h-64 sm:h-80 bg-white">
              <Image
                src={imageUrl}
                alt={deal.title}
                fill
                className="object-contain"
                priority
              />
              {savings && savings <= 75 && (
                <div
                  className="absolute top-4 left-4 text-white text-sm font-bold px-3 py-1 rounded-full"
                  style={{ backgroundColor: '#E63946' }}
                >
                  {savings}% OFF
                </div>
              )}
              {expired && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-extrabold text-2xl tracking-widest">EXPIRED</span>
                </div>
              )}
            </div>
          )}

          <div className="p-6 sm:p-8">

            <div className="flex items-center gap-3 mb-4">
              <span
                className="text-xs font-bold uppercase tracking-widest text-white px-3 py-1 rounded-full"
                style={{ backgroundColor: '#E63946' }}
              >
                Deal
              </span>
              {expired && (
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  Expired
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
              {deal.title}
            </h1>

            <p className="text-gray-500 text-sm font-medium mb-6">Store: {deal.store}</p>

            <div className="flex items-baseline gap-3 mb-6">
              <span style={{ color: '#E63946' }} className="text-4xl font-extrabold">
                ${deal.salePrice.toFixed(2)}
              </span>
              {deal.originalPrice && deal.originalPrice > deal.salePrice && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    ${deal.originalPrice.toFixed(2)}
                  </span>
                  {savings && savings <= 75 && (
                    <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      Save {savings}%
                    </span>
                  )}
                </>
              )}
            </div>

            {deal.description && (
              <div className="text-gray-600 text-sm leading-relaxed mb-6 border-t pt-5">
                <p>{deal.description}</p>
              </div>
            )}

            {deal.expiryDate && !expired && (
              <p className="text-sm text-gray-400 mb-6">
                Expires:{' '}
                {new Date(deal.expiryDate).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </p>
            )}

            <a
              href={deal.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={`block w-full text-center font-extrabold py-4 rounded-xl text-lg tracking-wide transition ${
                expired
                  ? 'bg-gray-200 text-gray-400 pointer-events-none'
                  : 'text-white hover:opacity-90 active:scale-95'
              }`}
              style={!expired ? { backgroundColor: '#E63946' } : {}}
            >
              {expired ? 'Deal Expired' : '🛒 Get This Deal →'}
            </a>

          </div>
        </div>
      </div>
    </main>
  )
}
