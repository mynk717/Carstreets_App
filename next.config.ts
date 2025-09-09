import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'apollo.olx.in',
      },
      {
        protocol: 'https',
        hostname: 'apolloimages.olx.in',
      },
      {
        protocol: 'https',
        hostname: 'images.olx.in',
      },
    ],
  },
  // Fixed: Updated from experimental.serverComponentsExternalPackages
  serverExternalPackages: ['puppeteer-core'],
}

export default nextConfig
