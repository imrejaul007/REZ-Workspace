/**
 * Application Domain Types for Programmatic TV Service
 */

import { DealType, DealStatus, CTVDeviceCategory } from './openrtb.js';

// Private Deal Model
export interface PrivateDeal {
  dealId: string;
  name: string;
  description?: string;
  advertiserId: string;
  advertiserName?: string;
  publisherId: string;
  publisherName?: string;
  type: DealType;
  floorPrice: number;
  priceCurrency: string;
  targeting: DealTargeting;
  startDate: Date;
  endDate: Date;
  status: DealStatus;
  priority?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  impressionsLimit?: number;
  impressionsDelivered?: number;
  budgetLimit?: number;
  budgetSpent?: number;
  dealAttributes?: Record<string, unknown>;
}

// Deal Targeting
export interface DealTargeting {
  geo?: string[];
  deviceTypes?: CTVDeviceCategory[];
  contentCategories?: string[];
  deviceMakes?: string[];
  deviceModels?: string[];
  operatingSystems?: string[];
  userAgeGroups?: number[];
  userGenders?: string[];
  dayParts?: DayPart[];
  inventorySources?: string[];
}

// Day Part for targeting
export interface DayPart {
  daysOfWeek: number[];
  startHour: number;
  endHour: number;
  timezone?: string;
}

// Bidder Seat Model
export interface BidderSeat {
  seatId: string;
  name: string;
  advertiserId: string;
  organizationName?: string;
  contactEmail: string;
  status: 'active' | 'suspended' | 'inactive';
  allowedFormats: string[];
  allowedCategories: string[];
  bidLimits?: BidLimits;
  sspConnections: string[];
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt?: Date;
  metadata?: Record<string, unknown>;
}

// Bid Limits
export interface BidLimits {
  dailyBudget?: number;
  monthlyBudget?: number;
  perBidMax?: number;
  dailyImpressions?: number;
}

// Floor Price Rule
export interface FloorPriceRule {
  ruleId: string;
  name: string;
  description?: string;
  priority: number;
  conditions: FloorConditions;
  floorPrice: number;
  currency: string;
  status: 'active' | 'paused' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Floor Conditions
export interface FloorConditions {
  geo?: string[];
  deviceTypes?: CTVDeviceCategory[];
  contentCategories?: string[];
  appBundles?: string[];
  formats?: string[];
  connectionTypes?: number[];
  timeOfDay?: {
    startHour: number;
    endHour: number;
    daysOfWeek?: number[];
  };
  dealTypes?: DealType[];
}

// Deal Statistics
export interface DealStats {
  dealId: string;
  date: Date;
  impressionsOffered: number;
  impressionsWon: number;
  winRate: number;
  averageCpm: number;
  totalSpend: number;
  revenue: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
  requestId?: string;
}

// List Response
export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Filter Options
export interface DealFilter {
  status?: DealStatus;
  type?: DealType;
  advertiserId?: string;
  publisherId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface SeatFilter {
  status?: 'active' | 'suspended' | 'inactive';
  advertiserId?: string;
  search?: string;
}

export interface FloorFilter {
  status?: 'active' | 'paused' | 'deleted';
  geo?: string;
  deviceType?: CTVDeviceCategory;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Health Check
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: {
    mongodb: ServiceHealth;
    redis: ServiceHealth;
  };
  version: string;
}

export interface ServiceHealth {
  status: 'up' | 'down';
  latency?: number;
  error?: string;
}
