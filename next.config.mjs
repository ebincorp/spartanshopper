/** @type {import('next').NextConfig} */
const nextConfig = {
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
