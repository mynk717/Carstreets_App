import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../src/app/globals.css'
import { Header } from './components/layout/Header'

const inter = Inter({ subsets: ['latin'] })
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
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  )
}
