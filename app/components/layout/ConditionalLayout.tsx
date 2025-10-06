'use client'
import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { useEffect, useState } from 'react'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const [showHeader, setShowHeader] = useState(false)

  useEffect(() => {
    // Don't show header on dealer storefronts or admin pages
    const shouldShowHeader = !pathname?.startsWith('/dealers/') && !pathname?.startsWith('/admin/')
    setShowHeader(shouldShowHeader)
  }, [pathname])

  return (
    <>
      {showHeader && <Header />}
      {children}
    </>
  )
}
