/**
 * Unified Campaign Service - Type Definitions
 *
 * Core types for cross-platform campaign orchestration.
 */

import { TenantContext, InventoryCategory, Platform } from '@rez/tenant-middleware';

// ============================================================================
// CAMPAIGN TYPES
// ============================================================================

/**
 * Campaign status
 */
export enum CampaignStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

/**
 * Campaign type/objective
 */
export enum CampaignType {
  AWARENESS = 'awareness',
  CONSIDERATION = 'consideration',
  CONVERSION = 'conversion',
  LOYALTY = 'loyalty',
  RE_ENGAGEMENT = 're_engagement',
}

/**
 * Campaign priority
 */
export enum CampaignPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

// ============================================================================
// BUDGET TYPES
// ============================================================================

/**
 * Budget allocation model
 */
export enum BudgetModel {
  DAILY = 'daily',
  TOTAL = 'total',
  UNLIMITED = 'unlimited',
}

/**
 * Budget allocation for platform
 */
export interface PlatformBudget {
  platform: Platform;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

/**
 * Complete budget configuration
 */
export interface BudgetConfig {
  totalBudget: number;
  totalSpent: number;
  model: BudgetModel;
  dailyLimit?: number;
  allocation: PlatformBudget[];
  currency: 'INR';
  minBudget: number;
  maxBudget?: number;
}

// ============================================================================
// TARGETING TYPES
// ============================================================================

/**
 * Geographic targeting
 */
export interface GeoTargeting {
  countries?: string[];
  states?: string[];
  cities?: string[];
  areas?: string[]; // Neighborhoods, localities
  radius?: {
    lat: number;
    lng: number;
    radiusKm: number;
  }[];
  postalCodes?: string[];
}

/**
 * Demographic targeting
 */
export interface DemographicTargeting {
  ageRange?: {
    min: number;
    max: number;
  };
  genders?: ('male' | 'female' | 'other')[];
  interests?: string[];
  occupations?: string[];
  incomeBrackets?: ('low' | 'middle' | 'high' | 'affluent')[];
}

/**
 * Behavioral targeting
 */
export interface BehavioralTargeting {
  purchaseFrequency?: ('low' | 'medium' | 'high' | 'vip')[];
  categories?: string[];
  brands?: string[];
  lastPurchaseDays?: number;
  abandonedCarts?: boolean;
  loyaltyTiers?: ('L1' | 'L2' | 'L3' | 'L4')[];
}

/**
 * Device targeting
 */
export interface DeviceTargeting {
  platforms?: ('ios' | 'android' | 'web' | 'desktop')[];
  connectionTypes?: ('wifi' | 'cellular' | 'any')[];
}

/**
 * Time targeting
 */
export interface TimeTargeting {
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  hoursOfDay?: {
    start: number; // 0-23
    end: number; // 0-23
  }[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Complete targeting configuration
 */
export interface TargetingConfig {
  geo: GeoTargeting;
  demographic: DemographicTargeting;
  behavioral: BehavioralTargeting;
  device: DeviceTargeting;
  time: TimeTargeting;
  // Custom audience segments
  customSegments?: string[];
  // Lookalike audiences
  lookalikeOf?: string;
  lookalikeSimilarity?: number; // 1-10
}

// ============================================================================
// SCHEDULING TYPES
// ============================================================================

/**
 * Schedule configuration
 */
export interface ScheduleConfig {
  startDate: Date;
  endDate?: Date;
  timezone: string;
  allDay: boolean;
  slots?: {
    start: string; // HH:mm
    end: string; // HH:mm
  }[];
  frequencyCap?: {
    impressions: number;
    perHours: number;
  };
}

// ============================================================================
// CREATIVE TYPES
// ============================================================================

/**
 * Ad creative
 */
export interface AdCreative {
  id: string;
  type: 'image' | 'video' | 'carousel' | 'text' | 'interactive';
  assets: {
    url: string;
    type: 'image' | 'video' | 'audio';
    alt?: string;
    mimeType: string;
    size?: {
      width: number;
      height: number;
    };
  }[];
  headline?: string;
  description?: string;
  callToAction?: string;
  trackingUrl?: string;
}

/**
 * Creative rotation
 */
export enum CreativeRotation {
  SEQUENTIAL = 'sequential',
  RANDOM = 'random',
  WEIGHTED = 'weighted',
  BEST_PERFORMING = 'best_performing',
}

/**
 * Creative configuration
 */
export interface CreativeConfig {
  primary: AdCreative;
  variations: AdCreative[];
  rotation: CreativeRotation;
}

// ============================================================================
// CAMPAIGN MODEL
// ============================================================================

/**
 * Unified campaign
 */
export interface UnifiedCampaign {
  // Core
  id: string;
  tenantId: string;
  tenantType: 'rez_internal' | 'external';

  // Identity
  name: string;
  description?: string;
  objective: CampaignType;

  // Status
  status: CampaignStatus;
  priority: CampaignPriority;

  // Inventory
  inventory: {
    categories: InventoryCategory[];
    platforms: Platform[];
  };

  // Configuration
  budget: BudgetConfig;
  targeting: TargetingConfig;
  schedule: ScheduleConfig;
  creative: CreativeConfig;

  // Attribution
  attribution: {
    window: number; // Days
    model: 'first_click' | 'last_click' | 'linear' | 'time_decay' | 'position_based';
    trackVisits: boolean;
    trackConversions: boolean;
    trackWallet: boolean; // Only for internal tenants
  };

  // Metrics
  metrics: {
    impressions: number;
    uniqueImpressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    conversionRate: number;
    spend: number;
    cpm: number;
    cpc: number;
    cpa: number;
    roas: number;
    visits?: number; // Physical visits
    walletCredits?: number; // Coins earned
  };

  // Optimization
  optimization: {
    autoOptimize: boolean;
    bidStrategy: 'lowest_cost' | 'target_cost' | 'highest_volume';
    targetCpa?: number;
    targetRoi?: number;
  };

  // Metadata
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;
}

// ============================================================================
// CAMPAIGN REQUESTS
// ============================================================================

/**
 * Create campaign request
 */
export interface CreateCampaignRequest {
  name: string;
  description?: string;
  objective: CampaignType;
  inventory: {
    categories: InventoryCategory[];
    platforms: Platform[];
  };
  budget: {
    totalBudget: number;
    model: BudgetModel;
    dailyLimit?: number;
    allocation?: Partial<Record<Platform, number>>;
  };
  targeting: Partial<TargetingConfig>;
  schedule: Partial<ScheduleConfig>;
  creative: CreativeConfig;
  attribution?: Partial<UnifiedCampaign['attribution']>;
  optimization?: Partial<UnifiedCampaign['optimization']>;
}

/**
 * Update campaign request
 */
export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  status?: CampaignStatus;
  priority?: CampaignPriority;
  budget?: Partial<BudgetConfig>;
  targeting?: Partial<TargetingConfig>;
  schedule?: Partial<ScheduleConfig>;
  creative?: Partial<CreativeConfig>;
  optimization?: Partial<UnifiedCampaign['optimization']>;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Campaign list response
 */
export interface CampaignListResponse {
  campaigns: UnifiedCampaign[];
  total: number;
  page: number;
  limit: number;
  filters: {
    status?: CampaignStatus[];
    type?: CampaignType[];
    inventory?: InventoryCategory[];
    platform?: Platform[];
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
}

/**
 * Campaign metrics response
 */
export interface CampaignMetricsResponse {
  campaignId: string;
  metrics: UnifiedCampaign['metrics'];
  platformMetrics: {
    platform: Platform;
    metrics: PlatformBudget;
  }[];
  trend: {
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
  }[];
}

// ============================================================================
// INVENTORY TYPES
// ============================================================================

/**
 * Available inventory for targeting preview
 */
export interface AvailableInventory {
  platform: Platform;
  category: InventoryCategory;
  name: string;
  description: string;
  estimatedReach: number;
  estimatedCpm: number;
  available: boolean;
  minBudget: number;
}

// ============================================================================
// AUDIENCE TYPES
// ============================================================================

/**
 * Audience segment
 */
export interface AudienceSegment {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  size: number;
  targeting: TargetingConfig;
  isPublic: boolean; // External tenants can only use public segments
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Audience estimate
 */
export interface AudienceEstimate {
  total: number;
  byPlatform: Record<Platform, number>;
  byDemographic: {
    age: Record<string, number>;
    gender: Record<string, number>;
  };
  byBehavior: {
    category: Record<string, number>;
    loyalty: Record<string, number>;
  };
}
