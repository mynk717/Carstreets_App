import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '../src/app/globals.css'
import { Header } from './components/layout/Header'
import { AuthSessionProvider } from "./components/SessionProvider";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta-sans' });

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#111827',
}
export const metadata: Metadata = {
  title: 'CarStreets - Buy & Sell Used Cars',
  description: 'Find the best deals on used cars in your city. Buy and sell cars with confidence.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${plusJakartaSans.variable} ${GeistSans.variable} ${GeistMono.variable}`}>
        <Header />
        <main className="min-h-screen bg-gray-50">
          <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
        </main>
      </body>
    </html>
  )
}
