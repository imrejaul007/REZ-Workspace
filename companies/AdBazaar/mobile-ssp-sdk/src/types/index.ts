// Platform types
export type Platform = 'ios' | 'android' | 'react-native' | 'flutter';
export type PublisherStatus = 'active' | 'pending' | 'suspended';
export type AppStatus = 'active' | 'pending' | 'suspended';
export type AdFormat = 'banner' | 'interstitial' | 'native' | 'rewarded' | 'app-open';
export type AdRequestStatus = 'pending' | 'filled' | 'no-fill' | 'expired';
export type AdType = 'display' | 'video' | 'native' | 'rich-media';

// SDK Configuration
export interface SDKConfig {
  appId: string;
  publisherId: string;
  platform: Platform;
  adFormats: AdFormat[];
  ecpm: number;
  refreshInterval: number;
  timeout: number;
  retryAttempts: number;
  testMode: boolean;
  consentRequired: boolean;
  gdprEnabled: boolean;
  coppaEnabled: boolean;
  customParameters: Record<string, string>;
}

// App Publisher
export interface App {
  appId: string;
  name: string;
  platform: Platform;
  bundleId: string;
  category: string;
  status: AppStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublisherSettings {
  adFormats: AdFormat[];
  minCPM: number;
  autoRefresh: boolean;
  testMode: boolean;
}

export interface PublisherStats {
  totalImpressions: number;
  totalClicks: number;
  totalEarnings: number;
  todayImpressions: number;
  todayClicks: number;
  todayEarnings: number;
  yesterdayImpressions: number;
  yesterdayClicks: number;
  yesterdayEarnings: number;
}

export interface AppPublisher {
  publisherId: string;
  name: string;
  email: string;
  company?: string;
  apps: App[];
  settings: PublisherSettings;
  stats: PublisherStats;
  status: PublisherStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Placement
export interface Placement {
  placementId: string;
  appId: string;
  name: string;
  adFormat: AdFormat;
  width?: number;
  height?: number;
  position: 'top' | 'bottom' | 'center' | 'interstitial';
  refreshInterval: number;
  ecpm: number;
  status: 'active' | 'paused' | 'disabled';
  targeting?: PlacementTargeting;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlacementTargeting {
  countries?: string[];
  excludedCountries?: string[];
  devices?: string[];
  osVersions?: string[];
  demographics?: {
    ageMin?: number;
    ageMax?: number;
    gender?: 'male' | 'female' | 'other';
  };
}

// Ad Request
export interface AdRequest {
  requestId: string;
  placementId: string;
  appId: string;
  publisherId: string;
  platform: Platform;
  adFormat: AdFormat;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  language: string;
  country: string;
  timestamp: Date;
  status: AdRequestStatus;
  responseTime?: number;
  filledAt?: Date;
  noFillReason?: string;
}

export interface AdRequestInput {
  placementId: string;
  appId: string;
  publisherId: string;
  platform: Platform;
  adFormat: AdFormat;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  language: string;
  country: string;
  keywords?: string[];
  demographics?: {
    age?: number;
    gender?: 'male' | 'female' | 'other';
  };
}

// Ad Response
export interface AdResponse {
  requestId: string;
  adId: string;
  adType: AdType;
  adFormat: AdFormat;
  creativeUrl: string;
  clickUrl: string;
  impressionUrl: string;
  width?: number;
  height?: number;
  duration?: number;
  skipable?: boolean;
  vpaid?: boolean;
  ecpm: number;
  currency: string;
  fallback: boolean;
}

// Impression
export interface Impression {
  impressionId: string;
  requestId: string;
  adId: string;
  placementId: string;
  appId: string;
  publisherId: string;
  timestamp: Date;
  viewable: boolean;
  viewableTime?: number;
}

// Click
export interface Click {
  clickId: string;
  impressionId: string;
  requestId: string;
  adId: string;
  placementId: string;
  appId: string;
  publisherId: string;
  timestamp: Date;
  deviceType: string;
}

// Earnings
export interface EarningsRecord {
  date: string;
  impressions: number;
  clicks: number;
  ecpm: number;
  earnings: number;
}

export interface PublisherEarnings {
  publisherId: string;
  period: {
    start: Date;
    end: Date;
  };
  totalEarnings: number;
  totalImpressions: number;
  totalClicks: number;
  averageECPM: number;
  breakdown: EarningsRecord[];
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface JWTPayload {
  publisherId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthContext {
  publisherId: string;
  email: string;
}