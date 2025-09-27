'use client'

import { useState } from 'react'
import { Search, Menu, X, MapPin, Heart, User } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import Link from 'next/link'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">
                Car<span className="text-gray-800">Streets</span>
              </h1>
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search cars, brands, or models..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 pr-4"
              />
            </div>
            <Button className="ml-3" size="md">
              Search
            </Button>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>Raipur</span>
            </Button>
            <Button variant="ghost" className="flex items-center space-x-1">
              <Heart className="h-4 w-4" />
              <span>Wishlist</span>
            </Button>
            <Link href="/auth/signin">
            <Button variant="outline" className="flex items-center space-x-1">
            <User className="h-4 w-4" />
            <span>Sign In</span>
            </Button>
            </Link>

            <Button>Sell Car</Button>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search cars..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-3 space-y-3">
            <Button variant="ghost" className="w-full justify-start">
              <MapPin className="h-4 w-4 mr-2" />
              Raipur
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Heart className="h-4 w-4 mr-2" />
              Wishlist
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Button>
            <Button className="w-full">Sell Car</Button>
          </div>
        </div>
      )}
    </header>
  )
}
