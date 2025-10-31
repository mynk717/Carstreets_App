// app/components/layout/Header.tsx
'use client'

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '../ui/Button'
import Link from 'next/link'

export default function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // Detect if we're on a dealer public route
  const isDealerPublicRoute = pathname?.startsWith('/dealers/') && !pathname?.includes('/dashboard')
  
  // Safe session handling
  let session = null
  
  if (!isDealerPublicRoute) {
    try {
      const sessionData = useSession()
      session = sessionData.data
    } catch (e) {
      // Session not available
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  // Get dealer subdomain from session (scalable)
  const dealerSubdomain = session?.user?.subdomain

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              MotoYard
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-blue-600 transition font-medium"
            >
              Home
            </Link>
            <Link 
              href="/features" 
              className="text-gray-700 hover:text-blue-600 transition font-medium"
            >
              Features
            </Link>
            <Link 
              href="/pricing" 
              className="text-gray-700 hover:text-blue-600 transition font-medium"
            >
              Pricing
            </Link>
          </nav>

          {/* Auth Actions - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {!isDealerPublicRoute && session ? (
              <>
                {session && (
  <Link href={`/dealers/${session.user.subdomain || 'carstreets'}/dashboard`}>
                    <Button variant="outline" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                )}
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  Sign Out
                </Button>
              </>
            ) : !isDealerPublicRoute ? (
              <>
                <Link href="/auth/signin">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/get-started">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Get Started
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/">
                <Button size="sm">
                  Back to Home
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-3">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-blue-600 transition py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/features" 
                className="text-gray-700 hover:text-blue-600 transition py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="/pricing" 
                className="text-gray-700 hover:text-blue-600 transition py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>

              {/* Mobile Auth Actions */}
              <div className="pt-3 border-t border-gray-200 mt-3">
                {!isDealerPublicRoute && session ? (
                  <>
                    {dealerSubdomain && (
                      <Link 
                        href={`/dealers/${dealerSubdomain}/dashboard`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Button variant="outline" size="sm" className="w-full mb-2">
                          Dashboard
                        </Button>
                      </Link>
                    )}
                    <Button 
                      onClick={() => {
                        handleSignOut()
                        setIsMenuOpen(false)
                      }} 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                    >
                      Sign Out
                    </Button>
                  </>
                ) : !isDealerPublicRoute ? (
                  <>
                    <Link 
                      href="/auth/signin"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Button variant="outline" size="sm" className="w-full mb-2">
                        Sign In
                      </Button>
                    </Link>
                    <Link 
                      href="/get-started"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                        Get Started
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link href="/" onClick={() => setIsMenuOpen(false)}>
                    <Button size="sm" className="w-full">
                      Back to Home
                    </Button>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
