import { ContentStudioClient } from './ContentStudioClient';

export default function ContentStudioPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Content Studio</h1>
      <p className="text-gray-600 mb-6">
        Generate AI-powered content for your social media platforms.
      </p>
      <ContentStudioClient />
    </div>
  );
}
