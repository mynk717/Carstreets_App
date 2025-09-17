// app/admin/content/page.tsx
'use client'

import { useState, useEffect } from 'react'

export default function ContentStudioPage() {
  const [cars, setCars] = useState([])
  const [selectedCar, setSelectedCar] = useState(null)
  const [generatedContent, setGeneratedContent] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCars()
  }, [])

  const fetchCars = async () => {
    const response = await fetch('/api/cars')
    const data = await response.json()
    setCars(data.cars)
  }
const generateIntelligentBatchContent = async () => {
  setLoading(true)
  try {
    const response = await fetch('/api/admin/content/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin-temp-key'
      },
      body: JSON.stringify({
        contentType: 'batch_content',
        platform: 'facebook',
        useIntelligentSelection: true
      })
    })
    
    const data = await response.json()
    console.log('Intelligent batch content:', data)
    setGeneratedContent(JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Intelligent content generation failed:', error)
  } finally {
    setLoading(false)
  }
}
  const generateContent = async (contentType: string, platform?: string) => {
    if (!selectedCar) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/admin/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-temp-key'
        },
        body: JSON.stringify({
          carId: selectedCar.id,
          contentType,
          platform
        })
      })
      
      const data = await response.json()
      setGeneratedContent(data.content)
    } catch (error) {
      console.error('Content generation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Content Studio</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Car Selection */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Select Car</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {cars.map((car) => (
              <div
                key={car.id}
                onClick={() => setSelectedCar(car)}
                className={`p-3 border rounded cursor-pointer ${
                  selectedCar?.id === car.id ? 'bg-blue-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{car.title}</div>
                <div className="text-sm text-gray-600">{car.price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Generation */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Generate Content</h2>
          
          {selectedCar && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded">
                <strong>Selected:</strong> {selectedCar.title}
              </div>
              
              {/* Content Type Buttons */}
              <div className="space-y-2">
                <button
  onClick={() => generateIntelligentBatchContent()}
  disabled={loading}
  className="w-full p-3 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 font-medium"
>
  🧠 Generate Intelligent Content (Top 5 Cars)
</button>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => generateContent('social_post', 'facebook')}
                    disabled={loading}
                    className="p-2 bg-blue-600 text-white rounded text-sm"
                  >
                    Facebook Post
                  </button>
                  <button
                    onClick={() => generateContent('social_post', 'instagram')}
                    disabled={loading}
                    className="p-2 bg-pink-500 text-white rounded text-sm"
                  >
                    Instagram Post
                  </button>
                  <button
                    onClick={() => generateContent('social_post', 'linkedin')}
                    disabled={loading}
                    className="p-2 bg-blue-700 text-white rounded text-sm"
                  >
                    LinkedIn Post
                  </button>
                </div>
                
                <button
                  onClick={() => generateContent('youtube_title')}
                  disabled={loading}
                  className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  YouTube Title
                </button>
              </div>

              {/* Generated Content Display */}
              {generatedContent && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Generated Content:</h3>
                  <textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    className="w-full h-32 p-3 border rounded"
                    placeholder="Generated content will appear here..."
                  />
                  <button className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                    Save Content
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
// Note: This is a simplified version. In production, add error handling, loading states, and better UI/UX.