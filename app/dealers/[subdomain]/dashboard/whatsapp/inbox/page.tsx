import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import InboxClient from './InboxClient';

export default async function WhatsAppInboxPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  const { subdomain } = await params;

  const dealer = await prisma.dealer.findUnique({
    where: { subdomain },
    select: {
      id: true,
      email: true,
      businessName: true,
      whatsappPhoneNumberId: true,
    },
  });

  if (!dealer || session.user.email !== dealer.email) {
    redirect('/auth/signin');
  }

  if (!dealer.whatsappPhoneNumberId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            WhatsApp Not Connected
          </h2>
          <p className="text-gray-600 mb-4">
            Please connect your WhatsApp Business account first.
          </p>
          <a
            href={`/dealers/${subdomain}/dashboard/whatsapp`}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Go to WhatsApp Settings
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-[#008069] text-white px-4 py-3 flex items-center gap-3 shadow-md flex-shrink-0">
        <a
          href={`/dealers/${subdomain}/dashboard/whatsapp`}
          className="text-white hover:text-gray-200"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </a>
        <h1 className="text-lg font-semibold">WhatsApp Inbox</h1>
      </div>

      {/* Inbox UI */}
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-500">Loading conversations...</div>
          </div>
        }
      >
        <InboxClient subdomain={subdomain} dealerId={dealer.id} />
      </Suspense>
    </div>
  );
}
