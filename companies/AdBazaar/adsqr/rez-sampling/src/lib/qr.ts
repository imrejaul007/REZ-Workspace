// AdsQr MVP - Phase 1
// Generate unique slug for QR codes
import { randomUUID } from 'crypto';

export function generateSlug(): string {
  // Use crypto UUID for cryptographically secure slug
  return randomUUID().replace(/-/g, '').substring(0, 8).toLowerCase();
}

// Generate QR image URL (using QR Server API)
export function generateQRImage(slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adsqr.rezapp.com'
  const url = `${baseUrl}/scan/${slug}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`
}
