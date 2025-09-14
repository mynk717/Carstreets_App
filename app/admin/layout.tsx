// app/admin/layout.tsx
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-layout flex">
      <nav className="w-64 bg-gray-800 text-white min-h-screen p-4">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
        <ul className="space-y-2">
          <li>
            <Link 
              href="/admin/cars" 
              className="block px-4 py-2 rounded hover:bg-gray-700"
            >
              Car Management
            </Link>
          </li>
          <li>
            <Link 
              href="/admin/content" 
              className="block px-4 py-2 rounded hover:bg-gray-700"
            >
              Content Studio
            </Link>
          </li>
        </ul>
      </nav>
      <main className="flex-1 bg-gray-50">
        {children}
      </main>
    </div>
  )
}
