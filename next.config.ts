import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'apollo.olx.in',
        port: '',
        pathname: '/v1/files/**',
      },
      {
        protocol: 'https',
        hostname: 'apolloimages.olx.in', 
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
}

export default nextConfig
