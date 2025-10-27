'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export function CarActionsClient({ 
  car, 
  subdomain 
}: { 
  car: { id: string; title: string }; 
  subdomain: string;
}) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`⚠️ Delete "${car.title}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/dealers/${subdomain}/cars/${car.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('✅ Car deleted successfully!');
        router.refresh(); // Refresh to update the list
      } else {
        alert(`❌ ${data.error || 'Failed to delete car'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('❌ Network error occurred while deleting');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Delete car"
    >
      {deleting ? (
        <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin inline-block" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}
