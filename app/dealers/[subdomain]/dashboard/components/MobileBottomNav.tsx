"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Car, BarChart3, Settings } from "lucide-react"

export function MobileBottomNav({ subdomain }: { subdomain: string }) {
  const pathname = usePathname()

  const navItems = [
    { 
      href: `/dealers/${subdomain}/dashboard`, 
      icon: LayoutDashboard, 
      label: "Home" 
    },
    { 
      href: `/dealers/${subdomain}/dashboard/cars`, 
      icon: Car, 
      label: "Cars" 
    },
    { 
      href: `/dealers/${subdomain}/dashboard/content`, 
      icon: BarChart3, 
      label: "Content" 
    },
    { 
      href: `/dealers/${subdomain}/dashboard/settings`, 
      icon: Settings, 
      label: "Settings" 
    },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 
  border-t border-gray-200 dark:border-gray-700 z-[60] 
  pb-[env(safe-area-inset-bottom)]">
    <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-3 flex-1 ${
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
