'use client'

import { useState, useEffect } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Car } from '../../../types'

interface CarFormModalProps {
  car: Car | null
  isOpen: boolean
  onClose: () => void
  onSave: (car: Car) => void
  title: string
}

export function CarFormModal({ car, isOpen, onClose, onSave, title }: CarFormModalProps) {
  const [formData, setFormData] = useState<Partial<Car>>({})
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)
  const [customBrand, setCustomBrand] = useState('')

  // Extended brand list
  const predefinedBrands = [
    'Maruti Suzuki', 'Honda', 'Hyundai', 'Toyota', 'Renault', 'Tata', 'Mahindra', 
    'Ford', 'Chevrolet', 'Nissan', 'Volkswagen', 'Skoda', 'Kia', 'MG', 'Jeep',
    'BMW', 'Mercedes-Benz', 'Audi', 'Jaguar', 'Land Rover', 'Volvo', 'Mini',
    'Datsun', 'Isuzu', 'Force Motors', 'Ashok Leyland', 'Eicher', 'BYD', 'Tesla'
  ]

  useEffect(() => {
    if (car) {
      setFormData({
        ...car,
        images: Array.isArray(car.images) ? car.images.join('\n') : car.images || '',
        price: typeof car.price === 'number' ? car.price.toString() : car.price || ''
      } as any)
      
      // Check if brand is custom (not in predefined list)
      if (car.brand && !predefinedBrands.includes(car.brand)) {
        setCustomBrand(car.brand)
      }
    }
  }, [car])

  const handleBrandSelect = (brand: string) => {
    if (brand === 'custom') {
      setCustomBrand('')
      setFormData({...formData, brand: ''})
    } else {
      setFormData({...formData, brand})
      setCustomBrand('')
    }
    setShowBrandDropdown(false)
  }

  const handleCustomBrandChange = (value: string) => {
    setCustomBrand(value)
    setFormData({...formData, brand: value})
  }

  const handleSave = async () => {
    if (!formData.title || !formData.price) {
      alert('Please fill in required fields (Title and Price)')
      return
    }

    if (!formData.brand && !customBrand) {
      alert('Please select or enter a brand')
      return
    }

    const carToSave: Car = {
      ...formData,
      brand: customBrand || formData.brand || '',
      images: typeof formData.images === 'string' 
        ? (formData.images as string).split('\n').filter(url => url.trim()) 
        : Array.isArray(formData.images) ? formData.images : [],
      price: typeof formData.price === 'string' 
        ? (formData.price.replace(/[₹,]/g, '') || '0')
        : formData.price?.toString() || '0',
      kmDriven: Number(formData.kmDriven) || 0,
      year: Number(formData.year) || new Date().getFullYear(),
      owners: Number(formData.owners) || 1,
      updatedAt: new Date(),
      isVerified: true
    } as Car

    console.log('🚀 Saving car:', carToSave)
    
    try {
      onSave(carToSave)
    } catch (error) {
      console.error('❌ Save error:', error)
      alert('Failed to save car. Check console for details.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[95vh] overflow-y-auto mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Basic Info */}
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium mb-1 text-red-600">Title *</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Maruti Suzuki Swift Dzire VXI, 2020, Petrol"
              required
            />
          </div>

          {/* Pricing Section */}
          <div>
            <label className="block text-sm font-medium mb-1 text-red-600">Price *</label>
            <input
              type="text"
              value={formData.price || ''}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="₹5,50,000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">CarStreets Special Price</label>
            <input
              type="text"
              value={(formData as any).discountedPrice || ''}
              onChange={(e) => setFormData({...formData, discountedPrice: e.target.value} as any)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="₹5,25,000 (Better Deal!)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full px-3 py-2 border rounded"
              placeholder="Raipur, Chhattisgarh"
            />
          </div>

          {/* Enhanced Brand Selection */}
          <div className="relative">
            <label className="block text-sm font-medium mb-1 text-red-600">Brand *</label>
            {customBrand || !predefinedBrands.includes(formData.brand || '') ? (
              <div className="flex gap-1">
                <input
                  type="text"
                  value={customBrand || formData.brand || ''}
                  onChange={(e) => handleCustomBrandChange(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter brand name"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCustomBrand('')
                    setFormData({...formData, brand: ''})
                    setShowBrandDropdown(true)
                  }}
                  className="px-3 py-2 border rounded hover:bg-gray-50"
                  title="Choose from list"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                  className="w-full px-3 py-2 border rounded text-left flex justify-between items-center hover:bg-gray-50"
                >
                  <span>{formData.brand || 'Select Brand'}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showBrandDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => handleBrandSelect('custom')}
                      className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b font-medium text-blue-600"
                    >
                      + Enter Custom Brand
                    </button>
                    {predefinedBrands.map(brand => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => handleBrandSelect(brand)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50"
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Model</label>
            <input
              type="text"
              value={formData.model || ''}
              onChange={(e) => setFormData({...formData, model: e.target.value})}
              className="w-full px-3 py-2 border rounded"
              placeholder="Swift Dzire"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Variant</label>
            <input
              type="text"
              value={formData.variant || ''}
              onChange={(e) => setFormData({...formData, variant: e.target.value})}
              className="w-full px-3 py-2 border rounded"
              placeholder="VXI, ZXI, etc."
            />
          </div>

          {/* Rest of the form remains the same... */}
          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <input
              type="number"
              value={formData.year || ''}
              onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border rounded"
              min="1990"
              max={new Date().getFullYear() + 1}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">KM Driven</label>
            <input
              type="number"
              value={formData.kmDriven || ''}
              onChange={(e) => setFormData({...formData, kmDriven: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border rounded"
              placeholder="50000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Owners</label>
            <select
              value={formData.owners || 1}
              onChange={(e) => setFormData({...formData, owners: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border rounded"
            >
              <option value={1}>1st Owner</option>
              <option value={2}>2nd Owner</option>
              <option value={3}>3rd Owner</option>
              <option value={4}>4+ Owner</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fuel Type</label>
            <select
              value={formData.fuelType || 'Petrol'}
              onChange={(e) => setFormData({...formData, fuelType: e.target.value as any})}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="CNG">CNG</option>
              <option value="Electric">Electric</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Transmission</label>
            <select
              value={formData.transmission || 'Manual'}
              onChange={(e) => setFormData({...formData, transmission: e.target.value as any})}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="Manual">Manual</option>
              <option value="Automatic">Automatic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Seller Type</label>
            <select
              value={formData.sellerType || 'Individual'}
              onChange={(e) => setFormData({...formData, sellerType: e.target.value as any})}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="Individual">Individual</option>
              <option value="Dealer">Dealer</option>
            </select>
          </div>

          {/* Enhanced Fields */}
          <div>
            <label className="block text-sm font-medium mb-1">Condition</label>
            <select
              value={(formData as any).condition || 'Good'}
              onChange={(e) => setFormData({...formData, condition: e.target.value} as any)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="Excellent">Excellent</option>
              <option value="Very Good">Very Good</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Service History</label>
            <select
              value={(formData as any).serviceHistory || 'Available'}
              onChange={(e) => setFormData({...formData, serviceHistory: e.target.value} as any)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="Available">Available</option>
              <option value="Partial">Partial</option>
              <option value="Not Available">Not Available</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Insurance</label>
            <select
              value={(formData as any).insurance || 'Valid'}
              onChange={(e) => setFormData({...formData, insurance: e.target.value} as any)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="Valid">Valid</option>
              <option value="Expired">Expired</option>
              <option value="Third Party">Third Party Only</option>
            </select>
          </div>

          {/* Description */}
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detailed description of the vehicle condition, features, etc."
            />
          </div>

          {/* Selling Points */}
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium mb-1">Selling Points (for marketing)</label>
            <textarea
              value={(formData as any).sellingPoints || ''}
              onChange={(e) => setFormData({...formData, sellingPoints: e.target.value} as any)}
              rows={3}
              className="w-full px-3 py-2 border rounded"
              placeholder="• Excellent condition, single owner&#10;• Full service history available&#10;• Recently serviced, new tires"
            />
          </div>

          {/* Images */}
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium mb-1">Image URLs (one per line)</label>
            <textarea
              value={formData.images || ''}
              onChange={(e) => setFormData({...formData, images: e.target.value} as any)}
              rows={4}
              className="w-full px-3 py-2 border rounded"
              placeholder="https://apollo.olx.in/v1/files/image1.jpg&#10;https://apollo.olx.in/v1/files/image2.jpg"
            />
          </div>

          {/* Checkboxes */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={(formData as any).availableForFinance || false}
                onChange={(e) => setFormData({...formData, availableForFinance: e.target.checked} as any)}
                className="mr-2"
              />
              Finance Available
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={(formData as any).availableForExchange || false}
                onChange={(e) => setFormData({...formData, availableForExchange: e.target.checked} as any)}
                className="mr-2"
              />
              Exchange Accepted
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isFeatured || false}
                onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                className="mr-2"
              />
              Featured Listing
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.carStreetsListed || false}
                onChange={(e) => setFormData({...formData, carStreetsListed: e.target.checked})}
                className="mr-2"
              />
              CarStreets Exclusive
            </label>
          </div>
        </div>

        {/* Save/Cancel */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button onClick={onClose} className="bg-gray-500 hover:bg-gray-600">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600">
            Save Car
          </Button>
        </div>
      </div>
    </div>
  )
}
