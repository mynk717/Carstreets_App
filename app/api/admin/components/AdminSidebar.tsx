// app/admin/components/AdminSidebar.tsx
export function AdminSidebar() {
  return (
    <div className="w-64 bg-gray-800 text-white h-screen p-4">
      <h2 className="text-xl font-bold mb-4">MotoYard Admin</h2>
      <nav>
  <ul className="space-y-2">
    <li><a href="/admin" className="block p-2 hover:bg-gray-700 rounded">Dashboard</a></li>
    <li><a href="/admin/dealers" className="block p-2 hover:bg-gray-700 rounded">Dealers</a></li>
    <li><a href="/admin/scraper" className="block p-2 hover:bg-gray-700 rounded">Scraper</a></li>
    <li><a href="/admin/listings" className="block p-2 hover:bg-gray-700 rounded">Listings</a></li>
    <li><a href="/admin/content" className="block p-2 hover:bg-gray-700 rounded">Content Studio</a></li>
    <li><a href="/admin/analytics" className="block p-2 hover:bg-gray-700 rounded">Analytics</a></li>
  </ul>
</nav>
    </div>
  )
}