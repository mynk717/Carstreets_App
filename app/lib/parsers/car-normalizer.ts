// lib/parsers/car-normalizer.ts
import { Car } from '../../app/types'

export const parseIntSafe = (v: string | number, fallback = 0): number => {
  const n = typeof v === 'number' ? v : parseInt(String(v).replace(/[^0-9]/g, ''), 10)
  return Number.isFinite(n) && !Number.isNaN(n) ? n : fallback
}

export const parseYear = (y: string | number): number => {
  const cur = new Date().getFullYear()
  const yr = parseIntSafe(y, cur - 3)
  return Math.min(Math.max(yr, 1990), cur)
}

export const parseKmDriven = (km: string | number): number => parseIntSafe(km, 0)

export const parseOwners = (owners: string | number): number => {
  if (typeof owners === 'number') return owners
  const m = String(owners).match(/^\d+/)
  return m ? parseInt(m[0], 10) : 1
}

export const normalizeFuelType = (fuel: string): Car['fuelType'] => {
  const v = String(fuel).trim().toLowerCase()
  if (v.startsWith('pet')) return 'Petrol'
  if (v.startsWith('die')) return 'Diesel'
  if (v.includes('cng')) return 'CNG'
  if (v.startsWith('elec')) return 'Electric'
  if (v.startsWith('hyb')) return 'Hybrid'
  return 'Petrol'
}

export const normalizeTransmission = (t: string): Car['transmission'] => {
  const v = String(t).trim().toLowerCase()
  return v.startsWith('auto') || v.includes('amt') || v.includes('cvt') ? 'Automatic' : 'Manual'
}

export const normalizeSellerType = (s: string): Car['sellerType'] => {
  return String(s).toLowerCase().startsWith('deal') ? 'Dealer' : 'Individual'
}

export const cleanApolloImage = (url: string) => url.replace(/;s=\d+;q=\d+$/, '')

export const normalizeCar = (raw: any, index = 0): Car => ({
  id: String(raw.id ?? `car_${Date.now()}_${index}`),
  title: String(raw.title ?? 'Used Car'),
  price: typeof raw.price === 'bigint' ? Number(raw.price) : parseIntSafe(raw.price, 0),
  year: parseYear(raw.year ?? new Date().getFullYear()),
  fuelType: normalizeFuelType(raw.fuelType ?? 'Petrol'),
  transmission: normalizeTransmission(raw.transmission ?? 'Manual'),
  kmDriven: parseKmDriven(raw.kmDriven ?? 0),
  location: String(raw.location ?? 'Raipur'),
  images: Array.isArray(raw.images) && raw.images.length
    ? raw.images.map((u: string) => cleanApolloImage(u)).slice(0, 8)
    : ['/default-car.jpg'],
  description: String(raw.description ?? raw.specs ?? '').slice(0, 200),
  sellerType: normalizeSellerType(raw.sellerType ?? 'Individual'),
  postedDate: String(raw.postedDate ?? new Date().toISOString().split('T')[0]),
  brand: String(raw.brand ?? 'Unknown'),
  model: String(raw.model ?? 'Unknown'),
  variant: raw.variant ? String(raw.variant) : undefined,
  owners: parseOwners(raw.owners ?? 1),
  isVerified: Boolean(raw.isVerified ?? true),
  isFeatured: Boolean(raw.isFeatured ?? index < 3),
  createdAt: raw.createdAt ? new Date(raw.createdAt) : undefined,
  updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : undefined,
  dataSource: (raw.dataSource ?? 'other') as Car['dataSource'],
  olxProfile: raw.olxProfile as Car['olxProfile'],
  olxProfileId: raw.olxProfileId ? String(raw.olxProfileId) : undefined,
  originalUrl: String(raw.originalUrl ?? ''),
  attribution: raw.attribution ? String(raw.attribution) : undefined,
  attributionNote: raw.attributionNote ? String(raw.attributionNote) : undefined,
  carStreetsListed: Boolean(raw.carStreetsListed ?? true)
})
