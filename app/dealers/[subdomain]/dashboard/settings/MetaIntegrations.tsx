'use client';

import { useState } from 'react';
import { MessageSquare, CheckCircle2, Mail, ExternalLink } from 'lucide-react';

export function MetaIntegrations({ dealer, subdomain }: { dealer: any; subdomain: string }) {
  const [showHelp, setShowHelp] = useState(false);

  const isWhatsAppConnected = !!dealer.whatsappBusinessAccountId;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">WhatsApp Business Integration</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Connect your WhatsApp Business Account to send bulk messages and automated campaigns to your customers.
      </p>

      {/* WhatsApp Connection Status */}
      <div className={`flex items-center justify-between p-4 border rounded-lg mb-4 ${
        isWhatsAppConnected 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900'
          : 'border-gray-200 dark:border-gray-700'
      }`}>
        <div className="flex items-center gap-4">
          <MessageSquare className={`w-6 h-6 ${isWhatsAppConnected ? 'text-green-600' : 'text-gray-400'}`} />
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">WhatsApp Business</h4>
            {isWhatsAppConnected ? (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>{dealer.whatsappBusinessNumber || 'Connected'}</span>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Not connected</p>
            )}
          </div>
        </div>

        {isWhatsAppConnected ? (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>✅ Active</p>
          </div>
        ) : (
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Request Connection
          </button>
        )}
      </div>

      {/* Help Modal/Message */}
      {showHelp && !isWhatsAppConnected && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                WhatsApp Business Setup Required
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
                To connect your WhatsApp Business account, our team will help you set it up. This is a one-time process that takes about 5-10 minutes.
              </p>
              
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">What we'll need from you:</p>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                  <li>Your WhatsApp Business phone number</li>
                  <li>Access to your Meta Business Manager (we'll guide you)</li>
                  <li>Confirmation of business verification status</li>
                </ul>
              </div>

              <a
                href="mailto:support@mktgdime.com?subject=WhatsApp Business Setup Request&body=Hi, I'd like to connect my WhatsApp Business account to CarStreets.%0D%0A%0D%0ABusiness Name: {businessName}%0D%0ASubdomain: {subdomain}%0D%0AWhatsApp Number: [Please provide]%0D%0A%0D%0AThank you!"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                <Mail className="w-4 h-4" />
                Email Support to Get Started
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Already Connected - Status Info */}
      {isWhatsAppConnected && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">✅ WhatsApp is Connected</h4>
          <div className="text-sm text-green-800 dark:text-green-300 space-y-2">
            <p><strong>Phone Number:</strong> {dealer.whatsappBusinessNumber}</p>
            <p><strong>Account ID:</strong> {dealer.whatsappBusinessAccountId}</p>
            <p className="pt-2 border-t border-green-200 dark:border-green-800">
              You can now send bulk WhatsApp messages from the <a href={`/dealers/${subdomain}/dashboard/whatsapp`} className="underline font-medium">WhatsApp Dashboard</a>.
            </p>
          </div>
        </div>
      )}

      {/* Documentation Links */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Learn More</h4>
        <div className="space-y-2">
          <a
            href="https://business.facebook.com/wa/manage/home/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Meta WhatsApp Business Manager
          </a>
          <a
            href="https://developers.facebook.com/docs/whatsapp/business-management-api/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            WhatsApp Business API Documentation
          </a>
        </div>
      </div>
    </div>
  );
}
