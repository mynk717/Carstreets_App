'use client'

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from 'react'
import { Search, Menu, X, User } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import Link from 'next/link'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Only use session on routes that need it (admin, dashboard, etc.)
  // For dealer public routes, session will be null
  const isDealerPublicRoute = pathname?.startsWith('/dealers/') && !pathname?.includes('/dashboard')
  
  // Safe session handling - only call useSession on auth-enabled routes
  let session = null
  let status = 'unauthenticated'
  
  if (!isDealerPublicRoute) {
    try {
      const sessionData = useSession()
      session = sessionData.data
      status = sessionData.status
    } catch (e) {
      // Session not available, continue with null
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-blue-600">
              CarStreets
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dealers" className="text-gray-700 hover:text-blue-600 transition">
              Browse Dealers
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600 transition">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600 transition">
              Contact
            </Link>
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search cars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </form>

          {/* Auth Actions - Only show on non-public routes */}
          <div className="hidden md:flex items-center gap-3">
            {!isDealerPublicRoute && session ? (
              <>
                <Link href="/admin/dashboard">
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  Sign Out
                </Button>
              </>
            ) : !isDealerPublicRoute ? (
              <Button onClick={() => signIn()} size="sm">
                Sign In
              </Button>
            ) : (
              // For public dealer routes, show generic CTA
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
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search cars..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </form>

            {/* Mobile Navigation */}
            <nav className="flex flex-col gap-3">
              <Link 
                href="/dealers" 
                className="text-gray-700 hover:text-blue-600 transition py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Browse Dealers
              </Link>
              <Link 
                href="/about" 
                className="text-gray-700 hover:text-blue-600 transition py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/contact" 
                className="text-gray-700 hover:text-blue-600 transition py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>

              {/* Mobile Auth Actions */}
              <div className="pt-3 border-t border-gray-200 mt-3">
                {!isDealerPublicRoute && session ? (
                  <>
                    <Link href="/admin/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full mb-2">
                        Dashboard
                      </Button>
                    </Link>
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
                  <Button 
                    onClick={() => {
                      signIn()
                      setIsMenuOpen(false)
                    }} 
                    size="sm"
                    className="w-full"
                  >
                    Sign In
                  </Button>
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
