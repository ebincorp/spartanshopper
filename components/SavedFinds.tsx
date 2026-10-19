'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { findKey, offerStatus, type CurrentFind, type SavedFind } from '@/lib/saved-finds'
import { offerExpiryLabel } from '@/lib/offerExpiry'
import { useSavedFinds } from './useSavedFinds'

type Filter = 'all' | 'deal' | 'coupon'
const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All finds' }, { value: 'deal', label: 'Deals' }, { value: 'coupon', label: 'Coupons' },
]
const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-700'

function FindImage({ find }: { find: CurrentFind }) {
  const [failed, setFailed] = useState(false)
  return <div className="relative flex h-48 items-center justify-center border-b border-slate-100 bg-white sm:h-52">
    {find.image && !failed
      ? <Image src={find.image} alt={find.title} fill unoptimized className="object-contain p-6" onError={() => setFailed(true)} />
      : <span aria-hidden="true" className="text-5xl text-slate-200">♡</span>}
  </div>
}

export default function SavedFinds() {
  const { finds, ready, error, remove, save } = useSavedFinds()
  const [current, setCurrent] = useState<CurrentFind[]>([])
  const [loading, setLoading] = useState(true)
  const [failure, setFailure] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [filter, setFilter] = useState<Filter>('all')
  const [removed, setRemoved] = useState<SavedFind | null>(null)
  const [checkedAt, setCheckedAt] = useState<Date | null>(null)
  useEffect(() => {
    if (!ready) return
    if (!finds.length) { setCurrent([]); setLoading(false); setFailure(''); return }
    const controller = new AbortController()
    let cancelled = false
    const timeout = window.setTimeout(() => controller.abort(), 15000)
    setLoading(true)
    setFailure('')
    fetch('/api/saved-finds', { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finds), signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json() })
      .then(data => {
        if (cancelled) return
        if (!Array.isArray(data.finds)) throw new Error()
        setCurrent(data.finds); setCheckedAt(new Date()); setLoading(false)
      })
      .catch(() => {
        if (!cancelled) { setFailure('We couldn’t check your offers. Your saved list is still here.'); setLoading(false) }
      })
      .finally(() => window.clearTimeout(timeout))
    return () => { cancelled = true; window.clearTimeout(timeout); controller.abort() }
  }, [finds, ready, refresh])
  useEffect(() => {
    const refreshOffers = () => { if (document.visibilityState === 'visible') setRefresh(value => value + 1) }
    window.addEventListener('focus', refreshOffers)
    document.addEventListener('visibilitychange', refreshOffers)
    const timer = window.setInterval(refreshOffers, 60000)
    return () => {
      window.removeEventListener('focus', refreshOffers)
      document.removeEventListener('visibilitychange', refreshOffers)
      window.clearInterval(timer)
    }
  }, [])

  // Keep titles and images during refresh; never retain a stale price or shopping link.
  const rows: CurrentFind[] = finds.map(find => {
    const resolved = current.find(item => findKey(item) === findKey(find))
    if (!resolved) return { ...find, status: 'unavailable' }
    if (resolved.status === 'available' && resolved.expiryDate) {
      const status = offerStatus(true, undefined, resolved.expiryDate)
      if (status !== 'available') return { ...resolved, status, offer: undefined, affiliateSlug: undefined }
    }
    return resolved
  })
  const visible = rows.filter(find => filter === 'all' || find.kind === filter)
  const available = rows.filter(find => find.status === 'available').length
  const checked = ready && !loading && !failure

  function removeFind(find: SavedFind) {
    if (remove(find)) setRemoved({ kind: find.kind, slug: find.slug, title: find.title })
  }

  return <main className="min-h-[70vh] bg-slate-50 pb-16 text-slate-900">
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-800">Your shopping shortlist</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#1A1A2E] sm:text-5xl">My Finds<span className="text-[#E63946]">.</span></h1>
            <p className="mt-4 text-base leading-7 text-slate-600">A little less searching. A little more deciding. Keep the deals and coupons you’re considering in one place.</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-950">
            <p className="font-bold">Just for this browser</p>
            <p className="mt-1 max-w-xs leading-6">No account needed. Your list won’t sync to other devices, and clearing site data removes it.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-rose-800">
          <Link href="/deals" className={`py-2 underline underline-offset-4 ${focus}`}>Find more deals →</Link>
          <Link href="/coupons" className={`py-2 underline underline-offset-4 ${focus}`}>Browse coupons →</Link>
        </div>
      </div>
    </section>

    <div className="mx-auto max-w-7xl px-4 pt-7 sm:px-6">
      {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p>}
      {removed && <div role="status" className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <p className="min-w-0 break-words"><span className="font-semibold">Removed:</span> {removed.title}</p>
        <button type="button" onClick={() => { if (save(removed)) setRemoved(null) }} className={`min-h-11 shrink-0 px-3 font-bold text-rose-800 underline underline-offset-4 ${focus}`}>Undo</button>
      </div>}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div aria-live="polite" role="status">
          <p className="font-bold">{!ready ? 'Loading your list…' : `${finds.length} saved ${finds.length === 1 ? 'find' : 'finds'}`}</p>
          {ready && finds.length > 0 && <p className="mt-1 text-sm text-slate-500">{loading ? 'Checking listed offers…' : failure ? 'Offers haven’t been checked' : `${available} active · ${finds.length - available} unavailable or upcoming`}</p>}
        </div>
        {finds.length > 0 && <button type="button" onClick={() => setRefresh(value => value + 1)} disabled={loading} className={`min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:border-slate-500 disabled:opacity-50 ${focus}`}>{loading ? 'Checking…' : 'Refresh offers'}</button>}
      </div>
      {failure && <div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{failure} Refresh offers to try again. Shopping links will return once we can check availability.</div>}

      {ready && finds.length > 0 && <>
        <div aria-label="Filter saved finds" role="group" className="mt-6 flex flex-wrap gap-2">
          {filters.map(option => <button key={option.value} type="button" aria-pressed={filter === option.value} onClick={() => setFilter(option.value)} className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold ${focus} ${filter === option.value ? 'border-[#1A1A2E] bg-[#1A1A2E] text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-500'}`}>
            {option.label} <span className="ml-1 opacity-70">{option.value === 'all' ? finds.length : finds.filter(find => find.kind === option.value).length}</span>
          </button>)}
        </div>
        <p className="mt-5 text-xs leading-5 text-slate-500">Affiliate disclosure: SpartanShopper may earn a commission from qualifying purchases through these links.</p>
      </>}

      {ready && !finds.length && <section className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center sm:py-20">
        <span aria-hidden="true" className="text-5xl text-[#E63946]">♡</span>
        <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-[#1A1A2E]">Found something good? Keep it here.</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">Tap “Save for later” on a deal or coupon card. Come back here to compare your picks and check the listed offers before you shop.</p>
        <Link href="/deals" className={`mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#E63946] px-6 py-3 text-sm font-bold text-white hover:bg-rose-700 ${focus}`}>Explore today’s deals →</Link>
      </section>}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy={loading && finds.length > 0}>
        {visible.map(find => {
          const active = checked && find.status === 'available'
          const timedExpiry = !!find.expiryDate && find.expiryDate.length > 10
          const expiry = offerExpiryLabel(find.expiryDate, timedExpiry ? 'America/Los_Angeles' : 'UTC')
          const detailPath = `/${find.kind === 'deal' ? 'deals' : 'coupons'}/${find.slug}`
          return <article key={findKey(find)} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <FindImage find={find} />
            <div className="flex flex-1 flex-col p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                <span className="uppercase tracking-wider text-slate-500">{find.store || (find.kind === 'deal' ? 'Deal' : 'Coupon')}</span>
                <span className={`rounded-full px-2.5 py-1 ${active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{!checked ? loading ? 'Checking' : 'Not checked' : { available: find.kind === 'coupon' ? 'Coupon' : 'Deal', expired: 'Expired', upcoming: 'Upcoming', unavailable: 'Unavailable' }[find.status]}</span>
              </div>
              <h2 className="mt-3 break-words text-lg font-bold leading-6 text-[#1A1A2E]">{active ? <Link href={detailPath} className={`hover:underline ${focus}`}>{find.title}</Link> : find.title}</h2>
              <div className="my-4">
                {active ? <>
                  <p className="text-xs text-slate-500">{find.kind === 'deal' ? 'Listed price' : 'Listed offer'}</p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight text-rose-800">{find.offer || 'See offer details'}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{find.instructions}</p>
                  <p className="mt-2 text-xs text-slate-500">{expiry ? `Listed expiry: ${expiry}${timedExpiry ? ' (PT)' : ''}` : 'End date not supplied'}</p>
                </> : <p className="text-sm leading-6 text-slate-500">{!checked ? loading ? 'Checking the latest listing before you shop.' : 'Your find is saved. Refresh to check the offer.' : { available: '', expired: 'This offer has ended. Keep it as a reminder or remove it below.', upcoming: 'This offer hasn’t started yet. Check back after its start date.', unavailable: 'This offer is no longer listed as active. You can keep it here as a reminder.' }[find.status]}</p>}
              </div>
              {active && <div className="mt-auto space-y-3 pt-2">
                <Link href={detailPath} className={`block rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-bold text-[#1A1A2E] hover:bg-slate-50 ${focus}`}>{find.kind === 'coupon' ? 'View coupon & terms' : 'View deal details'}</Link>
                {find.affiliateSlug && find.kind === 'deal' && <a data-saved-find={findKey(find)} href={`/go/${find.affiliateSlug}`} target="_blank" rel="noopener noreferrer sponsored nofollow" className={`block rounded-xl bg-[#1A1A2E] px-4 py-3 text-center text-sm font-bold text-white hover:bg-slate-700 ${focus}`}>Shop at {find.store || 'retailer'} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>}
              </div>}
              <button type="button" onClick={() => removeFind(find)} className={`mt-3 min-h-11 self-start rounded-lg px-1 text-sm font-semibold text-slate-500 underline underline-offset-4 hover:text-rose-800 ${focus}`} aria-label={`Remove ${find.title} from My Finds`}>Remove</button>
            </div>
          </article>
        })}
      </div>
      {ready && finds.length > 0 && visible.length === 0 && <div className="mt-2 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="font-bold">No {filter === 'coupon' ? 'coupons' : 'deals'} saved yet.</p><button type="button" onClick={() => setFilter('all')} className={`mt-3 min-h-11 px-3 text-sm font-semibold text-rose-800 underline ${focus}`}>Show all finds</button></div>}
      {finds.length > 0 && <div className="mt-7 border-t border-slate-200 pt-5 text-xs leading-6 text-slate-500">
        {checked && checkedAt && <p>Listing availability checked at {checkedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.</p>}
        <p>Prices, coupon eligibility and availability can change. Refreshing checks SpartanShopper’s listings; confirm the final offer at the retailer.</p>
      </div>}
    </div>
  </main>
}
