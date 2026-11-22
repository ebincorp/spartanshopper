'use client'

import { useState } from 'react'

const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default function PatchCostCalculator() {
  const [count, setCount] = useState('60')
  const [total, setTotal] = useState('')
  const patches = Number(count)
  const price = Number(total)
  const applications = Number.isSafeInteger(patches) && patches >= 2 ? Math.floor(patches / 2) : 0
  const hasPrice = total.trim() !== '' && Number.isFinite(price) && price >= 0
  const applicationCount = applications === 1 ? '1 two-patch application' : applications + ' two-patch applications'

  return (
    <section id="patch-cost-calculator" aria-labelledby="patch-cost-heading" className="mb-8 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
      <h2 id="patch-cost-heading" className="text-xl font-extrabold text-[#1A1A2E]">How much will each use cost?</h2>
      <p className="mt-2 text-sm text-gray-700">Use the number of individual patches on your jar. Include shipping and tax in the total you enter.</p>
      <form className="mt-4" onSubmit={event => event.preventDefault()}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block min-w-0 text-sm font-medium text-gray-700">
            Individual patches
            <input
              className="mt-1 block w-full rounded-md border border-gray-400 bg-white px-2 py-2 text-base text-gray-900 focus:border-[#A62B3E] focus:outline-[#A62B3E]"
              type="number"
              inputMode="numeric"
              min="2"
              step="1"
              value={count}
              onChange={event => setCount(event.target.value)}
            />
          </label>
          <label className="block min-w-0 text-sm font-medium text-gray-700">
            Checkout total in USD
            <input
              className="mt-1 block w-full rounded-md border border-gray-400 bg-white px-2 py-2 text-base text-gray-900 focus:border-[#A62B3E] focus:outline-[#A62B3E]"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={total}
              onChange={event => setTotal(event.target.value)}
            />
          </label>
        </div>
        <output aria-live="polite" className="mt-4 block rounded-md bg-[#fff1f2] p-3 text-sm text-gray-900">
          {!applications
            ? 'Enter a whole number of at least two patches.'
            : hasPrice
              ? applicationCount + ' at ' + dollars.format(price / applications) + ' per application.'
              : applicationCount + '. Enter the checkout total for cost per application.'}
        </output>
      </form>
    </section>
  )
}
