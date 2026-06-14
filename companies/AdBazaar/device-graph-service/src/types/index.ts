import { z } from 'zod';

// Device Types
export const DeviceTypeSchema = z.enum([
  'mobile',
  'tablet',
  'desktop',
  'smart_tv',
  'smart_watch',
  'iot',
  'other'
]);

export const PlatformSchema = z.enum([
  'ios',
  'android',
  'windows',
  'macos',
  'linux',
  'web',
  'tvos',
  'other'
]);

// Device Schema
export const DeviceSchema = z.object({
  deviceId: z.string().min(1),
  type: DeviceTypeSchema,
  platform: PlatformSchema,
  userId: z.string().optional(),
  householdId: z.string().optional(),
  identifiers: z.object({
    idfa: z.string().optional(),
    gaid: z.string().optional(),
    androidId: z.string().optional(),
    cookieId: z.string().optional(),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
  }).optional(),
  attributes: z.object({
    screenWidth: z.number().optional(),
    screenHeight: z.number().optional(),
    browser: z.string().optional(),
    osVersion: z.string().optional(),
    appVersion: z.string().optional(),
    manufacturer: z.string().optional(),
    model: z.string().optional(),
  }).optional(),
  firstSeen: z.date().optional(),
  lastSeen: z.date().optional(),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
});

export type DeviceType = z.infer<typeof DeviceTypeSchema>;
export type Platform = z.infer<typeof PlatformSchema>;
export type DeviceInput = z.infer<typeof DeviceSchema>;

// Device Link Schema
export const DeviceLinkSchema = z.object({
  deviceIds: z.array(z.string()).min(2).max(2),
  confidence: z.number().min(0).max(1),
  method: z.enum(['ip', 'wifi', 'cookie', 'login', 'fingerprint', 'behavioral', 'household', 'inferred']),
  evidence: z.object({
    sharedIp: z.boolean().optional(),
    sharedWifi: z.boolean().optional(),
    sharedCookie: z.boolean().optional(),
    loginTimestamp: z.date().optional(),
    fingerprintScore: z.number().optional(),
    behavioralScore: z.number().optional(),
  }).optional(),
  userId: z.string().optional(),
  householdId: z.string().optional(),
  expiresAt: z.date().optional(),
});

export type DeviceLinkInput = z.infer<typeof DeviceLinkSchema>;

// Household Schema
export const HouseholdSchema = z.object({
  householdId: z.string().min(1),
  name: z.string().optional(),
  devices: z.array(z.string()).default([]),
  members: z.array(z.object({
    userId: z.string(),
    role: z.enum(['owner', 'member', 'guest']).default('member'),
    joinedAt: z.date(),
  })).default([]),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional(),
  attributes: z.record(z.any()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type HouseholdInput = z.infer<typeof HouseholdSchema>;

// Device Graph Schema
export const DeviceGraphSchema = z.object({
  userId: z.string().min(1),
  nodes: z.array(z.object({
    id: z.string(),
    type: z.enum(['device', 'user', 'household']),
    attributes: z.record(z.any()).optional(),
  })).default([]),
  edges: z.array(z.object({
    source: z.string(),
    target: z.string(),
    type: z.enum(['links_to', 'belongs_to', 'shared_with']),
    weight: z.number().min(0).max(1).default(1),
    metadata: z.record(z.any()).optional(),
  })).default([]),
  lastUpdated: z.date().optional(),
});

export type DeviceGraphInput = z.infer<typeof DeviceGraphSchema>;

// API Request/Response Types
export interface RegisterDeviceRequest {
  deviceId: string;
  type: DeviceType;
  platform: Platform;
  userId?: string;
  identifiers?: {
    idfa?: string;
    gaid?: string;
    androidId?: string;
    cookieId?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  attributes?: {
    screenWidth?: number;
    screenHeight?: number;
    browser?: string;
    osVersion?: string;
    appVersion?: string;
    manufacturer?: string;
    model?: string;
  };
  tags?: string[];
}

export interface LinkDevicesRequest {
  deviceIds: [string, string];
  confidence: number;
  method: 'ip' | 'wifi' | 'cookie' | 'login' | 'fingerprint' | 'behavioral' | 'household' | 'inferred';
  evidence?: {
    sharedIp?: boolean;
    sharedWifi?: boolean;
    sharedCookie?: boolean;
    loginTimestamp?: Date;
    fingerprintScore?: number;
    behavioralScore?: number;
  };
  userId?: string;
  householdId?: string;
  expiresAt?: Date;
}

export interface ResolveUserRequest {
  deviceId: string;
  identifiers?: {
    idfa?: string;
    gaid?: string;
    androidId?: string;
    cookieId?: string;
    ipAddress?: string;
  };
}

export interface BatchDeviceRequest {
  devices: RegisterDeviceRequest[];
  linkPairs?: Array<{
    deviceIds: [string, string];
    confidence: number;
    method: string;
  }>;
}

export interface DeviceStats {
  totalDevices: number;
  activeDevices: number;
  devicesByType: Record<DeviceType, number>;
  devicesByPlatform: Record<Platform, number>;
  linkedDevices: number;
  households: number;
  averageLinksPerDevice: number;
}
