'use client'

import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { Car } from './types'
import { CarGrid } from './components/car/CarGrid'
import { Button } from './components/ui/Button'

export default function Home() {
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedFuelType, setSelectedFuelType] = useState('')
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    interestedIn: '',
    message: ''
  })

  const fetchCars = async (forceRefresh = false) => {
    setLoading(true)
    
    try {
      const url = new URL('/api/cars', window.location.origin)
      if (forceRefresh) {
        url.searchParams.set('refresh', 'true')
      }

      const response = await fetch(url.toString())
      const data = await response.json()
      
      if (data.success) {
        setCars(data.cars)
      } else {
        setCars(data.cars || [])
      }
    } catch (err) {
      console.error('Failed to fetch cars:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCars()
  }, [])

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Send to your CRM/email service
    console.log('Lead submitted:', leadForm)
    alert('Thank you! We\'ll contact you soon with the best car deals.')
    setShowLeadForm(false)
    setLeadForm({ name: '', email: '', phone: '', interestedIn: '', message: '' })
  }

  const filteredCars = cars.filter(car => {
    if (selectedBrand && car.brand !== selectedBrand) return false
    if (selectedFuelType && car.fuelType !== selectedFuelType) return false
    return true
  })

  const carStreetsListings = cars.filter(car => car.carStreetsListed === true).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* FIXED: Hero Landing Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Find Your Perfect Car in Raipur
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Verified cars, transparent pricing, and hassle-free buying experience
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => document.getElementById('cars-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg"
              >
                Browse Cars ({cars.length})
              </Button>
              <Button 
                onClick={() => setShowLeadForm(true)}
                className="bg-green-500 hover:bg-green-600 px-8 py-3 text-lg"
              >
                Get Best Deals
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold">{carStreetsListings}</div>
                <div className="text-blue-200">CarStreets Exclusive</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{cars.length}</div>
                <div className="text-blue-200">Total Cars Available</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">100%</div>
                <div className="text-blue-200">Verified Listings</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cars Section */}
      <div id="cars-section" className="container mx-auto px-4 py-12">
        {/* Search Filters */}
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto mb-8">
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
              onClick={() => fetchCars(true)}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Available Cars ({filteredCars.length})
            </h2>
          </div>

          <CarGrid cars={filteredCars} loading={loading} />
        </div>
      </div>

      {/* FIXED: Lead Capture Modal */}
      {showLeadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Get Best Car Deals</h3>
              <button onClick={() => setShowLeadForm(false)} className="text-gray-500">✕</button>
            </div>
            
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                value={leadForm.name}
                onChange={(e) => setLeadForm({...leadForm, name: e.target.value})}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="email"
                placeholder="Email Address"
                value={leadForm.email}
                onChange={(e) => setLeadForm({...leadForm, email: e.target.value})}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={leadForm.phone}
                onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <select
                value={leadForm.interestedIn}
                onChange={(e) => setLeadForm({...leadForm, interestedIn: e.target.value})}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Interested in...</option>
                <option value="Budget Cars">Budget Cars (Under ₹3L)</option>
                <option value="Premium Cars">Premium Cars (₹3L+)</option>
                <option value="SUVs">SUVs</option>
                <option value="Sedans">Sedans</option>
                <option value="Hatchbacks">Hatchbacks</option>
              </select>
              <Button type="submit" className="w-full bg-green-500 hover:bg-green-600">
                Get My Best Deals
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
