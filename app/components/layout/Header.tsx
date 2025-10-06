'use client'
import { useState, useEffect } from 'react'
import { Search, Menu, X, User } from 'lucide-react'
import {Button} from '../ui/Button'
import {Input} from '../ui/Input'
import Link from 'next/link'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <h1 className="text-2xl font-bold text-blue-700">
                Moto<span className="text-gray-800">Yard</span>
              </h1>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search dealerships, cars, or services..."
                className="pl-12 pr-4 w-full h-12 bg-gray-50 border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/features" 
              className="text-gray-700 hover:text-orange-600 font-medium text-sm tracking-wide transition-colors duration-200"
            >
              Features
            </Link>
            <Link 
              href="/pricing" 
              className="text-gray-700 hover:text-orange-600 font-medium text-sm tracking-wide transition-colors duration-200"
            >
              Pricing
            </Link>
            <Link 
              href="/dealers" 
              className="text-gray-700 hover:text-orange-600 font-medium text-sm tracking-wide transition-colors duration-200"
            >
              Browse Dealers
            </Link>
            
            {/* CTA Buttons */}
            <div className="flex items-center space-x-3">
              <Link href="/auth/signin">
                <Button className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-5 py-2.5 rounded-xl border border-gray-300 transition-all duration-200 hover:shadow-md">
                  Sign In
                </Button>
              </Link>
              <Link href="/get-started">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                  Start Your Dealership
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search dealerships..."
              className="pl-12 pr-4 w-full h-12 bg-gray-50 border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-6 space-y-4 bg-gray-50 -mx-4 px-4 py-4 rounded-b-2xl border-t border-gray-200">
            <Link 
              href="/features" 
              className="block py-3 text-gray-800 hover:text-orange-600 font-medium transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="/pricing" 
              className="block py-3 text-gray-800 hover:text-orange-600 font-medium transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="/dealers" 
              className="block py-3 text-gray-800 hover:text-orange-600 font-medium transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Browse Dealers
            </Link>
            
            <div className="pt-4 space-y-3 border-t border-gray-200">
              <Link href="/auth/signin">
                <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-5 py-3 rounded-xl border border-gray-300 transition-all duration-200">
                  Sign In
                </Button>
              </Link>
              <Link href="/get-started">
                <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-200">
                  Start Your Dealership
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
