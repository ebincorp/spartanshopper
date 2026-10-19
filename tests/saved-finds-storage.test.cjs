const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
function load(file, imports = {}, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require: name => imports[name] ?? require(name), ...globals })
  return exports
}
const policy = load('lib/saved-finds.ts')
function harness(blocked = false) {
  const states = [], effects = [], events = [], listeners = new Map()
  let cursor = 0, mounted = false, stored = null
  const localStorage = {
    getItem() { if (blocked) throw Error('Blocked'); return stored },
    setItem(key, value) { if (blocked) throw Error('Blocked'); stored = value },
  }
  const window = {
    addEventListener(name, callback) { listeners.set(name, callback) },
    removeEventListener(name) { listeners.delete(name) },
    dispatchEvent(event) { listeners.get(event.type)?.() },
    gtag(...args) { events.push(args) },
  }
  const { useSavedFinds } = load('components/useSavedFinds.ts', {
    '@/lib/saved-finds': policy,
    react: {
      useState(initial) { const slot = cursor++; if (!(slot in states)) states[slot] = initial; return [states[slot], value => { states[slot] = value }] },
      useEffect(callback) { if (!mounted) effects.push(callback) },
    },
  }, { window, localStorage, Event })
  function render() {
    cursor = 0
    const value = useSavedFinds()
    if (!mounted) { mounted = true; effects.forEach(effect => effect()); return render() }
    return value
  }
  return { render, events, stored: () => stored, setBlocked: value => { blocked = value }, window }
}
const find = { kind: 'coupon', slug: 'coupon-pick', title: 'Coupon pick' }
test('save, remove and undo record one event each and never persist offer secrets', () => {
  const h = harness()
  assert.equal(h.render().ready, true)
  assert.equal(h.render().save({ ...find, code: 'SECRET', offer: '$5' }), true)
  assert.deepEqual(JSON.parse(h.stored()), [find])
  assert.equal(h.render().finds.length, 1)
  assert.equal(h.render().save(find), true)
  assert.equal(h.events.length, 1)
  assert.equal(h.render().remove(find), true)
  assert.equal(h.render().finds.length, 0)
  assert.equal(h.render().save(find), true)
  assert.deepEqual(h.events.map(event => event[1]), ['save_find', 'remove_saved_find', 'save_find'])
  assert.equal(h.events[0][2].item_slug, find.slug)
  assert.equal(h.events[0][2].code, undefined)
})
test('blocked storage reports failure without counting a save and recovers on sync', () => {
  const h = harness(true)
  assert.match(h.render().error, /blocking/)
  assert.equal(h.render().save(find), false)
  assert.equal(h.events.length, 0)
  h.setBlocked(false)
  assert.equal(h.render().save(find), true)
  assert.equal(h.render().error, '')
  assert.equal(h.render().finds.length, 1)
})
test('blocked analytics never prevents saving', () => {
  const h = harness()
  h.window.gtag = () => { throw Error('Analytics blocked') }
  assert.equal(h.render().save(find), true)
  assert.equal(h.render().finds.length, 1)
})
const { offerExpiryLabel } = load('lib/offerExpiry.ts')
test('timed expiry labels preserve Pacific sale dates while date-only labels stay calendar dates', () => {
  assert.equal(offerExpiryLabel('2026-10-31T23:59:00-07:00', 'America/Los_Angeles'), 'Oct 31, 2026')
  assert.equal(offerExpiryLabel('2026-12-31'), 'Dec 31, 2026')
  assert.equal(offerExpiryLabel('invalid'), null)
  assert.equal(offerExpiryLabel('2099-12-31'), null)
})
