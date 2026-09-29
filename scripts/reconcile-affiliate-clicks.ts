import dotenv from 'dotenv'
import { Redis } from '@upstash/redis'

dotenv.config({ path: '.env.local', quiet: true })

const date = process.argv.find(arg => arg.startsWith('--date='))?.slice(7)
const amazonClicks = Number(process.argv.find(arg => arg.startsWith('--amazon-clicks='))?.slice(16))
if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Use --date=YYYY-MM-DD')
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
if (!url || !token) throw new Error('Upstash Redis is not configured')
const db = new Redis({ url, token })
const base = `affiliate-clicks:v1:${date}`
const [firstPartyClicks, topPages, topSlugs] = await Promise.all([
  db.get<number>(`${base}:total`),
  db.zrange<string[]>(`${base}:pages`, 0, -1, { rev: true, withScores: true }),
  db.zrange<string[]>(`${base}:slugs`, 0, -1, { rev: true, withScores: true }),
])
const clicks = firstPartyClicks || 0
const result = {
  date, firstPartyHumanRedirects: clicks,
  ...(Number.isFinite(amazonClicks) ? { amazonClicks, gap: amazonClicks - clicks, gapPercent: amazonClicks ? Number((((amazonClicks - clicks) / amazonClicks) * 100).toFixed(1)) : 0 } : {}),
  topPages, topSlugs,
}
console.log(JSON.stringify(result, null, 2))
