// Room types with base prices
export const ROOM_TYPES = {
  standard: { basePrice: 2000, name: 'Standard Room' },
  deluxe: { basePrice: 3500, name: 'Deluxe Room' },
  suite: { basePrice: 6000, name: 'Suite' },
  presidential: { basePrice: 15000, name: 'Presidential Suite' },
} as const;

export type RoomType = keyof typeof ROOM_TYPES;

// Season multipliers
export const SEASON_MULTIPLIERS = {
  low: 0.8,
  regular: 1.0,
  high: 1.4,
  peak: 1.8,
} as const;

export type Season = keyof typeof SEASON_MULTIPLIERS;

// Day of week multipliers
export const DAY_MULTIPLIERS: Record<string, number> = {
  sunday: 0.9,
  monday: 0.95,
  tuesday: 0.95,
  wednesday: 1.0,
  thursday: 1.0,
  friday: 1.15,
  saturday: 1.2,
};

export interface PricingRequest {
  roomType: RoomType;
  checkInDate: string;
  checkOutDate: string;
  occupancy: number;
  hotelId: string;
}

export interface PricingResult {
  roomType: RoomType;
  basePrice: number;
  finalPrice: number;
  occupancyMultiplier: number;
  seasonMultiplier: number;
  dayMultiplier: number;
  breakdown: {
    basePrice: number;
    occupancyAdjustment: number;
    seasonAdjustment: number;
    dayAdjustment: number;
  };
}

export interface PricingHistoryEntry {
  id: string;
  hotelId: string;
  roomType: RoomType;
  date: string;
  occupancy: number;
  price: number;
  createdAt: string;
}

// In-memory store for pricing history
const pricingHistory: Map<string, PricingHistoryEntry[]> = new Map();

function getSeason(date: Date): Season {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Peak season: December 20 - January 5, April 10-20, May 1-15
  if ((month === 12 && day >= 20) || (month === 1 && day <= 5)) return 'peak';
  if (month === 4 && day >= 10 && day <= 20) return 'peak';
  if (month === 5 && day >= 1 && day <= 15) return 'peak';

  // High season: October - November, March, June
  if (month === 10 || month === 11 || month === 3 || month === 6) return 'high';

  // Low season: July - August, February (except holidays)
  if (month === 7 || month === 8 || month === 2) return 'low';

  return 'regular';
}

function getDayMultiplier(date: Date): number {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  return DAY_MULTIPLIERS[dayName] || 1.0;
}

function getOccupancyMultiplier(occupancyPercent: number): number {
  if (occupancyPercent >= 90) return 1.35;
  if (occupancyPercent >= 80) return 1.25;
  if (occupancyPercent >= 70) return 1.15;
  if (occupancyPercent >= 60) return 1.08;
  if (occupancyPercent >= 50) return 1.0;
  if (occupancyPercent >= 30) return 0.95;
  return 0.9;
}

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateRate(
  roomType: RoomType,
  checkInDate: string,
  checkOutDate: string,
  occupancy: number,
  hotelId: string
): PricingResult {
  const basePrice = ROOM_TYPES[roomType].basePrice;
  const checkIn = new Date(checkInDate);

  const season = getSeason(checkIn);
  const seasonMultiplier = SEASON_MULTIPLIERS[season];

  const dayMultiplier = getDayMultiplier(checkIn);
  const occupancyMultiplier = getOccupancyMultiplier(occupancy);

  const nights = calculateNights(checkInDate, checkOutDate);
  const avgBasePricePerNight = basePrice * nights;

  // Calculate adjustments
  const occupancyAdjustment = avgBasePricePerNight * (occupancyMultiplier - 1);
  const seasonAdjustment = avgBasePricePerNight * (seasonMultiplier - 1);
  const dayAdjustment = avgBasePricePerNight * (dayMultiplier - 1);

  const finalPrice = Math.round(
    basePrice * seasonMultiplier * dayMultiplier * occupancyMultiplier * nights
  );

  return {
    roomType,
    basePrice: basePrice * nights,
    finalPrice,
    occupancyMultiplier,
    seasonMultiplier,
    dayMultiplier,
    breakdown: {
      basePrice: basePrice * nights,
      occupancyAdjustment: Math.round(occupancyAdjustment),
      seasonAdjustment: Math.round(seasonAdjustment),
      dayAdjustment: Math.round(dayAdjustment),
    },
  };
}

export function recordPrice(
  id: string,
  hotelId: string,
  roomType: RoomType,
  date: string,
  occupancy: number,
  price: number
): void {
  const entry: PricingHistoryEntry = {
    id,
    hotelId,
    roomType,
    date,
    occupancy,
    price,
    createdAt: new Date().toISOString(),
  };

  const existing = pricingHistory.get(hotelId) || [];
  existing.push(entry);
  pricingHistory.set(hotelId, existing);
}

export function getPricingHistory(hotelId: string): PricingHistoryEntry[] {
  return pricingHistory.get(hotelId) || [];
}

export function getSeasonalTrends(hotelId: string, months: number = 3): Record<string, number> {
  const history = pricingHistory.get(hotelId) || [];
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  const filtered = history.filter((h) => new Date(h.date) >= cutoff);

  const trends: Record<string, { total: number; count: number }> = {};

  for (const entry of filtered) {
    if (!trends[entry.roomType]) {
      trends[entry.roomType] = { total: 0, count: 0 };
    }
    trends[entry.roomType].total += entry.price;
    trends[entry.roomType].count += 1;
  }

  const result: Record<string, number> = {};
  for (const [type, data] of Object.entries(trends)) {
    result[type] = Math.round(data.total / data.count);
  }

  return result;
}
