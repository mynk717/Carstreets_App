/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
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
