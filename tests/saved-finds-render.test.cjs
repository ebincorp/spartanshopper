const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const { renderToStaticMarkup } = require('react-dom/server')
function load(file, imports = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require: name => imports[name] ?? require(name) })
  return exports
}
const policy = load('lib/saved-finds.ts')
const expiry = load('lib/offerExpiry.ts')
const saved = { kind: 'deal', slug: 'saved', title: 'Saved product' }
function render(status, loading = false, failure = '') {
  let cursor = 0
  const offer = { ...saved, status, offer: '$25.00', affiliateSlug: 'shop-saved', instructions: 'Check selection.' }
  const values = [[offer], loading, failure, 0, 'all', null, new Date()]
  const React = require('react')
  const { default: SavedFinds } = load('components/SavedFinds.tsx', {
    react: { ...React, useState(initial) { return [cursor < values.length ? values[cursor++] : initial, () => {}] }, useEffect() {} },
    'next/link': { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) },
    'next/image': { __esModule: true, default: () => null },
    '@/lib/saved-finds': policy, '@/lib/offerExpiry': expiry,
    './useSavedFinds': { useSavedFinds: () => ({ finds: [saved], ready: true, error: '', remove() {}, save() {} }) },
  })
  return renderToStaticMarkup(React.createElement(SavedFinds))
}
test('failed refresh hides old prices and links while keeping the saved title', () => {
  const html = render('available', false, 'Unable to check')
  assert.match(html, /Saved product/)
  assert.match(html, /Unable to check/)
  assert.doesNotMatch(html, /\$25.00|\/go\/shop-saved|\/deals\/saved/)
})
test('loading, expired, future and inactive cards never show shopping links or old prices', () => {
  for (const html of [render('available', true), render('expired'), render('upcoming'), render('unavailable')]) {
    assert.match(html, /Saved product/)
    assert.doesNotMatch(html, /\$25.00|\/go\/shop-saved|\/deals\/saved/)
  }
})
test('available shortlist cards expose attributed sponsored redirects and detail links', () => {
  const html = render('available')
  assert.match(html, /\$25.00/)
  assert.match(html, /href="\/go\/shop-saved"/)
  assert.match(html, /data-saved-find="deal:saved"/)
  assert.match(html, /rel="noopener noreferrer sponsored nofollow"/)
  assert.match(html, /href="\/deals\/saved"/)
  assert.ok(html.indexOf('Affiliate disclosure') < html.indexOf('/go/shop-saved'))
})
