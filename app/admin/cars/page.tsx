'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Plus, Trash2, Edit, AlertCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Car } from '../../types'
import { CarFormModal } from './components/CarFormModal'

export default function AdminCarsPage() {
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(false)
  const [testUrl, setTestUrl] = useState('')
  const [testError, setTestError] = useState('')
  const [bulkUrls, setBulkUrls] = useState('')
  const [bulkResults, setBulkResults] = useState<any[]>([])
  
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedCar, setSelectedCar] = useState<Car | null>(null)

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

    try {
      const response = await fetch('/api/admin/cars/test-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl.trim() })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Open edit modal with scraped data for review/correction
        const scrapedCar = transformScrapedDataToCar(data.data)
        setSelectedCar(scrapedCar)
        setIsEditModalOpen(true)
        setTestUrl('')
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

  // Transform scraped data to Car interface
  const transformScrapedDataToCar = (scrapedData: any): Car => ({
    id: `temp_${Date.now()}`, // Temporary ID for new cars
    title: scrapedData.title || '',
    price: scrapedData.price || '',
    year: extractYear(scrapedData.title || ''),
    fuelType: extractFuelType(scrapedData.title || '') as any,
    transmission: 'Manual' as any,
    kmDriven: 50000, // Default, to be edited
    location: `${scrapedData.location?.city || ''}, ${scrapedData.location?.state || ''}`,
    images: scrapedData.images?.lead ? [scrapedData.images.lead] : [],
    description: scrapedData.description || '',
    sellerType: scrapedData.seller?.business ? 'Dealer' : 'Individual' as any,
    postedDate: new Date().toISOString(),
    brand: extractBrand(scrapedData.title || ''),
    model: extractModel(scrapedData.title || ''),
    variant: '',
    owners: 1,
    isVerified: false,
    isFeatured: false,
    dataSource: 'olx-external' as any,
    originalUrl: scrapedData.url || '',
    carStreetsListed: false,
    // New fields for enhanced editing
    discountedPrice: '',
    sellingPoints: '',
    condition: 'Good',
    availableForFinance: true,
    availableForExchange: true,
    serviceHistory: 'Available',
    insurance: 'Valid',
    rcStatus: 'Clear'
  })

  // Helper functions
  const extractYear = (title: string): number => {
    const yearMatch = title.match(/\b(19|20)\d{2}\b/)
    return yearMatch ? parseInt(yearMatch[0]) : 2020
  }

  const extractFuelType = (title: string): string => {
    if (title.toLowerCase().includes('diesel')) return 'Diesel'
    if (title.toLowerCase().includes('petrol')) return 'Petrol'
    if (title.toLowerCase().includes('cng')) return 'CNG'
    return 'Petrol'
  }

  const extractBrand = (title: string): string => {
    const brands = ['Maruti Suzuki', 'Honda', 'Hyundai', 'Toyota', 'Renault', 'Tata', 'Mahindra']
    for (const brand of brands) {
      if (title.toLowerCase().includes(brand.toLowerCase())) return brand
    }
    return 'Other'
  }

  const extractModel = (title: string): string => {
    const parts = title.split(' ')
    return parts.slice(2, 4).join(' ') || 'Unknown'
  }

  // Handle car operations
  const handleEditCar = (car: Car) => {
    setSelectedCar(car)
    setIsEditModalOpen(true)
  }

  const handleAddNewCar = () => {
    setSelectedCar({
      id: `new_${Date.now()}`,
      title: '',
      price: '',
      year: new Date().getFullYear(),
      fuelType: 'Petrol',
      transmission: 'Manual',
      kmDriven: 0,
      location: 'Raipur, Chhattisgarh',
      images: [],
      description: '',
      sellerType: 'Individual',
      postedDate: new Date().toISOString(),
      brand: '',
      model: '',
      variant: '',
      owners: 1,
      isVerified: true,
      isFeatured: false,
      dataSource: 'direct',
      originalUrl: '',
      carStreetsListed: true,
      // Enhanced fields
      discountedPrice: '',
      sellingPoints: '',
      condition: 'Excellent',
      availableForFinance: true,
      availableForExchange: true,
      serviceHistory: 'Available',
      insurance: 'Valid',
      rcStatus: 'Clear'
    } as any)
    setIsAddModalOpen(true)
  }

  const handleSaveCar = async (carData: Car) => {
    try {
      const isNewCar = carData.id.includes('new_') || carData.id.includes('temp_')
      const endpoint = isNewCar ? '/api/admin/cars' : `/api/admin/cars/${carData.id}`
      const method = isNewCar ? 'POST' : 'PUT'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carData)
      })

      if (response.ok) {
        await fetchCars() // Refresh the car list
        setIsEditModalOpen(false)
        setIsAddModalOpen(false)
        setSelectedCar(null)
      } else {
        alert('Failed to save car')
      }
    } catch (error) {
      console.error('Failed to save car:', error)
      alert('Failed to save car')
    }
  }

  const handleDeleteCar = async (carId: string) => {
    if (!confirm('Are you sure you want to delete this car?')) return

    try {
      const response = await fetch(`/api/admin/cars/${carId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCars(cars.filter(car => car.id !== carId))
      } else {
        alert('Failed to delete car')
      }
    } catch (error) {
      console.error('Failed to delete car:', error)
      alert('Failed to delete car')
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls })
      })

      const data = await response.json()
      setBulkResults(data.results || [])
      
      if (data.success) {
        await fetchCars()
        setBulkUrls('')
      }
    } catch (error) {
      setTestError('Bulk processing failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Car Inventory Management</h1>
        <div className="flex gap-2">
          <Button 
            onClick={handleAddNewCar}
            className="bg-green-500 hover:bg-green-600 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Car
          </Button>
          <Button onClick={fetchCars} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Single URL Test Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Import from OLX URL (Test & Edit)
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
              {loading ? 'Importing...' : 'Import & Edit'}
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
        </div>
      </div>

      {/* Bulk URL Add Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Bulk Import from URLs
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
            {loading ? 'Processing...' : 'Bulk Import'}
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
          Current Inventory ({cars.length})
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
                <div className="text-xs text-gray-500">
                  {car.year} • {car.fuelType} • {car.kmDriven?.toLocaleString()} km
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  car.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {car.isVerified ? 'Verified' : 'Needs Review'}
                </span>
                
                <Button
                  onClick={() => handleEditCar(car)}
                  size="sm" 
                  className="bg-blue-500 hover:bg-blue-600 flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </Button>
                
                <Button
                  onClick={() => handleDeleteCar(car.id)}
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </Button>
              </div>
            </div>
          ))}

          {cars.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No cars in inventory yet.</p>
              <p className="text-sm">Add your first car using the "Add New Car" button or import from OLX.</p>
            </div>
          )}
        </div>
      </div>

      {/* Car Form Modals */}
      <CarFormModal
        car={selectedCar}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedCar(null)
        }}
        onSave={handleSaveCar}
        title="Edit Car Details"
      />

      <CarFormModal
        car={selectedCar}
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setSelectedCar(null)
        }}
        onSave={handleSaveCar}
        title="Add New Car"
      />
    </div>
  )
}
