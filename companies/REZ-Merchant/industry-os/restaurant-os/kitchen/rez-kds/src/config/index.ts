import { z } from 'zod';

// Station types enum
export const StationType = {
  GRILL: 'grill',
  FRYER: 'fryer',
  SALAD: 'salad',
  DESSERT: 'dessert',
  EXPO: 'expo',
  BEVERAGE: 'beverage',
  PREP: 'prep'
} as const;

export type StationType = typeof StationType[keyof typeof StationType];

// Order status enum
export const OrderStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

// Priority levels
export const PriorityLevel = {
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
  URGENT: 4,
  RUSH: 5
} as const;

export type PriorityLevel = typeof PriorityLevel[keyof typeof PriorityLevel];

// Timing thresholds in seconds
export const TimingThresholds = {
  OK: 300,        // 5 minutes - OK
  WARNING: 600,   // 10 minutes - warning
  CRITICAL: 900,  // 15 minutes - critical
  OVERDUE: 1200   // 20 minutes - overdue
} as const;

// Item routing rules - which station handles which item types
export const ItemStationMapping: Record<string, StationType[]> = {
  burger: [StationType.GRILL],
  steak: [StationType.GRILL],
  chicken: [StationType.GRILL],
  fries: [StationType.FRYER],
  wings: [StationType.FRYER],
  onion_rings: [StationType.FRYER],
  salad: [StationType.SALAD],
  soup: [StationType.SALAD],
  cake: [StationType.DESSERT],
  ice_cream: [StationType.DESSERT],
  beverage: [StationType.BEVERAGE],
  coffee: [StationType.BEVERAGE]
} as const;

// Audio alert configuration
export const AudioAlerts = {
  NEW_ORDER: 'new_order',
  PRIORITY: 'priority',
  OVERDUE: 'overdue',
  READY: 'ready',
  RUSH: 'rush'
} as const;

// Configuration schema for validation
export const KDSConfigSchema = z.object({
  port: z.number().default(4006),
  mongoUri: z.string(),
  redisUrl: z.string().default('redis://localhost:6379'),
  timingThresholds: z.object({
    ok: z.number().default(300),
    warning: z.number().default(600),
    critical: z.number().default(900),
    overdue: z.number().default(1200)
  }).optional(),
  audioEnabled: z.boolean().default(true),
  internalServiceToken: z.string()
});

export type KDSConfig = z.infer<typeof KDSConfigSchema>;

// Default configuration
export const defaultConfig: KDSConfig = {
  port: 4006,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-kds',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  audioEnabled: process.env.AUDIO_ENABLED === 'true',
  internalServiceToken: ''
};
