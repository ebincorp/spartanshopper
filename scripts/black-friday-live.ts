import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { config } from 'dotenv'
import {
  BLACK_FRIDAY_END_MS,
  getBlackFridayTarget,
  isBlackFridayLaunchAsin,
} from '../lib/black-friday-offers'
import {
  configuredBlackFridayRedis,
  readBlackFridayCatalog,
  validTimestamp,
  type BlackFridayCatalog,
} from '../lib/black-friday-store'

type Observation = {
  asin: string
  observedAt: string
  url: string
} & (
  | { state: 'live'; badge: 'Black Friday Deal'; inStock: true; endsAt?: string }
  | { state: 'ended'; reason: 'badge absent' | 'retailer ended' | 'out of stock' }
)

const MAX_EVIDENCE_AGE_MS = 15 * 60 * 1000

async function readObservations(file: string): Promise<Observation[]> {
  const rows: Observation[] = JSON.parse(await readFile(file, 'utf8'))
  if (!Array.isArray(rows) || !rows.length) throw new Error('No observations supplied')

  const now = Date.now()
  const seen = new Set<string>()
  for (const row of rows) {
    if (!row || !isBlackFridayLaunchAsin(row.asin) || seen.has(row.asin) ||
        !validTimestamp(row.observedAt) || typeof row.url !== 'string' ||
        getBlackFridayTarget(row.url)?.asin !== row.asin) {
      throw new Error('Invalid, duplicate, or outside-scope product observation')
    }
    const age = now - Date.parse(row.observedAt)
    if (age < 0 || age > MAX_EVIDENCE_AGE_MS) throw new Error('Observation is outside the 15-minute evidence window')
    if (row.state === 'live') {
      if (row.badge !== 'Black Friday Deal' || row.inStock !== true) throw new Error('Exact badge and stock are required')
      if (row.endsAt !== undefined && (!validTimestamp(row.endsAt) || Date.parse(row.endsAt) <= now)) {
        throw new Error('Stated retailer end is invalid or already passed')
      }
    } else if (row.state !== 'ended' || !['badge absent', 'retailer ended', 'out of stock'].includes(row.reason)) {
      throw new Error('An unclear listing stops the batch')
    }
    seen.add(row.asin)
  }
  return rows
}

const SEED_HASH = `
  if redis.call('EXISTS', KEYS[1]) == 1 then return 0 end
  local offers = cjson.decode(ARGV[1])
  for asin, offer in pairs(offers) do
    redis.call('HSET', KEYS[1], asin, cjson.encode(offer))
  end
  redis.call('PEXPIREAT', KEYS[1], tonumber(ARGV[2]))
  return 1
`

// Validate every observation before changing the hash. A stale or incomplete
// pass leaves every field untouched, including its existing expiry.
const APPLY_PASS = `
  local checks = cjson.decode(ARGV[1])
  if #checks ~= redis.call('HLEN', KEYS[1]) then return 0 end
  local updates = {}
  for _, check in ipairs(checks) do
    local raw = redis.call('HGET', KEYS[1], check.asin)
    if not raw then return 0 end
    local offer = cjson.decode(raw)
    if check.observedAt <= (offer.withdrawnAt or offer.checkedAt) then return 0 end
    if check.state == 'live' then
      offer.checkedAt = check.observedAt
      offer.endsAt = check.endsAt
      offer.withdrawnAt = nil
    else
      offer.withdrawnAt = check.observedAt
    end
    updates[check.asin] = offer
  end
  for asin, offer in pairs(updates) do
    redis.call('HSET', KEYS[1], asin, cjson.encode(offer))
  end
  return 1
`

async function main() {
  const [action, ...args] = process.argv.slice(2)
  const file = args[0]
  const valid = (action === 'status' && args.length === 0) ||
    (action === 'clear' && args.length === 1 && file === '--apply') ||
    ((action === 'seed' || action === 'recheck') && args.length === 2 && args[1] === '--apply')
  if (!valid) throw new Error('Use status, seed <observations.json> --apply, recheck <observations.json> --apply, or clear --apply')

  config({ path: '.env.local', quiet: true })
  const store = configuredBlackFridayRedis()
  if (!store) throw new Error('The existing Redis credentials are unavailable')
  const { redis, key } = store

  if (action === 'status') {
    console.log(JSON.stringify({ key, offers: await readBlackFridayCatalog(store) }))
    return
  }
  if (action === 'clear') {
    console.log(JSON.stringify({ key, deleted: await redis.del(key) }))
    return
  }
  if (Date.now() >= BLACK_FRIDAY_END_MS) throw new Error('The Black Friday launch window has ended')

  const rows = await readObservations(file)
  if (action === 'seed') {
    const fixtures: BlackFridayCatalog = JSON.parse(await readFile(join(__dirname, 'fixtures', 'black-friday-preview.json'), 'utf8'))
    const seeded = Object.fromEntries(rows.map(row => {
      if (row.state !== 'live' || !fixtures[row.asin]) throw new Error('Only verified launch listings can be seeded')
      return [row.asin, { ...fixtures[row.asin], checkedAt: row.observedAt, endsAt: row.endsAt }]
    }))
    const applied = await redis.eval<[string, number], number>(
      SEED_HASH, [key], [JSON.stringify(seeded), BLACK_FRIDAY_END_MS],
    )
    if (applied !== 1) throw new Error('The launch hash already exists. Nothing seeded.')
    console.log(JSON.stringify({ key, seeded: Object.keys(seeded) }))
    return
  }

  const applied = await redis.eval<[string], number>(APPLY_PASS, [key], [JSON.stringify(rows)])
  if (applied !== 1) throw new Error('Incomplete or stale batch. Nothing changed.')
  console.log(JSON.stringify({
    key,
    refreshed: rows.filter(row => row.state === 'live').map(row => row.asin),
    withdrawn: rows.filter(row => row.state === 'ended').map(row => row.asin),
  }))
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
