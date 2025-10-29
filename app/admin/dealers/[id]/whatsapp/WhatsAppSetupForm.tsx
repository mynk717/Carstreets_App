'use client';

import { useState } from 'react';
import { Save, ExternalLink, AlertCircle } from 'lucide-react';

export default function WhatsAppSetupForm({ dealer }: { dealer: any }) {
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState({
    wabaId: dealer.whatsappBusinessAccountId || '',
    phoneNumber: dealer.whatsappBusinessNumber || '',
    accessToken: dealer.whatsappApiToken || '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/dealers/${dealer.id}/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) throw new Error(await res.text());
      alert('WhatsApp credentials saved successfully!');
      window.location.href = '/admin/dealers';
    } catch (e: any) {
      alert('Failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Setup WhatsApp for {dealer.businessName}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Configure WhatsApp Business API credentials for this dealer
      </p>
      
      {/* Instructions Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">How to Get These Credentials</h3>
            <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://business.facebook.com/wa/manage/home/" target="_blank" rel="noopener noreferrer" className="underline font-medium">Meta Business Manager</a></li>
              <li>Select <strong>WhatsApp Accounts</strong> → Choose the dealer's account</li>
              <li>Copy the <strong>WABA ID</strong> from Account Info</li>
              <li>Go to <strong>System Users</strong> → Create/Select a System User</li>
              <li>Generate token with <strong>whatsapp_business_messaging</strong> permission</li>
              <li>Copy and paste the credentials below</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-2">
            WABA ID
          </label>
          <input
            type="text"
            value={credentials.wabaId}
            onChange={(e) => setCredentials({ ...credentials, wabaId: e.target.value })}
            placeholder="1234567890123456"
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            WhatsApp Business Account ID (16-digit number)
          </p>
        </div>

        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-2">
            Phone Number
          </label>
          <input
            type="text"
            value={credentials.phoneNumber}
            onChange={(e) => setCredentials({ ...credentials, phoneNumber: e.target.value })}
            placeholder="+919876543210"
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Phone number with country code (E.164 format)
          </p>
        </div>

        <div>
          <label className="block font-medium text-gray-900 dark:text-white mb-2">
            Access Token
          </label>
          <textarea
            value={credentials.accessToken}
            onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })}
            placeholder="EAAxxxxxxxxxxxxxx..."
            rows={4}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            System User Access Token from Meta Business Manager
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !credentials.wabaId || !credentials.accessToken}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save WhatsApp Configuration'}
        </button>
      </div>

      {/* Documentation Links */}
      <div className="mt-6 flex items-center gap-4 text-sm">
        <a
          href="https://developers.facebook.com/docs/whatsapp/business-management-api/get-started"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ExternalLink className="w-4 h-4" />
          WhatsApp API Documentation
        </a>
        <a
          href="https://business.facebook.com/wa/manage/home/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ExternalLink className="w-4 h-4" />
          Meta Business Manager
        </a>
      </div>
    </div>
  );
}
