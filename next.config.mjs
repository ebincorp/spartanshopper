/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/blog/magnesium-glycinate-for-sleep',
        destination: '/blog/magnesium-glycinate-for-sleep-the-natural-melatonin-alternative-you-ve-been-looking-for',
        permanent: true,
      },
      {
        source: '/post/magnesium-glycinate-for-sleep',
        destination: '/blog/magnesium-glycinate-for-sleep-the-natural-melatonin-alternative-you-ve-been-looking-for',
        permanent: true,
      },
      {
        // Keyword-cannibalization consolidation: duplicate psyllium pillar → canonical pillar.
        source: '/blog/psyllium-husk-fiber-supplement',
        destination: '/blog/psyllium-husk-supplement-benefits',
        permanent: true,
      },
      {
        // Third psyllium duplicate — near-identical title to the pillar and the
        // same head-term intent. Unique material (gut-microbiome section,
        // BulkSupplements, FDA/onset facts) was folded into the pillar first.
        source: '/blog/psyllium-husk-supplement',
        destination: '/blog/psyllium-husk-supplement-benefits',
        permanent: true,
      },
      {
        // Near-duplicate Korean eye-patch roundups. The evergreen slug survives;
        // the month-stamped one redirects into it.
        source: '/blog/best-korean-eye-patches-july-2026',
        destination: '/blog/best-korean-eye-patches-2026',
        permanent: true,
      },
      {
        // Standalone gummies roundup duplicated the sea-moss-supplement pillar's
        // own built-in gummies section (GSC: crawled, not indexed). The
        // 5-brand comparison table was folded into the pillar first.
        source: '/blog/sea-moss-gummies',
        destination: '/blog/sea-moss-supplement',
        permanent: true,
      },
      {
        // Stale promo-code roundup — all 4 codes carry expiry dates (Jun 6-30
        // 2026) that have passed. No evergreen pillar for this term; the
        // closest live equivalent is the coupons hub.
        source: '/blog/amazon-promo-codes-beauty-grooming-june-2026',
        destination: '/coupons',
        permanent: true,
      },
      {
        // Pre-Prime-Day beauty markdown roundup — entire premise ("Prime Day
        // starts Tuesday") is ~7 weeks stale, no per-item Sanity doc to
        // re-verify against. Closest live equivalent is the deals hub.
        source: '/blog/beauty-deals-before-prime-day-june-2026',
        destination: '/deals',
        permanent: true,
      },
      {
        // Clippable-coupon roundup — audited 2026-08-07: 2/9 ASINs unavailable,
        // 4/9 no longer at the advertised coupon price, majority dead.
        // Closest live equivalent is the coupons hub.
        source: '/blog/amazon-clippable-coupon-deals-july-2026',
        destination: '/coupons',
        permanent: true,
      },
    ]
  },
  serverExternalPackages: ['@sanity/client', 'sanity', 'superagent'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
    ],
    // Cache transformed images for 30 days to minimise repeat transformations on Vercel's free tier.
    minimumCacheTTL: 2592000,
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig
