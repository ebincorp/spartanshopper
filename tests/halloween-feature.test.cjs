const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

const exportsObject = {}
const source = ts.transpileModule(fs.readFileSync('lib/halloween-feature.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText
vm.runInNewContext(source, { exports: exportsObject })
const { isHalloweenFeatureActive: isActive, halloweenGuides: guides } = exportsObject

test('campaign is bounded to October 21–31, 2026 in Los Angeles', () => {
  assert.equal(isActive(Date.parse('2026-10-21T06:59:59.999Z')), false)
  assert.equal(isActive(Date.parse('2026-10-21T07:00:00.000Z')), true)
  assert.equal(isActive(Date.parse('2026-11-01T06:59:59.999Z')), true)
  assert.equal(isActive(Date.parse('2026-11-01T07:00:00.000Z')), false)
  assert.equal(isActive(Date.parse('2027-10-21T12:00:00.000Z')), false)
  assert.equal(isActive(NaN), false)
})

test('campaign routes readers to three distinct existing guides without offer promises', () => {
  assert.deepEqual(Array.from(guides, guide => guide.href), [
    '/blog/last-minute-halloween-costumes-2026',
    '/blog/indoor-halloween-decorations-2026',
    '/blog/non-candy-halloween-treats',
  ])
  assert.equal(new Set(guides.map(guide => guide.href)).size, 3)
  for (const guide of guides) {
    assert(!/\$\d|\d+%|arrives? by|guaranteed/i.test(guide.title + guide.description + guide.cta))
  }
})

test('homepage placement preserves disclosure, urgent offers, metadata, and one H1', () => {
  const page = fs.readFileSync('app/page.tsx', 'utf8')
  const component = fs.readFileSync('components/HalloweenFeature.tsx', 'utf8')
  assert(page.indexOf('How affiliate links work') < page.indexOf('<HalloweenFeature />'))
  assert(page.indexOf('<HalloweenFeature />') < page.indexOf('<EndingSoonDeals deals='))
  assert(page.includes('export const revalidate = 300'))
  assert(page.includes('isHalloweenFeatureActive() && <HalloweenFeature />'))
  assert(page.includes("absoluteTitle: 'SpartanShopper — Coupon Codes & Shopping Deals'"))
  assert.equal((page.match(/<h1\b/g) || []).length, 1)
  assert.equal((component.match(/<h1\b/g) || []).length, 0)
  assert(component.includes('aria-labelledby="halloween-title"'))
  assert(component.includes('href="/blog/halloween-shopping-guide-2026"'))
  assert(component.includes('Delivery before Halloween is not guaranteed.'))
})

test('feature renders a labelled section and four keyboard-accessible guide links', () => {
  const componentExports = {}
  const componentCode = ts.transpileModule(fs.readFileSync('components/HalloweenFeature.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  vm.runInNewContext(componentCode, {
    exports: componentExports,
    require: name => {
      if (name === '@/lib/halloween-feature') return exportsObject
      if (name === 'next/link') return { default: ({ children, ...props }) => React.createElement('a', props, children) }
      return require(name)
    },
  })
  const html = renderToStaticMarkup(React.createElement(componentExports.default))
  assert.equal((html.match(/<a /g) || []).length, 4)
  assert.equal((html.match(/<h2 /g) || []).length, 1)
  assert.equal((html.match(/<h3 /g) || []).length, 3)
  assert.equal((html.match(/focus-visible:outline-offset-4/g) || []).length, 4)
  assert(html.includes('aria-labelledby="halloween-title"'))
  for (const guide of guides) assert(html.includes(`href="${guide.href}"`))
})
