'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';

export default function ContentCalendarPage() {
  const [contentItems, setContentItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Load existing content calendar
  useEffect(() => {
    loadContentCalendar();
  }, []);
  
  const loadContentCalendar = async () => {
    try {
      // You'll need to create this API endpoint
      const response = await fetch('/api/admin/content/calendar');
      const data = await response.json();
      setContentItems(data.content || []);
    } catch (error) {
      console.error('Failed to load calendar:', error);
    }
  };
  
  const generateAutomatedContent = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/admin/content/generate-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Let it auto-select cars with images
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadContentCalendar(); // Reload the calendar
        alert(`✅ Generated ${result.generated} ready-to-post content items!`);
      } else {
        alert(`❌ Failed: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };
  
  const approveContent = async (contentId: string) => {
    try {
      const response = await fetch('/api/admin/content/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
        })
      });
      
      if (response.ok) {
        await loadContentCalendar();
        alert('✅ Content approved and scheduled!');
      }
    } catch (error) {
      alert(`❌ Approval failed: ${error.message}`);
    }
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-green-600 mb-2">
          🗓️ CarStreets Content Calendar
        </h1>
        <p className="text-gray-600 text-lg">
          Automated content generation with Cloudinary + nano-banana branding
        </p>
      </div>
      
      <div className="mb-8">
        <Button
          onClick={generateAutomatedContent}
          disabled={generating}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {generating ? '🔄 Generating Automated Content...' : '🚀 Generate Weekly Content'}
        </Button>
      </div>
      
      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contentItems.map((item: any) => (
          <div key={item.id} className="bg-white p-6 rounded-lg shadow-lg border">
            <div className="mb-4">
              <span className={`px-2 py-1 text-xs rounded-full ${
                item.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                item.status === 'approved' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {item.status.toUpperCase()}
              </span>
              <span className="ml-2 text-sm text-gray-600">{item.platform}</span>
            </div>
            
            {/* Generated Image */}
            {item.brandedImage && (
              <div className="mb-4">
                <img 
                  src={item.brandedImage} 
                  alt="Branded car content"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <p className="text-xs text-green-600 mt-1">✅ CarStreets branded</p>
              </div>
            )}
            
            {/* Generated Text */}
            <div className="mb-4">
              <p className="text-sm text-gray-800 line-clamp-4">
                {item.textContent?.substring(0, 150)}...
              </p>
              <p className="text-xs text-blue-600 mt-2">
                {item.hashtags?.join(' ')}
              </p>
            </div>
            
            {/* Stats */}
            <div className="text-xs text-gray-600 mb-4">
              <div>Uniqueness: {item.uniquenessScore}%</div>
              <div>Cost: ₹{(item.generationCost * 83).toFixed(2)}</div>
              <div>Auto-generated: ✅</div>
            </div>
            
            {/* Approval Button */}
            {item.status === 'draft' && (
              <Button
                onClick={() => approveContent(item.id)}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                ✅ Approve & Schedule
              </Button>
            )}
          </div>
        ))}
      </div>
      
      {contentItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-4">
            No content generated yet
          </p>
          <p className="text-sm text-gray-500">
            Click "Generate Weekly Content" to create automated branded content
          </p>
        </div>
      )}
    </div>
  );
}
