import Link from 'next/link'
import VoltariTekOffer from './VoltariTekOffer'
import { LABEL_GUIDE_SLUGS, type BlogSearchItem } from '@/lib/blog-discovery'

export default function LabelGuideFeature({ posts, image }: { posts: BlogSearchItem[]; image?: string }) {
  const guides = LABEL_GUIDE_SLUGS.flatMap(slug => posts.filter(p => p.slug === slug))
  const primary = guides.find(p => p.slug === 'magnetic-toolbox-labels')
  if (!primary) return null
  return <section aria-labelledby="label-guide-feature" className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="grid md:grid-cols-[1fr_1fr]">
      {image && <Link href="/blog/magnetic-toolbox-labels" aria-label="Explore the updated custom magnetic label guide" className="block bg-slate-900">
        {/* Official live builder screenshot, not an AI product rendering. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="VoltariTek custom-label builder showing a Brake tools label in 3D" className="h-full min-h-56 w-full object-contain" />
      </Link>}
      <div className="p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-rose-700">Featured update · Workshop organization</p>
        <h2 id="label-guide-feature" className="mt-2 text-2xl font-extrabold text-slate-900">Your drawers. Your words. Preview the labels in 3D.</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">Explore the current custom builder, compare custom sets with ready-made packs, and check surface fit and pricing before you order.</p>
        <VoltariTekOffer />
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/blog/magnetic-toolbox-labels" className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white">Read the updated guide</Link>
          <Link href="/videos#voltaritek-label-builder" className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-900">Find the video product</Link>
        </div>
      </div>
    </div>
    <nav aria-label="Toolbox label guides" className="flex flex-wrap gap-3 border-t border-slate-200 p-5">
      {guides.filter(p => p.id !== primary.id).map(p => <Link key={p.id} href={'/blog/'+p.slug} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 underline underline-offset-4">{p.title}</Link>)}
    </nav>
  </section>
}
