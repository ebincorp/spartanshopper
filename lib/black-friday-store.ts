import { readFile, rename, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { Redis } from '@upstash/redis'
import {
  isBlackFridayLaunchAsin,
  isBlackFridayOfferLive,
  type BlackFridayOffer,
  type StoredBlackFridayOffer,
} from './black-friday-offers'

export type BlackFridayCatalog = Record<string, StoredBlackFridayOffer>
export type Recheck =
  | { observedAt: string; kind: StoredBlackFridayOffer['kind']; endsAt?: string }
  | { observedAt: string; kind: 'withdrawn' }

type RedisStore = { redis: Redis; key: string }
type Store = { file: string } | RedisStore

export const BLACK_FRIDAY_REDIS_KEY = 'spartanshopper:black-friday:offers:2026'

export function validTimestamp(value: unknown): value is string {
  return typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value))
}

function parseCatalog(value: unknown): BlackFridayCatalog {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  return Object.fromEntries(Object.entries(value).filter(([asin, offer]) =>
    isBlackFridayLaunchAsin(asin) &&
    offer && typeof offer === 'object' &&
    typeof offer.name === 'string' && offer.name.length > 0 &&
    (offer.kind === 'black-friday' || offer.kind === 'limited-time') &&
    validTimestamp(offer.checkedAt) &&
    (offer.endsAt === undefined || validTimestamp(offer.endsAt)) &&
    (offer.withdrawnAt === undefined || validTimestamp(offer.withdrawnAt)) &&
    Array.isArray(offer.goSlugs) &&
    offer.goSlugs.every((slug: unknown) => typeof slug === 'string' && /^[a-z0-9-]+$/.test(slug)),
  ))
}

export function configuredBlackFridayRedis(): RedisStore | undefined {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (!url || !token) return undefined
  return { redis: new Redis({ url, token }), key: BLACK_FRIDAY_REDIS_KEY }
}

export async function readBlackFridayCatalog(store: Store): Promise<BlackFridayCatalog> {
  const value = 'file' in store
    ? JSON.parse(await readFile(store.file, 'utf8'))
    : await store.redis.hgetall(store.key)
  return parseCatalog(value)
}

export async function readLiveBlackFridayOffers(now: number): Promise<BlackFridayOffer[]> {
  const file = process.env.NODE_ENV === 'development' ? process.env.BLACK_FRIDAY_PREVIEW_FILE : undefined
  const store = file ? { file } : configuredBlackFridayRedis()
  if (!store) return []

  return Object.entries(await readBlackFridayCatalog(store))
    .filter(([, offer]) => isBlackFridayOfferLive(offer, now))
    .map(([asin, { name, kind, checkedAt, goSlugs, endsAt, withdrawnAt }]) =>
      ({ asin, name, kind, checkedAt, goSlugs, endsAt, withdrawnAt }),
    )
}

export function mergeBlackFridayRecheck(offer: StoredBlackFridayOffer, recheck: Recheck): StoredBlackFridayOffer | undefined {
  if (recheck.observedAt <= (offer.withdrawnAt ?? offer.checkedAt)) return undefined
  if (recheck.kind === 'withdrawn') return { ...offer, withdrawnAt: recheck.observedAt }

  return { ...offer, kind: recheck.kind, checkedAt: recheck.observedAt, endsAt: recheck.endsAt, withdrawnAt: undefined }
}

// Update only observed offer state. A concurrent operator may have changed the
// same record's product name or redirect aliases since the listing was opened.
const UPDATE_OFFER = `
  local current = redis.call('HGET', KEYS[1], ARGV[1])
  if not current then return 0 end
  local offer = cjson.decode(current)
  local check = cjson.decode(ARGV[2])
  if check.observedAt <= (offer.withdrawnAt or offer.checkedAt) then return 0 end
  if check.kind == 'withdrawn' then
    offer.withdrawnAt = check.observedAt
  else
    offer.checkedAt = check.observedAt
    offer.kind = check.kind
    offer.endsAt = check.endsAt
    offer.withdrawnAt = nil
  end
  redis.call('HSET', KEYS[1], ARGV[1], cjson.encode(offer))
  return 1
`

export async function recordBlackFridayRecheck(store: Store, asin: string, recheck: Recheck): Promise<boolean> {
  if (!isBlackFridayLaunchAsin(asin)) throw new Error('ASIN is outside the Black Friday launch scope')
  if (!validTimestamp(recheck.observedAt)) throw new Error('Invalid observation time')
  if (!('file' in store)) {
    return (await store.redis.eval<[string, string], number>(UPDATE_OFFER, [store.key], [asin, JSON.stringify(recheck)])) === 1
  }

  const catalog = await readBlackFridayCatalog(store)
  const existing = catalog[asin]
  const updated = existing && mergeBlackFridayRecheck(existing, recheck)
  if (!updated) return false

  // Single-operator preview file. Redis uses an atomic update for concurrent writes.
  const temporary = `${store.file}.${randomUUID()}.tmp`
  await writeFile(temporary, JSON.stringify({ ...catalog, [asin]: updated }, null, 2) + '\n', { flag: 'wx' })
  await rename(temporary, store.file)
  return true
}
