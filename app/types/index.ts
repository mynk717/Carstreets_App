/* ----------  app/types/index.ts  ---------- */
export interface Car {
  id: string
  title: string
  price: number | string
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
  // Database timestamps (added by Prisma)  
  createdAt?: Date
  updatedAt?: Date
  // Data source attribution
  dataSource: 'olx-carstreets-profile' | 'olx-external' | 'direct' | 'other' | 'openai-enhanced' | 'emergency-fallback' | 'database-managed-scraping' | 'fresh-database-scraping'
  olxProfile?: 'carstreets' | 'external'
  olxProfileId?: string
  originalUrl: string
  attribution?: string
  attributionNote?: string
  carStreetsListed?: boolean
  
  // NEW: Enhanced fields for complete inventory management
  discountedPrice?: string
  sellingPoints?: string
  condition?: 'Excellent' | 'Very Good' | 'Good' | 'Fair'
  availableForFinance?: boolean
  availableForExchange?: boolean
  serviceHistory?: 'Available' | 'Partial' | 'Not Available'
  insurance?: 'Valid' | 'Expired' | 'Third Party'
  rcStatus?: 'Clear' | 'Pending' | 'Issues'
  inspectionDate?: string
  inspectionReport?: string
}

export interface DataSourceAttribution {
  source: string
  profileId?: string
  profileUrl?: string
  scrapedAt: string
  attributionRequired: boolean
}

/* EOF */
