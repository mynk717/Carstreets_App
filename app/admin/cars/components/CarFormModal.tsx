'use client'

import { useState, useEffect } from 'react'
import { CldUploadWidget } from 'next-cloudinary'
import { Upload, X, ChevronDown } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Car } from '../../../types'


// Helper function to safely handle textarea value
const getTextareaValue = (val: string | string[] | undefined | null): string => {
  if (!val) return ''
  if (Array.isArray(val)) return val.join('\n')
  if (typeof val === 'string') return val
  return ''
}

// Helper function to safely convert price to string
const getPriceString = (price: string | number | bigint | undefined): string => {
  if (!price) return ''
  if (typeof price === 'string') return price
  if (typeof price === 'number' || typeof price === 'bigint') return price.toString()
  return ''
}

// Fixed interface - don't extend Partial<Car>
interface ExtendedFormData {
  id?: string
  title?: string
  brand?: string
  model?: string
  variant?: string | null
  price?: string | number | bigint  // This is the problematic line - now fixed
  year?: number
  fuelType?: string
  transmission?: string
  kmDriven?: number
  location?: string
  images?: string | string[]  // Allow both types during editing
  description?: string
  sellerType?: string
  postedDate?: string
  owners?: number
  isVerified?: boolean
  isFeatured?: boolean
  dataSource?: string
  olxProfile?: string | null
  olxProfileId?: string | null
  originalUrl?: string | null
  attribution?: string | null
  carStreetsListed?: boolean
  createdAt?: Date
  updatedAt?: Date
  // Extended fields for enhanced editing
  discountedPrice?: string
  sellingPoints?: string
  condition?: string
  availableForFinance?: boolean
  availableForExchange?: boolean
  serviceHistory?: string
  insurance?: string
}


interface CarFormModalProps {
  car: Car | null
  isOpen: boolean
  onClose: () => void
  onSave: (car: Car) => void
  title: string
}

export function CarFormModal({ car, isOpen, onClose, onSave, title }: CarFormModalProps) {
  const [formData, setFormData] = useState<ExtendedFormData>({})
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
      // Safe image conversion
      let imagesString = ''
      if (Array.isArray(car.images)) {
        imagesString = car.images.join('\n')
      } else if (typeof car.images === 'string') {
        try {
          const parsed = JSON.parse(car.images)
          imagesString = Array.isArray(parsed) ? parsed.join('\n') : car.images
        } catch {
          imagesString = car.images
        }
      }

      setFormData({
        ...car,
        images: imagesString,
        price: getPriceString(car.price),
        discountedPrice: (car as any).discountedPrice || '',
        sellingPoints: (car as any).sellingPoints || '',
        condition: (car as any).condition || 'Good',
        availableForFinance: (car as any).availableForFinance ?? true,
        availableForExchange: (car as any).availableForExchange ?? true,
        serviceHistory: (car as any).serviceHistory || 'Available',
        insurance: (car as any).insurance || 'Valid'
      })
      
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

    // Safe image parsing with type guards
    let imageArray: string[] = []
    const imagesValue = formData.images
    if (typeof imagesValue === 'string') {
      imageArray = imagesValue
        .split(/[\n,]/) // Split on both newlines AND commas
        .map(url => url.trim())
        .filter(url => url && url.startsWith('http')) // Only valid URLs
    } else if (Array.isArray(imagesValue)) {
      imageArray = imagesValue.filter(Boolean)
    }

    const carToSave: Car = {
      ...formData,
      brand: customBrand || formData.brand || '',
      images: imageArray,
      price: typeof formData.price === 'string' 
        ? (formData.price.replace(/[₹,\s]/g, '') || '0')
        : formData.price?.toString() || '0',
      kmDriven: Number(formData.kmDriven) || 0,
      year: Number(formData.year) || new Date().getFullYear(),
      owners: Number(formData.owners) || 1,
      updatedAt: new Date(),
      isVerified: true
    } as Car

    console.log('🚀 Saving car:', carToSave)
    onSave(carToSave)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[95vh] overflow-y-auto mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Basic Info */}
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium mb-1 text-gray-800">Title *</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border rounded 
                         text-gray-900 placeholder-gray-500 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white"
              placeholder="Maruti Suzuki Swift Dzire VXI, 2020, Petrol"
              required
            />
          </div>

          {/* Pricing Section */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800">Price *</label>
            <input
              type="text"
              value={getPriceString(formData.price)}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="w-full px-3 py-2 border rounded 
                         text-gray-900 placeholder-gray-500 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white"
              placeholder="₹5,50,000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800">CarStreets Special Price</label>
            <input
              type="text"
              value={formData.discountedPrice || ''}
              onChange={(e) => setFormData({...formData, discountedPrice: e.target.value})}
              className="w-full px-3 py-2 border rounded 
                         text-gray-900 placeholder-gray-500 
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                         bg-white"
              placeholder="₹5,25,000 (Better Deal!)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800">Location</label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full px-3 py-2 border rounded 
                         text-gray-900 placeholder-gray-500 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white"
              placeholder="Raipur, Chhattisgarh"
            />
          </div>

          {/* Enhanced Brand Selection */}
          <div className="relative">
            <label className="block text-sm font-medium mb-1 text-gray-800">Brand *</label>
            {customBrand || !predefinedBrands.includes(formData.brand || '') ? (
              <div className="flex gap-1">
                <input
                  type="text"
                  value={customBrand || formData.brand || ''}
                  onChange={(e) => handleCustomBrandChange(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded 
                             text-gray-900 placeholder-gray-500 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             bg-white"
                  placeholder="Enter brand name"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCustomBrand('')
                    setFormData({...formData, brand: ''})
                    setShowBrandDropdown(true)
                  }}
                  className="px-3 py-2 border rounded hover:bg-gray-50 text-gray-700"
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
                  className="w-full px-3 py-2 border rounded text-left flex justify-between items-center hover:bg-gray-50 
                             text-gray-900 bg-white"
                >
                  <span>{formData.brand || 'Select Brand'}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
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
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 text-gray-900"
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
            <label className="block text-sm font-medium mb-1 text-gray-800">Model</label>
            <input
              type="text"
              value={formData.model || ''}
              onChange={(e) => setFormData({...formData, model: e.target.value})}
              className="w-full px-3 py-2 border rounded 
                         text-gray-900 placeholder-gray-500 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white"
              placeholder="Swift Dzire"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800">Variant</label>
            <input
              type="text"
              value={formData.variant || ''}
              onChange={(e) => setFormData({...formData, variant: e.target.value})}
              className="w-full px-3 py-2 border rounded 
                         text-gray-900 placeholder-gray-500 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white"
              placeholder="VXI, ZXI, etc."
            />
          </div>

          {/* Vehicle Details */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800">Year</label>
            <input
              type="number"
              value={formData.year || ''}
              onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border rounded 
                         text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white"
              min="1990"
              max={new Date().getFullYear() + 1}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800">KM Driven</label>
            <input
              type="number"
              value={formData.kmDriven || ''}
              onChange={(e) => setFormData({...formData, kmDriven: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border rounded 
                         text-gray-900 placeholder-gray-500 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white"
              placeholder="50000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800">Owners</label>
            <select
              value={formData.owners || 1}
              onChange={(e) => setFormData({...formData, owners: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border rounded 
                         text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white"
            >
              <option value={1}>1st Owner</option>
              <option value={2}>2nd Owner</option>
              <option value={3}>3rd Owner</option>
              <option value={4}>4+ Owner</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800">Fuel Type</label>
            <select
              value={formData.fuelType || 'Petrol'}
              onChange={(e) => setFormData({...formData, fuelType: e.target.value as any})}
              className="w-full px-3 py-2 border rounded 
                         text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white"
            >
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="CNG">CNG</option>
              <option value="Electric">Electric</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800">Transmission</label>
            <select
              value={formData.transmission || 'Manual'}
              onChange={(e) => setFormData({...formData, transmission: e.target.value as any})}
              className="w-full px-3 py-2 border rounded 
                         text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white"
            >
              <option value="Manual">Manual</option>
              <option value="Automatic">Automatic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800">Seller Type</label>
            <select
              value={formData.sellerType || 'Individual'}
              onChange={(e) => setFormData({...formData, sellerType: e.target.value as any})}
              className="w-full px-3 py-2 border rounded 
                         text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white"
            >
              <option value="Individual">Individual</option>
              <option value="Dealer">Dealer</option>
            </select>
          </div>

          {/* Enhanced Fields */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800">Condition</label>
            <select
              value={formData.condition || 'Good'}
              onChange={(e) => setFormData({...formData, condition: e.target.value})}
              className="w-full px-3 py-2 border rounded 
                         text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white"
            >
              <option value="Excellent">Excellent</option>
              <option value="Very Good">Very Good</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800">Service History</label>
            <select
              value={formData.serviceHistory || 'Available'}
              onChange={(e) => setFormData({...formData, serviceHistory: e.target.value})}
              className="w-full px-3 py-2 border rounded 
                         text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white"
            >
              <option value="Available">Available</option>
              <option value="Partial">Partial</option>
              <option value="Not Available">Not Available</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800">Insurance</label>
            <select
              value={formData.insurance || 'Valid'}
              onChange={(e) => setFormData({...formData, insurance: e.target.value})}
              className="w-full px-3 py-2 border rounded 
                         text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white"
            >
              <option value="Valid">Valid</option>
              <option value="Expired">Expired</option>
              <option value="Third Party">Third Party Only</option>
            </select>
          </div>

          {/* Description */}
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium mb-1 text-gray-800">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border rounded 
                         text-gray-900 placeholder-gray-500 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white"
              placeholder="Detailed description of the vehicle condition, features, etc."
            />
          </div>

          {/* Selling Points */}
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium mb-1 text-gray-800">Selling Points (for marketing)</label>
            <textarea
              value={formData.sellingPoints || ''}
              onChange={(e) => setFormData({...formData, sellingPoints: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border rounded 
                         text-gray-900 placeholder-gray-500 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white"
              placeholder="• Excellent condition, single owner&#10;• Full service history available&#10;• Recently serviced, new tires"
            />
          </div>

          {/* Images Section - Enhanced with Cloudinary Upload */}
<div className="lg:col-span-3">
  <label className="block text-sm font-medium mb-1 text-gray-800">Car Images</label>
  
  {/* Cloudinary Upload Widget */}
  <div className="mb-4">
    <CldUploadWidget
      uploadPreset="carstreets-unsigned"
      options={{
        multiple: true,
        maxFiles: 10,
        resourceType: "image",
        maxImageFileSize: 5000000, // 5MB
        cropping: true,
        croppingAspectRatio: 16/9,
        sources: ['local', 'camera', 'url'],
        showSkipCropButton: false,
        croppingShowBackButton: true,
        folder: "carstreets/cars"
      }}
      onUpload={(result: any) => {
        if (result.event === 'success') {
          const currentImages = typeof formData.images === 'string' 
            ? formData.images.split('\n').filter(Boolean) 
            : Array.isArray(formData.images) ? formData.images : []
          
          const newImageUrl = result.info.secure_url
          const updatedImages = [...currentImages, newImageUrl].join('\n')
          
          setFormData({...formData, images: updatedImages})
        }
      }}
    >
      {({ open }: any) => (
        <button
          type="button"
          onClick={() => open()}
          className="w-full border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all group"
        >
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 text-blue-400 group-hover:text-blue-600 mb-3" />
            <div className="font-medium text-gray-700 group-hover:text-blue-700 mb-1">
              Upload Car Images
            </div>
            <div className="text-sm text-gray-500">
              Drag & drop or click to upload • Max 10 images • 5MB each
            </div>
            <div className="text-xs text-blue-600 mt-2">
              📸 Auto-optimized with Cloudinary
            </div>
          </div>
        </button>
      )}
    </CldUploadWidget>
  </div>
  
  {/* Manual URL Input (for OLX images) */}
  <div className="mb-4">
    <div className="text-sm font-medium text-gray-600 mb-2">Or paste image URLs manually:</div>
    <textarea
      value={getTextareaValue(formData.images)}
      onChange={(e) => setFormData({...formData, images: e.target.value})}
      rows={4}
      className="w-full px-3 py-2 border rounded 
                 text-gray-900 placeholder-gray-500 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                 bg-white"
      placeholder="https://apollo.olx.in/v1/files/image1.jpg
https://apollo.olx.in/v1/files/image2.jpg
Or separate with commas"
    />
  </div>
  
  {/* Image Preview */}
  {(() => {
    const imageUrls = typeof formData.images === 'string' 
      ? formData.images.split(/[\n,]/).map(url => url.trim()).filter(Boolean)
      : Array.isArray(formData.images) ? formData.images : []
    
    return imageUrls.length > 0 && (
      <div>
        <div className="text-sm font-medium text-gray-600 mb-2">
          Preview ({imageUrls.length} images):
        </div>
        <div className="grid grid-cols-4 gap-2">
          {imageUrls.slice(0, 8).map((url, index) => (
            <div key={index} className="relative group">
              <img 
                src={url} 
                alt={`Preview ${index + 1}`}
                className="w-full h-16 object-cover rounded border"
              />
              <button
                type="button"
                onClick={() => {
                  const filtered = imageUrls.filter((_, i) => i !== index)
                  setFormData({...formData, images: filtered.join('\n')})
                }}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
          {imageUrls.length > 8 && (
            <div className="w-full h-16 bg-gray-100 rounded border flex items-center justify-center text-gray-500 text-xs">
              +{imageUrls.length - 8} more
            </div>
          )}
        </div>
      </div>
    )
  })()}
  
  <p className="text-xs text-gray-600 mt-2">
    💡 <strong>Tip:</strong> Uploaded images are automatically optimized. Manual URLs work for existing OLX images.
  </p>
</div>


          {/* Checkboxes */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center text-gray-800">
              <input
                type="checkbox"
                checked={formData.availableForFinance ?? false}
                onChange={(e) => setFormData({...formData, availableForFinance: e.target.checked})}
                className="mr-2"
              />
              Finance Available
            </label>
            
            <label className="flex items-center text-gray-800">
              <input
                type="checkbox"
                checked={formData.availableForExchange ?? false}
                onChange={(e) => setFormData({...formData, availableForExchange: e.target.checked})}
                className="mr-2"
              />
              Exchange Accepted
            </label>

            <label className="flex items-center text-gray-800">
              <input
                type="checkbox"
                checked={formData.isFeatured || false}
                onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                className="mr-2"
              />
              Featured Listing
            </label>

            <label className="flex items-center text-gray-800">
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
          <Button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 text-white">
            Save Car
          </Button>
        </div>
      </div>
    </div>
  )
}
