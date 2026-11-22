const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')

const implementation = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../lib/verify-deals.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
).outputText

function fixture(records, items) {
  const pending = []
  const commits = []
  const transaction = {
    patch(id, build) {
      const patch = {
        ifRevisionId(revision) { this.revision = revision; return this },
        set(fields) { this.fields = fields; return this },
      }
      const { revision, fields } = build(patch)
      pending.push(JSON.parse(JSON.stringify({ id, revision, fields })))
      return transaction
    },
    async commit() { commits.push([...pending]) },
  }
  const client = {
    withConfig() { return client },
    async fetch(query) {
      assert.match(query, /_id, _rev/)
      return records
    },
    transaction() { return transaction },
  }
  const exports = {}
  vm.runInNewContext(implementation, {
    exports,
    process: { env: {} },
    require(name) {
      if (name === '@sanity/client') return { createClient: () => client }
      if (name === './creators-api') return { getItems: async () => ({ status: 'OK', items }) }
      if (name === './deal-price') return require('../lib/deal-price.ts')
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  return { run: exports.runVerifyDeals, commits }
}

const deal = (id, fields) => ({ _id: id, _rev: `revision-${id}`, _type: 'deal', title: id, asin: id, ...fields })
const item = (asin, fields) => ({ asin, available: true, savingsPercent: 25, ...fields })

test('verification saves the exact observed deal price and timestamp with the same guarded patch', async () => {
  const records = [
    deal('matching', { salePrice: 20, originalPrice: 40 }),
    deal('repriced', { salePrice: 30, originalPrice: 50 }),
    deal('clip-coupon', { salePrice: 20, originalPrice: 24, clipCoupon: true }),
    deal('standalone-coupon', { _type: 'coupon' }),
    deal('missing-price', { salePrice: 20 }),
    deal('out-of-stock', { salePrice: 20 }),
  ]
  const items = [
    item('matching', { currentPrice: 19.75, listPrice: 35 }),
    item('repriced', { currentPrice: 19, listPrice: 46 }),
    item('clip-coupon', { currentPrice: 24 }),
    item('standalone-coupon', { currentPrice: 20 }),
    item('missing-price', { currentPrice: 0 }),
    item('out-of-stock', { currentPrice: 20, available: false }),
  ]
  const { run, commits } = fixture(records, items)
  assert.equal((await run({ execute: false })).status, 'DONE')
  assert.equal(commits.length, 0)
  const result = await run({ execute: true })
  assert.equal(result.status, 'DONE')
  assert.equal(result.rows.find(row => row.id === 'missing-price').action, 'REVIEW')
  assert.equal(commits.length, 1)
  const stamp = commits[0][0].fields.priceVerifiedAt
  assert.ok(stamp && Number.isFinite(Date.parse(stamp)))
  assert.deepEqual(commits[0], [
    { id: 'matching', revision: 'revision-matching', fields: { salePrice: 19.75, originalPrice: 35, priceVerifiedAt: stamp, priceVerificationSource: 'amazon-creators-api', priceApiObservation: { amount: 19.75, checkedAt: stamp } } },
    { id: 'repriced', revision: 'revision-repriced', fields: { salePrice: 19, originalPrice: 46, priceVerifiedAt: stamp, priceVerificationSource: 'amazon-creators-api', priceApiObservation: { amount: 19, checkedAt: stamp } } },
    { id: 'out-of-stock', revision: 'revision-out-of-stock', fields: { active: false } },
  ])
})

test('suspected partial price feed failure never advances any timestamps', async () => {
  const records = Array.from({ length: 6 }, (_, index) => deal(`deal-${index}`, { salePrice: 20 }))
  const { run, commits } = fixture(records, [item('deal-0', { currentPrice: 20, listPrice: 40 })])
  assert.equal((await run({ execute: true })).status, 'SUSPECTED_FAULT')
  assert.equal(commits.length, 0)
})
