'use client'

import { useState } from 'react'
import { Car } from '../../types'
import { CarCard } from './CarCard'

interface CarGridProps {
  cars: Car[]
  loading?: boolean
}

export function CarGrid({ cars, loading = false }: CarGridProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const handleFavorite = (carId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(carId)) {
        newFavorites.delete(carId)
      } else {
        newFavorites.add(carId)
      }
      return newFavorites
    })
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-300"></div>
            <div className="p-4">
              <div className="h-6 bg-gray-300 rounded mb-2"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2 mb-4"></div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-300 rounded flex-1"></div>
                <div className="h-8 bg-gray-300 rounded flex-1"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (cars.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚗</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No cars found
        </h3>
        <p className="text-gray-600">
          Try adjusting your search filters to see more results.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cars.map((car) => (
        <CarCard
          key={car.id}
          car={car}
          onFavorite={handleFavorite}
          isFavorited={favorites.has(car.id)}
        />
      ))}
    </div>
  )
}
