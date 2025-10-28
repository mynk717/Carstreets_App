'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateDealerSettings } from '@/actions/dealerActions';


export function AutomationSettings({ dealer }: { dealer: any }) {
  const router = useRouter();
  const [preference, setPreference] = useState(dealer.contentGenerationPreference || 'on_demand');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await updateDealerSettings(dealer.id, { contentGenerationPreference: preference });
    setIsSaving(false);
    alert('Settings saved successfully!');
    router.refresh(); // Refresh to ensure server components get the new data
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Content Automation</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Choose how AI generates social media posts for your cars. This setting controls API usage and costs.
      </p>
      
      <div className="space-y-4">
        <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${preference === 'on_demand' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'dark:border-gray-600'}`}>
          <input
            type="radio"
            name="content-preference"
            value="on_demand"
            checked={preference === 'on_demand'}
            onChange={(e) => setPreference(e.target.value)}
            className="w-5 h-5 text-blue-600 focus:ring-blue-500"
          />
          <div className="ml-4">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">On-Demand</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manually generate content from the Content Studio. You have full control. (Recommended)</p>
          </div>
        </label>
        <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${preference === 'automatic' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'dark:border-gray-600'}`}>
          <input
            type="radio"
            name="content-preference"
            value="automatic"
            checked={preference === 'automatic'}
            onChange={(e) => setPreference(e.target.value)}
            className="w-5 h-5 text-blue-600 focus:ring-blue-500"
          />
          <div className="ml-4">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">Automatic (Weekly)</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Our AI will create and schedule posts for new cars every week. (Higher API usage)</p>
          </div>
        </label>
      </div>
      
      <div className="mt-6 flex justify-end">
        <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
          {isSaving ? 'Saving...' : 'Save Preference'}
        </button>
      </div>
    </div>
  );
}
