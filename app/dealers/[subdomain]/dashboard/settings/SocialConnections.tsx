'use client';
import { CheckCircle, Link as LinkIcon, XCircle } from 'lucide-react';

export function SocialConnections({ dealer }: { dealer: any }) {
  // In a real app, this data would come from dealer.socialMediaConnected JSON
  const connections = {
    whatsapp: dealer.whatsappBusinessVerified || false,
    facebook: dealer.facebookPageId || false,
    instagram: dealer.metaAccessToken || false, // Assuming insta is linked via meta
  };

  const ConnectionStatus = ({ platform, isConnected }: { platform: string, isConnected: boolean }) => (
    <div className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <span className="font-medium text-gray-800 dark:text-gray-200">{platform}</span>
      {isConnected ? (
        <span className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
          <CheckCircle className="w-5 h-5" /> Connected
        </span>
      ) : (
        <a href="#" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline">
          <LinkIcon className="w-5 h-5" /> Connect Now
        </a>
      )}
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Social Connections</h3>
       <div className="space-y-3">
        <ConnectionStatus platform="WhatsApp Business" isConnected={connections.whatsapp} />
        <ConnectionStatus platform="Facebook Page" isConnected={connections.facebook} />
        <ConnectionStatus platform="Instagram Business" isConnected={connections.instagram} />
      </div>
    </div>
  );
}
