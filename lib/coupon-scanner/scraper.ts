/**
 * Amazon Associates Promotions Scraper
 *
 * Navigates to https://affiliate-program.amazon.com/home/promotions/summary
 * and extracts active promo codes. Handles login automatically if credentials
 * are provided via AMAZON_EMAIL + AMAZON_PASSWORD env vars.
 *
 * NOTE: If Amazon changes their page structure, update the selectors below.
 * Run the script locally first to verify selectors before relying on cron.
 */

import type { AmazonPromotion } from './types'

export const PROMOTIONS_URL =
  'https://affiliate-program.amazon.com/home/promotions/summary'

const LOGIN_URL = 'https://www.amazon.com/ap/signin'

// ── Selector constants (adjust if Amazon updates their DOM) ──────────────────
const SEL = {
  emailInput:      '#ap_email',
  continueBtn:     '#continue',
  passwordInput:   '#ap_password',
  signInBtn:       '#signInSubmit',
  // Promotions table — each row is one promotion
  promoRow:        'table tr[class*="promotion"], .promotion-row, [data-testid="promotion-row"]',
  // Fallback: any table row after the header
  tableRow:        'table tbody tr',
  // Column indices (0-based) — verify against live page
  colBrand:        0,
  colCode:         1,
  colDiscount:     2,
  colCategory:     3,
  colStartDate:    4,
  colEndDate:      5,
} as const

export interface LaunchOptions {
  executablePath?: string  // Path to Chromium; omit to use default
  headless?: boolean
}

export async function scrapeAmazonPromotions(
  opts: LaunchOptions = {}
): Promise<AmazonPromotion[]> {
  const { chromium } = await import('playwright-core')

  const browser = await chromium.launch({
    executablePath: opts.executablePath,
    headless: opts.headless ?? true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  })

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })
    const page = await context.newPage()

    console.log('[scraper] Navigating to promotions page…')
    await page.goto(PROMOTIONS_URL, { waitUntil: 'networkidle', timeout: 30_000 })

    // ── Handle login redirect ────────────────────────────────────────────────
    if (page.url().includes('signin') || page.url().includes('ap/signin')) {
      const email    = process.env.AMAZON_EMAIL
      const password = process.env.AMAZON_PASSWORD

      if (!email || !password) {
        throw new Error(
          'Amazon Associates login required but AMAZON_EMAIL / AMAZON_PASSWORD are not set. ' +
          'Run locally while logged in, or add credentials to your env vars.'
        )
      }

      console.log('[scraper] Logging in as', email)

      // Step 1 — email
      await page.fill(SEL.emailInput, email)
      await page.click(SEL.continueBtn)
      await page.waitForLoadState('networkidle')

      // Step 2 — password
      await page.fill(SEL.passwordInput, password)
      await page.click(SEL.signInBtn)
      await page.waitForLoadState('networkidle')

      // OTP / 2FA: pause and wait up to 60s for the user to complete (local runs only)
      if (page.url().includes('ap/mfa') || page.url().includes('ap/cvf')) {
        if (opts.headless === false) {
          console.log('[scraper] 2FA required — complete it in the browser window (60s timeout)…')
          await page.waitForNavigation({ timeout: 60_000 })
        } else {
          throw new Error(
            'Amazon requires 2FA but scraper is running headless. ' +
            'Complete a manual login locally to generate a valid session, ' +
            'or disable 2FA on the Amazon Associates account.'
          )
        }
      }

      // Navigate to promotions after login
      await page.goto(PROMOTIONS_URL, { waitUntil: 'networkidle', timeout: 30_000 })
    }

    console.log('[scraper] On promotions page, extracting data…')
    console.log('[scraper] Current URL:', page.url())

    // Give React/JS-rendered content time to load
    await page.waitForTimeout(3000)

    // ── Wait for promotions table ────────────────────────────────────────────
    const hasTable = await page.waitForSelector('table', { timeout: 20_000 })
      .then(() => true)
      .catch(() => false)

    if (!hasTable) {
      // Dump page structure to help diagnose what Amazon is actually rendering
      const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 2000))
      const bodyHtml = await page.evaluate(() => document.body.innerHTML.slice(0, 3000))
      console.warn('[scraper] No <table> found. Page text preview:\n', bodyText)
      console.warn('[scraper] Page HTML preview:\n', bodyHtml)
    }

    // ── Extract promotion rows ───────────────────────────────────────────────
    const promotions = await page.evaluate((sel) => {
      const results: Array<{
        brand: string
        promoCode: string
        discountText: string
        category: string
        startDate: string
        endDate: string
        productUrl: string
      }> = []

      // Try specific promotion row selector first, fall back to all table rows
      let rows = Array.from(document.querySelectorAll(sel.promoRow))
      if (rows.length === 0) {
        const allRows = Array.from(document.querySelectorAll(sel.tableRow))
        // Skip header row (first row often has <th> cells)
        rows = allRows.filter((r) => r.querySelector('td'))
      }

      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll('td'))
        if (cells.length < 4) continue

        const text = (i: number) => cells[i]?.textContent?.trim() ?? ''
        const link = cells[sel.colCode]?.querySelector('a')?.href ?? ''

        results.push({
          brand:        text(sel.colBrand),
          promoCode:    text(sel.colCode).replace(/^use code\s*/i, '').toUpperCase(),
          discountText: text(sel.colDiscount),
          category:     text(sel.colCategory),
          startDate:    text(sel.colStartDate),
          endDate:      text(sel.colEndDate),
          productUrl:   link,
        })
      }

      return results
    }, SEL)

    console.log(`[scraper] Raw rows found: ${promotions.length}`)

    // ── Parse + normalise ────────────────────────────────────────────────────
    const parsed: AmazonPromotion[] = []

    for (const row of promotions) {
      if (!row.promoCode || row.promoCode.length < 2) continue

      const discountPercent = parseDiscount(row.discountText)
      if (discountPercent === null) continue

      parsed.push({
        brand:           row.brand || 'Amazon',
        promoCode:       row.promoCode,
        discountPercent,
        category:        row.category || 'General',
        startDate:       row.startDate,
        endDate:         row.endDate,
        productUrl:      row.productUrl || undefined,
        description:     row.discountText,
      })
    }

    return parsed
  } finally {
    await browser.close()
  }
}

/** Parse a discount string like "50% off" or "$10 off" → returns % or null */
function parseDiscount(text: string): number | null {
  const pctMatch = text.match(/(\d+(?:\.\d+)?)\s*%/)
  if (pctMatch) return parseFloat(pctMatch[1])

  // Dollar-off discounts: treat "$10 off $20" as 50% etc. — skip if can't determine %
  return null
}
