'use client'

import { useEffect, useState } from 'react'
import { findKey, MAX_SAVED_FINDS, parseSavedFinds, SAVED_FINDS_EVENT, SAVED_FINDS_KEY, type SavedFind } from '@/lib/saved-finds'

export function useSavedFinds() {
  const [finds, setFinds] = useState<SavedFind[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const sync = () => {
      try { setFinds(parseSavedFinds(localStorage.getItem(SAVED_FINDS_KEY))) }
      catch { setError('This browser is blocking saved finds. Allow site storage to save items.') }
      setReady(true)
    }
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener(SAVED_FINDS_EVENT, sync)
    return () => { window.removeEventListener('storage', sync); window.removeEventListener(SAVED_FINDS_EVENT, sync) }
  }, [])
  function toggle(find: SavedFind) {
    try {
      const current = parseSavedFinds(localStorage.getItem(SAVED_FINDS_KEY))
      const saved = current.some(item => findKey(item) === findKey(find))
      if (!saved && current.length >= MAX_SAVED_FINDS) { setError('Your list holds 100 finds. Remove one before adding another.'); return }
      const next = saved ? current.filter(item => findKey(item) !== findKey(find)) : [...current, find]
      localStorage.setItem(SAVED_FINDS_KEY, JSON.stringify(next))
      setError('')
      window.dispatchEvent(new Event(SAVED_FINDS_EVENT))
      try {
        const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag
        gtag?.('event', saved ? 'remove_saved_find' : 'save_find', { item_type: find.kind, item_slug: find.slug })
      } catch { /* Saving does not depend on analytics. */ }
    } catch { setError('Could not save changes. Allow site storage and try again.') }
  }
  return { finds, ready, error, toggle }
}
