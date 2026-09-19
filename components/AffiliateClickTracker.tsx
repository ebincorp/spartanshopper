'use client'

import { useEffect } from 'react'
import { installAffiliateClickTracking } from '@/lib/trackAffiliateClick'

export default function AffiliateClickTracker() {
  useEffect(() => installAffiliateClickTracking(document, window), [])
  return null
}
