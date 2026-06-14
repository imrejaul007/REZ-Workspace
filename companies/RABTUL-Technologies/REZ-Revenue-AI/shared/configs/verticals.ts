/**
 * REZ Revenue AI - Vertical Configurations
 * Industry-specific pricing rules and multipliers
 */

import type { VerticalConfig, CashbackSegmentConfig } from '../schemas';

// ================== RESTAURANT CONFIG ==================

export const restaurantConfig: VerticalConfig = {
  vertical: 'restaurant',
  displayName: 'Restaurant & Food',
  surge: {
    maxCap: 2.0,
    triggers: ['demand', 'time', 'weather', 'events'],
    floors: {
      breakfast: 0.9,
      lunch: 1.0,
      afternoon: 0.75,
      dinner: 1.3,
      lateNight: 1.1,
    },
  },
  cashback: [
    { segment: 'new', baseRate: 0.20, minRate: 0.10, maxRate: 0.30 },
    { segment: 'regular', baseRate: 0.08, minRate: 0.05, maxRate: 0.15 },
    { segment: 'vip', baseRate: 0.03, minRate: 0.02, maxRate: 0.08 },
    { segment: 'at_risk', baseRate: 0.15, minRate: 0.10, maxRate: 0.25 },
    { segment: 'dormant', baseRate: 0.12, minRate: 0.08, maxRate: 0.20 },
  ] as CashbackSegmentConfig[],
  inventoryFactors: {
    enabled: true,
    lowStockThreshold: 20,
    overstockThreshold: 80,
    expiryThresholds: [3, 7],
  },
  timeMultipliers: {
    dayOfWeek: {
      '0': 1.0,  // Sunday
      '1': 0.85, // Monday
      '2': 0.90, // Tuesday
      '3': 0.95, // Wednesday
      '4': 1.05, // Thursday
      '5': 1.15, // Friday
      '6': 1.20, // Saturday
    },
    hourOfDay: {
      '6': 0.6,  '7': 0.7,  '8': 0.8,  '9': 0.9,
      '10': 0.95, '11': 1.1, '12': 1.0, '13': 0.85,
      '14': 0.75, '15': 0.8, '16': 0.9, '17': 1.0,
      '18': 1.2, '19': 1.4, '20': 1.3, '21': 1.1,
      '22': 0.9, '23': 0.7, '0': 0.5, '1': 0.4,
      '2': 0.4,  '3': 0.4,  '4': 0.5,  '5': 0.5,
    },
    weekend: 1.15,
    holiday: 1.20,
  },
};

// ================== HOTEL CONFIG ==================

export const hotelConfig: VerticalConfig = {
  vertical: 'hotel',
  displayName: 'Hotels & Hospitality',
  surge: {
    maxCap: 3.0,
    triggers: ['demand', 'events', 'seasonality', 'lead_time'],
    floors: {
      offSeason: 0.85,
      shoulderSeason: 1.0,
      peakSeason: 1.25,
      weekend: 1.15,
      festival: 1.80,
      blackout: 2.5,
    },
  },
  cashback: [
    { segment: 'new', baseRate: 0.15, minRate: 0.10, maxRate: 0.25 },
    { segment: 'regular', baseRate: 0.06, minRate: 0.03, maxRate: 0.12 },
    { segment: 'vip', baseRate: 0.02, minRate: 0.01, maxRate: 0.05 },
    { segment: 'at_risk', baseRate: 0.12, minRate: 0.08, maxRate: 0.20 },
    { segment: 'dormant', baseRate: 0.10, minRate: 0.05, maxRate: 0.15 },
  ] as CashbackSegmentConfig[],
  inventoryFactors: {
    enabled: true,
    lowStockThreshold: 15,
    overstockThreshold: 85,
    expiryThresholds: [], // Hotels don't have expiry
  },
  timeMultipliers: {
    dayOfWeek: {
      '0': 1.05,  // Sunday
      '1': 0.95,  // Monday
      '2': 0.90,  // Tuesday
      '3': 0.90,  // Wednesday
      '4': 0.95,  // Thursday
      '5': 1.10,  // Friday
      '6': 1.15,  // Saturday
    },
    hourOfDay: {}, // Hotels use day-based pricing
    weekend: 1.15,
    holiday: 1.30,
  },
};

// ================== SALON CONFIG ==================

export const salonConfig: VerticalConfig = {
  vertical: 'salon',
  displayName: 'Salon & Spa',
  surge: {
    maxCap: 1.5,
    triggers: ['time', 'slots', 'seasonality'],
    floors: {
      morning: 0.85,
      afternoon: 0.70,
      evening: 1.30,
      weekend: 1.20,
    },
  },
  cashback: [
    { segment: 'new', baseRate: 0.18, minRate: 0.10, maxRate: 0.25 },
    { segment: 'regular', baseRate: 0.07, minRate: 0.04, maxRate: 0.12 },
    { segment: 'vip', baseRate: 0.03, minRate: 0.02, maxRate: 0.06 },
    { segment: 'at_risk', baseRate: 0.14, minRate: 0.08, maxRate: 0.20 },
    { segment: 'dormant', baseRate: 0.10, minRate: 0.05, maxRate: 0.15 },
  ] as CashbackSegmentConfig[],
  inventoryFactors: {
    enabled: true,
    lowStockThreshold: 10,
    overstockThreshold: 90,
    expiryThresholds: [],
  },
  timeMultipliers: {
    dayOfWeek: {
      '0': 1.10,  // Sunday
      '1': 0.80,  // Monday
      '2': 0.85,  // Tuesday
      '3': 0.90,  // Wednesday
      '4': 1.00,  // Thursday
      '5': 1.15,  // Friday
      '6': 1.25,  // Saturday
    },
    hourOfDay: {
      '9': 0.9, '10': 1.0, '11': 1.1, '12': 1.0,
      '13': 0.8, '14': 0.7, '15': 0.75, '16': 0.85,
      '17': 1.0, '18': 1.2, '19': 1.4, '20': 1.2,
      '21': 0.9,
    },
    weekend: 1.20,
    holiday: 1.15,
  },
};

// ================== CLINIC CONFIG ==================

export const clinicConfig: VerticalConfig = {
  vertical: 'clinic',
  displayName: 'Clinics & Healthcare',
  surge: {
    maxCap: 1.5,
    triggers: ['time', 'demand', 'specialist'],
    floors: {
      morning: 1.0,
      afterWork: 1.25,
      weekend: 1.10,
      emergency: 1.50,
    },
  },
  cashback: [
    { segment: 'new', baseRate: 0.12, minRate: 0.08, maxRate: 0.20 },
    { segment: 'regular', baseRate: 0.05, minRate: 0.03, maxRate: 0.10 },
    { segment: 'vip', baseRate: 0.02, minRate: 0.01, maxRate: 0.04 },
    { segment: 'at_risk', baseRate: 0.10, minRate: 0.05, maxRate: 0.15 },
    { segment: 'dormant', baseRate: 0.08, minRate: 0.04, maxRate: 0.12 },
  ] as CashbackSegmentConfig[],
  inventoryFactors: {
    enabled: false, // Healthcare doesn't use inventory-based pricing
    lowStockThreshold: 0,
    overstockThreshold: 0,
    expiryThresholds: [],
  },
  timeMultipliers: {
    dayOfWeek: {
      '0': 0.9,   // Sunday (emergency only)
      '1': 1.0,   // Monday
      '2': 1.0,   // Tuesday
      '3': 1.0,   // Wednesday
      '4': 1.0,   // Thursday
      '5': 1.0,   // Friday
      '6': 1.05,  // Saturday
    },
    hourOfDay: {
      '8': 0.9, '9': 1.0, '10': 1.1, '11': 1.2,
      '12': 1.0, '13': 0.8, '14': 0.9, '15': 1.0,
      '16': 1.1, '17': 1.3, '18': 1.4, '19': 1.2,
      '20': 0.9, '21': 0.8,
    },
    weekend: 1.10,
    holiday: 1.30,
  },
};

// ================== GYM CONFIG ==================

export const gymConfig: VerticalConfig = {
  vertical: 'gym',
  displayName: 'Gym & Fitness',
  surge: {
    maxCap: 1.3,
    triggers: ['time', 'seasonality'],
    floors: {
      morning: 1.1,
      afternoon: 0.8,
      evening: 1.2,
      weekend: 0.9,
    },
  },
  cashback: [
    { segment: 'new', baseRate: 0.15, minRate: 0.10, maxRate: 0.25 },
    { segment: 'regular', baseRate: 0.05, minRate: 0.03, maxRate: 0.10 },
    { segment: 'vip', baseRate: 0.02, minRate: 0.01, maxRate: 0.04 },
    { segment: 'at_risk', baseRate: 0.12, minRate: 0.08, maxRate: 0.18 },
    { segment: 'dormant', baseRate: 0.08, minRate: 0.05, maxRate: 0.12 },
  ] as CashbackSegmentConfig[],
  inventoryFactors: {
    enabled: false,
    lowStockThreshold: 0,
    overstockThreshold: 0,
    expiryThresholds: [],
  },
  timeMultipliers: {
    dayOfWeek: {
      '0': 0.8,   // Sunday
      '1': 1.1,   // Monday (peak)
      '2': 1.0,   // Tuesday
      '3': 1.0,   // Wednesday
      '4': 1.0,   // Thursday
      '5': 1.0,   // Friday
      '6': 0.9,   // Saturday
    },
    hourOfDay: {
      '5': 1.0, '6': 1.3, '7': 1.4, '8': 1.2,
      '9': 1.0, '10': 0.8, '11': 0.7, '12': 0.7,
      '13': 0.7, '14': 0.8, '15': 0.9, '16': 1.0,
      '17': 1.1, '18': 1.3, '19': 1.4, '20': 1.2,
      '21': 1.0, '22': 0.8,
    },
    weekend: 0.85,
    holiday: 1.15,
  },
};

// ================== EVENTS CONFIG ==================

export const eventsConfig: VerticalConfig = {
  vertical: 'events',
  displayName: 'Events & Experiences',
  surge: {
    maxCap: 4.0,
    triggers: ['demand', 'events', 'time'],
    floors: {
      earlyBird: 0.85,
      regular: 1.0,
      lastMinute: 1.5,
      dayOfEvent: 2.0,
    },
  },
  cashback: [
    { segment: 'new', baseRate: 0.10, minRate: 0.05, maxRate: 0.15 },
    { segment: 'regular', baseRate: 0.05, minRate: 0.03, maxRate: 0.08 },
    { segment: 'vip', baseRate: 0.02, minRate: 0.01, maxRate: 0.03 },
    { segment: 'at_risk', baseRate: 0.08, minRate: 0.05, maxRate: 0.12 },
    { segment: 'dormant', baseRate: 0.06, minRate: 0.03, maxRate: 0.10 },
  ] as CashbackSegmentConfig[],
  inventoryFactors: {
    enabled: true,
    lowStockThreshold: 20,
    overstockThreshold: 0,
    expiryThresholds: [1, 3],
  },
  timeMultipliers: {
    dayOfWeek: {
      '0': 1.1, '1': 1.0, '2': 1.0, '3': 1.0,
      '4': 1.0, '5': 1.05, '6': 1.1,
    },
    hourOfDay: {}, // Events have specific start times
    weekend: 1.10,
    holiday: 1.20,
  },
};

// ================== RETAIL CONFIG ==================

export const retailConfig: VerticalConfig = {
  vertical: 'retail',
  displayName: 'Retail & E-commerce',
  surge: {
    maxCap: 1.8,
    triggers: ['demand', 'inventory', 'time', 'events'],
    floors: {
      offPeak: 0.85,
      normal: 1.0,
      sale: 0.70,
      flashSale: 0.60,
    },
  },
  cashback: [
    { segment: 'new', baseRate: 0.15, minRate: 0.08, maxRate: 0.25 },
    { segment: 'regular', baseRate: 0.06, minRate: 0.03, maxRate: 0.12 },
    { segment: 'vip', baseRate: 0.03, minRate: 0.02, maxRate: 0.06 },
    { segment: 'at_risk', baseRate: 0.12, minRate: 0.08, maxRate: 0.18 },
    { segment: 'dormant', baseRate: 0.10, minRate: 0.05, maxRate: 0.15 },
  ] as CashbackSegmentConfig[],
  inventoryFactors: {
    enabled: true,
    lowStockThreshold: 15,
    overstockThreshold: 70,
    expiryThresholds: [7, 14, 30],
  },
  timeMultipliers: {
    dayOfWeek: {
      '0': 1.0, '1': 0.95, '2': 0.90, '3': 0.95,
      '4': 1.0, '5': 1.05, '6': 1.10,
    },
    hourOfDay: {
      '9': 0.8, '10': 0.9, '11': 1.0, '12': 0.95,
      '13': 0.9, '14': 0.9, '15': 0.95, '16': 1.0,
      '17': 1.05, '18': 1.1, '19': 1.15, '20': 1.1,
      '21': 1.0, '22': 0.8,
    },
    weekend: 1.10,
    holiday: 1.25,
  },
};

// ================== HOME SERVICES CONFIG ==================

export const homeServicesConfig: VerticalConfig = {
  vertical: 'home_services',
  displayName: 'Home Services',
  surge: {
    maxCap: 1.8,
    triggers: ['time', 'demand', 'weather'],
    floors: {
      morning: 1.0,
      afternoon: 0.9,
      evening: 1.2,
      weekend: 1.15,
    },
  },
  cashback: [
    { segment: 'new', baseRate: 0.15, minRate: 0.10, maxRate: 0.22 },
    { segment: 'regular', baseRate: 0.07, minRate: 0.04, maxRate: 0.12 },
    { segment: 'vip', baseRate: 0.03, minRate: 0.02, maxRate: 0.06 },
    { segment: 'at_risk', baseRate: 0.12, minRate: 0.08, maxRate: 0.18 },
    { segment: 'dormant', baseRate: 0.10, minRate: 0.05, maxRate: 0.15 },
  ] as CashbackSegmentConfig[],
  inventoryFactors: {
    enabled: false,
    lowStockThreshold: 0,
    overstockThreshold: 0,
    expiryThresholds: [],
  },
  timeMultipliers: {
    dayOfWeek: {
      '0': 1.10,  // Sunday
      '1': 0.95,  // Monday
      '2': 0.90,  // Tuesday
      '3': 0.90,  // Wednesday
      '4': 0.95,  // Thursday
      '5': 1.00,  // Friday
      '6': 1.15,  // Saturday
    },
    hourOfDay: {
      '8': 0.9, '9': 1.0, '10': 1.1, '11': 1.1,
      '12': 1.0, '13': 0.9, '14': 0.9, '15': 0.95,
      '16': 1.0, '17': 1.15, '18': 1.25, '19': 1.15,
      '20': 1.0,
    },
    weekend: 1.15,
    holiday: 1.20,
  },
};

// ================== CORP PERKS CONFIG ==================

export const corpPerksConfig: VerticalConfig = {
  vertical: 'corp_perks',
  displayName: 'Corporate Perks',
  surge: {
    maxCap: 1.3,
    triggers: ['time', 'seasonality'],
    floors: {
      offSeason: 0.90,
      regular: 1.0,
      benefitsOpen: 1.15,
    },
  },
  cashback: [
    { segment: 'new', baseRate: 0.08, minRate: 0.05, maxRate: 0.12 },
    { segment: 'regular', baseRate: 0.04, minRate: 0.02, maxRate: 0.08 },
    { segment: 'vip', baseRate: 0.02, minRate: 0.01, maxRate: 0.04 },
    { segment: 'at_risk', baseRate: 0.06, minRate: 0.04, maxRate: 0.10 },
    { segment: 'dormant', baseRate: 0.05, minRate: 0.03, maxRate: 0.08 },
  ] as CashbackSegmentConfig[],
  inventoryFactors: {
    enabled: false,
    lowStockThreshold: 0,
    overstockThreshold: 0,
    expiryThresholds: [],
  },
  timeMultipliers: {
    dayOfWeek: {
      '0': 0.9, '1': 1.0, '2': 1.0, '3': 1.0,
      '4': 1.0, '5': 1.0, '6': 0.9,
    },
    hourOfDay: {}, // Corporate bookings are day-based
    weekend: 0.9,
    holiday: 1.05,
  },
};

// ================== ALL VERTICALS MAP ==================

export const VERTICAL_CONFIGS: Record<string, VerticalConfig> = {
  restaurant: restaurantConfig,
  hotel: hotelConfig,
  clinic: clinicConfig,
  salon: salonConfig,
  gym: gymConfig,
  events: eventsConfig,
  retail: retailConfig,
  home_services: homeServicesConfig,
  corp_perks: corpPerksConfig,
};

export const getVerticalConfig = (vertical: string): VerticalConfig | undefined => {
  return VERTICAL_CONFIGS[vertical];
};

export const getDefaultConstraints = (vertical: string) => {
  const config = getVerticalConfig(vertical);
  return {
    minMargin: 0.15,
    maxDiscount: config?.surge.maxCap ? 1 - (1 / config.surge.maxCap) : 0.5,
    maxSurge: config?.surge.maxCap || 2.0,
    strategy: 'balanced' as const,
    allowNegativePricing: false,
    roundToNearest: 1,
  };
};
