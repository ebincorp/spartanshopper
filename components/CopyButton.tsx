'use client'

import { useState } from 'react'

interface Props {
  code: string
}

export default function CopyButton({ code }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
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
