import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '../src/app/globals.css';
import { AuthSessionProvider } from './components/SessionProvider';
import { ConditionalLayout } from './components/layout/ConditionalLayout';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter' 
});

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ['latin'], 
  variable: '--font-plus-jakarta-sans' 
});

// ✅ NEW: Add viewport configuration
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#2563eb', // MotoYard blue
};

// ✅ UPDATED: Enhanced metadata with PWA support
export const metadata: Metadata = {
  title: 'MotoYard - Multi-Dealer Automotive Platform',
  description: 'Complete dealer management platform for automotive businesses. Manage inventory, create content, and grow your dealership with AI-powered tools.',
  manifest: '/manifest.json', // ✅ NEW: PWA manifest link
  appleWebApp: { // ✅ NEW: iOS PWA settings
    capable: true,
    statusBarStyle: 'default',
    title: 'MotoYard',
  },
  formatDetection: { // ✅ NEW: Disable auto-formatting
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* ✅ NEW: PWA Meta Tags - ADD THESE 7 LINES */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MotoYard" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={`${inter.variable} ${plusJakartaSans.variable} ${GeistSans.variable} ${GeistMono.variable}`}>
        <ConditionalLayout>
          <main className="min-h-screen bg-gray-50">
            <AuthSessionProvider>
              {children}
            </AuthSessionProvider>
          </main>
        </ConditionalLayout>
      </body>
    </html>
  );
}
