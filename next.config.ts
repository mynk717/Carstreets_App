import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

// ✅ PWA Configuration
const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable in dev mode
  scope: '/',
  sw: 'sw.js',
  buildExcludes: [/middleware-manifest\.json$/],
});

const nextConfig: NextConfig = {
  // ✅ Fix for next-auth with Next.js 15
  transpilePackages: ['next-auth'],
  
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
};

// ✅ Export with PWA wrapper
export default pwaConfig(nextConfig);
