'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ✅ CUSTOM DEBOUNCE HOOK (No package needed)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

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
  const debouncedSearch = useDebounce(search, 500); // ✅ Using custom hook
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
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  // ✅ Update URL when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== searchParams.get('search')) {
      updateURL({ search: debouncedSearch });
    }
  }, [debouncedSearch]);

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
      {/* Mobile-Friendly Controls */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search Maruti, Swift, etc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex gap-3">
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              updateURL({ sort: e.target.value });
            }}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-white text-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest</option>
            <option value="price_low">Price Low</option>
            <option value="price_high">Price High</option>
            <option value="year_new">Year New</option>
          </select>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(true)}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 relative text-lg whitespace-nowrap"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-white font-semibold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile-Friendly Filter Modal */}
      {showFilters && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowFilters(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-x-0 bottom-0 bg-white w-full rounded-t-2xl p-6 space-y-4 shadow-lg z-50 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold">Filters</h3>
              <button 
                onClick={() => setShowFilters(false)} 
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-lg font-medium mb-2">Brand</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-lg font-medium mb-2">Price Range (₹)</label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                  className="px-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                  className="px-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Year Range */}
            <div>
              <label className="block text-lg font-medium mb-2">Year</label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Min"
                  value={yearRange.min}
                  onChange={(e) => setYearRange({...yearRange, min: e.target.value})}
                  className="px-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={yearRange.max}
                  onChange={(e) => setYearRange({...yearRange, max: e.target.value})}
                  className="px-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Apply & Reset Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={clearFilters}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-lg"
              >
                Reset
              </button>
              <button
                onClick={applyFilters}
                disabled={isPending}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg disabled:opacity-50"
              >
                {isPending ? 'Applying...' : `Show ${totalCars} Cars`}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm sm:text-lg text-gray-600">
        <p>
          <span className="font-semibold text-gray-900">{totalCars}</span> car{totalCars !== 1 ? 's' : ''}
          {activeFiltersCount > 0 && (
            <span className="hidden sm:inline"> with {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''}</span>
          )}
        </p>
        {isPending && <span className="text-blue-600 text-sm">Updating...</span>}
      </div>
    </div>
  );
}
