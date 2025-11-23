'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CldUploadWidget } from 'next-cloudinary';
import { Upload, X, Eye, EyeOff, Star } from 'lucide-react';

interface DealerCarEditFormProps {
  car: any;
  dealerId: string;
  subdomain: string;
}

export function DealerCarEditForm({ car, dealerId, subdomain }: DealerCarEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: car.title || '',
    brand: car.brand || '',
    model: car.model || '',
    variant: car.variant || '',
    year: car.year || new Date().getFullYear(),
    price: typeof car.price === 'bigint' ? car.price.toString() : car.price || '',
    kmDriven: car.kmDriven || 0,
    fuelType: car.fuelType || 'Petrol',
    transmission: car.transmission || 'Manual',
    owners: car.owners || 1,
    location: car.location || '',
    description: car.description || '',
    images: Array.isArray(car.images) ? car.images.join('\n') : '',
    sellerType: car.sellerType || 'Dealer',
    carStreetsListed: car.carStreetsListed ?? false,
    isFeatured: car.isFeatured ?? false,
    isVerified: car.isVerified ?? true,
    availableForFinance: (car as any).availableForFinance ?? true,
    availableForExchange: (car as any).availableForExchange ?? true,
  });

  const handleSetCover = (idx: number) => {
    const currentImages = formData.images
      .split('\n')
      .map(url => url.trim())
      .filter(Boolean);
      
    if (idx < 0 || idx >= currentImages.length) return;
    
    // Remove selected image from its position
    const [selected] = currentImages.splice(idx, 1);
    // Move it to the front (index 0)
    currentImages.unshift(selected);
    
    setFormData({
      ...formData,
      images: currentImages.join('\n')
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const imageArray = formData.images
        .split('\n')
        .map(url => url.trim())
        .filter(url => url && url.startsWith('http'));

      const response = await fetch(`/api/dealers/${subdomain}/cars/${car.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images: imageArray,
          price: parseInt(formData.price.toString().replace(/[₹,]/g, '')) || 0,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('✅ Car updated successfully!');
        router.push(`/dealers/${subdomain}/dashboard/cars`);
        router.refresh();
      } else {
        setError(data.error || 'Failed to update car');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const imageUrls = formData.images
    .split('\n')
    .map(url => url.trim())
    .filter(Boolean);

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-200 dark:border-gray-700">
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Car Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Brand */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Brand *</label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Model *</label>
          <input
            type="text"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Variant */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Variant</label>
          <input
            type="text"
            value={formData.variant}
            onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Year *</label>
          <input
            type="number"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            min="1990"
            max={new Date().getFullYear() + 1}
            required
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price (₹) *</label>
          <input
            type="text"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="550000"
            required
          />
        </div>

        {/* KM Driven */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">KM Driven *</label>
          <input
            type="number"
            value={formData.kmDriven}
            onChange={(e) => setFormData({ ...formData, kmDriven: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Fuel Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fuel Type *</label>
          <select
            value={formData.fuelType}
            onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="CNG">CNG</option>
            <option value="Electric">Electric</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        {/* Transmission */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transmission *</label>
          <select
            value={formData.transmission}
            onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="Manual">Manual</option>
            <option value="Automatic">Automatic</option>
          </select>
        </div>

        {/* Owners */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Owners *</label>
          <select
            value={formData.owners}
            onChange={(e) => setFormData({ ...formData, owners: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>1st Owner</option>
            <option value={2}>2nd Owner</option>
            <option value={3}>3rd Owner</option>
            <option value={4}>4+ Owner</option>
          </select>
        </div>

        {/* Location */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location *</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Raipur, Chhattisgarh"
            required
          />
        </div>

        {/* Description */}
        <div className="lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Detailed description of the car..."
          />
        </div>

        {/* Image Upload Section */}
        <div className="lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Car Images (Up to 10)
          </label>

          <div className="mb-4">
            <CldUploadWidget
              uploadPreset="carstreets-unsigned"
              options={{
                multiple: true,
                maxFiles: 10,
                resourceType: 'image',
                maxImageFileSize: 10000000,
                cropping: false,
                folder: 'carstreets/cars',
                clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
              }}
              onUpload={(result: any) => {
                if (result.event === 'success' && result.info?.secure_url) {
                  const newImageUrl = result.info.secure_url;
                  const currentImages = formData.images ? formData.images.split('\n').filter(Boolean) : [];
                  const updatedImages = [...currentImages, newImageUrl].join('\n');
                  setFormData({ ...formData, images: updatedImages });
                }
              }}
            >
              {({ open }: any) => (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    open();
                  }}
                  className="w-full border-2 border-dashed border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-900 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                >
                  <div className="flex flex-col items-center">
                    <Upload className="w-10 h-10 text-blue-400 dark:text-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-3" />
                    <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Car Images</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Click to upload (Max 10 images)</div>
                  </div>
                </button>
              )}
            </CldUploadWidget>
          </div>

          {imageUrls.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-bold text-green-600 dark:text-green-400">
                  {imageUrls.length} Image{imageUrls.length !== 1 ? 's' : ''} Ready
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, images: '' })}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
  {imageUrls.map((url, index) => (
    <div key={index} className="relative group">
      {/* Cover badge on first image */}
      {index === 0 && (
        <span className="absolute left-1 top-1 z-10 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold shadow-md">
          Cover
        </span>
      )}
      
      <img
        src={url}
        alt={`Preview ${index + 1}`}
        className="w-full h-24 object-cover rounded border border-gray-200 dark:border-gray-700"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/placeholder-car.jpg';
        }}
      />
      
      {/* Remove button */}
      <button
        type="button"
        onClick={() => {
          const filtered = imageUrls.filter((_, i) => i !== index);
          setFormData({ ...formData, images: filtered.join('\n') });
        }}
        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-20"
      >
        ×
      </button>
      
      {/* Set Cover button (only shown on non-cover images) */}
      {index !== 0 && (
        <button
          type="button"
          onClick={() => handleSetCover(index)}
          className="absolute bottom-1 left-1 bg-black/60 hover:bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-md transition opacity-0 group-hover:opacity-100 z-10"
          title="Set as cover"
        >
          Set Cover
        </button>
      )}
    </div>
  ))}
</div>

            </div>
          )}
        </div>

        {/* ✅ Listing Options with Dark Mode */}
        <div className="lg:col-span-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Listing Options</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center text-gray-800 dark:text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.carStreetsListed}
                  onChange={(e) => setFormData({ ...formData, carStreetsListed: e.target.checked })}
                  className="mr-2 w-4 h-4"
                />
                <Eye className="w-4 h-4 mr-1" />
                List on Storefront
              </label>
              <label className="flex items-center text-gray-800 dark:text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="mr-2 w-4 h-4"
                />
                <Star className="w-4 h-4 mr-1" />
                Featured Car
              </label>
              <label className="flex items-center text-gray-800 dark:text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.availableForFinance}
                  onChange={(e) => setFormData({ ...formData, availableForFinance: e.target.checked })}
                  className="mr-2 w-4 h-4"
                />
                Finance Available
              </label>
              {/* ⭐ NEW: Verified (Required for Meta Sync) */}
      <label className="flex items-center text-gray-800 dark:text-gray-200 cursor-pointer" title="Required for Meta/Facebook catalog sync">
        <input
          type="checkbox"
          checked={formData.isVerified}
          onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
          className="mr-2 w-4 h-4"
        />
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Verified (Meta Sync)
      </label>
              <label className="flex items-center text-gray-800 dark:text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.availableForExchange}
                  onChange={(e) => setFormData({ ...formData, availableForExchange: e.target.checked })}
                  className="mr-2 w-4 h-4"
                />
                Exchange Accepted
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
