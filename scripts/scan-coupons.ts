/**
 * Local coupon scanner — run this from your machine where you're already
 * logged into Amazon Associates, or provide AMAZON_EMAIL + AMAZON_PASSWORD.
 *
 * Usage:
 *   npx tsx scripts/scan-coupons.ts
 *
 * Options (env vars):
 *   AMAZON_EMAIL      — Associates login email (optional if already logged in via saved session)
 *   AMAZON_PASSWORD   — Associates password
 *   HEADLESS=false    — Show the browser window (useful for debugging / 2FA)
 *   NOTIFICATION_EMAIL + RESEND_API_KEY — to receive email summary
 */

import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
import { runCouponScan } from '../lib/coupon-scanner'

// Detect a local Chrome installation on Windows/Mac/Linux
function detectChrome(): string | undefined {
  const { platform } = process
  if (platform === 'win32') {
    const paths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ]
    for (const p of paths) {
      try {
        require('fs').accessSync(p)
        return p
      } catch { /* not found */ }
    }
  } else if (platform === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  } else {
    return '/usr/bin/google-chrome'
  }
  return undefined
}

async function main() {
  console.log('═══════════════════════════════════════')
  console.log('  SpartanShopper — Coupon Scanner')
  console.log('═══════════════════════════════════════')

  const headless = process.env.HEADLESS !== 'false'
  const executablePath = detectChrome()

  if (executablePath) {
    console.log(`[local] Using Chrome at: ${executablePath}`)
  } else {
    console.log('[local] No Chrome found — Playwright will use its own Chromium')
  }

  const result = await runCouponScan({ executablePath, headless })

  console.log('\n── Results ──────────────────────────────')
  console.log(`  Promotions found: ${result.found.length}`)
  console.log(`  Drafts created:   ${result.added.length}`)
  console.log(`  Skipped:          ${result.skipped.length}`)
  if (result.errors.length > 0) {
    console.log(`  Errors:           ${result.errors.length}`)
    result.errors.forEach((e) => console.error(' ', e))
  }

  if (result.added.length > 0) {
    console.log('\n── New drafts ───────────────────────────')
    result.added.forEach((d) => {
      console.log(`  • ${d.title} | ${d.code} | expires ${d.expiryDate}`)
    })
    console.log('\nReview at: https://spartanshopper.sanity.studio')
  }
}

main().catch((err) => {
  console.error('[fatal]', err)
  process.exit(1)
})
