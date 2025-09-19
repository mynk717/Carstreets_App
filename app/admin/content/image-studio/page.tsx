'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/Button';

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
  
  const generateContent = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      // Step 1: Generate unique, detailed content first
      const uniquePrompt = `Create HIGHLY SPECIFIC and UNIQUE content for a ${carData.year} ${carData.make} ${carData.model}.
      
      Focus on these UNIQUE aspects:
      - Specific model year advantages (${carData.year} improvements over previous years)
      - Detailed technical specifications unique to this variant
      - Market positioning in Raipur's competitive landscape
      - Seasonal relevance for September 2025 car buyers
      - Financial benefits specific to this price range (₹${carData.price})
      - Local dealer advantages and CarStreets exclusive benefits
      
      Make every sentence information-rich and avoid generic car descriptions.
      Include specific numbers, features, and local market insights.
      
      Content type: ${contentType}
      Target platforms: ${selectedPlatforms.join(', ')}`;
      
      // Step 2: Generate content with images
      const response = await fetch('/api/admin/test-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'admin-user',
          carIds: [carData.id],
          customPrompt: uniquePrompt,
          platforms: selectedPlatforms,
          contentType
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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎨 CarStreets Image Studio
        </h1>
        <p className="text-gray-600">
          Multi-model AI image generation with {'>'}90% unique content
        </p>
      </div>
      
      {/* Car Data Input */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">🚗 Car Details</h2>
          
          <div className="space-y-4">
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
          </div>
        </div>
        
        {/* Generation Options */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">⚙️ Generation Options</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Content Type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as any)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="lifestyle">🏖️ Lifestyle</option>
                <option value="technical">🔧 Technical</option>
                <option value="promotional">📢 Promotional</option>
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
            
            <Button
              onClick={generateContent}
              disabled={loading || selectedPlatforms.length === 0}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? '🔄 Generating...' : '🚀 Generate Content + Images'}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Results Display */}
      {results && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {results.success ? '✅ Generation Results' : '❌ Generation Failed'}
          </h2>
          
          {results.success ? (
            <div className="space-y-6">
              {/* Quality Metrics */}
              {results.result?.quality_metrics && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">📊 Quality Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Uniqueness:</span>
                      <br />
                      <span className="font-bold text-green-600">
                        {results.result.quality_metrics.uniqueness_score}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Accuracy:</span>
                      <br />
                      <span className="font-bold text-green-600">
                        {results.result.quality_metrics.accuracy_score}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Images:</span>
                      <br />
                      <span className="font-bold text-green-600">
                        {results.result.quality_metrics.image_success_rate}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Cost:</span>
                      <br />
                      <span className="font-bold text-blue-600">
                        ₹{(results.result.total_cost * 83).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Generated Content */}
              {results.result?.content && (
                <div className="space-y-4">
                  {results.result.content.map((item: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">
                        🚗 Car {item.carId} - {item.success ? 'Success' : 'Failed'}
                      </h3>
                      
                      {item.content && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">📝 Generated Text:</h4>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded">
                            {item.content.text}
                          </p>
                          <div className="mt-2">
                            <span className="text-sm text-blue-600">
                              {item.content.hashtags?.join(' ')}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {item.images && item.images.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">🖼️ Generated Images:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {item.images.map((img: any, imgIndex: number) => (
                              <div key={imgIndex} className="border rounded p-3">
                                <div className="text-sm">
                                  <span className="font-medium">{img.platform}</span>
                                  <br />
                                  <span className={img.success ? 'text-green-600' : 'text-red-600'}>
                                    {img.success ? '✅ Success' : '❌ Failed'}
                                  </span>
                                  {img.model && (
                                    <>
                                      <br />
                                      <span className="text-gray-600">Model: {img.model}</span>
                                    </>
                                  )}
                                  {img.cost && (
                                    <>
                                      <br />
                                      <span className="text-blue-600">Cost: ₹{(img.cost * 83).toFixed(2)}</span>
                                    </>
                                  )}
                                </div>
                                {img.imageUrl && (
                                  <img 
                                    src={img.imageUrl} 
                                    alt={`${img.platform} image`}
                                    className="w-full mt-2 rounded"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-700">{results.error}</p>
            </div>
          )}
          
          <details className="mt-6">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
              🔍 Raw API Response
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
