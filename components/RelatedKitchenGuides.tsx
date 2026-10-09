import Link from 'next/link'
import { client } from '@/lib/sanity.client'

// Existing researched guides form one focused cluster; do not suggest unrelated posts.
const kitchenGuides = ['ototo-avocado-spoon-rest', 'gifts-for-men-who-cook-2026', 'zojirushi-neuro-fuzzy-rice-cooker-review']

export default async function RelatedKitchenGuides({ slug }: { slug: string }) {
  if (!kitchenGuides.includes(slug)) return null
  const guides = await client.fetch<{ title: string; slug: string }[]>(
    '*[_type == "post" && slug.current in $slugs && slug.current != $slug]{title,"slug":slug.current}',
    { slugs: kitchenGuides, slug },
  ).catch(() => [])
  if (!guides.length) return null
  return <aside className="my-8 rounded-xl border border-gray-200 bg-white p-5" aria-label="Related kitchen guides">
    <h2 className="text-xl font-bold text-gray-900">More kitchen buying guides</h2>
    <ul className="mt-3 space-y-2">{guides.map(guide => <li key={guide.slug}>
      <Link href={`/blog/${guide.slug}`} className="block py-3 font-semibold text-rose-700 underline underline-offset-4">{guide.title}</Link>
    </li>)}</ul>
  </aside>
}
