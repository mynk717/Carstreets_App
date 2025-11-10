'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface CarFiltersProps {
  brands: string[];
  totalCars: number;
}

export function CarFilters({ brands, totalCars }: CarFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || '',
  });
  const [yearRange, setYearRange] = useState({
    min: searchParams.get('minYear') || '',
    max: searchParams.get('maxYear') || '',
  });
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');

  const updateURL = (filters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    
    // Update or remove each filter
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Navigate with new params
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    updateURL({ search: value });
  };

  const applyFilters = () => {
    updateURL({
      search,
      brand: selectedBrand,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      minYear: yearRange.min,
      maxYear: yearRange.max,
      sort: sortBy,
    });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedBrand('');
    setPriceRange({ min: '', max: '' });
    setYearRange({ min: '', max: '' });
    setSortBy('newest');
    router.push(window.location.pathname);
  };

  const activeFiltersCount = [
    search,
    selectedBrand,
    priceRange.min,
    priceRange.max,
    yearRange.min,
    yearRange.max,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4 mb-8">
      {/* Search Bar & Controls */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by brand, model, or title..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            updateURL({ sort: e.target.value });
          }}
          className="px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="newest">Newest First</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="year_new">Year: Newest</option>
          <option value="year_old">Year: Oldest</option>
        </select>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 relative"
        >
          <SlidersHorizontal className="w-5 h-5" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="px-4 py-3 text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <X className="w-5 h-5" />
            Clear
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Filters</h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Brand</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Brands</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium mb-2">Price Range (₹)</label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Year Range */}
          <div>
            <label className="block text-sm font-medium mb-2">Year</label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Min Year"
                value={yearRange.min}
                onChange={(e) => setYearRange({...yearRange, min: e.target.value})}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Max Year"
                value={yearRange.max}
                onChange={(e) => setYearRange({...yearRange, max: e.target.value})}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={applyFilters}
              disabled={isPending}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {isPending ? 'Applying...' : 'Apply Filters'}
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <p>
          Showing <span className="font-semibold text-gray-900">{totalCars}</span> car{totalCars !== 1 ? 's' : ''}
          {activeFiltersCount > 0 && ` with ${activeFiltersCount} filter${activeFiltersCount !== 1 ? 's' : ''} applied`}
        </p>
        {isPending && <span className="text-blue-600">Updating...</span>}
      </div>
    </div>
  );
}
