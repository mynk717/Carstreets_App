// app/admin/content/calendar/page.tsx - FIXED VERSION
'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { ApprovalModal } from "./ApprovalModal";  // relative path
import { useSession } from 'next-auth/react'


export default function ContentCalendarPage() {
  const { data: session, status } = useSession()
  const [contentItems, setContentItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedContent, setSelectedContent] = useState<{id: string, title: string} | null>(null);

if (status === 'loading') return <div>Checking authentication...</div>
if (!session) return <div>Please sign in to access admin features</div>
  // Load existing content calendar
  useEffect(() => {
    loadContentCalendar();
  }, []);
  
  const handleOpenApprovalModal = (contentItem) => {
  setSelectedContent(contentItem); // save whole content object to show title etc in modal
  setIsModalOpen(true);
};
const handleApprovalConfirm = async (scheduledDate: Date | null) => {
  if (!selectedContent) return;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (process.env.NEXT_PUBLIC_VERCEL_AUTOMATION_BYPASS_SECRET) {
      headers['x-vercel-protection-bypass'] = process.env.NEXT_PUBLIC_VERCEL_AUTOMATION_BYPASS_SECRET;
    }

    const response = await fetch('/api/admin/content/approve', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contentId: selectedContent.id,
        scheduledDate: scheduledDate ? scheduledDate.toISOString() : null,
      }),
    });

    if (response.ok) {
      alert('✅ Content approved successfully!');
      setIsModalOpen(false);
      await loadContentCalendar();
    } else {
      alert('❌ Approval failed');
    }
  } catch (error: any) {
    alert(`❌ Approval failed: ${error.message}`);
  }
};

  const loadContentCalendar = async () => {
    try {
      // ✅ FIXED: Add proper headers including authorization
      const headers: Record<string, string> = {
      };
      
      // Add Vercel bypass token if available
      if (process.env.NEXT_PUBLIC_VERCEL_AUTOMATION_BYPASS_SECRET) {
        headers['x-vercel-protection-bypass'] = process.env.NEXT_PUBLIC_VERCEL_AUTOMATION_BYPASS_SECRET;
      }
      
      const response = await fetch('/api/admin/content/calendar', {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Calendar loading failed: ${response.status}`);
      }
      
      const data = await response.json();
      setContentItems(data.content || []);
    } catch (error) {
      console.error('Failed to load calendar:', error);
      setContentItems([]); // Set empty array as fallback
    }
  };
  
  const generateAutomatedContent = async () => {
    setGenerating(true);
    try {
      // ✅ FIXED: Add Vercel bypass headers for production
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add Vercel bypass token if available
      if (process.env.NEXT_PUBLIC_VERCEL_AUTOMATION_BYPASS_SECRET) {
        headers['x-vercel-protection-bypass'] = process.env.NEXT_PUBLIC_VERCEL_AUTOMATION_BYPASS_SECRET;
      }
      
      const response = await fetch('/api/admin/content/generate-calendar', {
        method: 'POST',
        headers,
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
  // ✅ NEW: Content cleanup functions
const cleanupContent = async (autoCleanup = false) => {
  setLoading(true);
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (process.env.NEXT_PUBLIC_VERCEL_AUTOMATION_BYPASS_SECRET) {
      headers['x-vercel-protection-bypass'] = process.env.NEXT_PUBLIC_VERCEL_AUTOMATION_BYPASS_SECRET;
    }

    const response = await fetch('/api/admin/content/cleanup', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        maxItems: 20,
        autoCleanup
      })
    });

    const result = await response.json();
    
    if (result.success) {
      await loadContentCalendar(); // Refresh the calendar
      alert(`Cleanup completed: ${result.message}`);
    } else {
      alert(`Cleanup failed: ${result.error}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  const approveContent = async (contentId: string) => {
    try {
      // ✅ FIXED: Add Vercel bypass headers for approval
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add Vercel bypass token if available
      if (process.env.NEXT_PUBLIC_VERCEL_AUTOMATION_BYPASS_SECRET) {
        headers['x-vercel-protection-bypass'] = process.env.NEXT_PUBLIC_VERCEL_AUTOMATION_BYPASS_SECRET;
      }
      
      const response = await fetch('/api/admin/content/approve', {
        method: 'POST',
        headers,
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
        {/* ✅ NEW: Cleanup buttons */}
  <Button
    onClick={() => cleanupContent(false)}
    disabled={loading}
    className="bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50"
  >
    Check Cleanup Status
  </Button>
  
  <Button
    onClick={() => cleanupContent(true)}
    disabled={loading}
    className="bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
  >
    Auto-Clean (Keep 20 Recent)
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
            <div className="mt-4">
        {item.status === 'draft' && (
          <button
            onClick={() => handleOpenApprovalModal(item)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            ✅ Approve & Schedule
          </button>
        )}
        
        {item.status === 'scheduled' && (
          <div className="w-full bg-yellow-100 text-yellow-800 py-2 px-4 rounded-lg text-center text-sm font-medium">
            📅 Scheduled for {new Date(item.scheduledDate).toLocaleDateString()}
          </div>
        )}
        
        {item.status === 'posted' && (
          <div className="w-full bg-green-100 text-green-800 py-2 px-4 rounded-lg text-center text-sm font-medium">
            ✅ Posted successfully
          </div>
        )}
      </div>
    </div>
  ))}
</div>
      <ApprovalModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      contentTitle={selectedContent?.title ?? ""}
      onConfirm={handleApprovalConfirm}
    />
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