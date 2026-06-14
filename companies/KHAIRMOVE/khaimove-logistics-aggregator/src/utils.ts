// KHAIRMOVE Logistics Aggregator - Utility Functions

import { randomBytes } from 'crypto';

export function generateSecureId(): string {
  return randomBytes(16).toString('hex');
}

export function calculateRate(
  carrier: string,
  weight: number,
  distance: number,
  isCOD: boolean
): number {
  const baseRates: Record<string, number> = {
    delhivery: 50,
    bluedart: 60,
    dtdc: 45,
    fedex: 80,
    dhl: 100,
  };

  const base = baseRates[carrier] || 50;
  const weightCharge = weight * 15;
  const distanceCharge = distance * 0.5;
  const codSurcharge = isCOD ? 30 : 0;

  return base + weightCharge + distanceCharge + codSurcharge;
}

export function calculateDeliveryTime(carrier: string, type: 'local' | 'metro' | 'regional'): number {
  const times: Record<string, Record<string, number>> = {
    delhivery: { local: 3, metro: 4, regional: 5 },
    bluedart: { local: 2, metro: 3, regional: 4 },
    dtdc: { local: 4, metro: 5, regional: 6 },
    fedex: { local: 2, metro: 2, regional: 3 },
    dhl: { local: 3, metro: 3, regional: 4 },
  };

  return times[carrier]?.[type] || 4;
}

export function validateAddress(address: any): boolean {
  if (!address.pincode || address.pincode.length !== 6) return false;
  if (!address.phone || address.phone.length !== 10) return false;
  if (!address.city || !address.name || !address.address) return false;

  return true;
}
