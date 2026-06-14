import { z } from 'zod';

// Contact Schema
export const ContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
});

// Publisher Settings Schema
export const PublisherSettingsSchema = z.object({
  adFormats: z.array(z.enum(['banner', 'rectangle', 'native', 'video', 'interstitial'])),
  minCPM: z.number().min(0).default(1.0),
  headerBidding: z.boolean().default(false),
});

// Publisher Stats Schema
export const PublisherStatsSchema = z.object({
  totalImpressions: z.number().int().min(0).default(0),
  totalClicks: z.number().int().min(0).default(0),
  totalEarnings: z.number().min(0).default(0),
  pendingPayout: z.number().min(0).default(0),
});

// Publisher Schema
export const PublisherSchema = z.object({
  publisherId: z.string().uuid(),
  name: z.string().min(1).max(200),
  website: z.string().url(),
  category: z.enum([
    'news',
    'blog',
    'entertainment',
    'ecommerce',
    'social',
    'gaming',
    'education',
    'tech',
    'lifestyle',
    'finance',
    'sports',
    'travel',
    'food',
    'health',
    'other'
  ]),
  contact: ContactSchema,
  settings: PublisherSettingsSchema,
  stats: PublisherStatsSchema,
  status: z.enum(['active', 'pending', 'suspended']).default('pending'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Placement Schema
export const PlacementSchema = z.object({
  placementId: z.string().uuid(),
  publisherId: z.string().uuid(),
  name: z.string().min(1).max(100),
  pageUrl: z.string().url(),
  adFormats: z.array(z.enum(['banner', 'rectangle', 'native', 'video', 'interstitial'])),
  size: z.object({
    width: z.number().int().min(1).max(2000),
    height: z.number().int().min(1).max(2000),
  }),
  position: z.enum(['header', 'sidebar', 'content', 'footer', 'interstitial']),
  minCPM: z.number().min(0).default(1.0),
  status: z.enum(['active', 'paused', 'archived']).default('active'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Impression Event Schema
export const ImpressionEventSchema = z.object({
  eventId: z.string().uuid(),
  placementId: z.string().uuid(),
  publisherId: z.string().uuid(),
  adId: z.string().optional(),
  timestamp: z.date().default(() => new Date()),
  metadata: z.object({
    country: z.string().optional(),
    device: z.enum(['desktop', 'mobile', 'tablet']).optional(),
    browser: z.string().optional(),
    os: z.string().optional(),
    referrer: z.string().optional(),
  }).optional(),
});

// Click Event Schema
export const ClickEventSchema = z.object({
  eventId: z.string().uuid(),
  impressionId: z.string().uuid(),
  placementId: z.string().uuid(),
  publisherId: z.string().uuid(),
  adId: z.string().optional(),
  timestamp: z.date().default(() => new Date()),
  metadata: z.object({
    country: z.string().optional(),
    device: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  }).optional(),
});

// SDK Config Schema
export const SDKConfigSchema = z.object({
  publisherId: z.string().uuid(),
  apiKey: z.string(),
  adFormats: z.array(z.string()),
  headerBidding: z.boolean(),
  minCPM: z.number(),
  refreshInterval: z.number().int().min(10000).max(300000).default(60000),
  debug: z.boolean().default(false),
});

// Type exports
export type Contact = z.infer<typeof ContactSchema>;
export type PublisherSettings = z.infer<typeof PublisherSettingsSchema>;
export type PublisherStats = z.infer<typeof PublisherStatsSchema>;
export type Publisher = z.infer<typeof PublisherSchema>;
export type Placement = z.infer<typeof PlacementSchema>;
export type ImpressionEvent = z.infer<typeof ImpressionEventSchema>;
export type ClickEvent = z.infer<typeof ClickEventSchema>;
export type SDKConfig = z.infer<typeof SDKConfigSchema>;

// Request types
export interface RegisterPublisherRequest {
  name: string;
  website: string;
  category: string;
  contact: Contact;
  settings?: Partial<PublisherSettings>;
}

export interface CreatePublisherRequest {
  name: string;
  website: string;
  category: string;
  contact: Contact;
  settings?: Partial<PublisherSettings>;
  status?: 'active' | 'pending' | 'suspended';
}

export interface TrackImpressionRequest {
  placementId: string;
  adId?: string;
  metadata?: ImpressionEvent['metadata'];
}

export interface TrackClickRequest {
  impressionId: string;
  placementId: string;
  adId?: string;
  metadata?: ClickEvent['metadata'];
}

export interface CreatePlacementRequest {
  publisherId: string;
  name: string;
  pageUrl: string;
  adFormats: string[];
  size: { width: number; height: number };
  position: string;
  minCPM?: number;
}

// Response types
export interface EarningsResponse {
  publisherId: string;
  totalEarnings: number;
  pendingPayout: number;
  paidOut: number;
  impressions: number;
  clicks: number;
  ctr: number;
  avgCPM: number;
  lastUpdated: Date;
}

export interface SDKConfigResponse {
  config: SDKConfig;
  baseUrl: string;
 version: string;
}
