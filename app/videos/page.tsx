import Link from 'next/link'
import { client, urlFor } from '@/lib/sanity.client'
import { pageMetadata } from '@/lib/seo'

export const revalidate = 60
export const metadata = pageMetadata({ title: 'Shop Our Videos', description: 'Find the products featured in SpartanShopper videos, read the buying guides, and check current retailer details.', path: '/videos', noIndex: true })
// Social navigation destination, deliberately not an SEO competitor to the guides.
const features = [
  { slug: 'milkmaid-dress-fall-styling', label: 'Three ways to style a milkmaid dress for fall', category: 'Fashion', affiliate: 'scarlet-darkness-milkmaid-dress' },
  { slug: 'ototo-avocado-spoon-rest', label: 'A spot for your messy cooking spoon', category: 'Kitchen', affiliate: 'ototo-avocado-spoon-rest' },
  { slug: 'dr-jart-ceramidin-mask-20-minute-routine-guide', label: 'A simpler evening skincare step', category: 'Beauty', affiliate: 'dr-jart-ceramidin-skin-barrier-mask' },
]
type Guide = { slug: string; title: string; coverImage?: { asset: { _ref: string }; alt?: string } }
export default async function VideosPage() {
  const guides = await client.fetch<Guide[]>('*[_type == "post" && slug.current in $slugs]{"slug":slug.current,title,coverImage}', { slugs: features.map(f => f.slug) })
  const links = await client.fetch<{slug:string}[]>('*[_type == "affiliateLink" && slug.current in $slugs && defined(destination)]{"slug":slug.current}', {slugs: features.map(f=>f.affiliate)})
  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="bg-[#1A1A2E] px-5 py-12 text-white"><div className="mx-auto max-w-4xl">
      <p className="text-sm font-semibold uppercase tracking-widest text-rose-300">Seen it on SpartanShopper?</p>
      <h1 className="mt-3 text-4xl font-extrabold">Shop our videos</h1>
      <p className="mt-4 max-w-2xl text-slate-200">Find the product, understand what it does, and decide whether it solves your problem. No hunting through old posts.</p>
      <p className="mt-4 text-sm text-slate-300">Affiliate links: we may earn a commission from qualifying purchases. Featured picks are not necessarily on sale. Our videos may use AI presenters.</p>
    </div></header>
    <section aria-label="Featured video products" className="mx-auto grid max-w-4xl gap-6 px-5 py-10 sm:grid-cols-2">
      {features.map(feature => { const guide=guides.find(g=>g.slug===feature.slug); if(!guide)return null; return <article key={feature.slug} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        {guide.coverImage ? <img src={urlFor(guide.coverImage).width(700).url()} alt={guide.coverImage.alt || guide.title} className="h-64 w-full bg-white object-contain p-5" /> : <div className="grid h-64 place-items-center bg-rose-50 p-8 text-center text-3xl font-bold text-[#1A1A2E]">{guide.title}</div>}
        <div className="p-6"><p className="text-sm font-bold text-rose-700">{feature.category}</p><h2 className="mt-2 text-2xl font-bold">{feature.label}</h2><p className="mt-3 text-slate-600">{guide.title}</p>
          <Link data-video-guide={feature.slug} href={`/blog/${feature.slug}`} className="mt-5 block rounded-xl bg-[#1A1A2E] px-4 py-3 text-center font-bold text-white">Read the product guide</Link>
          {links.some(l=>l.slug===feature.affiliate) && <a href={`/go/${feature.affiliate}`} rel="sponsored nofollow" className="mt-3 block rounded-xl border border-slate-300 px-4 py-3 text-center font-semibold">Check current retailer details →</a>}
        </div></article> })}
      {!guides.length && <p>These video guides are being refreshed. Browse our shopping guides below.</p>}
    </section>
    <nav aria-label="More shopping help" className="mx-auto flex max-w-4xl flex-wrap gap-5 px-5 pb-12 font-semibold"><Link href="/blog">All buying guides</Link><Link href="/deals">Current deals</Link><Link href="/coupons">Coupons</Link><Link href="/affiliate-disclosure">Affiliate disclosure</Link></nav>
  </main>
}
