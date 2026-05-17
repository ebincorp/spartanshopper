'use client'

import { useEffect } from 'react'

export default function EmailSignup() {
  useEffect(() => {
    // @ts-ignore
    if (window.ck) {
      // @ts-ignore
      window.ck.show('9454781')
      return
    }

    const script = document.createElement('script')
    script.src = 'https://f.kit.com/ck.5.js'
    script.async = true
    script.onload = () => {
      // @ts-ignore
      if (window.ck) window.ck.show('9454781')
    }
    document.body.appendChild(script)
  }, [])

  return (
    <div className="my-8">
      <div data-uid="9454781" />
    </div>
  )
}
