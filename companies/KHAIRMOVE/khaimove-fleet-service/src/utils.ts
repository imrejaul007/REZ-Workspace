// KHAIRMOVE Fleet Service - Utility Functions

import { randomBytes } from 'crypto';

export function generateSecureId(): string {
  return randomBytes(16).toString('hex');
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export const DRIVER_TIERS = {
  bronze: { minScore: 0, maxScore: 3.9 },
  silver: { minScore: 4.0, maxScore: 4.4 },
  gold: { minScore: 4.5, maxScore: 4.7 },
  platinum: { minScore: 4.8, maxScore: 5.0 },
};

export function getDriverTier(rating: number): string {
  if (rating >= 4.8) return 'platinum';
  if (rating >= 4.5) return 'gold';
  if (rating >= 4.0) return 'silver';
  return 'bronze';
}
