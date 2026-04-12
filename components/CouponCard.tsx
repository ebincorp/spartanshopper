'use client'

import { useState } from 'react'

interface CouponCardProps {
  title: string
  store: string
  code: string
  discount?: string
  affiliateUrl: string
  slug: string
  expiryDate?: string
  verified?: boolean
}

function isExpired(expiryDate?: string): boolean {
  if (!expiryDate) return false
  return new Date(expiryDate) < new Date()
}

export default function CouponCard({
  title,
  store,
  code,
  discount,
  affiliateUrl,
  slug,
  expiryDate,
  verified,
}: CouponCardProps) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const expired = isExpired(expiryDate)

  const handleReveal = () => {
    setRevealed(true)
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-200">

      {/* Top bar */}
      <div style={{ backgroundColor: '#1A1A2E' }} className="px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-white/60 text-xs uppercase tracking-wide font-semibold">{store}</p>
          {discount && (
            <p className="text-white font-extrabold text-lg leading-tight">{discount}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {verified && (
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          )}
          {expired && (
            <span className="bg-gray-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              Expired
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-gray-900 font-bold text-sm leading-snug mb-4 flex-1">{title}</h3>

        {/* Coupon Code Box */}
        {!revealed && !expired ? (
          <button
            onClick={handleReveal}
            className="w-full flex items-center justify-between border-2 border-dashed border-[#E63946] rounded-xl px-4 py-3 mb-4 transition hover:bg-[#E63946]/5 cursor-pointer group"
          >
            <span className="font-mono font-bold text-lg tracking-widest text-gray-300 select-none">
              {'•'.repeat(code.length)}
            </span>
            <span className="text-xs font-bold text-white px-3 py-1 rounded-lg" style={{ backgroundColor: '#E63946' }}>
              Reveal Code
            </span>
          </button>
        ) : (
          <div
            className={`w-full flex items-center justify-between border-2 border-dashed rounded-xl px-4 py-3 mb-4 ${
              expired ? 'border-gray-200 opacity-50' : 'border-[#E63946]'
            }`}
          >
            <span
              className={`font-mono font-bold text-lg tracking-widest ${
                expired ? 'text-gray-400' : 'text-[#E63946]'
              }`}
            >
              {code}
            </span>
            {!expired && (
              <span className="text-xs font-semibold text-green-600">
                {copied ? 'Copied! ✓' : '✓ Revealed'}
              </span>
            )}
          </div>
        )}

        {/* Expiry */}
        {expiryDate && !expired && (
          <p className="text-xs text-gray-400 mb-3">
            Expires: {new Date(expiryDate).toLocaleDateString()}
          </p>
        )}

        {/* CTA */}
        <a
          href={`/go/${slug}`}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={`block w-full text-center font-bold py-2.5 rounded-xl text-sm transition ${
            expired
              ? 'bg-gray-200 text-gray-400 pointer-events-none'
              : 'text-white hover:opacity-90 active:scale-95'
          }`}
          style={!expired ? { backgroundColor: '#1A1A2E' } : {}}
        >
          {expired ? 'Coupon Expired' : 'Shop Now →'}
        </a>
      </div>
    </div>
  )
}
