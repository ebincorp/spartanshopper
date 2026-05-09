/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'spartanshopper.com' }],
        destination: 'https://www.spartanshopper.com/:path*',
        permanent: true,
      },
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
    ]
  },
  serverExternalPackages: ['@sanity/client', 'sanity'],
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
    ],
  },
}

export default nextConfig
