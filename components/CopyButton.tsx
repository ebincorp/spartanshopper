'use client'

import { useState } from 'react'

interface Props {
  code: string
  couponSlug?: string
  store?: string
}

export default function CopyButton({ code, couponSlug, store }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag
      gtag?.('event', 'coupon_code_copied', {
        coupon_slug: couponSlug ?? '(unknown)',
        store: store ?? '(unknown)',
        source_page_path: window.location.pathname,
        tracking_version: 'coupon_v1',
      })
    } catch {
      // Copying the code must not depend on Analytics being available.
    }
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for older browsers
      const el = document.createElement('textarea')
      el.value = code
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 font-bold text-sm px-5 py-4 rounded-xl transition active:scale-95"
      style={{
        backgroundColor: copied ? '#16a34a' : '#E63946',
        color: '#fff',
      }}
    >
      {copied ? '✓ Copied!' : 'Copy'}
    </button>
  )
}
