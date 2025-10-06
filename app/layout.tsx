import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import '../src/app/globals.css'
import { AuthSessionProvider } from "./components/SessionProvider"
import { ConditionalLayout } from './components/layout/ConditionalLayout'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta-sans' })

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#111827',
}

// Fixed metadata for MotoYard platform
export const metadata: Metadata = {
  title: 'MotoYard - Multi-Tenant Car Dealership Platform',
  description: 'Create your own car dealership website with MotoYard SaaS platform. Powered by AI content generation.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
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
  )
}
