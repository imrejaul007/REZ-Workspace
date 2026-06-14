// KHAIRMOVE Ride Service - Utility Functions

import { randomBytes } from 'crypto';

// ============================================
// SECURE ID GENERATION
// ============================================

export function generateSecureId(): string {
  return randomBytes(16).toString('hex');
}

export function generateSecureOTP(): string {
  return randomBytes(2).toString('hex').toUpperCase();
}

// ============================================
// DISTANCE CALCULATION (Haversine)
// ============================================

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
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

// ============================================
// FARE CONFIGURATION
// ============================================

export interface FareConfig {
  baseFare: number;
  perKm: number;
  perMin: number;
  minimumFare: number;
}

export const FARE_CONFIG: Record<'bike' | 'auto' | 'cab' | 'suv', FareConfig> = {
  bike: {
    baseFare: 15,
    perKm: 6,
    perMin: 1,
    minimumFare: 30,
  },
  auto: {
    baseFare: 25,
    perKm: 10,
    perMin: 1.5,
    minimumFare: 50,
  },
  cab: {
    baseFare: 40,
    perKm: 14,
    perMin: 2,
    minimumFare: 80,
  },
  suv: {
    baseFare: 60,
    perKm: 18,
    perMin: 2.5,
    minimumFare: 120,
  },
};

export const CASBACK_PERCENTAGE = 0.10;

// ============================================
// FARE CALCULATION
// ============================================

export interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeFare: number;
  surgeMultiplier: number;
  subtotal: number;
  cashback: number;
  finalFare: number;
}

export function calculateFare(
  vehicleType: 'bike' | 'auto' | 'cab' | 'suv',
  distance: number,
  durationMinutes: number,
  surgeMultiplier: number = 1
): FareBreakdown {
  const config = FARE_CONFIG[vehicleType];

  const distanceFare = distance * config.perKm;
  const timeFare = (durationMinutes / 60) * config.perMin;
  const subtotal = config.baseFare + distanceFare + timeFare;
  const surgeFare = subtotal * (surgeMultiplier - 1);
  const totalWithSurge = subtotal + surgeFare;
  const cashback = totalWithSurge * CASBACK_PERCENTAGE;

  return {
    baseFare: config.baseFare,
    distanceFare,
    timeFare,
    surgeFare,
    surgeMultiplier,
    subtotal: totalWithSurge,
    cashback,
    finalFare: totalWithSurge,
  };
}
