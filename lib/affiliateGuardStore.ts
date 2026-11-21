import { after } from 'next/server'
import { Redis } from '@upstash/redis'
import { affiliateVisitorHash, CHECK_TTL_SECONDS, checkReceiptHash, type CheckClaims } from './affiliateChallenge'
import type { BlockReason, CheckReason, PassReason } from './affiliateRequest'

export const GUARD_PREFIX = 'affiliate-guard:v1'
export const BURST_LIMIT = 30
export const BURST_SECONDS = 60
export const GUARD_RETENTION_SECONDS = 180 * 24 * 60 * 60
const BURST_BUDGET_MS = 175

const pacificDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
})

export function affiliateReportDate(now = Date.now()) {
  const parts = pacificDate.formatToParts(new Date(now))
  const value = (type: string) => parts.find(part => part.type === type)?.value
  return `${value('year')}-${value('month')}-${value('day')}`
}

function affiliateRedis(signal?: AbortSignal) {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  return url && token ? new Redis({ url, token, retry: false, signal }) : null
}

export function afterAffiliateResponse(task: (db: Redis) => Promise<unknown>) {
  after(async () => {
    try {
      const db = affiliateRedis()
      if (db) await task(db)
    } catch {
      // Observability must not prevent shopping or leak request details to logs.
    }
  })
}

const BURST_SCRIPT = `
  if redis.call('EXISTS', KEYS[1]) == 1 then return 0 end
  local count = redis.call('INCR', KEYS[2])
  if count == 1 then redis.call('EXPIRE', KEYS[2], ARGV[1]) end
  return count
`

const provenKey = (visitor: string) => `${GUARD_PREFIX}:proven:${visitor}`

export async function exceedsAffiliateBurst(request: Request, secret?: string) {
  const visitor = affiliateVisitorHash(request, secret)
  if (!visitor) return false
  try {
    const db = affiliateRedis(AbortSignal.timeout(BURST_BUDGET_MS))
    if (!db) return false
    const count = await db.eval<[number], number>(
      BURST_SCRIPT, [provenKey(visitor), `${GUARD_PREFIX}:burst:${visitor}`], [BURST_SECONDS],
    )
    return count > BURST_LIMIT
  } catch {
    return false
  }
}

export function markAffiliateVisitorProven(db: Redis, visitor: string) {
  return db.set(provenKey(visitor), 1, { ex: BURST_SECONDS })
}

function dayKey(now?: number) {
  return `${GUARD_PREFIX}:${affiliateReportDate(now)}:outcomes`
}

export async function incrementAffiliateOutcome(db: Redis, outcome: 'pass' | 'blocked', reason: PassReason | BlockReason) {
  const daily = dayKey()
  const commands = db.pipeline()
  commands.hincrby(daily, outcome, 1)
  commands.hincrby(daily, `${outcome}:${reason}`, 1)
  commands.expire(daily, GUARD_RETENTION_SECONDS)
  await commands.exec()
}

// A newly issued check is provisionally abandoned. A validated continuation
// moves it to check-passed. The receipt handles replays and the race where the
// deferred completion runs before the deferred issuance. No sweeper is needed.
const CHECK_SCRIPT = `
  local state = redis.call('GET', KEYS[2])
  local action, reason, receiptTTL, countTTL = ARGV[1], ARGV[2], ARGV[3], ARGV[4]
  local function bump(outcome, delta)
    redis.call('HINCRBY', KEYS[1], outcome, delta)
    redis.call('HINCRBY', KEYS[1], outcome .. ':' .. reason, delta)
  end
  if action == 'issue' then
    if state then return 0 end
    redis.call('SET', KEYS[2], 'pending', 'EX', receiptTTL)
    bump('check-abandoned', 1)
  else
    if state == 'complete' then return 0 end
    if state == 'pending' then bump('check-abandoned', -1) end
    redis.call('SET', KEYS[2], 'complete', 'EX', receiptTTL)
    bump('check-passed', 1)
  end
  redis.call('EXPIRE', KEYS[1], countTTL)
  return 1
`

export function recordCheckState(db: Redis, action: 'issue' | 'complete', claims: CheckClaims, secret: string) {
  const receipt = `${GUARD_PREFIX}:receipt:${checkReceiptHash(claims, secret)}`
  return db.eval<[string, CheckReason, number, number], number>(CHECK_SCRIPT, [dayKey(claims.issuedAt), receipt], [
    action, claims.reason, CHECK_TTL_SECONDS * 2, GUARD_RETENTION_SECONDS,
  ])
}
