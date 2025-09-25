import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'apollo.olx.in',
        pathname: '/v1/files/**',
      },
      {
        protocol: 'https',
        hostname: '*.olx.in',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'apolloimages.olx.in',
      },
      {
        protocol: 'https',
        hostname: 'images.olx.in',
      },
      {
        protocol: 'https',
        hostname: 'graph.facebook.com',
      },
      {
        protocol: 'https',
        hostname: 'platform.linkedin.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/auth/facebook/callback',
        destination: '/api/auth/facebook/callback',
        permanent: false,
      },
      {
        source: '/auth/linkedin/callback', 
        destination: '/api/auth/linkedin/callback',
        permanent: false,
      },
    ];
  },
  // Fixed: Updated from experimental.serverComponentsExternalPackages
  serverExternalPackages: ['puppeteer-core'],

  
}

export default nextConfig
