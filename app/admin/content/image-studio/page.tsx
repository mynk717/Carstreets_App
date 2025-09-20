'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/Button';

const AUTH_TOKEN = 'Bearer admin-temp-key';
interface CarData {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  location?: string;
}

export default function ImageStudioPage() {
  const [carData, setCarData] = useState<CarData>({
    id: '1',
    make: 'Maruti Suzuki',
    model: 'Swift',
    year: 2020,
    price: 650000,
    location: 'Raipur, Chhattisgarh'
  });
  
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const [contentType, setContentType] = useState<'lifestyle' | 'technical' | 'promotional'>('lifestyle');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  // ✅ FIXED: Real image handling
  const [useRealImage, setUseRealImage] = useState(false);
  const [realImageFile, setRealImageFile] = useState<File | null>(null);
  const [realImageUrl, setRealImageUrl] = useState<string>('');

  // ✅ Handle file upload and convert to URL
  const handleFileUpload = (file: File) => {
    setRealImageFile(file);
    const url = URL.createObjectURL(file);
    setRealImageUrl(url);
  };

  // ✅ Upload image to a URL (simple base64 for now)
  const uploadImageToUrl = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const testSingleImage = async (platform: string) => {
    setLoading(true);
    
    try {
      let imageUrl = '';
      
      // ✅ If using real image, convert to base64 URL
      if (useRealImage && realImageFile) {
        imageUrl = await uploadImageToUrl(realImageFile);
      }

      const prompt = `Professional CarStreets dealership ${contentType} photograph: 
      ${carData.year} ${carData.make} ${carData.model} priced at ₹${carData.price}`;
      
      const response = await fetch('/api/admin/thumbnails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
          Authorization: AUTH_TOKEN
         },
        body: JSON.stringify({
          carData,
          prompt,
          platform,
          style: 'photorealistic',
          useRealImage,
          realImageUrl: imageUrl // ✅ Now realImageFile value is used
        })
      });
      
      const result = await response.json();
      setResults({ singleImageTest: true, platform, result });
      
    } catch (error) {
      setResults({
        singleImageTest: true,
        platform,
        result: { success: false, error: error.message }
      });
    } finally {
      setLoading(false);
    }
  };
  
  const generateContent = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      const response = await fetch('/api/admin/test-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
          Authorization: AUTH_TOKEN
         },
        body: JSON.stringify({
          userId: 'image-studio-user',
          carIds: [carData.id],
          platforms: selectedPlatforms,
          contentType,
          useRealImage,
          realImageUrl: useRealImage && realImageFile ? await uploadImageToUrl(realImageFile) : ''
        })
      });
      
      const result = await response.json();
      setResults(result);
      
    } catch (error) {
      setResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">
          🎨 CarStreets Image Studio (Nano-Banana)
        </h1>
        <p className="text-gray-600 text-lg">
          Real car photos + AI branding with fal.ai nano-banana
        </p>
      </div>
      
      {/* Car Data Input */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">🚗 Car Configuration</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Make</label>
                <input
                  type="text"
                  value={carData.make}
                  onChange={(e) => setCarData({...carData, make: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Model</label>
                <input
                  type="text"
                  value={carData.model}
                  onChange={(e) => setCarData({...carData, model: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Year</label>
                <input
                  type="number"
                  value={carData.year}
                  onChange={(e) => setCarData({...carData, year: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={carData.price}
                  onChange={(e) => setCarData({...carData, price: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>

            {/* ✅ FIXED: Real Image Upload Section */}
            <div className="pt-4 border-t">
              <label className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={useRealImage}
                  onChange={(e) => setUseRealImage(e.target.checked)}
                  className="mr-2"
                />
                <span className="font-medium">🖼️ Use Real Car Photo</span>
              </label>
              
              {useRealImage && (
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    className="w-full p-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-600">
                    📸 Upload your car photo - Nano-banana will add CarStreets branding
                  </p>
                  
                  {realImageUrl && (
                    <div className="mt-2">
                      <img 
                        src={realImageUrl} 
                        alt="Uploaded car" 
                        className="w-32 h-32 object-cover rounded border"
                      />
                      <p className="text-xs text-green-600 mt-1">✅ Image ready for branding</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Generation Controls */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">⚙️ Nano-Banana Controls</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Content Type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as any)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="lifestyle">🏖️ Lifestyle Photography</option>
                <option value="technical">🔧 Technical Showcase</option>
                <option value="promotional">📢 Promotional Graphics</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Target Platforms</label>
              <div className="space-y-2">
                {['instagram', 'facebook', 'linkedin'].map(platform => (
                  <label key={platform} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlatforms([...selectedPlatforms, platform]);
                        } else {
                          setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
                        }
                      }}
                      className="mr-2"
                    />
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </label>
                ))}
              </div>
            </div>
            
            {/* Quick Test Buttons */}
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-3">🧪 Quick fal.ai Tests</h3>
              <div className="grid grid-cols-3 gap-2">
                {['instagram', 'facebook', 'linkedin'].map(platform => (
                  <button
                    key={platform}
                    onClick={() => testSingleImage(platform)}
                    disabled={loading}
                    className="px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
                  >
                    🍌 Test {platform}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Main Generation Button */}
            <div className="pt-4 border-t">
              <Button
                onClick={generateContent}
                disabled={loading || selectedPlatforms.length === 0}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? '🔄 Nano-Banana Generating...' : '🍌 Generate with Nano-Banana'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Results Display - Same as before but shows fal.ai results */}
      {results && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">
            {results.success ? '✅ Nano-Banana Results' : '❌ Generation Failed'}
          </h2>
          
          {/* Display results as before */}
          <pre className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
