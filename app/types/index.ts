export interface Car {
  id: string
  title: string
  price: number
  year: number
  fuelType: 'Petrol' | 'Diesel' | 'CNG' | 'Electric' | 'Hybrid'
  transmission: 'Manual' | 'Automatic'
  kmDriven: number
  location: string
  images: string[]
  description: string
  sellerType: 'Dealer' | 'Individual'
  postedDate: string
  brand: string
  model: string
  variant?: string
  owners: number
  isVerified?: boolean
  isFeatured?: boolean
}

export interface FilterOptions {
  priceRange: [number, number]
  yearRange: [number, number]
  fuelType: string[]
  transmission: string[]
  brand: string[]
  location: string
  sortBy: 'price_asc' | 'price_desc' | 'year_desc' | 'km_asc' | 'date_desc'
}
