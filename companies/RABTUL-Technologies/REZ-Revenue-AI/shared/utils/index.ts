/**
 * REZ Revenue AI - Utility Functions
 */

import { randomUUID } from 'crypto';

// ================== ID GENERATION ==================

export const generateRequestId = (): string => {
  return `req_${randomUUID().replace(/-/g, '').substring(0, 16)}`;
};

export const generateEntityId = (prefix: string = 'entity'): string => {
  return `${prefix}_${randomUUID().replace(/-/g, '').substring(0, 12)}`;
};

// ================== PRICE ROUNDING ==================

export const roundPrice = (price: number, roundTo?: number): number => {
  if (!roundTo || roundTo <= 0) {
    return Math.round(price * 100) / 100;
  }
  return Math.round(price / roundTo) * roundTo;
};

export const roundToNearest = (
  price: number,
  options: 1 | 5 | 10 | 50 | 100 = 1
): number => {
  return Math.round(price / options) * options;
};

// ================== PERCENTAGE CALCULATIONS ==================

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

export const calculateChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const applyPercentage = (value: number, percentage: number): number => {
  return value * (1 + percentage / 100);
};

export const reversePercentage = (value: number, percentage: number): number => {
  return value / (1 + percentage / 100);
};

// ================== PRICE ADJUSTMENTS ==================

export const calculateSurgePrice = (
  basePrice: number,
  surgeMultiplier: number,
  maxSurge: number
): number => {
  const effectiveSurge = Math.min(surgeMultiplier, maxSurge);
  return basePrice * effectiveSurge;
};

export const calculateDiscountedPrice = (
  basePrice: number,
  discountPercentage: number
): number => {
  return basePrice * (1 - discountPercentage / 100);
};

export const calculatePriceWithMargin = (
  cost: number,
  marginPercentage: number
): number => {
  return cost * (1 + marginPercentage / 100);
};

export const calculateMarginFromPrice = (
  price: number,
  cost: number
): number => {
  if (price === 0) return 0;
  return ((price - cost) / price) * 100;
};

// ================== DEMAND SCORING ==================

export const calculateDemandScore = (
  current: number,
  predicted: number,
  historical: number,
  weights: { current: number; predicted: number; historical: number } = {
    current: 0.4,
    predicted: 0.35,
    historical: 0.25,
  }
): number => {
  const rawScore =
    current * weights.current +
    predicted * weights.predicted +
    historical * weights.historical;
  return Math.min(100, Math.max(0, rawScore));
};

export const calculateDemandTrend = (
  currentDemand: number,
  previousDemand: number
): 'increasing' | 'stable' | 'decreasing' => {
  const change = calculateChange(currentDemand, previousDemand);
  if (change > 10) return 'increasing';
  if (change < -10) return 'decreasing';
  return 'stable';
};

// ================== TIME UTILITIES ==================

export const isPeakHour = (
  hour: number,
  vertical: string
): boolean => {
  const peakHours: Record<string, number[]> = {
    restaurant: [12, 13, 19, 20, 21],
    hotel: [9, 10, 11],
    salon: [10, 11, 18, 19, 20],
    clinic: [10, 11, 17, 18, 19],
    gym: [6, 7, 8, 18, 19, 20],
    events: [],
    retail: [17, 18, 19, 20],
    home_services: [9, 10, 11, 17, 18, 19],
    corp_perks: [10, 11, 14, 15],
  };
  return (peakHours[vertical] || []).includes(hour);
};

export const isWeekend = (dayOfWeek: number): boolean => {
  return dayOfWeek === 0 || dayOfWeek === 6;
};

export const getSeason = (month: number): 'spring' | 'summer' | 'autumn' | 'winter' => {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
};

export const getTimeSlot = (hour: number): string => {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

// ================== INVENTORY UTILITIES ==================

export const calculateInventoryPercentage = (level: number, max: number): number => {
  if (max === 0) return 0;
  return (level / max) * 100;
};

export const isLowStock = (percentage: number, threshold: number = 20): boolean => {
  return percentage <= threshold;
};

export const isOverstock = (percentage: number, threshold: number = 80): boolean => {
  return percentage >= threshold;
};

export const getInventoryVelocity = (
  current: number,
  previous: number
): 'fast' | 'normal' | 'slow' => {
  const ratio = previous > 0 ? current / previous : 1;
  if (ratio > 1.2) return 'fast';
  if (ratio < 0.8) return 'slow';
  return 'normal';
};

// ================== SLOT UTILITIES ==================

export const calculateSlotAvailability = (
  slotsRemaining: number,
  totalSlots: number
): 'high' | 'medium' | 'low' | 'full' => {
  if (slotsRemaining === 0) return 'full';
  const percentage = (slotsRemaining / totalSlots) * 100;
  if (percentage > 50) return 'high';
  if (percentage > 20) return 'medium';
  return 'low';
};

export const calculateSlotSurge = (
  slotsRemaining: number,
  totalSlots: number,
  baseSurge: number = 0.1
): number => {
  if (slotsRemaining === 0) return 0.3; // Max surge when full
  const percentage = slotsRemaining / totalSlots;
  if (percentage > 0.5) return 0; // No surge when plenty available
  if (percentage > 0.2) return baseSurge;
  return baseSurge * 2;
};

// ================== CONFIDENCE CALCULATIONS ==================

export const calculateDataQualityConfidence = (
  dataPoints: {
    hasHistorical: boolean;
    hasRealTime: boolean;
    hasCompetition: boolean;
    dataAge: number; // hours
  }
): number => {
  let confidence = 0;
  if (dataPoints.hasHistorical) confidence += 0.3;
  if (dataPoints.hasRealTime) confidence += 0.4;
  if (dataPoints.hasCompetition) confidence += 0.2;

  // Age penalty
  if (dataPoints.dataAge > 24) confidence -= 0.2;
  if (dataPoints.dataAge > 48) confidence -= 0.2;
  if (dataPoints.dataAge > 168) confidence -= 0.3;

  return Math.min(1, Math.max(0, confidence));
};

export const calculatePredictionConfidence = (
  dataPointsCount: number,
  modelAccuracy: number = 0.8,
  seasonalityConfidence: number = 0.7
): number => {
  let confidence = modelAccuracy * 0.5;

  // More data = higher confidence
  if (dataPointsCount > 100) confidence += 0.2;
  else if (dataPointsCount > 50) confidence += 0.15;
  else if (dataPointsCount > 20) confidence += 0.1;
  else if (dataPointsCount > 5) confidence += 0.05;

  confidence += seasonalityConfidence * 0.2;

  return Math.min(1, Math.max(0, confidence));
};

// ================== SEGMENT UTILITIES ==================

export const determineSegment = (
  orderCount: number,
  daysSinceLastOrder: number,
  churnRisk: number = 0
): 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant' => {
  if (orderCount === 0) return 'new';
  if (daysSinceLastOrder > 90) return 'dormant';
  if (churnRisk > 0.7) return 'at_risk';
  if (orderCount >= 10 && daysSinceLastOrder <= 30) return 'vip';
  return 'regular';
};

export const calculateLTVTier = (
  ltv: number
): 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' => {
  if (ltv >= 100000) return 'diamond';
  if (ltv >= 50000) return 'platinum';
  if (ltv >= 25000) return 'gold';
  if (ltv >= 10000) return 'silver';
  return 'bronze';
};

// ================== WEIGHTED AVERAGE ==================

export const weightedAverage = (
  values: number[],
  weights: number[]
): number => {
  if (values.length !== weights.length || values.length === 0) {
    throw new Error('Values and weights must have the same length and be non-empty');
  }
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return 0;
  const sum = values.reduce((acc, val, i) => acc + val * weights[i], 0);
  return sum / totalWeight;
};

// ================== VALIDATION ==================

export const isValidPrice = (price: number): boolean => {
  return typeof price === 'number' && !isNaN(price) && price >= 0 && isFinite(price);
};

export const isValidMargin = (margin: number): boolean => {
  return typeof margin === 'number' && !isNaN(margin) && margin >= 0 && margin <= 100;
};

export const clampPrice = (
  price: number,
  minPrice: number,
  maxPrice: number
): number => {
  return Math.max(minPrice, Math.min(maxPrice, price));
};

// ================== DATE UTILITIES ==================

export const addHours = (date: Date, hours: number): Date => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const getStartOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const getEndOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

// ================== CURRENCY FORMATTING ==================

export const formatCurrency = (
  amount: number,
  currency: string = 'INR'
): string => {
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  const symbol = symbols[currency] || currency + ' ';
  return `${symbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// ================== ERROR HANDLING ==================

export class RevenueAIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'RevenueAIError';
  }
}

export const createError = (
  code: string,
  message: string,
  statusCode: number = 500,
  details?: unknown
): RevenueAIError => {
  return new RevenueAIError(message, code, statusCode, details);
};

// ================== CACHE UTILITIES ==================

export const createCacheKey = (
  prefix: string,
  ...parts: (string | number | boolean)[]
): string => {
  return `${prefix}:${parts.join(':')}`;
};

export const isCacheValid = (
  cachedAt: Date,
  ttlMs: number
): boolean => {
  const now = Date.now();
  const cached = cachedAt.getTime();
  return now - cached < ttlMs;
};
