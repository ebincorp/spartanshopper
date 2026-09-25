'use client'

import { findKey, type SavedFind } from '@/lib/saved-finds'
import { useSavedFinds } from './useSavedFinds'

export default function SaveFindButton({ find }: { find: SavedFind }) {
  const { finds, ready, error, toggle } = useSavedFinds()
  const saved = finds.some(item => findKey(item) === findKey(find))
  return <div className="mt-3">
    <button type="button" disabled={!ready} aria-pressed={saved} aria-label={`${saved ? 'Remove' : 'Save'} ${find.title}${saved ? ' from My Finds' : ' to My Finds'}`} onClick={() => toggle(find)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-rose-700 hover:text-rose-800 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-700">{saved ? '♥ Saved to My Finds' : '♡ Save for later'}</button>
    {error && <p role="alert" className="mt-2 text-xs text-red-800">{error}</p>}
  </div>
}
