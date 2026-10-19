'use client'

import { useEffect, useState } from 'react'
import { findKey, parseSavedFinds, updateSavedFinds, SAVED_FINDS_EVENT, SAVED_FINDS_KEY, type SavedFind } from '@/lib/saved-finds'

export function useSavedFinds() {
  const [finds, setFinds] = useState<SavedFind[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const sync = () => {
      try { setFinds(parseSavedFinds(localStorage.getItem(SAVED_FINDS_KEY))); setError('') }
      catch { setError('This browser is blocking saved finds. Allow site storage to save items.') }
      setReady(true)
    }
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener(SAVED_FINDS_EVENT, sync)
    return () => { window.removeEventListener('storage', sync); window.removeEventListener(SAVED_FINDS_EVENT, sync) }
  }, [])
  function setSaved(find: SavedFind, save?: boolean) {
    try {
      const current = parseSavedFinds(localStorage.getItem(SAVED_FINDS_KEY))
      const saved = current.some(item => findKey(item) === findKey(find))
      const shouldSave = save ?? !saved
      if (saved === shouldSave) return true
      let next: SavedFind[]
      try { next = updateSavedFinds(current, find, shouldSave) }
      catch { setError('Your list holds 100 finds. Remove one before adding another.'); return false }
      localStorage.setItem(SAVED_FINDS_KEY, JSON.stringify(next))
      setError('')
      window.dispatchEvent(new Event(SAVED_FINDS_EVENT))
      try {
        const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag
        gtag?.('event', shouldSave ? 'save_find' : 'remove_saved_find', { item_type: find.kind, item_slug: find.slug })
      } catch { /* Saving does not depend on analytics. */ }
      return true
    } catch { setError('Could not save changes. Allow site storage and try again.'); return false }
  }
  return { finds, ready, error, toggle: (find: SavedFind) => setSaved(find), save: (find: SavedFind) => setSaved(find, true), remove: (find: SavedFind) => setSaved(find, false) }
}
