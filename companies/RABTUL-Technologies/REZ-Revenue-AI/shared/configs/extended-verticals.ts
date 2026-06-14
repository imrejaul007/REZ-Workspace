/**
 * REZ Revenue AI - Extended Vertical Configurations
 * Additional verticals: E-commerce, Travel, Auto, Events, Entertainment
 */

import type { VerticalConfig, CashbackSegmentConfig } from '../schemas';

// ================== E-COMMERCE CONFIG ==================

export const ecommerceConfig: VerticalConfig = {
  vertical: 'ecommerce',
  displayName: 'E-Commerce & Online Retail',
  surge: {
    maxCap: 2.5,
    triggers: ['demand', 'inventory', 'time', 'events'],
    floors: {
      flashSale: 0.5,
      offPeak: 0.8,
      normal: 1.0,
      highDemand: 1.3,
      exclusive: 1.5,
    },
  },
  cashback: [
    { segment: 'new', baseRate: 0.15, minRate: 0.08, maxRate: 0.25 },
    { segment: 'regular', baseRate: 0.05, minRate: 0.02, maxRate: 0.10 },
    { segment: 'vip', baseRate: 0.03, minRate: 0.01, maxRate: 0.06 },
    { segment: 'at_risk', baseRate: 0.10, minRate: 0.05, maxRate: 0.18 },
    { segment: 'dormant', baseRate: 0.08, minRate: 0.04, maxRate: 0.15 },
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
      '0': 0.3, '1': 0.2, '2': 0.2, '3': 0.2, '4': 0.2, '5': 0.3,
      '6': 0.4, '7': 0.5, '8': 0.7, '9': 0.9, '10': 1.0,
      '11': 1.1, '12': 1.0, '13': 0.95, '14': 0.95, '15': 1.0,
      '16': 1.05, '17': 1.15, '18': 1.25, '19': 1.3,
      '20': 1.2, '21': 1.1, '22': 0.9, '23': 0.6,
    },
    weekend: 1.10,
    holiday: 1.25,
  },
};

// ================== TRAVEL CONFIG ==================

export const travelConfig: VerticalConfig = {
  vertical: 'travel',
  displayName: 'Travel & Tourism',
  surge: {
    maxCap: 3.5,
    triggers: ['demand', 'seasonality', 'events', 'lead_time'],
    floors: {
      offSeason: 0.80,
      shoulder: 1.0,
      peak: 1.5,
      holiday: 2.0,
      blackout: 2.5,
    },
  },
  cashback: [
    { segment: 'new', baseRate: 0.12, minRate: 0.08, maxRate: 0.20 },
    { segment: 'regular', baseRate: 0.05, minRate: 0.03, maxRate: 0.10 },
    { segment: 'vip', baseRate: 0.02, minRate: 0.01, maxRate: 0.04 },
    { segment: 'at_risk', baseRate: 0.08, minRate: 0.05, maxRate: 0.15 },
    { segment: 'dormant', baseRate: 0.06, minRate: 0.03, maxRate: 0.12 },
  ] as CashbackSegmentConfig[],
  inventoryFactors: {
    enabled: true,
    lowStockThreshold: 20,
    overstockThreshold: 80,
    expiryThresholds: [],
  },
  timeMultipliers: {
    dayOfWeek: {
      '0': 1.05, '1': 0.90, '2': 0.85, '3': 0.85,
      '4': 0.90, '5': 1.10, '6': 1.15,
    },
    hourOfDay: {}, // Travel bookings don't vary by hour
    weekend: 1.15,
    holiday: 1.30,
  },
};

// ================== AUTO/RENTAL CONFIG ==================

export const autoRentalConfig: VerticalConfig = {
  vertical: 'auto_rental',
  displayName: 'Auto Rental & Transport',
  surge: {
    maxCap: 3.0,
    triggers: ['demand', 'seasonality', 'events', 'time'],
    floors: {
      weekday: 1.0,
      weekend: 1.25,
      holiday: 1.50,
      festival: 2.0,
      peakSeason: 1.75,
    },
  },
  cashback: [
    { segment: 'new', baseRate: 0.10, minRate: 0.05, maxRate: 0.15 },
    { segment: 'regular', baseRate: 0.04, minRate: 0.02, maxRate: 0.08 },
    { segment: 'vip', baseRate: 0.02, minRate: 0.01, maxRate: 0.04 },
    { segment: 'at_risk', baseRate: 0.08, minRate: 0.05, maxRate: 0.12 },
    { segment: 'dormant', baseRate: 0.06, minRate: 0.03, maxRate: 0.10 },
  ] as CashbackSegmentConfig[],
  inventoryFactors: {
    enabled: true,
    lowStockThreshold: 25,
    overstockThreshold: 85,
    expiryThresholds: [],
  },
  timeMultipliers: {
    dayOfWeek: {
      '0': 1.20, '1': 0.90, '2': 0.85, '3': 0.85,
      '4': 0.90, '5': 1.0, '6': 1.15,
    },
    hourOfDay: {
      '6': 0.9, '7': 1.0, '8': 1.2, '9': 1.3,
      '10': 1.2, '11': 1.1, '12': 1.0, '13': 0.9,
      '14': 0.9, '15': 1.0, '16': 1.1, '17': 1.2,
      '18': 1.3, '19': 1.2, '20': 1.0, '21': 0.9,
      '22': 0.8,
    },
    weekend: 1.20,
    holiday: 1.50,
  },
};

// ================== ENTERTAINMENT CONFIG ==================

export const entertainmentConfig: VerticalConfig = {
  vertical: 'entertainment',
  displayName: 'Entertainment & Events',
  surge: {
    maxCap: 4.0,
    triggers: ['demand', 'time', 'events', 'scarcity'],
    floors: {
      earlyBird: 0.70,
      presale: 0.85,
      regular: 1.0,
      lastMinute: 1.5,
      dayOfEvent: 2.0,
      soldOut: 2.5,
    },
  },
  cashback: [
    { segment: 'new', baseRate: 0.08, minRate: 0.05, maxRate: 0.12 },
    { segment: 'regular', baseRate: 0.04, minRate: 0.02, maxRate: 0.08 },
    { segment: 'vip', baseRate: 0.02, minRate: 0.01, maxRate: 0.03 },
    { segment: 'at_risk', baseRate: 0.06, minRate: 0.04, maxRate: 0.10 },
    { segment: 'dormant', baseRate: 0.05, minRate: 0.03, maxRate: 0.08 },
  ] as CashbackSegmentConfig[],
  inventoryFactors: {
    enabled: true,
    lowStockThreshold: 15,
    overstockThreshold: 0, // No overstock for events
    expiryThresholds: [1, 3], // Day-of-event pricing
  },
  timeMultipliers: {
    dayOfWeek: {
      '0': 1.10, '1': 0.95, '2': 0.95, '3': 0.95,
      '4': 1.0, '5': 1.05, '6': 1.10,
    },
    hourOfDay: {}, // Event-specific timing
    weekend: 1.15,
    holiday: 1.25,
  },
};

// ================== HEALTHCARE CONFIG ==================

export const healthcareConfig: VerticalConfig = {
  vertical: 'healthcare',
  displayName: 'Healthcare & Medical',
  surge: {
    maxCap: 1.5,
    triggers: ['time', 'demand', 'urgency'],
    floors: {
      routine: 1.0,
      afterHours: 1.25,
      emergency: 1.50,
      weekend: 1.15,
      holiday: 1.30,
    },
  },
  cashback: [
    { segment: 'new', baseRate: 0.10, minRate: 0.05, maxRate: 0.15 },
    { segment: 'regular', baseRate: 0.03, minRate: 0.02, maxRate: 0.06 },
    { segment: 'vip', baseRate: 0.01, minRate: 0.005, maxRate: 0.02 },
    { segment: 'at_risk', baseRate: 0.08, minRate: 0.05, maxRate: 0.12 },
    { segment: 'dormant', baseRate: 0.05, minRate: 0.03, maxRate: 0.08 },
  ] as CashbackSegmentConfig[],
  inventoryFactors: {
    enabled: false, // Healthcare doesn't typically use inventory pricing
    lowStockThreshold: 0,
    overstockThreshold: 0,
    expiryThresholds: [],
  },
  timeMultipliers: {
    dayOfWeek: {
      '0': 0.8, '1': 1.0, '2': 1.0, '3': 1.0,
      '4': 1.0, '5': 1.0, '6': 0.9,
    },
    hourOfDay: {
      '8': 0.9, '9': 1.0, '10': 1.1, '11': 1.2,
      '12': 1.0, '13': 0.8, '14': 0.9, '15': 1.0,
      '16': 1.1, '17': 1.3, '18': 1.4, '19': 1.2,
      '20': 0.9, '21': 0.7,
    },
    weekend: 0.9,
    holiday: 1.30,
  },
};

// ================== EDUCATION CONFIG ==================

export const educationConfig: VerticalConfig = {
  vertical: 'education',
  displayName: 'Education & Training',
  surge: {
    maxCap: 1.5,
    triggers: ['time', 'demand', 'seasonality'],
    floors: {
      offSeason: 0.85,
      regular: 1.0,
      intake: 1.20,
      exam: 1.15,
    },
  },
  cashback: [
    { segment: 'new', baseRate: 0.12, minRate: 0.08, maxRate: 0.18 },
    { segment: 'regular', baseRate: 0.05, minRate: 0.03, maxRate: 0.10 },
    { segment: 'vip', baseRate: 0.03, minRate: 0.02, maxRate: 0.05 },
    { segment: 'at_risk', baseRate: 0.10, minRate: 0.06, maxRate: 0.15 },
    { segment: 'dormant', baseRate: 0.08, minRate: 0.05, maxRate: 0.12 },
  ] as CashbackSegmentConfig[],
  inventoryFactors: {
    enabled: true,
    lowStockThreshold: 10,
    overstockThreshold: 80,
    expiryThresholds: [],
  },
  timeMultipliers: {
    dayOfWeek: {
      '0': 0.7, '1': 1.0, '2': 1.0, '3': 1.0,
      '4': 1.0, '5': 1.0, '6': 0.8,
    },
    hourOfDay: {
      '6': 0.5, '7': 0.7, '8': 0.9, '9': 1.0,
      '10': 1.1, '11': 1.0, '12': 0.8, '13': 0.9,
      '14': 1.0, '15': 1.1, '16': 1.0, '17': 0.9,
      '18': 1.2, '19': 1.4, '20': 1.3, '21': 1.0,
      '22': 0.7,
    },
    weekend: 0.8,
    holiday: 1.15,
  },
};

// ================== F&B (FOOD & BEVERAGE) CONFIG ==================

export const fnbConfig: VerticalConfig = {
  vertical: 'fnb',
  displayName: 'Food & Beverage',
  surge: {
    maxCap: 2.5,
    triggers: ['demand', 'time', 'weather', 'events'],
    floors: {
      morning: 0.9,
      lunch: 1.1,
      afternoon: 0.7,
      evening: 1.3,
      lateNight: 1.0,
    },
  },
  cashback: [
    { segment: 'new', baseRate: 0.18, minRate: 0.10, maxRate: 0.25 },
    { segment: 'regular', baseRate: 0.06, minRate: 0.03, maxRate: 0.12 },
    { segment: 'vip', baseRate: 0.03, minRate: 0.02, maxRate: 0.06 },
    { segment: 'at_risk', baseRate: 0.12, minRate: 0.08, maxRate: 0.20 },
    { segment: 'dormant', baseRate: 0.10, minRate: 0.05, maxRate: 0.15 },
  ] as CashbackSegmentConfig[],
  inventoryFactors: {
    enabled: true,
    lowStockThreshold: 20,
    overstockThreshold: 75,
    expiryThresholds: [1, 2, 3, 7],
  },
  timeMultipliers: {
    dayOfWeek: {
      '0': 1.10, '1': 0.85, '2': 0.90, '3': 0.95,
      '4': 1.05, '5': 1.15, '6': 1.20,
    },
    hourOfDay: {
      '6': 0.5, '7': 0.8, '8': 1.0, '9': 1.1,
      '10': 1.0, '11': 1.2, '12': 1.4, '13': 1.2,
      '14': 0.9, '15': 0.8, '16': 0.9, '17': 1.1,
      '18': 1.3, '19': 1.5, '20': 1.4, '21': 1.2,
      '22': 0.9, '23': 0.7, '0': 0.5, '1': 0.4,
      '2': 0.3, '3': 0.3, '4': 0.4, '5': 0.5,
    },
    weekend: 1.20,
    holiday: 1.30,
  },
};

// ================== GROCERY CONFIG ==================

export const groceryConfig: VerticalConfig = {
  vertical: 'grocery',
  displayName: 'Grocery & Essentials',
  surge: {
    maxCap: 1.8,
    triggers: ['demand', 'inventory', 'time', 'seasonality'],
    floors: {
      regular: 1.0,
      offPeak: 0.95,
      bulk: 0.9,
      urgent: 1.2,
    },
  },
  cashback: [
    { segment: 'new', baseRate: 0.10, minRate: 0.05, maxRate: 0.15 },
    { segment: 'regular', baseRate: 0.03, minRate: 0.01, maxRate: 0.06 },
    { segment: 'vip', baseRate: 0.02, minRate: 0.01, maxRate: 0.04 },
    { segment: 'at_risk', baseRate: 0.06, minRate: 0.03, maxRate: 0.10 },
    { segment: 'dormant', baseRate: 0.05, minRate: 0.02, maxRate: 0.08 },
  ] as CashbackSegmentConfig[],
  inventoryFactors: {
    enabled: true,
    lowStockThreshold: 15,
    overstockThreshold: 80,
    expiryThresholds: [3, 7, 14],
  },
  timeMultipliers: {
    dayOfWeek: {
      '0': 1.10, '1': 1.0, '2': 0.95, '3': 0.95,
      '4': 1.0, '5': 1.05, '6': 1.15,
    },
    hourOfDay: {
      '6': 0.3, '7': 0.5, '8': 0.8, '9': 1.0,
      '10': 1.1, '11': 1.2, '12': 1.1, '13': 1.0,
      '14': 0.95, '15': 1.0, '16': 1.1, '17': 1.3,
      '18': 1.4, '19': 1.3, '20': 1.0, '21': 0.7,
      '22': 0.5,
    },
    weekend: 1.15,
    holiday: 1.20,
  },
};

// ================== ALL EXTENDED VERTICALS MAP ==================

export const EXTENDED_VERTICAL_CONFIGS: Record<string, VerticalConfig> = {
  ecommerce: ecommerceConfig,
  travel: travelConfig,
  auto_rental: autoRentalConfig,
  entertainment: entertainmentConfig,
  healthcare: healthcareConfig,
  education: educationConfig,
  fnb: fnbConfig,
  grocery: groceryConfig,
};

// ================== VERTICAL DISPLAY INFO ==================

export interface VerticalDisplayInfo {
  vertical: string;
  displayName: string;
  icon: string;
  color: string;
  description: string;
}

export const VERTICAL_DISPLAY_INFO: VerticalDisplayInfo[] = [
  {
    vertical: 'restaurant',
    displayName: 'Restaurant',
    icon: '🍽️',
    color: '#f59e0b',
    description: 'Food service & dining',
  },
  {
    vertical: 'hotel',
    displayName: 'Hotel',
    icon: '🏨',
    color: '#6366f1',
    description: 'Accommodation & hospitality',
  },
  {
    vertical: 'salon',
    displayName: 'Salon & Spa',
    icon: '💇',
    color: '#ec4899',
    description: 'Beauty & wellness services',
  },
  {
    vertical: 'clinic',
    displayName: 'Clinic',
    icon: '🏥',
    color: '#22c55e',
    description: 'Medical & healthcare',
  },
  {
    vertical: 'gym',
    displayName: 'Gym & Fitness',
    icon: '💪',
    color: '#f97316',
    description: 'Fitness & health clubs',
  },
  {
    vertical: 'events',
    displayName: 'Events',
    icon: '🎭',
    color: '#8b5cf6',
    description: 'Concerts, shows & experiences',
  },
  {
    vertical: 'retail',
    displayName: 'Retail',
    icon: '🛍️',
    color: '#06b6d4',
    description: 'Brick & mortar stores',
  },
  {
    vertical: 'home_services',
    displayName: 'Home Services',
    icon: '🔧',
    color: '#84cc16',
    description: 'Plumber, electrician, cleaning',
  },
  {
    vertical: 'corp_perks',
    displayName: 'Corp Perks',
    icon: '💼',
    color: '#64748b',
    description: 'Corporate employee benefits',
  },
  {
    vertical: 'ecommerce',
    displayName: 'E-Commerce',
    icon: '📦',
    color: '#f43f5e',
    description: 'Online retail & marketplace',
  },
  {
    vertical: 'travel',
    displayName: 'Travel',
    icon: '✈️',
    color: '#0ea5e9',
    description: 'Flights, hotels, packages',
  },
  {
    vertical: 'auto_rental',
    displayName: 'Auto Rental',
    icon: '🚗',
    color: '#a855f7',
    description: 'Car & bike rentals',
  },
  {
    vertical: 'entertainment',
    displayName: 'Entertainment',
    icon: '🎬',
    color: '#d946ef',
    description: 'Movies, games, recreation',
  },
  {
    vertical: 'healthcare',
    displayName: 'Healthcare',
    icon: '🩺',
    color: '#14b8a6',
    description: 'Hospitals, diagnostics',
  },
  {
    vertical: 'education',
    displayName: 'Education',
    icon: '📚',
    color: '#f59e0b',
    description: 'Courses, tutoring, training',
  },
  {
    vertical: 'fnb',
    displayName: 'Food & Beverage',
    icon: '☕',
    color: '#ef4444',
    description: 'Cafes, QSR, delivery',
  },
  {
    vertical: 'grocery',
    displayName: 'Grocery',
    icon: '🛒',
    color: '#22c55e',
    description: 'Supermarkets, kirana',
  },
];
