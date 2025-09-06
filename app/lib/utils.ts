import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatDistance(km: number): string {
  if (km >= 100000) {
    return `${(km / 100000).toFixed(1)} lakh km`
  }
  return `${km.toLocaleString('en-IN')} km`
}
