'use client'

import { useCallback, useId, useSyncExternalStore, type ReactNode } from 'react'
import {
  blackFridayCutoff,
  matchBlackFridayOffer,
  type BlackFridayOffer,
  type OfferTarget,
} from '@/lib/black-friday-offers'

type Status = { now: number; offers: BlackFridayOffer[] }

const empty: BlackFridayOffer[] = []
let offers = empty
let status: Status | undefined
let requestedAt = 0
let inFlight = false
let expiryTimer: ReturnType<typeof setTimeout>
const listeners = new Set<() => void>()

function publish(next: BlackFridayOffer[]) {
  offers = next
  for (const notify of listeners) notify()
}

function updateVisibleOffers() {
  clearTimeout(expiryTimer)
  if (!status) return

  const now = status.now + performance.now() - requestedAt
  const visible = status.offers.filter(offer => now < blackFridayCutoff(offer))
  publish(visible)
  if (visible.length) {
    const cutoff = Math.min(...visible.map(blackFridayCutoff))
    expiryTimer = setTimeout(() => {
      updateVisibleOffers()
      if (document.visibilityState !== 'hidden') void refresh()
    }, Math.ceil(cutoff - now))
  }
}

async function refresh() {
  if (inFlight || !listeners.size) return
  inFlight = true
  const startedAt = performance.now()
  try {
    const response = await fetch('/api/black-friday-status', { cache: 'no-store' })
    if (!response.ok) throw new Error('Offer status unavailable')
    const next: Status = await response.json()
    if (!Number.isFinite(next.now) || !Array.isArray(next.offers)) throw new Error('Invalid offer status')
    if (!listeners.size) return

    status = next
    requestedAt = startedAt
    updateVisibleOffers()
  } catch {
    status = undefined
    clearTimeout(expiryTimer)
    publish(empty)
  } finally {
    inFlight = false
  }
}

function checkOnReturn() {
  if (document.visibilityState === 'hidden') return
  updateVisibleOffers()
  void refresh()
}

function subscribe(notify: () => void) {
  listeners.add(notify)
  if (listeners.size === 1) {
    window.addEventListener('focus', checkOnReturn)
    document.addEventListener('visibilitychange', checkOnReturn)
    void refresh()
  }
  return () => {
    listeners.delete(notify)
    if (!listeners.size) {
      window.removeEventListener('focus', checkOnReturn)
      document.removeEventListener('visibilitychange', checkOnReturn)
      clearTimeout(expiryTimer)
      status = undefined
      offers = empty
    }
  }
}

function useLiveOffers() {
  return useSyncExternalStore(subscribe, () => offers, () => empty)
}

const checkedDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'America/Los_Angeles',
})

const flagPlacements = new Map<string, { asin: string; marker: HTMLSpanElement }>()
const flagListeners = new Set<() => void>()
let firstPlacements = new Set<string>()
let placementUpdatePending = false

function schedulePlacementUpdate() {
  if (placementUpdatePending) return
  placementUpdatePending = true

  // Hydration order can differ from the rendered order of links and shelves.
  queueMicrotask(() => {
    placementUpdatePending = false
    const pages = new Map<Document, Map<string, { id: string; marker: HTMLSpanElement }>>()
    for (const [id, { asin, marker }] of flagPlacements) {
      if (!marker.isConnected) continue
      let firstByAsin = pages.get(marker.ownerDocument)
      if (!firstByAsin) {
        firstByAsin = new Map()
        pages.set(marker.ownerDocument, firstByAsin)
      }
      const first = firstByAsin.get(asin)
      if (!first || first.marker.compareDocumentPosition(marker) & Node.DOCUMENT_POSITION_PRECEDING) {
        firstByAsin.set(asin, { id, marker })
      }
    }

    const next = new Set(Array.from(pages.values()).flatMap(page => Array.from(page.values(), p => p.id)))
    if (next.size === firstPlacements.size && Array.from(next).every(id => firstPlacements.has(id))) return
    firstPlacements = next
    for (const notify of flagListeners) notify()
  })
}

function subscribeToPlacements(notify: () => void) {
  flagListeners.add(notify)
  return () => { flagListeners.delete(notify) }
}

function Flag({ offer, containerClassName }: { offer: BlackFridayOffer; containerClassName?: string }) {
  const id = useId()
  const { asin } = offer
  const register = useCallback((marker: HTMLSpanElement | null) => {
    if (!marker) return
    flagPlacements.set(id, { asin, marker })
    schedulePlacementUpdate()
    return () => {
      if (flagPlacements.get(id)?.marker === marker) flagPlacements.delete(id)
      schedulePlacementUpdate()
    }
  }, [asin, id])
  const isFirst = useSyncExternalStore(subscribeToPlacements, () => firstPlacements.has(id), () => false)

  const label = isFirst ? (
    <span
      data-black-friday-asin={asin}
      className="inline-flex flex-wrap items-baseline gap-x-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs leading-5 text-rose-950"
    >
      <strong className="font-bold">
        {offer.kind === 'black-friday' ? 'Black Friday' : 'Limited-time'} deal live at Amazon.
      </strong>
      <time dateTime={offer.checkedAt} className="text-rose-900">
        Checked {checkedDate.format(Date.parse(offer.checkedAt))}
      </time>
    </span>
  ) : null

  return (
    <>
      <span ref={register} hidden />
      {label && (containerClassName ? <div className={containerClassName}>{label}</div> : label)}
    </>
  )
}

export default function BlackFridayFlag({ target }: { target: OfferTarget }) {
  const offer = matchBlackFridayOffer(useLiveOffers(), target)
  return offer ? <Flag offer={offer} /> : null
}

export function BlackFridayPrice({
  target, children, flagClassName,
}: {
  target: OfferTarget
  children: ReactNode
  flagClassName?: string
}) {
  const offer = matchBlackFridayOffer(useLiveOffers(), target)
  if (!offer) return children
  if (!flagClassName) return null
  return <Flag offer={offer} containerClassName={flagClassName} />
}

export function BlackFridayCardLabel({ target, children }: { target: OfferTarget; children: ReactNode }) {
  return matchBlackFridayOffer(useLiveOffers(), target) ? 'Check today’s price →' : children
}

type ArticleLink = { href: string; target: OfferTarget; alreadyNearTop: boolean }

export function BlackFridayTopCTA({
  links, showDisclosure,
}: {
  links: ArticleLink[]
  showDisclosure: boolean
}) {
  const available = useLiveOffers()

  for (const link of links) {
    const offer = matchBlackFridayOffer(available, link.target)
    if (!offer) continue
    if (link.alreadyNearTop) return null

    return (
      <aside data-black-friday-top className="my-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        {showDisclosure && (
          <p className="mb-2 text-xs text-slate-600">We may earn a commission through this link.</p>
        )}
        <p className="mb-3 font-bold text-slate-950">{offer.name}</p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={link.href}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-lg bg-[#1A1A2E] px-3 text-sm font-bold text-white hover:bg-slate-800"
          >
            Check today’s price
          </a>
          <Flag offer={offer} />
        </div>
      </aside>
    )
  }

  return null
}
