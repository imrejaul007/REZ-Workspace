// KHAIRMOVE Delivery Service - Utility Functions

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

export const DELIVERY_PRIORITIES = {
  standard: { hours: 48, basePrice: 50, label: 'Standard' },
  express: { hours: 24, basePrice: 100, label: 'Express' },
  instant: { hours: 4, basePrice: 200, label: 'Instant' },
};

export const DELIVERY_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
};

export interface DeliveryPricingInput {
  weight: number;
  distance: number;
  priority: keyof typeof DELIVERY_PRIORITIES;
}

export function calculateDeliveryPrice(input: DeliveryPricingInput): number {
  const config = DELIVERY_PRIORITIES[input.priority];
  const perKgRate = 20;
  const perKmRate = 5;

  return config.basePrice + (input.weight * perKgRate) + (input.distance * perKmRate);
}
