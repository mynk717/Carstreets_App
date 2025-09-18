// app/admin/layout.tsx
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100">
      {/* Mobile-First Navigation */}
      <nav className="w-full lg:w-64 bg-gray-900 text-white shadow-lg">
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-between lg:block">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                CS
              </div>
              <h2 className="text-lg lg:text-xl font-bold">CarStreets Admin</h2>
            </div>
            
            {/* Mobile menu indicator - you can add hamburger menu logic here later */}
            <div className="lg:hidden">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
          </div>
          
          <div className="mt-4 lg:mt-6">
            <ul className="flex lg:flex-col gap-2 lg:space-y-1">
              <li className="flex-1 lg:flex-none">
                <Link 
                  href="/admin/cars" 
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-sm lg:text-base font-medium"
                >
                  <span className="text-lg">🚗</span>
                  <span className="hidden sm:block">Car Management</span>
                  <span className="sm:hidden">Cars</span>
                </Link>
              </li>
              <li className="flex-1 lg:flex-none">
                <Link 
                  href="/admin/content" 
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-sm lg:text-base font-medium"
                >
                  <span className="text-lg">✨</span>
                  <span className="hidden sm:block">Content Studio</span>
                  <span className="sm:hidden">Content</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Admin Info Section */}
          <div className="hidden lg:block mt-8 pt-6 border-t border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold">A</span>
              </div>
              <div>
                <p className="text-sm font-medium">Admin</p>
                <p className="text-xs text-gray-400">CarStreets Panel</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <div className="min-h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
