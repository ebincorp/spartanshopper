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
