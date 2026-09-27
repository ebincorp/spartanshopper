import assert from 'node:assert/strict'
import dotenv from 'dotenv'
import path from 'node:path'
import { createClient } from '@sanity/client'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token: process.env.SANITY_API_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn: false,
  perspective: 'published',
})

const slug = 'owala-vs-stanley'
const metaTitle = 'Owala vs. Stanley Water Bottles'

async function main() {
  const post = await client.fetch<{ _id: string; _rev: string; title: string; seo?: { metaTitle?: string } } | null>(
    '*[_type == "post" && slug.current == $slug][0]{_id,_rev,title,seo}',
    { slug },
  )
  assert(post, `Missing post: ${slug}`)

  const result = { slug, title: post.title, from: post.seo?.metaTitle ?? null, to: metaTitle }
  if (!process.argv.includes('--execute')) {
    console.log(JSON.stringify({ mode: 'dry-run', ...result }, null, 2))
    return
  }

  await client.patch(post._id).ifRevisionId(post._rev).set({ 'seo.metaTitle': metaTitle }).commit()
  const saved = await client.getDocument(post._id)
  assert.equal(saved?.seo?.metaTitle, metaTitle)
  console.log(JSON.stringify({ mode: 'executed', ...result }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
