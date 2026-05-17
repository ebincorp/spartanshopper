'use client'

import { useEffect } from 'react'

export default function EmailSignup() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://f.kit.com/ck.5.js'
    script.setAttribute('data-uid', '9454781')
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div className="my-8">
      <div data-uid="9454781" />
    </div>
  )
}
