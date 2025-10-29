import Link from 'next/link'
import { Car, BarChart3, Calendar, Image as LucideImage, Users, Home, Settings, TrendingUp } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/api/auth/[...nextauth]/route'
import Image from 'next/image'
import { UserProfileDropdown } from '@/components/admin/UserProfileDropdown'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const user = session?.user

  const navItems = [
    { href: '/admin', icon: Home, label: 'Overview' },
    { href: '/admin/dealers', icon: Users, label: 'Dealers', badge: 'New' },
    { href: '/admin/cars', icon: Car, label: 'Car Management' },
    { href: '/admin/content', icon: BarChart3, label: 'Content Studio' },
    { href: '/admin/content/image-studio', icon: LucideImage, label: 'Image Studio' },
    { href: '/admin/content/calendar', icon: Calendar, label: 'Content Calendar' },
  ]

  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-gray-50">
        <div className="h-full flex">
          {/* Sidebar */}
          <nav className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <Link href="/admin" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">M</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">MotoYard</h2>
                  <p className="text-xs text-gray-500">Platform Admin</p>
                </div>
              </Link>
            </div>

            <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
                >
                  <item.icon className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-blue-600" />
                  <span className="font-medium text-sm">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Sidebar footer */}
            <div className="p-4 border-t border-gray-200 space-y-2">
              <Link 
                href="/" 
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
              >
                <TrendingUp className="w-4 h-4" />
                View Main Site
              </Link>
              <Link 
                href="/admin/settings" 
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
              >
                <Settings className="w-4 h-4" />
                Platform Settings
              </Link>
            </div>
          </nav>

          {/* Main Content w/ Navbar */}
          <main className="flex-1 overflow-auto">
            <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
              <div>
                {/* You can add breadcrumbs or page title here if needed */}
              </div>

              <UserProfileDropdown user={user} />

            </header>
            <div className="p-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  )
}
