'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface UserProfileProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function UserProfileDropdown({ user }: UserProfileProps) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  if (!user) {
    return null; // or return a placeholder/loading state
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-600 rounded"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || 'User profile'}
            className="w-8 h-8 rounded-full border border-gray-200 shadow"
            width={32}
            height={32}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
            {user.name?.charAt(0).toUpperCase() || 'A'}
          </div>
        )}
        <span className="hidden sm:block font-semibold text-gray-900">
          {user.name || user.email}
        </span>
        <svg
          className={`w-3 h-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white shadow-md rounded-md border border-gray-200 z-50">
          <Link
            href="/admin/profile"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            onClick={() => setOpen(false)}
          >
            Profile Settings
          </Link>
          <a
            href="mailto:support@motoyard.com"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            onClick={() => setOpen(false)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact Support
          </a>
          <Link
            href="/auth/signout"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 border-t border-gray-200"
            onClick={() => setOpen(false)}
          >
            Sign Out
          </Link>
        </div>
      )}
    </div>
  )
}
