/**
 * Channel Integration Service - Configuration
 */

export interface ChannelConfig {
  id: string;
  name: string;
  commissionRate: number;
  apiType: 'xml' | 'rest' | 'graphql';
  baseUrl: string;
  requiresCredentials: boolean;
}

export interface AppConfig {
  port: number;
  environment: 'development' | 'production' | 'test';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Supported channel configurations
export const CHANNEL_CONFIGS: Record<string, ChannelConfig> = {
  booking_com: {
    id: 'booking_com',
    name: 'Booking.com',
    commissionRate: 0.15,
    apiType: 'xml',
    baseUrl: 'https://supply-xml.booking.com',
    requiresCredentials: true,
  },
  makemytrip: {
    id: 'makemytrip',
    name: 'MakeMyTrip',
    commissionRate: 0.15,
    apiType: 'rest',
    baseUrl: 'https://api.makemytrip.com',
    requiresCredentials: true,
  },
  goibibo: {
    id: 'goibibo',
    name: 'Goibibo',
    commissionRate: 0.15,
    apiType: 'rest',
    baseUrl: 'https://api.goibibo.com',
    requiresCredentials: true,
  },
  expedia: {
    id: 'expedia',
    name: 'Expedia',
    commissionRate: 0.12,
    apiType: 'rest',
    baseUrl: 'https://api.expedia.com',
    requiresCredentials: true,
  },
  airbnb: {
    id: 'airbnb',
    name: 'Airbnb',
    commissionRate: 0.0, // Airbnb charges hosts separately
    apiType: 'rest',
    baseUrl: 'https://api.airbnb.com',
    requiresCredentials: true,
  },
  google_hotel: {
    id: 'google_hotel',
    name: 'Google Hotel Center',
    commissionRate: 0.0,
    apiType: 'rest',
    baseUrl: 'https://HotelCenter.googleapis.com',
    requiresCredentials: true,
  },
};

// Default app configuration
export const DEFAULT_CONFIG: AppConfig = {
  port: parseInt(process.env.PORT || '4055', 10),
  environment: (process.env.NODE_ENV as AppConfig['environment']) || 'development',
  logLevel: (process.env.LOG_LEVEL as AppConfig['logLevel']) || 'info',
};

// Sync configuration
export const SYNC_CONFIG = {
  maxRetries: 3,
  retryDelayMs: 5000,
  batchSize: 100,
  timeoutMs: 30000,
};

export default { CHANNEL_CONFIGS, DEFAULT_CONFIG, SYNC_CONFIG };
