import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { MessageSquare, CheckCircle2, XCircle } from 'lucide-react';

export default async function AdminDealersPage() {
  const dealers = await prisma.dealer.findMany({
    select: {
      id: true,
      businessName: true,
      name: true,
      subdomain: true,
      email: true,
      plan: true,
      whatsappBusinessAccountId: true,
      whatsappBusinessNumber: true,
      carsCount: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dealers Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage dealer accounts and WhatsApp connections
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Business
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Subdomain
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                WhatsApp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cars
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {dealers.map((dealer) => (
              <tr key={dealer.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {dealer.businessName || dealer.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{dealer.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <a
                    href={`https://${dealer.subdomain}.motoyard.mktgdime.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {dealer.subdomain}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 capitalize">
                    {dealer.plan}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {dealer.whatsappBusinessAccountId ? (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-gray-900 dark:text-white">
                        {dealer.whatsappBusinessNumber || 'Connected'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500 dark:text-gray-400">Not connected</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {dealer.carsCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link
                    href={`/admin/dealers/${dealer.id}/whatsapp`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Setup WhatsApp
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {dealers.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No dealers found
          </div>
        )}
      </div>
    </div>
  );
}
