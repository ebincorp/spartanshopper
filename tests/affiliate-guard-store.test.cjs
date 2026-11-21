const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')
const challenge = require('../lib/affiliateChallenge.ts')

const request = new Request('https://www.spartanshopper.com/go/test-product', {
  headers: {
    'user-agent': 'Typical browser/130.0',
    'x-vercel-forwarded-for': '192.0.2.15',
    cookie: 'example_cookie=never_store_me',
  },
})
const now = Date.parse('2026-11-22T00:01:00Z')
const secret = 'synthetic-test-key'

function guardStore(evalCommand, { onVercel = true, configured = true } = {}) {
  const source = readFileSync(path.join(__dirname, '../lib/affiliateGuardStore.ts'), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  })
  const exports = {}
  const clients = []
  class FixtureRedis {
    constructor(config) { clients.push(config) }
    eval(...args) { return evalCommand(...args) }
  }
  const dependencies = {
    'next/server': { after() {} },
    '@upstash/redis': { Redis: FixtureRedis },
    './affiliateChallenge': {
      ...challenge,
      affiliateVisitorHash: (req, key) => challenge.affiliateVisitorHash(req, key, now, onVercel),
    },
  }
  const env = configured ? { UPSTASH_REDIS_REST_URL: 'https://redis.example', UPSTASH_REDIS_REST_TOKEN: 'fixture' } : {}
  vm.runInNewContext(outputText, { exports, require: name => dependencies[name], process: { env }, AbortSignal })
  return { ...exports, clients }
}

test('visitor hashes are scoped to Vercel, private and rotated at UTC midnight', () => {
  const hash = (req, at) => challenge.affiliateVisitorHash(req, secret, at, true)
  const first = hash(request, now)
  assert.match(first, /^[A-Za-z0-9_-]{43}$/)
  assert.equal(first, hash(request, now + 10))
  assert.notEqual(first, hash(request, now - 120_000))
  const onlyForwardedFor = new Request(request.url, { headers: {
    'x-forwarded-for': '192.0.2.15', 'user-agent': 'Typical browser/130.0',
  } })
  assert.equal(hash(onlyForwardedFor, now), null)
  assert.equal(challenge.affiliateVisitorHash(request, secret, now, false), null)
})

test('signed proofs bind one route and can cross UTC midnight before expiration', () => {
  const { proof, claims } = challenge.issueAffiliateCheck(request, 'test-product', 'missing-navigation', secret, now - 120_000)
  assert.deepEqual(challenge.validateAffiliateCheck(proof, 'test-product', secret, now), claims)
  assert.equal(challenge.validateAffiliateCheck(proof, 'another-product', secret, now), null)
  assert.equal(challenge.validateAffiliateCheck(proof, 'test-product', secret, now + 181_000), null)
  const body = Buffer.from(proof.split('.')[0], 'base64url').toString()
  assert.doesNotMatch(body, /192\.0\.2\.15|never_store_me|Typical browser|https:/)
})

test('burst check uses private Redis keys, a bounded command, and only blocks after 30 attempts', async () => {
  let count = 0
  const store = guardStore((lua, keys, args) => {
    assert.match(lua, /'EXISTS'.*KEYS\[1\]/)
    assert.match(lua, /'EXPIRE'.*KEYS\[2\]/)
    assert.match(keys[0], /^affiliate-guard:v1:proven:[\w-]{43}$/)
    assert.match(keys[1], /^affiliate-guard:v1:burst:[\w-]{43}$/)
    assert.doesNotMatch(keys.join(), /192\.0\.2\.15|never_store_me|Typical browser/)
    assert.equal(args[0], 60)
    return ++count
  })
  for (let i = 0; i < 30; i++) assert.equal(await store.exceedsAffiliateBurst(request, secret), false)
  assert.equal(await store.exceedsAffiliateBurst(request, secret), true)
  assert.equal(store.clients[0].retry, false)
  assert.ok(store.clients[0].signal instanceof AbortSignal)
})

test('missing identity, missing Redis and Redis errors fail open', async () => {
  const never = () => assert.fail('No Redis command expected')
  for (const opts of [{ onVercel: false }, { configured: false }]) {
    assert.equal(await guardStore(never, opts).exceedsAffiliateBurst(request, secret), false)
  }
  assert.equal(await guardStore(() => { throw new Error('Offline') }).exceedsAffiliateBurst(request, secret), false)
  assert.equal(await guardStore(() => 0).exceedsAffiliateBurst(request, secret), false)
})

test('issue and completion pass only a hashed receipt and the original cohort to the atomic counter script', async () => {
  const store = guardStore(() => 0)
  const { claims } = challenge.issueAffiliateCheck(request, 'test-product', 'missing-navigation', secret, now)
  const db = { eval(lua, keys, [action, reason, ttl, retention]) {
    assert.match(lua, /if state == 'complete' then return 0/)
    assert.match(lua, /if state == 'pending' then bump\('check-abandoned', -1\)/)
    assert.match(lua, /bump\('check-passed', 1\)/)
    assert.equal(keys[0], 'affiliate-guard:v1:2026-11-21:outcomes')
    assert.match(keys[1], /^affiliate-guard:v1:receipt:[\w-]{43}$/)
    assert.ok(!keys[1].includes(claims.nonce))
    assert.equal(reason, 'missing-navigation')
    assert.equal(ttl, challenge.CHECK_TTL_SECONDS * 2)
    assert.equal(retention, 180 * 86400)
    return action === 'issue' ? 1 : 0
  } }
  assert.equal(await store.recordCheckState(db, 'issue', claims, secret), 1)
  assert.equal(await store.recordCheckState(db, 'complete', claims, secret), 0)
})
