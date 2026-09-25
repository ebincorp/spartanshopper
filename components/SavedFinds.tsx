'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { findKey, type CurrentFind } from '@/lib/saved-finds'
import { useSavedFinds } from './useSavedFinds'

export default function SavedFinds() {
  const { finds, ready, error, toggle } = useSavedFinds()
  const [current, setCurrent] = useState<CurrentFind[]>([])
  const [loading, setLoading] = useState(true)
  const [failure, setFailure] = useState('')
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    if (!ready) return
    if (!finds.length) { setCurrent([]); setLoading(false); return }
    setLoading(true)
    setFailure('')
    fetch('/api/saved-finds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finds), signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json() })
      .then(data => { setCurrent(data.finds); setLoading(false) })
      .catch(() => { if (!controller.signal.aborted) { setFailure('We couldn’t check current offers. Your saved list is safe.'); setLoading(false) } })
    return () => controller.abort()
  }, [finds, ready, refresh])
  useEffect(() => {
    const refreshOffers = () => { if (document.visibilityState === 'visible') setRefresh(value => value + 1) }
    window.addEventListener('focus', refreshOffers)
    const timer = window.setInterval(refreshOffers, 60000)
    return () => { window.removeEventListener('focus', refreshOffers); window.clearInterval(timer) }
  }, [])
  const rows: CurrentFind[] = loading || failure ? finds.map(find => ({ ...find, status: 'unavailable' })) : current
  return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
    <p className="text-sm font-bold uppercase tracking-widest text-rose-800">Your shopping shortlist</p>
    <h1 className="mt-3 text-4xl font-extrabold text-[#1A1A2E]">My Finds</h1>
    <p className="mt-4 max-w-2xl text-slate-600">Keep the good finds together while you decide. Saved on this device, in this browser. Clearing site data removes your list.</p>
    <div className="my-7 flex flex-wrap items-center gap-4"><Link href="/deals" className="font-semibold text-rose-800 underline">Browse deals</Link><Link href="/coupons" className="font-semibold text-rose-800 underline">Browse coupons</Link><button onClick={() => setRefresh(value => value + 1)} disabled={loading || !finds.length} className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-50">Refresh offers</button></div>
    <div aria-live="polite">{!ready ? 'Loading your list…' : loading ? 'Checking current offers…' : `${finds.length} saved ${finds.length === 1 ? 'find' : 'finds'}`}</div>
    {error && <p role="alert" className="mt-4 text-red-800">{error}</p>}
    {failure && <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-4 text-amber-900">{failure} Use Refresh offers to try again.</p>}
    {ready && !finds.length && <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10"><h2 className="text-2xl font-bold">Your next good find starts here.</h2><p className="mt-3 text-slate-600">Tap “Save for later” on any deal or coupon card to build your shortlist.</p></div>}
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rows.map(find => <article key={findKey(find)} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {find.image && <div className="relative mb-4 h-40"><Image src={find.image} alt={find.title} fill unoptimized className="object-contain" /></div>}
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{find.store || find.kind}</p>
      <h2 className="mt-2 text-lg font-bold text-slate-900">{find.title}</h2>
      <p className="my-4 font-semibold text-rose-800">{loading ? 'Checking offer…' : failure ? 'Status not checked' : find.status === 'available' ? find.offer || 'Offer available' : { expired: 'Offer expired', upcoming: 'Offer hasn’t started yet', unavailable: 'Offer no longer listed as active' }[find.status]}</p>
      {find.status === 'available' && !loading && !failure && <div className="mt-auto space-y-3">
        <Link className="block font-semibold underline" href={`/${find.kind === 'deal' ? 'deals' : 'coupons'}/${find.slug}`}>View {find.kind === 'coupon' ? 'coupon and code' : 'deal details'}</Link>
        {find.affiliateSlug && <a data-saved-find={findKey(find)} href={`/go/${find.affiliateSlug}`} target="_blank" rel="noopener noreferrer sponsored nofollow" className="block rounded-xl bg-[#1A1A2E] px-4 py-3 text-center font-bold text-white">Shop offer →</a>}
      </div>}
      <button onClick={() => toggle(find)} className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold" aria-label={`Remove ${find.title} from My Finds`}>Remove</button>
    </article>)}</div>
    {!!finds.length && <p className="mt-8 text-sm text-slate-600">Prices and eligibility can change. Confirm the final offer at the retailer.</p>}
  </main>
}
