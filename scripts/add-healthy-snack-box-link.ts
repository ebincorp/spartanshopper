import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@sanity/client'
import { v4 as uuidv4 } from 'uuid'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true })

const client = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:    process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token:      process.env.SANITY_API_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn:     false,
})

const link = {
  title:       'Healthy Snack Box — Free Sample',
  slug:        'healthy-snack-box',
  destination: 'https://afflat3e1.com/trk/lnk/AACC5533-27AE-4667-B0FE-F7D3E906F340/?o=25012&c=918277&a=790773&k=89BBD6B5C28C11F7F527BCE92215E258&l=26113&s1=spartanshopper',
  notes:       'MaxBounty — Healthy Snack Box free sample offer, campaign 25012',
}

async function main() {
  const doc = {
    _id:         uuidv4(),
    _type:       'affiliateLink',
    title:       link.title,
    slug:        { _type: 'slug', current: link.slug },
    destination: link.destination,
    notes:       link.notes,
  }

  const result = await client.createOrReplace(doc)
  console.log(`Published: /go/${link.slug}  (_id: ${result._id})`)
  console.log('\nDone. Verify at https://spartanshopper.sanity.studio')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
