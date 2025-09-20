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
      const response = await fetch('/api/admin/test-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'image-studio-user',
          carIds: [carData.id],
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

  const testSingleImage = async (platform: string) => {
    setLoading(true);
    
    try {
      const prompt = `A ${contentType} photograph of a ${carData.year} ${carData.make} ${carData.model} 
        priced at ₹${carData.price}, available at CarStreets dealership in Raipur, Chhattisgarh. 
        Professional automotive photography with clean composition for ${platform} social media.`;
      
      const response = await fetch('/api/admin/thumbnails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carData,
          prompt,
          platform,
          style: 'photorealistic'
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
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">
          🎨 CarStreets Image Studio
        </h1>
        <p className="text-gray-600 text-lg">
          Multi-model AI image generation testing with 92% unique content
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
          </div>
        </div>
        
        {/* Generation Controls */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">⚙️ Generation Controls</h2>
          
          <div className="space-y-4">
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
                    {platform === 'instagram' && ' (1:1)'}
                    {platform === 'linkedin' && ' (16:9)'}
                  </label>
                ))}
              </div>
            </div>
            
            {/* Quick Test Buttons */}
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-3">🧪 Quick Image Tests</h3>
              <div className="grid grid-cols-3 gap-2">
                {['instagram', 'facebook', 'linkedin'].map(platform => (
                  <button
                    key={platform}
                    onClick={() => testSingleImage(platform)}
                    disabled={loading}
                    className="px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
                  >
                    Test {platform}
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
                {loading ? '🔄 Generating Content + Images...' : '🚀 Generate Complete Campaign'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Results Display */}
      {results && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">
            {results.success ? '✅ Generation Results' : '❌ Generation Failed'}
          </h2>
          
          {results.singleImageTest && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">
                🧪 Single Image Test - {results.platform}
              </h3>
              
              {results.result.success ? (
                <div className="space-y-4">
                  <div className="text-green-600 font-medium">
                    ✅ Image generated successfully with {results.result.model}
                  </div>
                  
                  {results.result.imageUrl && (
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Generated Image:</div>
                      <img 
                        src={results.result.imageUrl} 
                        alt={`Generated ${results.platform} image`}
                        className="max-w-sm border rounded-lg shadow"
                        style={{ maxHeight: '300px' }}
                      />
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Cost:</span> ₹{(results.result.cost * 83).toFixed(2)} | 
                    <span className="font-medium"> Model:</span> {results.result.model}
                  </div>
                </div>
              ) : (
                <div className="text-red-600">
                  ❌ Failed: {results.result.error}
                </div>
              )}
            </div>
          )}
          
          {results.success && results.result && !results.singleImageTest && (
            <div className="space-y-6">
              {/* Quality Metrics */}
              {results.result.quality_metrics && (
                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">📊 Quality Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Content Uniqueness:</span>
                      <div className="font-bold text-green-600">
                        {results.result.quality_metrics.uniqueness_score}%
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Accuracy:</span>
                      <div className="font-bold text-green-600">
                        {results.result.quality_metrics.accuracy_score}%
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Image Success:</span>
                      <div className="font-bold text-blue-600">
                        {results.result.quality_metrics.image_success_rate}%
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Cost:</span>
                      <div className="font-bold text-purple-600">
                        ₹{(results.result.total_cost * 83).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Generated Content with Images */}
              {results.result.content && (
                <div className="space-y-6">
                  {results.result.content.map((item: any, index: number) => (
                    <div key={index} className="border-2 border-gray-200 rounded-lg p-6">
                      <h3 className="text-xl font-semibold mb-4 text-blue-600">
                        🚗 Car {item.carId} Campaign - {item.success ? '✅ Complete' : '❌ Failed'}
                      </h3>
                      
                      {item.content && (
                        <div className="mb-6">
                          <h4 className="font-medium mb-2">📝 Generated Content:</h4>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <pre className="whitespace-pre-wrap text-sm text-gray-800">
                              {item.content.text?.substring(0, 600)}...
                            </pre>
                          </div>
                          <div className="mt-2 text-sm text-blue-600">
                            {item.content.hashtags?.join(' ')}
                          </div>
                        </div>
                      )}
                      
                      {item.images && item.images.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">🖼️ Generated Images:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {item.images.map((img: any, imgIndex: number) => (
                              <div key={imgIndex} className="border rounded-lg p-3 bg-white">
                                <div className="text-sm mb-3">
                                  <span className="font-medium">{img.platform}</span>
                                  <br />
                                  <span className={img.success ? 'text-green-600' : 'text-red-600'}>
                                    {img.success ? '✅ Generated' : '❌ Failed'}
                                  </span>
                                  {img.model && (
                                    <>
                                      <br />
                                      <span className="text-gray-600">Model: {img.model}</span>
                                    </>
                                  )}
                                  {img.cost > 0 && (
                                    <>
                                      <br />
                                      <span className="text-blue-600">Cost: ₹{(img.cost * 83).toFixed(2)}</span>
                                    </>
                                  )}
                                </div>
                                
                                {img.imageUrl && (
                                  <div className="mb-2">
                                    <img 
                                      src={img.imageUrl} 
                                      alt={`${img.platform} generated image`}
                                      className="w-full rounded border"
                                      style={{ maxHeight: '200px', objectFit: 'cover' }}
                                    />
                                  </div>
                                )}
                                
                                {!img.success && img.error && (
                                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                    {img.error}
                                  </div>
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
          )}
          
          {!results.success && (
            <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
              <p className="text-red-700 font-medium">❌ Error: {results.error}</p>
            </div>
          )}
          
          <details className="mt-6">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
              🔍 Full API Response (Debug)
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(results, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
