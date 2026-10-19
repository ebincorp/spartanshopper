'use client'

import { findKey, type SavedFind } from '@/lib/saved-finds'
import { useSavedFinds } from './useSavedFinds'
import Link from 'next/link'

export default function SaveFindButton({ find }: { find: SavedFind }) {
  const { finds, ready, error, toggle } = useSavedFinds()
  const saved = finds.some(item => findKey(item) === findKey(find))
  return <div className="mt-3">
    <button type="button" disabled={!ready} aria-pressed={saved} aria-label={`${saved ? 'Remove' : 'Save'} ${find.title}${saved ? ' from My Finds' : ' to My Finds'}`} onClick={() => toggle(find)} className={`min-h-11 w-full rounded-xl border px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 ${saved ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-slate-300 bg-white text-slate-700 hover:border-rose-700 hover:text-rose-800'}`}><span aria-hidden="true">{saved ? '♥' : '♡'}</span> {saved ? 'Saved to My Finds' : 'Save for later'}</button>
    {saved && <Link href="/my-finds" className="mt-1 block py-2 text-center text-xs font-semibold text-rose-800 underline underline-offset-4">View your saved finds →</Link>}
    {error && <p role="alert" className="mt-2 text-xs text-red-800">{error}</p>}
  </div>
}
