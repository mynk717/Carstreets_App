'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  Sparkles, FileText, DollarSign, Loader2, CheckCircle, 
  AlertCircle, Facebook, Instagram, Linkedin, MessageSquare,
  Info
} from 'lucide-react';
import { estimateCost } from '@/lib/agents/platformGrouping';

export function ContentStudioClient() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'facebook']);
  const [carCount, setCarCount] = useState(10);
  const params = useParams();
  const subdomain = params.subdomain as string;

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-500', borderColor: 'border-pink-500' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600', borderColor: 'border-blue-600' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-sky-600', borderColor: 'border-sky-600' },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, color: 'bg-green-500', borderColor: 'border-green-500' },
  ];

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };


  const handleGenerateContent = async () => {
    if (selectedPlatforms.length === 0) {
      alert('⚠️ Please select at least one platform');
      return;
    }

    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`/api/dealers/${subdomain}/content/generate-calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          carCount: carCount,
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Content generation error:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Content Generation
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Generate professional social media content with lifestyle scene transformations
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">Smart Cost Optimization</p>
              <p className="text-blue-700 dark:text-blue-200">
                Images are reused across platforms with same aspect ratio. Only unique text content is generated for each platform.
              </p>
            </div>
          </div>
        </div>

        {/* Platform Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Select Platforms
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              const isSelected = selectedPlatforms.includes(platform.id);
              
              return (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                    isSelected
                      ? `${platform.borderColor} ${platform.color} bg-opacity-10`
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-current' : 'text-gray-400'}`} />
                  <span className={`font-medium text-sm ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                    {platform.name}
                  </span>
                  {isSelected && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Car Count Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Number of Cars (max 10 recommended)
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={carCount}
            onChange={(e) => setCarCount(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
            <span>1 car</span>
            <span className="font-medium text-blue-600">{carCount} cars</span>
            <span>10 cars</span>
          </div>
        </div>

        {/* Cost Estimate */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Estimated Cost:
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {selectedPlatforms.length} platform(s) × {carCount} car(s) = {selectedPlatforms.length * carCount} content items
          </p>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateContent}
          disabled={loading || selectedPlatforms.length === 0}
          className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating for {selectedPlatforms.length} platform(s)...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate AI Content
            </>
          )}
        </button>
      </div>

      {/* Result Display */}
      {result && result.success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
              Content Generated Successfully!
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-green-800 dark:text-green-200">Content Items</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{result.generated}</p>
              </div>
            </div>
          </div>
          <a 
            href={`/dealers/${subdomain}/dashboard/calendar`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            View in Calendar →
          </a>
        </div>
      )}

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            AI Transformations
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Lifestyle scene transformations</li>
            <li>• Professional color grading</li>
            <li>• Platform-optimized content</li>
            <li>• Authentic preowned appeal</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            How It Works
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>1. Select best cars from inventory</li>
            <li>2. AI transforms images + generates text</li>
            <li>3. Review in calendar</li>
            <li>4. Schedule or post instantly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
