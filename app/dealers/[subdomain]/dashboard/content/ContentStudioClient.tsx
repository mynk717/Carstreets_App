'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button'; // CORRECT PATH

export function ContentStudioClient() {
  const [loading, setLoading] = useState(false);

  const handleGenerateContent = async () => {
    setLoading(true);
    console.log('Generating content...');
    setTimeout(() => {
      setLoading(false);
      alert('Content generation started!');
    }, 2000);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">AI Content Generation</h2>
      <p className="text-gray-500 mb-6">
        Click the button to generate new posts for your inventory.
      </p>
      <Button onClick={handleGenerateContent} disabled={loading}>
        {loading ? 'Generating...' : 'Generate AI Content'}
      </Button>
    </div>
  );
}
