'use client'

import { useState } from 'react'

export default function EmailSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('loading')

    try {
      const res = await fetch(
        `https://app.kit.com/forms/5b21462827/subscriptions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `email_address=${encodeURIComponent(email)}`,
        }
      )
      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="my-8 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <p className="text-green-700 font-medium">You're in! Exclusive deals coming your way.</p>
      </div>
    )
  }

  return (
    <div className="my-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Get Exclusive Coupon Codes</h3>
      <p className="text-gray-500 text-sm mb-4">Deals and discount codes delivered to your inbox. No spam.</p>
      <div className="flex gap-2 flex-wrap">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
        <button
          onClick={handleSubmit}
          disabled={status === 'loading'}
          className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-50 whitespace-nowrap"
        >
          {status === 'loading' ? 'Subscribing...' : 'Get Deals'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-red-500 text-xs mt-2">Something went wrong. Please try again.</p>
      )}
    </div>
  )
}
