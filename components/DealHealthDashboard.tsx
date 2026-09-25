'use client'

import { useState } from 'react'
import type { HealthRow } from '@/lib/deal-health'
import type { VerifyResult } from '@/lib/verify-deals'

export default function DealHealthDashboard() {
  const [key, setKey] = useState('')
  const [rows, setRows] = useState<HealthRow[] | null>(null)
  const [checked, setChecked] = useState('')
  const [priceChecked, setPriceChecked] = useState('')
  const [prices, setPrices] = useState<VerifyResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('issues')
  const [search, setSearch] = useState('')
  async function load(priceCheck = false) {
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/internal/deal-health', { method: priceCheck ? 'POST' : 'GET', headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Check failed')
      if (priceCheck) { setPrices(data.result); setPriceChecked(data.checkedAt) }
      else { setRows(data.rows); setChecked(data.checkedAt) }
    } catch (e) { setError(e instanceof Error ? e.message : 'Check failed') }
    finally { setBusy(false) }
  }
  const visible = (rows || []).filter(row => (filter === 'all' || (filter === 'urgent' ? row.issues.some(i => i.severity === 'urgent') : row.issues.length > 0)) && `${row.title} ${row._type}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => Number(b.issues.some(i => i.severity === 'urgent')) - Number(a.issues.some(i => i.severity === 'urgent')) || a.title.localeCompare(b.title))
  function download() {
    const blob = new Blob([JSON.stringify({ checkedAt: checked, rows, priceCheckedAt: priceChecked, prices }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = url; link.download = 'spartanshopper-deal-health.json'; link.click(); URL.revokeObjectURL(url)
  }
  return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
    <p className="text-xs font-bold uppercase tracking-widest text-rose-800">SpartanShopper / Internal</p>
    <h1 className="mt-3 text-4xl font-extrabold text-[#1A1A2E]">Deal health</h1>
    <p className="mt-4 max-w-3xl text-slate-600">Review offer dates, redirect configuration, and stored prices. Run an Amazon price check when needed. Checks are read-only; open Sanity to make editorial changes.</p>
    <form onSubmit={event => { event.preventDefault(); void load() }} className="my-8 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5">
      <label className="flex-1 text-sm font-semibold">Dashboard access key<input required type="password" autoComplete="off" value={key} onChange={event => setKey(event.target.value)} className="mt-2 block w-full min-w-0 rounded-lg border border-slate-300 p-3" /></label>
      <button disabled={busy} className="rounded-xl bg-[#1A1A2E] px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Checking…' : 'Load review queue'}</button>
      {rows && <button type="button" disabled={busy} onClick={() => { setRows(null); setPrices(null); setKey(''); setError('') }} className="rounded-xl border px-5 py-3">Lock</button>}
      <p className="w-full text-xs text-slate-500">The key stays in memory for this visit. It is never saved in browser storage.</p>
    </form>
    {error && <p role="alert" className="mb-6 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
    {rows && <>
      <div className="grid gap-4 sm:grid-cols-3">{[['Published offers', rows.length], ['Need review', rows.filter(row => row.issues.length).length], ['Urgent', rows.filter(row => row.issues.some(i => i.severity === 'urgent')).length]].map(([label, count]) => <div key={label} className="rounded-2xl border bg-white p-6"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-3xl font-bold">{count}</p></div>)}</div>
      <p className="mt-4 text-sm text-slate-500">Content checked: {new Date(checked).toLocaleString()}. Redirect checks inspect configured destinations; they do not confirm retailer HTTP availability.</p>
      <div className="my-6 flex flex-wrap gap-3"><label>Show<select value={filter} onChange={event => setFilter(event.target.value)} className="ml-2 rounded-lg border p-2"><option value="issues">Needs review</option><option value="urgent">Urgent</option><option value="all">All offers</option></select></label><input aria-label="Search offers" placeholder="Search offers…" value={search} onChange={event => setSearch(event.target.value)} className="rounded-lg border p-2" /><button onClick={download} className="rounded-lg border px-4 py-2">Export report</button><button disabled={busy} onClick={() => void load(true)} className="rounded-lg bg-rose-800 px-4 py-2 font-semibold text-white disabled:opacity-50">Check Amazon prices</button></div>
      <section aria-label="Offer review queue" className="space-y-4">{visible.length === 0 && <p className="rounded-xl border bg-white p-6">No offers match this view.</p>}{visible.map(row => <article key={row._id} className="rounded-2xl border bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase text-slate-500">{row._type} · {row.active ? 'Active' : 'Inactive'}</p><h2 className="mt-1 text-lg font-bold">{row.title}</h2></div><a href={`https://spartanshopper.sanity.studio/intent/edit/id=${encodeURIComponent(row._id)};type=${row._type}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-rose-800 underline">Review in Sanity →</a></div><ul className="mt-3 space-y-1">{row.issues.map(issue => <li key={issue.message} className={issue.severity === 'urgent' ? 'text-red-800' : 'text-amber-800'}>{issue.severity === 'urgent' ? 'Urgent' : 'Review'}: {issue.message}</li>)}</ul>{!row.issues.length && <p className="mt-3 text-slate-600">No configuration issues found.</p>}</article>)}</section>
      {prices && <section className="mt-10 rounded-2xl border bg-white p-6"><h2 className="text-2xl font-bold">Amazon price check</h2><p className="mt-2 text-sm text-slate-600">Checked {new Date(priceChecked).toLocaleString()} · {prices.status} · No records changed.</p>{prices.status === 'NOT_YET_ELIGIBLE' && <p className="mt-3">Amazon API eligibility is not available yet. Prices could not be checked.</p>}{prices.status === 'NO_RECORDS' && <p className="mt-3">No active offers with an ASIN to check.</p>}{prices.status === 'SUSPECTED_FAULT' && <p role="alert" className="mt-3 font-semibold text-red-800">Possible Amazon API fault. Do not treat the unavailable results as confirmed expirations; retry after the API recovers.</p>}<p className="mt-3 text-sm text-slate-600">Coupon codes and clip eligibility still need manual verification. Amazon list-price savings do not confirm a coupon’s discount.</p><div className="mt-4 space-y-3">{prices.rows.map(row => <div key={row.id} className="border-t pt-3"><p className="font-semibold">{row.title}</p><p className="text-sm">{row.action === 'OK' ? 'No price action suggested' : row.action === 'UPDATED' ? 'Review changed price' : 'Review availability / savings'} · {row.reason}</p><p className="text-sm text-slate-600">Stored: {row.storedPrice == null ? 'Not supplied' : `$${row.storedPrice.toFixed(2)}`} · Live: {row.newPrice == null ? 'Not returned' : `$${row.newPrice.toFixed(2)}`}</p></div>)}</div></section>}
    </>}
  </main>
}
