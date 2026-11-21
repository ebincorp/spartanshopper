import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline/promises'
import { pathToFileURL } from 'node:url'
import { chromium, type Locator, type Page } from 'playwright'
import type { Recheck } from '../lib/black-friday-store'

const require = createRequire(import.meta.url)
const { getBlackFridayTarget } = require('../lib/black-friday-offers.ts') as typeof import('../lib/black-friday-offers')
const {
  configuredBlackFridayRedis,
  readBlackFridayCatalog,
  recordBlackFridayRecheck,
} = require('../lib/black-friday-store.ts') as typeof import('../lib/black-friday-store')

const badgePattern = /^(?:Black Friday Deal|Limited[ -]time deal|Lightning deal)$/i
const endPattern = /^Ends (?:in|at|on) \S.+$/i

async function visibleTexts(locators: Locator): Promise<string[]> {
  const texts: string[] = []
  for (const locator of await locators.all()) {
    if (await locator.isVisible()) texts.push((await locator.innerText()).trim())
  }
  return texts
}

function countdownEnd(text: string, now: number): string | undefined {
  const clock = /^Ends in (\d{1,3}):(\d{2}):(\d{2})$/i.exec(text)
  if (clock) return new Date(now + (+clock[1] * 3600 + +clock[2] * 60 + +clock[3]) * 1000).toISOString()

  const words = /^Ends in (?:(\d+) hours?\s*)?(?:(\d+) minutes?\s*)?(?:(\d+) seconds?)?$/i.exec(text)
  if (words && words.slice(1).some(Boolean)) {
    // A display rounded to whole minutes can overstate the remaining seconds.
    const seconds = Number(words[1] ?? 0) * 3600 + Number(words[2] ?? 0) * 60 + Number(words[3] ?? 0)
    const uncertainty = words[3] ? 0 : words[2] ? 60 : 3600
    return new Date(now + Math.max(0, seconds - uncertainty) * 1000).toISOString()
  }

  return undefined
}

type ListingObservation = { state: 'unclear'; reason: string } | { state: 'observed'; text: string; recheck: Recheck }

export async function inspectBlackFridayListing(page: Page, asin: string): Promise<ListingObservation> {
  const url = new URL(page.url())
  if (url.pathname.startsWith('/checkpoint/') || await page.locator('#captchacharacters').count()) {
    return { state: 'unclear', reason: 'Amazon displayed a shopping checkpoint' }
  }

  const title = page.locator('#centerCol #productTitle, #centerCol #title').first()
  if (getBlackFridayTarget(url.href)?.asin !== asin || !await title.isVisible()) {
    return { state: 'unclear', reason: 'The exact product page was not visible' }
  }
  const selectedAsin = await page.locator('input#ASIN').first().getAttribute('value', { timeout: 1000 }).catch(() => null)
  if (selectedAsin && selectedAsin.toUpperCase() !== asin) {
    return { state: 'unclear', reason: 'The selected variant differs from the requested ASIN' }
  }

  // Stay within the selected product’s own offer. Do not read related cards.
  const center = page.locator('#centerCol #apex_desktop, #centerCol #apex_desktop_newAccordionRow, #centerCol #corePrice_feature_div')
  const buyBox = page.locator('#rightCol #desktop_buybox, #rightCol #desktop_qualifiedBuyBox, #rightCol #availability')
  const offerArea = center.or(buyBox)
  const badges = await visibleTexts(offerArea.getByText(badgePattern))
  const timers = await visibleTexts(offerArea.getByText(endPattern))
  const available = (await visibleTexts(buyBox.getByText(/^(?:In Stock|Only \d+ left in stock\b.*)$/i))).length > 0
  const unavailable = (await visibleTexts(buyBox.getByText(/^(?:Currently unavailable|Temporarily out of stock)\.?$/i))).length > 0
  const now = Date.now()
  const observedAt = new Date(now).toISOString()

  if (unavailable || (available && !badges.length && !timers.length && await center.first().isVisible())) {
    return {
      state: 'observed',
      text: unavailable ? 'The exact listing says it is unavailable' : 'No visible deal badge in the exact purchase area',
      recheck: { observedAt, kind: 'withdrawn' },
    }
  }
  if (!available || (!badges.length && !timers.length)) {
    return { state: 'unclear', reason: 'The exact purchase area or stock could not be confirmed' }
  }

  const knownEnds = timers.map(timer => countdownEnd(timer, now)).filter((end): end is string => !!end).sort()
  if (timers.length && !knownEnds.length) {
    return { state: 'unclear', reason: 'The retailer displayed an end time the script could not read' }
  }
  const kind = badges.some(badge => /^Black Friday Deal$/i.test(badge)) ? 'black-friday' : 'limited-time'
  return { state: 'observed', text: [...new Set([...badges, ...timers])].join(' · '), recheck: { observedAt, kind, endsAt: knownEnds[0] } }
}

async function main(args: string[]) {
  const [mode, second, third] = args
  const asin = (mode === '--file' ? third : second)?.toUpperCase()
  if (!asin || !/^[A-Z0-9]{10}$/.test(asin) ||
      !((mode === '--file' && second && args.length === 3) || (mode === '--redis' && args.length === 2))) {
    throw new Error('Use --file <preview-copy.json> <ASIN> or --redis <ASIN>')
  }

  const store = mode === '--file' ? { file: resolve(second) } : configuredBlackFridayRedis()
  if (!store) throw new Error('Redis credentials are missing')
  const product = (await readBlackFridayCatalog(store))[asin]
  if (!product) throw new Error('This ASIN is not registered in the selected store')

  // One listing per invocation. The operator controls the pace and approves each write.
  const input = createInterface({ input: stdin, output: stdout })
  try {
    const start = await input.question(`Open ${product.name} (${asin}) in Chrome? Type open to proceed. `)
    if (start.trim().toLowerCase() !== 'open') return

    const browser = await chromium.launch({ channel: 'chrome', headless: false })
    try {
      const page = await browser.newPage()
      await page.goto(`https://www.amazon.com/dp/${asin}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await input.question('Review the exact purchase area in Chrome, then press Enter to inspect it. ')
      const observation = await inspectBlackFridayListing(page, asin)
      if (observation.state === 'unclear') {
        console.log(`${observation.reason}. No update recorded.`)
        return
      }

      const action = observation.recheck.kind === 'withdrawn' ? 'withdraw' : 'record'
      const confirm = await input.question(`${observation.text}. Type ${action} to apply this observation. `)
      if (confirm.trim().toLowerCase() !== action) return

      const current = await inspectBlackFridayListing(page, asin)
      if (current.state !== 'observed' || current.recheck.kind !== observation.recheck.kind) {
        console.log('The exact offer changed. No update recorded.')
        return
      }
      const updated = await recordBlackFridayRecheck(store, asin, current.recheck)
      console.log(updated ? `${asin} ${action === 'withdraw' ? 'withdrawn' : 'verified'} at ${current.recheck.observedAt}` : 'A newer observation or removal already exists.')
    } finally {
      await browser.close()
    }
  } finally {
    input.close()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
