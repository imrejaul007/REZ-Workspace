/**
 * AdBazaar Multi-Tenant Middleware - Type Definitions
 *
 * This module defines all types for multi-tenant support in AdBazaar.
 *
 * Two tenant types:
 * - REZ_INTERNAL: Privileged internal clients (ReZ App, ReZ Ride, Airzy, StayOwn, etc.)
 * - EXTERNAL: Standard marketplace clients (restaurants, retailers, brands, etc.)
 */

// ============================================================================
// TENANT TYPES
// ============================================================================

/**
 * Tenant type classification
 * - REZ_INTERNAL: Internal REZ ecosystem clients with privileged access
 * - EXTERNAL: External marketplace clients with standard access
 */
export enum TenantType {
  REZ_INTERNAL = 'rez_internal',
  EXTERNAL = 'external',
}

/**
 * Tenant tier for rate limiting and feature access
 */
export enum TenantTier {
  // REZ Internal tiers
  REZ_TIER_0 = 'rez_tier_0', // Core REZ apps (ReZ App, ReZ Ride)

  // External tiers
  EXTERNAL_TIER_0 = 'external_tier_0', // Enterprise clients
  EXTERNAL_TIER_1 = 'external_tier_1', // Standard clients
  EXTERNAL_TIER_2 = 'external_tier_2', // Free/Startup clients
}

// ============================================================================
// INVENTORY CATEGORIES
// ============================================================================

/**
 * Inventory classification for access control
 * Internal inventory is only accessible to REZ_INTERNAL tenants
 */
export enum InventoryCategory {
  // === REZ INTERNAL INVENTORY (REZ_INTERNAL tenants only) ===

  /** ReZ App home feed placements */
  REZ_APP_HOME_FEED = 'rez_app_home_feed',

  /** ReZ App recommendation engine placements */
  REZ_APP_RECOMMENDATION = 'rez_app_recommendation',

  /** ReZ Ride in-app placements */
  REZ_RIDE_INAPP = 'rez_ride_inapp',

  /** ReZ Ride external screens */
  REZ_RIDE_EXTERNAL = 'rez_ride_external',

  /** Airzy traveler-specific placements */
  AIRZY_TRAVELER = 'airzy_traveler',

  /** Airzy lounge/premium placements */
  AIRZY_LOUNGE = 'airzy_lounge',

  /** StayOwn guest room placements */
  STAYOWN_GUEST = 'stayown_guest',

  /** StayOwn lobby/common area placements */
  STAYOWN_LOBBY = 'stayown_lobby',

  /** CorpPerks employee targeting */
  CORPPERKS_EMPLOYEE = 'corpperks_employee',

  /** BuzzLocal community screens */
  BUZZLOCAL_COMMUNITY = 'buzzlocal_community',

  /** REZ Now merchant placements */
  REZNOW_MERCHANT = 'reznow_merchant',

  /** RisaCare health ecosystem */
  RISACARE_HEALTH = 'risacare_health',

  /** Karma loyalty placements */
  KARMA_LOYALTY = 'karma_loyalty',

  /** Internal loyalty/wallet placements */
  REZ_WALLET_PLACEMENT = 'rez_wallet_placement',

  // === MARKETPLACE INVENTORY (All tenants) ===

  /** Public DOOH screens (mall, transit, billboard) */
  DOOH_PUBLIC = 'dooh_public',

  /** Public QR campaigns */
  QR_PUBLIC = 'qr_public',

  /** Creator/influencer inventory */
  CREATOR_PUBLIC = 'creator_public',

  /** WhatsApp commerce placements */
  WHATSAPP_PUBLIC = 'whatsapp_public',

  /** Event inventory */
  EVENT_PUBLIC = 'event_public',

  /** BuzzLocal public community screens */
  BUZZLOCAL_PUBLIC = 'buzzlocal_public',

  /** Society/apartment screen inventory */
  SOCIETY_PUBLIC = 'society_public',

  /** Hotel/restaurant displays */
  HOSPITALITY_PUBLIC = 'hospitality_public',

  /** Retail shelf displays */
  RETAIL_PUBLIC = 'retail_public',
}

/**
 * Platform types for campaign execution
 */
export enum Platform {
  DOOH = 'dooh',
  QR = 'qr',
  WHATSAPP = 'whatsapp',
  CREATOR = 'creator',
  APP = 'app',
  EVENT = 'event',
  HOSPITALITY = 'hospitality',
}

/**
 * Map inventory categories to their platforms
 */
export const INVENTORY_TO_PLATFORM: Record<InventoryCategory, Platform> = {
  // Internal → APP
  [InventoryCategory.REZ_APP_HOME_FEED]: Platform.APP,
  [InventoryCategory.REZ_APP_RECOMMENDATION]: Platform.APP,
  [InventoryCategory.REZ_RIDE_INAPP]: Platform.APP,
  [InventoryCategory.REZ_RIDE_EXTERNAL]: Platform.DOOH,
  [InventoryCategory.REZ_WALLET_PLACEMENT]: Platform.APP,

  // Internal → HOSPITALITY
  [InventoryCategory.AIRZY_TRAVELER]: Platform.HOSPITALITY,
  [InventoryCategory.AIRZY_LOUNGE]: Platform.HOSPITALITY,
  [InventoryCategory.STAYOWN_GUEST]: Platform.HOSPITALITY,
  [InventoryCategory.STAYOWN_LOBBY]: Platform.HOSPITALITY,

  // Internal → COMMUNITY
  [InventoryCategory.BUZZLOCAL_COMMUNITY]: Platform.DOOH,
  [InventoryCategory.BUZZLOCAL_PUBLIC]: Platform.DOOH,
  [InventoryCategory.CORPPERKS_EMPLOYEE]: Platform.APP,
  [InventoryCategory.REZNOW_MERCHANT]: Platform.QR,
  [InventoryCategory.RISACARE_HEALTH]: Platform.APP,
  [InventoryCategory.KARMA_LOYALTY]: Platform.APP,

  // Public
  [InventoryCategory.DOOH_PUBLIC]: Platform.DOOH,
  [InventoryCategory.QR_PUBLIC]: Platform.QR,
  [InventoryCategory.CREATOR_PUBLIC]: Platform.CREATOR,
  [InventoryCategory.WHATSAPP_PUBLIC]: Platform.WHATSAPP,
  [InventoryCategory.EVENT_PUBLIC]: Platform.EVENT,
  [InventoryCategory.SOCIETY_PUBLIC]: Platform.DOOH,
  [InventoryCategory.HOSPITALITY_PUBLIC]: Platform.HOSPITALITY,
  [InventoryCategory.RETAIL_PUBLIC]: Platform.DOOH,
};

/**
 * Check if inventory is internal (REZ_INTERNAL only)
 */
export function isInternalInventory(category: InventoryCategory): boolean {
  return Object.values([
    InventoryCategory.REZ_APP_HOME_FEED,
    InventoryCategory.REZ_APP_RECOMMENDATION,
    InventoryCategory.REZ_RIDE_INAPP,
    InventoryCategory.REZ_RIDE_EXTERNAL,
    InventoryCategory.AIRZY_TRAVELER,
    InventoryCategory.AIRZY_LOUNGE,
    InventoryCategory.STAYOWN_GUEST,
    InventoryCategory.STAYOWN_LOBBY,
    InventoryCategory.CORPPERKS_EMPLOYEE,
    InventoryCategory.BUZZLOCAL_COMMUNITY,
    InventoryCategory.REZNOW_MERCHANT,
    InventoryCategory.RISACARE_HEALTH,
    InventoryCategory.KARMA_LOYALTY,
    InventoryCategory.REZ_WALLET_PLACEMENT,
  ]).includes(category);
}

// ============================================================================
// TENANT CONFIGURATION
// ============================================================================

/**
 * Rate limits by tenant tier
 */
export interface RateLimits {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  campaignsPerMonth: number;
  campaignsActive: number;
  budgetMaxMonthly: number;
  budgetMaxCampaign: number;
}

/**
 * Default rate limits by tenant tier
 */
export const DEFAULT_RATE_LIMITS: Record<TenantTier, RateLimits> = {
  [TenantTier.REZ_TIER_0]: {
    requestsPerMinute: 10000,
    requestsPerHour: 500000,
    requestsPerDay: 10000000,
    campaignsPerMonth: -1, // Unlimited
    campaignsActive: -1,
    budgetMaxMonthly: -1,
    budgetMaxCampaign: -1,
  },
  [TenantTier.EXTERNAL_TIER_0]: {
    requestsPerMinute: 1000,
    requestsPerHour: 50000,
    requestsPerDay: 500000,
    campaignsPerMonth: 200,
    campaignsActive: 50,
    budgetMaxMonthly: -1, // Custom pricing
    budgetMaxCampaign: -1,
  },
  [TenantTier.EXTERNAL_TIER_1]: {
    requestsPerMinute: 500,
    requestsPerHour: 20000,
    requestsPerDay: 200000,
    campaignsPerMonth: 50,
    campaignsActive: 20,
    budgetMaxMonthly: 10000000, // ₹10L
    budgetMaxCampaign: 500000, // ₹5L
  },
  [TenantTier.EXTERNAL_TIER_2]: {
    requestsPerMinute: 100,
    requestsPerHour: 5000,
    requestsPerDay: 50000,
    campaignsPerMonth: 10,
    campaignsActive: 5,
    budgetMaxMonthly: 100000, // ₹1L
    budgetMaxCampaign: 25000, // ₹25K
  },
};

/**
 * Feature flags by tenant type
 */
export interface FeatureFlags {
  // Campaign features
  canCreateCampaigns: boolean;
  canUseInternalInventory: boolean;
  canUseCrossPlatformTargeting: boolean;
  canUseAdvancedAnalytics: boolean;
  canUseAIMOptimization: boolean;

  // Inventory features
  canAccessDoohInventory: boolean;
  canAccessQrInventory: boolean;
  canAccessCreatorInventory: boolean;
  canAccessWhatsAppInventory: boolean;
  canAccessHospitalityInventory: boolean;
  canAccessCommunityInventory: boolean;

  // Attribution features
  canUseMultiTouchAttribution: boolean;
  canUseWalletAttribution: boolean;
  canUseRideAttribution: boolean;
  canUseCommerceAttribution: boolean;

  // Advanced features
  canUseCustomAudienceSegments: boolean;
  canUseLookalikeAudiences: boolean;
  canUsePredictiveScoring: boolean;
  canUseAutonomousOptimization: boolean;
}

/**
 * Default feature flags by tenant type
 */
export const DEFAULT_FEATURE_FLAGS: Record<TenantType, FeatureFlags> = {
  [TenantType.REZ_INTERNAL]: {
    // Full access
    canCreateCampaigns: true,
    canUseInternalInventory: true,
    canUseCrossPlatformTargeting: true,
    canUseAdvancedAnalytics: true,
    canUseAIMOptimization: true,

    // All inventory
    canAccessDoohInventory: true,
    canAccessQrInventory: true,
    canAccessCreatorInventory: true,
    canAccessWhatsAppInventory: true,
    canAccessHospitalityInventory: true,
    canAccessCommunityInventory: true,

    // Full attribution
    canUseMultiTouchAttribution: true,
    canUseWalletAttribution: true,
    canUseRideAttribution: true,
    canUseCommerceAttribution: true,

    // Advanced features
    canUseCustomAudienceSegments: true,
    canUseLookalikeAudiences: true,
    canUsePredictiveScoring: true,
    canUseAutonomousOptimization: true,
  },
  [TenantType.EXTERNAL]: {
    // Standard access
    canCreateCampaigns: true,
    canUseInternalInventory: false, // Cannot access internal inventory
    canUseCrossPlatformTargeting: false, // Limited to marketplace
    canUseAdvancedAnalytics: true,
    canUseAIMOptimization: true,

    // Marketplace inventory only
    canAccessDoohInventory: true,
    canAccessQrInventory: true,
    canAccessCreatorInventory: true,
    canAccessWhatsAppInventory: true,
    canAccessHospitalityInventory: true,
    canAccessCommunityInventory: false, // No internal community access

    // Standard attribution
    canUseMultiTouchAttribution: true,
    canUseWalletAttribution: false, // No wallet access
    canUseRideAttribution: false, // No ride data
    canUseCommerceAttribution: true, // Basic commerce

    // Standard features
    canUseCustomAudienceSegments: false,
    canUseLookalikeAudiences: false,
    canUsePredictiveScoring: false,
    canUseAutonomousOptimization: false,
  },
};

/**
 * Pricing configuration by tenant
 */
export interface PricingConfig {
  commissionRate: number; // Platform commission
  minimumBudget: number;
  coinRewardRate: number; // Coins per ₹100 spent
  creditTerms: 'prepaid' | 'postpaid';
}

/**
 * Default pricing by tenant type
 */
export const DEFAULT_PRICING: Record<TenantType, PricingConfig> = {
  [TenantType.REZ_INTERNAL]: {
    commissionRate: 0.10, // 10% internal rate
    minimumBudget: 0,
    coinRewardRate: 5, // 5 coins per ₹100
    creditTerms: 'postpaid', // Billed monthly
  },
  [TenantType.EXTERNAL]: {
    commissionRate: 0.15, // 15% marketplace rate
    minimumBudget: 500, // ₹500 minimum
    coinRewardRate: 2, // 2 coins per ₹100
    creditTerms: 'prepaid', // Pay before campaign
  },
};

// ============================================================================
// TENANT CONTEXT
// ============================================================================

/**
 * Complete tenant context object attached to requests
 */
export interface TenantContext {
  /** Unique tenant identifier */
  tenantId: string;

  /** Tenant type: internal or external */
  tenantType: TenantType;

  /** Tenant tier for rate limiting */
  tenantTier: TenantTier;

  /** Human-readable tenant name */
  tenantName: string;

  /** Associated REZ company (for internal) or business name (for external) */
  companyName: string;

  /** Allowed inventory categories for this tenant */
  allowedInventory: InventoryCategory[];

  /** Rate limits for this tenant */
  rateLimits: RateLimits;

  /** Feature flags for this tenant */
  features: FeatureFlags;

  /** Pricing configuration */
  pricing: PricingConfig;

  /** Tenant metadata */
  metadata: Record<string, unknown>;

  /** Whether tenant is active */
  isActive: boolean;

  /** Tenant creation timestamp */
  createdAt: Date;

  /** Last activity timestamp */
  lastActivityAt: Date;
}

/**
 * Tenant registration request
 */
export interface TenantRegistration {
  type: TenantType;
  tier?: TenantTier;
  name: string;
  companyName: string;
  email: string;
  phone?: string;
  website?: string;

  // For REZ_INTERNAL tenants
  rezCompanyId?: string;

  // For EXTERNAL tenants
  businessType?: string;
  gstin?: string;
  address?: string;
}

/**
 * Tenant update request
 */
export interface TenantUpdate {
  name?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  tier?: TenantTier;
}

/**
 * Internal REZ company identifiers
 * These are the official REZ ecosystem companies
 */
export const REZ_COMPANY_IDS = [
  'rez-app', // ReZ App
  'rez-merchant', // ReZ Merchant
  'buzzlocal', // BuzzLocal
  'rez-ride', // ReZ Ride
  'airzy', // Airzy
  'stayown', // StayOwn
  'corpperks', // CorpPerks
  'do-app', // DO App
  'z-events', // Z-Events
  'risacare', // RisaCare
  'ridza', // RidZa
  'risnaestate', // RisnaEstate
  'rez-now', // REZ Now
  'karma', // Karma
  'wasil', // Wasil
  'rez-money', // REZ Money
] as const;

export type RezCompanyId = typeof REZ_COMPANY_IDS[number];

/**
 * Check if a company ID is a valid REZ company
 */
export function isRezCompany(companyId: string): companyId is RezCompanyId {
  return REZ_COMPANY_IDS.includes(companyId as RezCompanyId);
}

// ============================================================================
// REQUEST EXTENSIONS
// ============================================================================

/**
 * Extended Express Request with tenant context
 */
declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
      tenantId?: string;
      isInternalTenant?: boolean;
    }
  }
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * Tenant API response
 */
export interface TenantResponse {
  success: boolean;
  data?: TenantContext;
  error?: string;
}

/**
 * Inventory access check result
 */
export interface InventoryAccessResult {
  allowed: boolean;
  reason?: string;
  requiredType?: TenantType;
}

/**
 * Campaign inventory requirements
 */
export interface CampaignInventoryRequirement {
  campaignId: string;
  requestedInventory: InventoryCategory[];
  allowedInventory: InventoryCategory[];
  deniedInventory: InventoryCategory[];
  requiresInternalAccess: boolean;
}
