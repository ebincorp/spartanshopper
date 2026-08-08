/**
 * Verify active deals/coupons (that carry an asin) against live Amazon prices
 * via the Creators API. PERMANENT — does not self-delete.
 *
 *   npx tsx scripts/verify-amazon-deals.ts            # dry-run (default)
 *   npx tsx scripts/verify-amazon-deals.ts --execute  # apply mutations
 *
 * Exit codes: 0 on success (including NOT_YET_ELIGIBLE / no records), 1 on error.
 */
import path from 'path'
import dotenv from 'dotenv'
import { runVerifyDeals, type VerifyRow } from '../lib/verify-deals'

// Load env for standalone runs. SANITY_API_TOKEN lives in .env.local, the
// CREATORS_API_* credentials in .env — load both, .env.local taking precedence.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true })
dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true })

const execute = process.argv.includes('--execute')

function printTable(rows: VerifyRow[]) {
  const header = ['ACTION', 'TYPE', 'ASIN', 'STORED', 'LIVE', 'SAV%', 'TITLE']
  const data = rows.map((r) => [
    r.action,
    r.type,
    r.asin,
    r.storedPrice != null ? `$${r.storedPrice}` : '—',
    r.newPrice != null ? `$${r.newPrice}` : '—',
    r.savingsPercent != null ? `${r.savingsPercent}%` : '—',
    r.title.length > 48 ? r.title.slice(0, 47) + '…' : r.title,
  ])
  const widths = header.map((h, i) => Math.max(h.length, ...data.map((d) => d[i].length)))
  const fmt = (cols: string[]) => cols.map((c, i) => c.padEnd(widths[i])).join('  ')
  console.log(fmt(header))
  console.log(widths.map((w) => '-'.repeat(w)).join('  '))
  for (const d of data) console.log(fmt(d))
}

async function main() {
  console.log(`\nVerify Amazon deals — ${execute ? 'EXECUTE (mutations ON)' : 'DRY-RUN (default)'}\n`)

  const result = await runVerifyDeals({ execute })

  if (result.status === 'NOT_YET_ELIGIBLE') {
    console.log('⏳ NOT_YET_ELIGIBLE — ' + result.message)
    console.log('   No records mutated. This is expected until Amazon completes eligibility review.')
    process.exit(0)
  }

  if (result.status === 'NO_RECORDS') {
    console.log('No active deals/coupons with an asin were found. Nothing to verify.')
    process.exit(0)
  }

  if (result.status === 'SUSPECTED_FAULT') {
    printTable(result.rows)
    console.log(
      `\n🚨 SUSPECTED_FAULT — ${result.unavailable}/${result.checked} came back "unavailable" ` +
        `(> ${'50'}% threshold).`
    )
    console.log(
      '   This looks like an Amazon API fault, not a real mass-expiry. NOTHING was mutated.'
    )
    console.log(
      '   Re-run manually once the API is confirmed healthy if these deactivations are genuine.'
    )
    process.exit(1)
  }

  printTable(result.rows)

  const counts = result.rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.action] = (acc[r.action] || 0) + 1
    return acc
  }, {})
  console.log(
    `\nSummary: ${result.rows.length} checked — ` +
      `OK ${counts.OK || 0}, UPDATED ${counts.UPDATED || 0}, DEACTIVATED ${counts.DEACTIVATED || 0}` +
      (execute ? ' (applied)' : ' (dry-run — no changes written)')
  )
  process.exit(0)
}

main().catch((err) => {
  console.error('\n❌ verify-amazon-deals failed:')
  console.error(err instanceof Error ? err.stack : err)
  process.exit(1)
})
