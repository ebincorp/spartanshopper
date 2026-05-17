'use client'

import { useEffect } from 'react'

export default function EmailSignup() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://spartanshopper-com.kit.com/5b21462827'
    script.setAttribute('data-uid', '5b21462827')
    script.async = true
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  return (
    <div className="my-8">
      <div data-uid="5b21462827" />
    </div>
  )
}
