/*
 * Corrects the four live article <title> values that still exceed Bing's
 * 70-character recommendation after the SpartanShopper brand suffix.
 *
 * Dry-run by default. Use --execute to patch Sanity with revision protection.
 */
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@sanity/client')

const changes = {
  'biodance-bio-collagen-real-deep-mask-review': {
    from: 'BIODANCE Collagen Mask: How Long, Overnight and Rinsing',
    to: 'BIODANCE Collagen Mask: Overnight and Rinsing',
  },
  'biodance-eye-patches-review': {
    from: 'BIODANCE Eye Patches Review: How to Use and Buy Wisely',
    to: 'BIODANCE Eye Patches: How to Use',
  },
  'metamucil-for-constipation': {
    from: 'Metamucil for Constipation: Powder, Capsules and Labels',
    to: 'Metamucil for Constipation: Powder and Capsules',
  },
  'psyllium-husk-vs-miralax': {
    from: 'Psyllium Husk vs. MiraLax: Differences and How to Choose',
    to: 'Psyllium vs. MiraLax: How to Choose',
  },
}

const client = createClient({
  projectId: 'eohdr7jw',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  perspective: 'published',
})

async function main() {
  const execute = process.argv.includes('--execute')
  const posts = await client.fetch(
    `*[_type == "post" && slug.current in $slugs]{_id, _rev, "slug": slug.current, "metaTitle": seo.metaTitle}`,
    { slugs: Object.keys(changes) },
  )

  if (posts.length !== Object.keys(changes).length) {
    throw new Error(`Expected ${Object.keys(changes).length} published posts; found ${posts.length}. No changes made.`)
  }

  const mutations = posts.map((post) => {
    const change = changes[post.slug]
    if (post.metaTitle !== change.from) {
      throw new Error(`Revision collision for ${post.slug}: expected “${change.from}”, found “${post.metaTitle}”. No changes made.`)
    }

    const liveLength = `${change.to} — SpartanShopper`.length
    if (liveLength > 70) {
      throw new Error(`Proposed title remains too long for ${post.slug}: ${liveLength} characters.`)
    }

    return {
      id: post._id,
      ifRevisionID: post._rev,
      patch: { set: { 'seo.metaTitle': change.to } },
    }
  })

  console.log(JSON.stringify({ mode: execute ? 'execute' : 'dry-run', changes: mutations.map((m) => ({ id: m.id, title: m.patch.set['seo.metaTitle'] })) }, null, 2))

  if (execute) {
    const transaction = client.transaction()
    mutations.forEach((mutation) => transaction.patch(mutation.id, mutation.patch, { ifRevisionID: mutation.ifRevisionID }))
    await transaction.commit({ autoGenerateArrayKeys: true })
    console.log('Published 4 Bing title-length corrections.')
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
