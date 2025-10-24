'use client'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

// This ConditionalLayout simply passes through children.
// No header, no nav, no dynamic imports, no session logic.
export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  return <>{children}</>
}
