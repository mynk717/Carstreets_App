// app/admin/content/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function ContentStudioPage() {
  const { data: session, status } = useSession()
  const [cars, setCars] = useState([])
  const [selectedCar, setSelectedCar] = useState(null)
  const [batchContent, setBatchContent] = useState('') // ✅ Separate state
  const [selectedContent, setSelectedContent] = useState('') // ✅ Separate state
  const [generatedContent, setGeneratedContent] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session) {
      fetchCars()
    }
  }, [session])
  if (status === 'loading') return <div>Loading...</div>
  if (!session) return <div>Please sign in to access content studio</div>


  const fetchCars = async () => {
    const response = await fetch('/api/cars')
    const data = await response.json()
    setCars(data.cars)
  }

  const generateIntelligentBatchContent = async () => {
    console.log("🟢 Button clicked - Starting intelligent content generation")
    setLoading(true)
    
    try {
      console.log("🟡 Making fetch request to /admin/content/generate")
      
      const response = await fetch('/admin/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType: 'batch_content',
          platform: 'facebook',
          useIntelligentSelection: true
        })
      })
      
      console.log("🟡 Response status:", response.status)
      console.log("🟡 Response ok:", response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("🔴 API Error Response:", errorText)
        setGeneratedContent(`Error: ${response.status} - ${errorText}`)
        return
      }
      
      const data = await response.json()
      console.log('🟢 Intelligent batch content received:', data)
      setBatchContent(JSON.stringify(data, null, 2)) // ✅ Set batch content
      
    } catch (error) {
      console.error('🔴 Intelligent content generation failed:', error)
      setGeneratedContent(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const generateContent = async (contentType: string, platform?: string) => {
    if (!selectedCar) return
    
    setLoading(true)
    try {
      const response = await fetch('/admin/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          carId: selectedCar.id,
          contentType,
          platform
        })
      })
      
      const data = await response.json()
      setSelectedContent(data.content) // ✅ Set selected content
    } catch (error) {
      console.error('Content generation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">Content Studio</h1>
      
      {/* Always Visible Intelligent Content Button */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1"> Intelligent Content Generation</h3>
            <p className="text-sm text-gray-600">Generate marketing content for the top 5 most marketable cars automatically</p>
          </div>
          <button
            onClick={() => generateIntelligentBatchContent()}
            disabled={loading}
            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
          >
            {loading ? '⏳ Generating...' : '🚀 Generate Smart Content'}
          </button>
        </div>
      </div>
      {/* ✅ Batch Results - Always visible when available */}
      {batchContent && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border-l-4 border-purple-500">
          <h2 className="text-lg font-semibold text-purple-700 mb-3">🧠 Intelligent Batch Results</h2>
          <pre className="bg-white p-4 rounded text-xs overflow-auto max-h-64 font-mono">
            {batchContent}
          </pre>
          <button onClick={() => navigator.clipboard.writeText(batchContent)} className="mt-2 px-3 py-1 bg-purple-600 text-white rounded text-sm">
            Copy JSON
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column: Car Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
            🚗 Select Car 
            <span className="text-sm font-normal text-gray-500">({cars.length} available)</span>
          </h2>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            {cars.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🔄</div>
                <p>Loading cars...</p>
              </div>
            ) : (
              cars.map((car) => (
                <div
                  key={car.id}
                  onClick={() => setSelectedCar(car)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedCar?.id === car.id 
                      ? 'bg-blue-50 border-blue-300 shadow-sm' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold text-gray-900 text-sm sm:text-base mb-1">
                    {car.title}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">{car.price}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Content Generation */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
            ✨ Generate Content
          </h2>
          
          {selectedCar ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-semibold text-gray-900 text-sm">Selected Car:</span>
                </div>
                <p className="text-gray-800 font-medium">{selectedCar.title}</p>
                <p className="text-sm text-gray-600">{selectedCar.price}</p>
              </div>
              
              {/* Content Generation Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => generateContent('description')}
                  disabled={loading}
                  className="w-full py-3 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                >
                  📝 Generate Description
                </button>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => generateContent('social_post', 'facebook')}
                    disabled={loading}
                    className="py-3 px-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    📘 Facebook
                  </button>
                  <button
                    onClick={() => generateContent('social_post', 'instagram')}
                    disabled={loading}
                    className="py-3 px-2 text-xs sm:text-sm bg-pink-500 text-white rounded-lg hover:bg-pink-600 font-medium transition-colors"
                  >
                    📸 Instagram
                  </button>
                  <button
                    onClick={() => generateContent('social_post', 'linkedin')}
                    disabled={loading}
                    className="py-3 px-2 text-xs sm:text-sm bg-blue-700 text-white rounded-lg hover:bg-blue-800 font-medium transition-colors"
                  >
                    💼 LinkedIn
                  </button>
                </div>
                
                <button
                  onClick={() => generateContent('youtube_title')}
                  disabled={loading}
                  className="w-full py-3 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                >
                  🎥 YouTube Title
                </button>
              </div>

              {/* Generated Content Display */}
              {generatedContent && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                  <h3 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                    ✅ Generated Content:
                  </h3>
                  <textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    className="w-full h-48 sm:h-56 p-4 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Generated content will appear here..."
                  />
                  <div className="flex gap-2 mt-3">
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                      💾 Save Content
                    </button>
                    <button 
                      onClick={() => navigator.clipboard.writeText(generatedContent)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Select a Car to Generate Content</h3>
              <p className="text-sm text-gray-600 max-w-xs mx-auto">
                Choose a car from the left panel to create targeted social media content, or use the smart content generator above for automatic selection.
              </p>
            </div>
          )}
          {/* ✅ Selected Car Results - Only in right panel */}
          {selectedContent && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">📝 Generated Content:</h3>
              <textarea
                value={selectedContent}
                onChange={(e) => setSelectedContent(e.target.value)}
                className="w-full h-32 p-3 border rounded text-sm"
              />
              <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded">Save</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
