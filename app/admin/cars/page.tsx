'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Plus, Trash2, Eye, AlertCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Car } from '../../types'

export default function AdminCarsPage() {
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(false)
  const [testUrl, setTestUrl] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [testError, setTestError] = useState('')
  const [bulkUrls, setBulkUrls] = useState('')
  const [bulkResults, setBulkResults] = useState<any[]>([])

  // Load existing cars
  useEffect(() => {
    fetchCars()
  }, [])

  const fetchCars = async () => {
    try {
      const response = await fetch('/api/cars')
      const data = await response.json()
      if (data.success) {
        setCars(data.cars)
      }
    } catch (error) {
      console.error('Failed to fetch cars:', error)
    }
  }

  // Single URL Test Function
  const testSingleUrl = async () => {
    if (!testUrl.trim()) {
      setTestError('Please enter a valid URL')
      return
    }

    setLoading(true)
    setTestError('')
    setTestResult(null)

    try {
      const response = await fetch('/api/admin/cars/test-scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: testUrl.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult(data)
        console.log('✅ Test scrape successful:', data)
      } else {
        setTestError(data.error || 'Test scraping failed')
      }
    } catch (error) {
      setTestError('Network error occurred')
      console.error('Test scrape error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Bulk URL Processing
  const processBulkUrls = async () => {
    const urls = bulkUrls.split('\n')
      .map(url => url.trim())
      .filter(url => url && url.startsWith('http'))

    if (urls.length === 0) {
      setTestError('Please enter valid URLs')
      return
    }

    if (urls.length > 15) {
      setTestError('Maximum 15 URLs allowed per batch')
      return
    }

    setLoading(true)
    setTestError('')
    setBulkResults([])

    try {
      const response = await fetch('/api/admin/cars/bulk-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls })
      })

      const data = await response.json()
      setBulkResults(data.results || [])
      
      if (data.success) {
        // Refresh car list
        await fetchCars()
        setBulkUrls('')
      }
    } catch (error) {
      setTestError('Bulk processing failed')
    } finally {
      setLoading(false)
    }
  }

  // Remove car
  const removeCar = async (carId: string) => {
    if (!confirm('Are you sure you want to remove this car?')) return

    try {
      const response = await fetch(`/api/admin/cars/${carId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCars(cars.filter(car => car.id !== carId))
      }
    } catch (error) {
      console.error('Failed to remove car:', error)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Car Management</h1>
        <Button onClick={fetchCars} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Single URL Test Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Single URL Test (Development Only)
        </h2>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="https://www.olx.in/item/cars-c84-..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <Button 
              onClick={testSingleUrl} 
              disabled={loading || !testUrl.trim()}
              className="flex items-center gap-2"
            >
              {loading ? 'Testing...' : 'Test Scrape'}
            </Button>
          </div>

          {testError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {testError}
              </p>
            </div>
          )}

          {testResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">Test Results:</h3>
              <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Bulk URL Add Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Cars (Bulk URLs)
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste URLs (one per line, max 15):
            </label>
            <textarea
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              placeholder="https://www.olx.in/item/cars-c84-...
https://www.olx.in/item/cars-c84-...
https://www.olx.in/item/cars-c84-..."
              className="w-full h-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <div className="text-sm text-gray-500 mt-1">
              URLs detected: {bulkUrls.split('\n').filter(url => url.trim().startsWith('http')).length}
            </div>
          </div>

          <Button 
            onClick={processBulkUrls} 
            disabled={loading || !bulkUrls.trim()}
            className="flex items-center gap-2"
          >
            {loading ? 'Processing...' : 'Add Cars'}
          </Button>

          {bulkResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Processing Results:</h3>
              {bulkResults.map((result, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded border ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="font-medium text-sm">
                    {result.success ? '✅' : '❌'} {result.url}
                  </div>
                  <div className="text-xs text-gray-600">
                    {result.success ? result.title : result.error}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Car List Management */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          Current Cars ({cars.length})
        </h2>
        
        <div className="space-y-3">
          {cars.map((car) => (
            <div 
              key={car.id} 
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="font-medium">{car.title}</div>
                <div className="text-sm text-gray-600">
                  {car.price} • {car.location} • Source: {car.dataSource}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  car.isVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {car.isVerified ? 'Verified' : 'Unverified'}
                </span>
                <Button
                  onClick={() => removeCar(car.id)}
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
