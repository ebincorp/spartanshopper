'use client'

import Script from 'next/script'

export default function EmailSignup() {
  return (
    <div className="my-8">
      <Script
        src="https://f.kit.com/ck.5.js"
        data-uid="9454781"
        strategy="lazyOnload"
      />
      <div data-uid="9454781" />
    </div>
  )
}
