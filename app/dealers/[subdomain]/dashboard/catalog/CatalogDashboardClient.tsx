'use client';

import { useState } from 'react';
import { Download, RefreshCw, CheckCircle2, XCircle, Package, ShoppingCart, ExternalLink } from 'lucide-react';

type CatalogInfo = {
  id: string;
  metaCatalogId: string | null;
  catalogName: string;
  status: string;
  lastSyncedAt: Date | string | null;
  itemCount: number;
  syncError: string | null;
} | null;

export default function CatalogDashboardClient({
  subdomain,
  dealer,
  catalogInfo,
  inventoryCount,
}: {
  subdomain: string;
  dealer: any;
  catalogInfo: CatalogInfo;
  inventoryCount: number;
}) {
  const [syncing, setSyncing] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<any>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(`/api/dealers/${subdomain}/catalog/sync`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();

      setSyncResult(result);
      
      if (result.success) {
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (e: any) {
      setSyncResult({ success: false, error: e.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleDownload = async (format: 'xml' | 'csv' | 'json') => {
    setDownloading(format);
    try {
      const res = await fetch(`/api/dealers/${subdomain}/catalog/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });

      if (!res.ok) throw new Error(await res.text());

      if (format === 'json') {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `catalog.json`;
        a.click();
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `catalog.${format}`;
        a.click();
      }
    } catch (e: any) {
      alert('Download failed: ' + e.message);
    } finally {
      setDownloading(null);
    }
  };

  const metaConfigured = !!dealer.facebookCatalogId;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">
            Product Catalog
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Sync your inventory to Meta Commerce Manager for Facebook, Instagram, and WhatsApp
          </p>
        </div>
      </div>

      {/* Configuration Status */}
      {!metaConfigured && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">
                Meta Integration Not Configured
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                To sync your catalog to Meta Commerce Manager, you need to configure your Facebook Catalog ID and Access Token in Settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Inventory Items"
          value={inventoryCount}
          icon={<Package />}
          accent="text-blue-600"
        />
        <StatCard
          label="Catalog Items"
          value={catalogInfo?.itemCount || 0}
          icon={<ShoppingCart />}
          accent="text-green-600"
        />
        <StatCard
          label="Sync Status"
          value={catalogInfo?.status || 'Not synced'}
          icon={catalogInfo?.status === 'synced' ? <CheckCircle2 /> : <XCircle />}
          accent={catalogInfo?.status === 'synced' ? 'text-green-600' : 'text-gray-600'}
        />
      </div>

      {/* Last Sync Info */}
      {catalogInfo?.lastSyncedAt && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last synced</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(catalogInfo.lastSyncedAt).toLocaleString()}
              </p>
              {catalogInfo.syncError && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Error: {catalogInfo.syncError}
                </p>
              )}
            </div>
            {catalogInfo.metaCatalogId && (
              <a
                href={`https://business.facebook.com/commerce/catalogs/${catalogInfo.metaCatalogId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                View in Meta
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Sync Result */}
      {syncResult && (
        <div
          className={`rounded-lg border p-4 ${
            syncResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {syncResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            )}
            <div>
              <h3
                className={`font-semibold ${
                  syncResult.success
                    ? 'text-green-900 dark:text-green-200'
                    : 'text-red-900 dark:text-red-200'
                }`}
              >
                {syncResult.success ? 'Sync Successful' : 'Sync Failed'}
              </h3>
              <p
                className={`text-sm mt-1 ${
                  syncResult.success
                    ? 'text-green-800 dark:text-green-300'
                    : 'text-red-800 dark:text-red-300'
                }`}
              >
                {syncResult.success
                  ? `Successfully synced ${syncResult.itemsProcessed} items to Meta Catalog`
                  : syncResult.error || 'Unknown error occurred'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sync Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Sync to Meta Commerce Manager
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Push your current inventory to Facebook/Instagram/WhatsApp catalog. This will update all product listings.
        </p>
        <button
          onClick={handleSync}
          disabled={syncing || !metaConfigured}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {/* Download Feeds */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Download Product Feeds
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Export your catalog in different formats for Google Vehicle Ads, Meta bulk upload, or manual use.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleDownload('xml')}
            disabled={downloading === 'xml'}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading === 'xml' ? 'Downloading...' : 'Download XML (Google)'}
          </button>
          <button
            onClick={() => handleDownload('csv')}
            disabled={downloading === 'csv'}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading === 'csv' ? 'Downloading...' : 'Download CSV (Meta)'}
          </button>
          <button
            onClick={() => handleDownload('json')}
            disabled={downloading === 'json'}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading === 'json' ? 'Downloading...' : 'Download JSON'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        <div className={`${accent || 'text-gray-400'}`}>{icon}</div>
      </div>
      <p className={`text-3xl font-semibold ${accent || 'text-gray-900 dark:text-white'}`}>
        {value}
      </p>
    </div>
  );
}
