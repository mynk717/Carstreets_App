import { Car } from '../types'

export const mockCars: Car[] = [
  // CarStreets OLX Profile listings (these would come from scraping)
  {
    id: '1',
    title: 'Tata Punch Creative Dual Tone AMT Sunroof',
    price: 600000,
    year: 2023,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    kmDriven: 15000,
    location: 'Pirop Colony, Raipur',
    images: [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400'
    ],
    description: 'Well maintained car with full service history. Single owner. All papers clear.',
    sellerType: 'Individual',
    postedDate: '2025-09-04',
    brand: 'Tata',
    model: 'Punch',
    variant: 'Creative Dual Tone AMT',
    owners: 1,
    isVerified: true,
    isFeatured: true,
    
    // NEW: Profile attribution
    dataSource: 'olx-carstreets-profile',
    olxProfile: 'carstreets',
    olxProfileId: '569969876',
    originalUrl: 'https://www.olx.in/item/tata-punch-creative-iid-123456',
    attributionNote: 'Listed by CarStreets on OLX.in',
    carStreetsListed: true
  },
  {
    id: '2',
    title: 'Maruti Suzuki Swift VXi',
    price: 450000,
    year: 2022,
    fuelType: 'Petrol',
    transmission: 'Manual',
    kmDriven: 25000,
    location: 'Civil Lines, Raipur',
    images: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
    ],
    description: 'Excellent condition Swift with low mileage. AC, power steering.',
    sellerType: 'Dealer',
    postedDate: '2025-09-03',
    brand: 'Maruti Suzuki',
    model: 'Swift',
    variant: 'VXi',
    owners: 1,
    isVerified: true,
    isFeatured: false,
    
    // External OLX listing (not from CarStreets profile)
    dataSource: 'olx-external',
    olxProfile: 'external',
    originalUrl: 'https://www.olx.in/item/swift-vxi-iid-789012',
    attributionNote: 'External listing from OLX.in'
  },
  {
    id: '3',
    title: 'Hyundai Creta SX Executive',
    price: 1200000,
    year: 2023,
    fuelType: 'Diesel',
    transmission: 'Manual',
    kmDriven: 12000,
    location: 'Shankar Nagar, Raipur',
    images: [
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400',
      'https://images.unsplash.com/photo-1614200179818-781b20e8b83d?w=400'
    ],
    description: 'Premium SUV with all modern features. Leather seats, sunroof.',
    sellerType: 'Individual',
    postedDate: '2025-09-02',
    brand: 'Hyundai',
    model: 'Creta',
    variant: 'SX Executive',
    owners: 1,
    isVerified: true,
    isFeatured: true,
    
    // Direct CarStreets listing
    dataSource: 'direct',
    originalUrl: 'https://carstreets.com/car/hyundai-creta-sx-3',
    attributionNote: 'Listed directly on CarStreets'
  }
]

// Helper function to get cars by data source
export const getCarsBySource = (source: string) => {
  return mockCars.filter(car => car.dataSource === source)
}

// Get CarStreets OLX profile specific cars
export const getCarStreetsOLXCars = () => {
  return mockCars.filter(car => car.olxProfile === 'carstreets')
}
