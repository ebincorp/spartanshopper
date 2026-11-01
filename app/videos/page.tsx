import Link from 'next/link'
import SocialProductFinder from '@/components/SocialProductFinder'
import { client } from '@/lib/sanity.client'
import { pageMetadata } from '@/lib/seo'
import { buildSocialProductCards, socialProductFeatures, type SocialProductRecord } from '@/lib/social-products'

export const revalidate = 60
export const metadata = pageMetadata({
  title: 'Shop Our Videos & Recent Posts',
  description: 'Find the exact products from SpartanShopper videos and recent posts. Search by product or brand, read the details, and check current retailer prices.',
  path: '/videos',
  noIndex: true,
})

// Social navigation, not a competing SEO landing page. Keep noindex and sitemap
// exclusion, and never repeat prices from old posts as current offers.
export default async function VideosPage() {
  const [records, links, featuredGuides] = await Promise.all([
    client.fetch<SocialProductRecord[]>(`*[
      (_type == "deal" && slug.current in $dealSlugs) ||
      (_type == "post" && slug.current in $guideSlugs && publishedAt <= now())
    ]{
      _type, "slug": slug.current, active, startDate, expiryDate, publishedAt, store,
      "imageUrl": coalesce(image.asset->url, coverImage.asset->url),
      "imageWidth": coalesce(image.asset->metadata.dimensions.width, coverImage.asset->metadata.dimensions.width)
    }`, {
      dealSlugs: socialProductFeatures.flatMap(feature => feature.dealSlug ? [feature.dealSlug] : []),
      guideSlugs: socialProductFeatures.flatMap(feature => feature.guideSlug ? [feature.guideSlug] : []),
    }),
    client.fetch<{ slug: string }[]>('*[_type == "affiliateLink" && slug.current in $slugs && defined(destination) && destination != ""]{"slug": slug.current}', {
      slugs: socialProductFeatures.map(feature => feature.affiliateSlug),
    }),
    client.fetch<{ slug: string }[]>('*[_type == "post" && slug.current in $slugs && publishedAt <= now()]{"slug": slug.current}', {
      slugs: ['jiyu-toner-pad-dupes', 'cosori-turboblaze-vs-ninja-af141'],
    }),
  ])
  const recentComparisons = [
    { slug: 'jiyu-toner-pad-dupes', label: 'Beauty', title: 'JiYu vs medicube toner pads', description: 'Compare cost per pad, jar counts and formula differences.', action: 'Compare toner pads' },
    { slug: 'cosori-turboblaze-vs-ninja-af141', label: 'Kitchen', title: 'COSORI TurboBlaze vs Ninja AF141', description: 'Compare basket size and cooking modes before paying for extras.', action: 'Compare air fryers' },
  ].filter(guide => featuredGuides.some(record => record.slug === guide.slug))
  const products = buildSocialProductCards(socialProductFeatures, records, links.map(link => link.slug))
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-[#1A1A2E] px-5 py-5 text-white sm:py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-300">Saw it in a post? Find it here.</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Shop our recent posts</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">Find the exact products from our Instagram, TikTok and Pinterest posts.</p>
          <p className="mt-3 max-w-3xl text-xs leading-relaxed text-slate-300">Affiliate disclosure: We may earn a commission from qualifying purchases through retailer links, at no extra cost to you. As an Amazon Associate I earn from qualifying purchases.</p>
        </div>
      </header>
      {recentComparisons.length > 0 && (
        <details className="mx-auto max-w-6xl px-5 pt-4">
          <summary className="min-h-11 cursor-pointer rounded-lg py-3 text-sm font-semibold text-[#1A1A2E] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E63946]">Toner-pad &amp; air-fryer comparisons</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {recentComparisons.map(guide => (
              <Link key={guide.slug} href={`/blog/${guide.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#E63946] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E63946]">
                <p className="text-xs font-bold uppercase tracking-wider text-[#E63946]">{guide.label}</p>
                <h2 className="mt-2 text-lg font-bold text-[#1A1A2E]">{guide.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{guide.description}</p>
                <p className="mt-4 text-sm font-bold text-[#1A1A2E] group-hover:underline">{guide.action} <span aria-hidden="true">→</span></p>
              </Link>
            ))}
          </div>
        </details>
      )}
      <SocialProductFinder products={products} />
      <p className="mx-auto max-w-6xl px-5 pb-6 text-xs leading-relaxed text-slate-500">Prices, coupons and availability can change after a post; check the retailer before buying. Our content may use AI presenters and illustrative images.</p>
      <nav aria-label="More shopping help" className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-4 border-t border-slate-200 px-5 py-8 text-sm font-semibold text-[#1A1A2E]">
        <Link href="/deals" className="underline underline-offset-4">Current deals</Link>
        <Link href="/coupons" className="underline underline-offset-4">Coupons</Link>
        <Link href="/blog" className="underline underline-offset-4">All buying guides</Link>
        <Link href="/affiliate-disclosure" className="underline underline-offset-4">Affiliate disclosure</Link>
      </nav>
    </main>
  )
}
