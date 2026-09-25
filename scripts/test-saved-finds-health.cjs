const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const base = process.env.TEST_BASE_URL || 'http://localhost:3025'
const storageKey = 'spartanshopper.saved-finds.v1'
;(async () => {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  try {
    await page.goto(`${base}/my-finds`)
    await page.getByText('Your next good find starts here.').waitFor()
    await page.evaluate(key => localStorage.setItem(key, JSON.stringify([
      { kind: 'deal', slug: 'fixture-active', title: 'Active fixture' },
      { kind: 'coupon', slug: 'fixture-expired', title: 'Expired fixture' },
      { kind: 'deal', slug: 'fixture-missing', title: 'Missing fixture' },
    ])), storageKey)
    await page.route('**/api/saved-finds', async route => {
      const finds = route.request().postDataJSON().map(find => ({ ...find, status: find.slug === 'fixture-active' ? 'available' : find.slug === 'fixture-expired' ? 'expired' : 'unavailable', ...(find.slug === 'fixture-active' ? { offer: '$25.00', affiliateSlug: 'fixture-active' } : {}) }))
      await route.fulfill({ json: { finds } })
    })
    await page.reload()
    await page.getByText('$25.00', { exact: true }).waitFor()
    assert.equal(await page.getByRole('link', { name: 'Shop offer' }).count(), 1)
    await page.getByText('Offer expired', { exact: true }).waitFor()
    await page.getByText('Offer no longer listed as active', { exact: true }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.screenshot({ path: 'docs/saved-finds-mobile.png', fullPage: true })
    await page.getByRole('button', { name: 'Remove Expired fixture from My Finds' }).click()
    await page.getByText('2 saved finds', { exact: true }).waitFor()
    await page.reload()
    await page.getByText('2 saved finds', { exact: true }).waitFor()
    await page.route('**/api/saved-finds', route => route.fulfill({ status: 503, json: { error: 'offline' } }))
    await page.getByRole('button', { name: 'Refresh offers' }).click()
    await page.getByRole('alert').filter({ hasText: 'Your saved list is safe' }).waitFor()
    assert.equal(await page.getByRole('link', { name: 'Shop offer' }).count(), 0)
    await page.screenshot({ path: 'docs/saved-finds-offline-mobile.png', fullPage: true })
    await page.goto(`${base}/internal/deal-health`)
    await page.getByLabel('Dashboard access key').fill('incorrect')
    await page.getByRole('button', { name: 'Load review queue' }).click()
    await page.getByRole('alert').filter({ hasText: 'valid dashboard access key' }).waitFor()
    await page.route('**/api/internal/deal-health', route => route.fulfill({ json: { checkedAt: new Date().toISOString(), rows: [{ _id: 'fixture', _type: 'deal', title: 'Review fixture', active: true, issues: [{ severity: 'urgent', message: 'Affiliate destination does not resolve' }] }] } }))
    await page.getByLabel('Dashboard access key').fill('fixture-key')
    await page.getByRole('button', { name: 'Load review queue' }).click()
    await page.getByRole('heading', { name: 'Review fixture' }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.screenshot({ path: 'docs/deal-health-desktop.png', fullPage: true })
    await page.getByRole('button', { name: 'Lock', exact: true }).click()
    assert.equal(await page.getByRole('heading', { name: 'Review fixture' }).count(), 0)
    assert.equal(await page.getByLabel('Dashboard access key').inputValue(), '')
    assert.deepEqual(errors, [])
    console.log('PASS: mobile shortlist, persistence, expired/unavailable states, failure recovery, dashboard authorization and lock; no browser exceptions')
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
