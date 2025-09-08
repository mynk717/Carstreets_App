<<<<<<< HEAD
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
=======
/** @type {import('next').NextConfig} */
const nextConfig = {
>>>>>>> 1b71d0462f3415cc4320d48c0006735cc730ced5
  images: {
    remotePatterns: [
      {
        protocol: 'https',
<<<<<<< HEAD
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
=======
        hostname: 'images.unsplash.com', // For Unsplash images
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'apollo.olx.in', // For OLX Apollo images
        pathname: '/**'
      }
    ]
  }
}

module.exports = nextConfig
>>>>>>> 1b71d0462f3415cc4320d48c0006735cc730ced5
