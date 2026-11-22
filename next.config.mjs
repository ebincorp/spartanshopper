import { createRequire } from 'node:module'

const blogRedirects = createRequire(import.meta.url)('./lib/blog-redirects.json')

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      ...Object.entries(blogRedirects).map(([slug, destination]) => ({
        source: `/blog/${slug}`,
        destination,
        permanent: true,
      })),
      {
        source: '/post/magnesium-glycinate-for-sleep',
        destination: blogRedirects['magnesium-glycinate-for-sleep'],
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
