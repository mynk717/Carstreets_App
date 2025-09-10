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
  // NEW: Profile-specific attribution
  dataSource: 'olx-carstreets-profile' | 'olx-external' | 'direct' | 'other' | 'openai-enhanced' | 'emergency-fallback' | 'database-managed-scraping' | 'fresh-database-scraping'
  olxProfile?: 'carstreets' | 'external'
  olxProfileId?: string
  originalUrl: string
  attribution?: string
  attributionNote?: string
  carStreetsListed?: boolean
}

export interface DataSourceAttribution {
  source: string
  profileId?: string
  profileUrl?: string
  scrapedAt: string
  attributionRequired: boolean
}

/* EOF */
