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
  const [records, links] = await Promise.all([
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
  ])
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
