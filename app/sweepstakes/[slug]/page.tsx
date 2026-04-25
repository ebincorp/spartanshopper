import { client, urlFor } from '@/lib/sanity.client'
import { sweepstakeBySlugQuery, sweepstakeSlugsQuery } from '@/lib/queries'
import type { Sweepstake } from '@/lib/types'
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
    .fetch<{ slug: string }[]>(sweepstakeSlugsQuery)
    .catch(() => [])
  return slugs.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const sweep = await client
    .fetch<Sweepstake | null>(sweepstakeBySlugQuery, { slug })
    .catch(() => null)

  if (!sweep) return {}

  const title = `${sweep.title} — SpartanShopper`
  const description = `Enter to win ${sweep.prize} from ${sweep.sponsor}. Free sweepstakes on SpartanShopper.`
  const imageUrl = sweep.image
    ? urlFor(sweep.image).width(1200).height(630).url()
    : 'https://spartanshopper.com/og-default.png'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://spartanshopper.com/sweepstakes/${slug}`,
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

export default async function SweepstakePage({ params }: Props) {
  const { slug } = await params
  const sweep = await client
    .fetch<Sweepstake | null>(sweepstakeBySlugQuery, { slug })
    .catch(() => null)

  if (!sweep) notFound()

  const imageUrl = sweep.image ? urlFor(sweep.image).width(800).url() : null
  const deadline = new Date(sweep.entryDeadline)
  const expired = deadline < new Date()

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        <Link
          href="/sweepstakes"
          className="inline-flex items-center gap-1 text-sm font-semibold mb-6 transition hover:underline"
          style={{ color: '#E63946' }}
        >
          ← Back to Sweepstakes
        </Link>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden">

          {imageUrl && (
            <div className="relative w-full h-64 sm:h-80">
              <Image
                src={imageUrl}
                alt={sweep.title}
                fill
                className="object-cover object-top"
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
                Sweepstake
              </span>
              {expired && (
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  Ended
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
              {sweep.title}
            </h1>

            <p className="text-gray-500 text-sm font-medium mb-6">
              Sponsor: {sweep.sponsor}
            </p>

            <div className="bg-gray-50 rounded-xl p-5 mb-6 space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Prize</p>
                <p className="text-2xl font-extrabold" style={{ color: '#E63946' }}>
                  {sweep.prize}
                </p>
              </div>
              <div className="flex gap-6 flex-wrap text-sm">
                <div>
                  <p className="text-gray-400">Deadline</p>
                  <p className="font-semibold text-gray-800">
                    {deadline.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                {sweep.entryFrequency && (
                  <div>
                    <p className="text-gray-400">Entry Frequency</p>
                    <p className="font-semibold text-gray-800">{sweep.entryFrequency}</p>
                  </div>
                )}
              </div>
            </div>

            {sweep.description && (
              <div className="text-gray-600 text-sm leading-relaxed mb-6 border-t pt-5">
                <p>{sweep.description}</p>
              </div>
            )}

            <a
              href={sweep.entryUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={`block w-full text-center font-extrabold py-4 rounded-xl text-lg tracking-wide transition ${
                expired
                  ? 'bg-gray-200 text-gray-400 pointer-events-none'
                  : 'text-white hover:opacity-90 active:scale-95'
              }`}
              style={!expired ? { backgroundColor: '#E63946' } : {}}
            >
              {expired ? 'Sweepstakes Ended' : '🏆 Enter Now — FREE →'}
            </a>

          </div>
        </div>
      </div>
    </main>
  )
}
