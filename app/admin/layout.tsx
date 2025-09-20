// app/admin/layout.tsx
import Link from 'next/link'
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        {/* Complete override - no main site header */}
        <div className="h-full flex flex-col lg:flex-row bg-gray-100">
          <nav className="w-full lg:w-64 bg-gray-900 text-white shadow-lg">
            <div className="p-4">
              <h2 className="text-xl font-bold mb-6">CarStreets Admin</h2>
              <ul className="space-y-2">
                <li><Link href="/admin/cars" className="block px-4 py-2 rounded hover:bg-gray-700"> Car Management</Link></li>
                <li><Link href="/admin/content" className="block px-4 py-2 rounded hover:bg-gray-700"> Content Studio</Link></li>
                <li><Link href="/admin/content/image-studio" className="block px-4 py-2 hover:bg-gray-100">🎨 Image Studio</Link></li>
                <li><Link href="/admin/content/calendar" className="block px-4 py-2 hover:bg-gray-100">🗓️ Content Calendar</Link></li>
              </ul>
              <Link href="/" className="mt-8 block text-blue-300 text-sm">← Back to Main Site</Link>
            </div>
          </nav>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  )
}
