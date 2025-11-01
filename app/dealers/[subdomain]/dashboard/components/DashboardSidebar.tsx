'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, LayoutDashboard, Car, BarChart3, Settings, LogOut, Calendar, MessageSquare, ShoppingCart } from 'lucide-react';
import { Dealer } from '@prisma/client';

export function DashboardSidebar({ dealer }: { dealer: Dealer }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: `/dealers/${dealer.subdomain}/dashboard`, icon: LayoutDashboard, label: 'Overview' },
    { href: `/dealers/${dealer.subdomain}/dashboard/cars`, icon: Car, label: 'My Cars' },
    { href: `/dealers/${dealer.subdomain}/dashboard/content`, icon: BarChart3, label: 'Content Studio' },
    { href: `/dealers/${dealer.subdomain}/dashboard/calendar`, icon: Calendar, label: 'Content Calendar' },
    { href: `/dealers/${dealer.subdomain}/dashboard/whatsapp`, icon: MessageSquare, label: 'WhatsApp' },
    { href: `/dealers/${dealer.subdomain}/dashboard/settings`, icon: Settings, label: 'Settings' },
    { href: `/dealers/${dealer.subdomain}/dashboard/catalog`, icon: ShoppingCart, label: 'Product Catalog' },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        )}
      </button>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        fixed lg:relative
        inset-y-0 left-0
        z-40 lg:z-0
        w-64 flex-shrink-0
        bg-white dark:bg-gray-800
        border-r border-gray-200 dark:border-gray-700
        flex flex-col
        transition-transform duration-300 ease-in-out
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <Link href={`/dealers/${dealer.subdomain}/dashboard`} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">{dealer.businessName.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-md font-bold text-gray-900 dark:text-white">{dealer.businessName}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{dealer.plan} Plan</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                pathname === item.href
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Link 
            href="/api/auth/signout" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sign Out</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
