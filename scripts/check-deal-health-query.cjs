require('dotenv').config({ path: '.env.local', quiet: true })
const { createClient } = require('@sanity/client')
const fs = require('node:fs')
const source = fs.readFileSync('app/api/internal/deal-health/route.ts', 'utf8')
const query = source.match(/fetch<HealthRecord\[\]>\(`([\s\S]*?)`,/)[1]
const client = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production', apiVersion: '2024-01-01', token: process.env.SANITY_API_TOKEN, useCdn: false, perspective: 'published' })
client.fetch(query).then(rows => console.log(JSON.stringify({ count: rows.length, active: rows.filter(r => r.active).length, resolved: rows.filter(r => r.destination).length }))).catch(error => { console.error(error.message); process.exitCode = 1 })
