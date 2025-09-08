'use client'

import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { Car } from './types'
import { CarGrid } from './components/car/CarGrid'
import { Button } from './components/ui/Button'

export default function Home() {
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<string>('loading...')
  const [cacheInfo, setCacheInfo] = useState<string>('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedFuelType, setSelectedFuelType] = useState('')

  // Fetch cars from API with dynamic count
  const fetchCars = async (forceRefresh = false) => {
    console.log('📡 Fetching cars from /api/cars...')
    setLoading(true)
    setError(null)
    
    try {
      const url = new URL('/api/cars', window.location.origin)
      if (forceRefresh) {
        url.searchParams.set('refresh', 'true')
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📊 API Response:', data)
      
      if (data.success) {
        setCars(data.cars)
        setDataSource(data.source)
        setCacheInfo(data.cacheInfo || '')
        console.log(`✅ Loaded ${data.cars.length} cars from ${data.source}`)
      } else {
        setError(data.error || 'Failed to fetch cars')
        setCars(data.cars || [])
        setDataSource(data.source || 'error')
        console.log(`⚠️ API failed, using ${data.source}`)
      }
    } catch (err) {
      console.error('❌ Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch cars')
      setDataSource('error')
    } finally {
      setLoading(false)
    }
  }

  // Load data when component mounts
  useEffect(() => {
    fetchCars()
  }, [])

  // Filter cars dynamically
  const filteredCars = cars.filter(car => {
    if (selectedBrand && car.brand !== selectedBrand) return false
    if (selectedFuelType && car.fuelType !== selectedFuelType) return false
    return true
  })

  // Dynamic counts from actual data
  const carStreetsListings = cars.filter(car => car.carStreetsListed === true).length
  const totalCars = cars.length

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Find Your Perfect Car
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          Discover the best used cars in Raipur and across India
        </p>
        
        {/* Dynamic Real-time Stats */}
        <div className="flex justify-center gap-6 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <div className="text-lg font-bold text-green-800">{carStreetsListings}</div>
            <div className="text-sm text-green-600">CarStreets Cars</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <div className="text-lg font-bold text-blue-800">{totalCars}</div>
            <div className="text-sm text-blue-600">Total Available</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
            <div className="text-lg font-bold text-purple-800">
              {loading ? '...' : dataSource.includes('cached') ? 'Cached' : 'Live'}
            </div>
            <div className="text-sm text-purple-600">Data Status</div>
          </div>
        </div>

        {/* Data Source & Cache Info */}
        <div className="mb-6 space-y-2">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            dataSource.includes('openai') || dataSource.includes('hybrid') ? 'bg-green-100 text-green-800' :
            dataSource.includes('cached') ? 'bg-blue-100 text-blue-800' :
            dataSource.includes('mock') ? 'bg-yellow-100 text-yellow-800' :
            dataSource.includes('error') ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            Source: {dataSource}
          </span>
          {cacheInfo && (
            <div className="text-xs text-gray-500">{cacheInfo}</div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
            <p className="text-red-800 text-sm">⚠️ {error}</p>
            <Button 
              onClick={() => fetchCars()} 
              className="mt-2" 
              size="sm"
              disabled={loading}
            >
              Retry
            </Button>
          </div>
        )}
        
        {/* Simplified Search Filters */}
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="">All Brands</option>
              {Array.from(new Set(cars.map(car => car.brand))).map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
            
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedFuelType}
              onChange={(e) => setSelectedFuelType(e.target.value)}
            >
              <option value="">All Fuel Types</option>
              {Array.from(new Set(cars.map(car => car.fuelType))).map(fuel => (
                <option key={fuel} value={fuel}>{fuel}</option>
              ))}
            </select>
            
            <Button
              onClick={() => fetchCars(true)} // Force refresh
              disabled={loading}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh Data'}
            </Button>
          </div>
          
          <div className="text-center text-gray-500">
            <p>🚗 AI Enhanced • 🤖 Smart Caching • 💰 Real Prices • 📱 CarStreets Exclusive</p>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Available Cars ({filteredCars.length})
          </h2>
          {totalCars > 0 && (
            <div className="text-sm text-gray-600">
              Showing {filteredCars.length} of {totalCars} cars
              {carStreetsListings > 0 && ` • ${carStreetsListings} CarStreets exclusive`}
            </div>
          )}
        </div>

        <CarGrid cars={filteredCars} loading={loading} />
      </div>
    </div>
  )
}
