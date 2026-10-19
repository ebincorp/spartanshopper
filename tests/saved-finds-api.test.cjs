const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
function load(file, imports = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require: name => imports[name] ?? (name === '@/lib/deal-price' ? load('lib/deal-price.ts') : require(name)), URL, process, Buffer, console })
  return exports
}
const policy = load('lib/saved-finds.ts')
const request = body => new Request('http://localhost/api/saved-finds', { method: 'POST', body: JSON.stringify(body) })
test('saved-finds API omits expired prices, future shopping links and coupon codes', async () => {
  const records = [
    { _type: 'deal', slug: 'active', title: 'Current title', active: true, salePrice: 12, priceVerifiedAt: new Date().toISOString(), affiliateSlug: 'shop-active' },
    { _type: 'coupon', slug: 'expired', title: 'Expired', active: true, expiryDate: '2020-01-01', discount: 'Secret old offer', code: 'DO-NOT-RETURN', affiliateSlug: 'shop-expired' },
    { _type: 'deal', slug: 'future', title: 'Future', active: true, startDate: '2099-01-01', affiliateSlug: 'shop-future' },
  ]
  const route = load('app/api/saved-finds/route.ts', { '@/lib/saved-finds': policy, '@/lib/sanity.client': { client: { fetch: async () => records } } })
  const response = await route.POST(request([...records.map(r => ({ kind: r._type, slug: r.slug, title: 'Stored title' })), { kind: 'deal', slug: 'unpublished', title: 'Old title' }]))
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  const { finds } = await response.json()
  assert.equal(finds[0].offer, '$12.00')
  assert.equal(finds[0].title, 'Current title')
  assert.equal(finds[1].status, 'expired')
  assert.equal(finds[1].offer, undefined)
  assert.equal(finds[1].code, undefined)
  assert.equal(finds[2].status, 'upcoming')
  assert.equal(finds[2].affiliateSlug, undefined)
  assert.equal(finds[3].status, 'unavailable')
})
test('invalid lists do not query Sanity and fetch failures stay distinguishable from unavailable offers', async () => {
  let calls = 0
  const route = load('app/api/saved-finds/route.ts', { '@/lib/saved-finds': policy, '@/lib/sanity.client': { client: { fetch: async () => { calls++; throw new Error('Offline') } } } })
  assert.equal((await route.POST(request([{ kind: 'deal', slug: '../oops', title: 'X' }]))).status, 400)
  assert.equal(calls, 0)
  assert.equal((await route.POST(request([{ kind: 'deal', slug: 'valid', title: 'X' }]))).status, 503)
})

test('shortlist returns expiry and coupon steps without disclosing codes or inventing clip requirements', async () => {
  const records = [
    { _type: 'coupon', slug: 'with-code', title: 'Coupon', active: true, hasCode: true, code: 'PRIVATECODE', discount: '20% off', expiryDate: '2090-01-01' },
    { _type: 'deal', slug: 'clip', title: 'Clip deal', active: true, salePrice: 27.99, description: 'Clip the 30% coupon for this selection.' },
    { _type: 'deal', slug: 'markdown', title: 'Sale', active: true, salePrice: 19.99, description: 'No clip coupon or confirmed sale end date shown.' },
  ]
  const route = load('app/api/saved-finds/route.ts', { '@/lib/saved-finds': policy, '@/lib/sanity.client': { client: { fetch: async () => records } } })
  const response = await route.POST(request(records.map(r => ({ kind: r._type, slug: r.slug, title: 'Stored title' }))))
  const { finds } = await response.json()
  assert.match(finds[0].instructions, /apply it at checkout/)
  assert.equal(finds[0].expiryDate, '2090-01-01')
  assert.match(finds[1].instructions, /clip the coupon/)
  assert.doesNotMatch(finds[2].instructions, /clip/)
  assert.ok(!JSON.stringify(finds).includes('PRIVATECODE'))
})

test('missing records discard extra client fields and invalid deal prices stay hidden', async () => {
  const records = [{ _type: 'deal', slug: 'invalid-price', title: 'Invalid', active: true, salePrice: -5 }]
  const route = load('app/api/saved-finds/route.ts', { '@/lib/saved-finds': policy, '@/lib/sanity.client': { client: { fetch: async () => records } } })
  const response = await route.POST(request([
    { kind: 'deal', slug: 'missing', title: 'Saved', code: 'INJECTED', affiliateSlug: 'stale', offer: '$1' },
    { kind: 'deal', slug: 'invalid-price', title: 'Invalid' },
  ]))
  const { finds } = await response.json()
  assert.deepEqual(finds[0], { kind: 'deal', slug: 'missing', title: 'Saved', status: 'unavailable' })
  assert.equal(finds[1].offer, 'Check current price')
})
test('dashboard API rejects unauthorized reads and writes before any data access', async () => {
  let calls = 0
  const route = load('app/api/internal/deal-health/route.ts', {
    '@/lib/deal-health-auth': { healthAuthorized: () => false },
    '@/lib/deal-health': {}, '@/lib/sanity.client': { client: { fetch: () => { calls++ } } },
    '@/lib/verify-deals': { runVerifyDeals: () => { calls++ } },
  })
  for (const method of ['GET', 'POST']) assert.equal((await route[method](new Request('http://localhost/api/internal/deal-health', { method }))).status, 401)
  assert.equal(calls, 0)
})
test('dashboard price checks force dry-run and published scope regardless of request body', async () => {
  let options
  const route = load('app/api/internal/deal-health/route.ts', {
    '@/lib/deal-health-auth': { healthAuthorized: () => true },
    '@/lib/deal-health': {}, '@/lib/sanity.client': {},
    '@/lib/verify-deals': { runVerifyDeals: async opts => { options = opts; return { status: 'NO_RECORDS', rows: [] } } },
  })
  const response = await route.POST(request({ execute: true }))
  assert.equal(response.status, 200)
  assert.equal(options.execute, false)
  assert.equal(options.publishedOnly, true)
})


test('old stored prices do not override production freshness policy', async () => {
  const records = [{ _type: 'deal', slug: 'old-price', title: 'Old', active: true, salePrice: 12, priceVerifiedAt: '2020-01-01' }]
  const route = load('app/api/saved-finds/route.ts', { '@/lib/saved-finds': policy, '@/lib/sanity.client': { client: { fetch: async () => records } } })
  const response = await route.POST(request([{ kind: 'deal', slug: 'old-price', title: 'Old' }]))
  const { finds } = await response.json()
  assert.equal(finds[0].offer, 'Check current price')
  assert.equal(finds[0].status, 'available')
})
