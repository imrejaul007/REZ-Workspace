/**
 * Tenant Registry - Type Definitions
 */

import mongoose, { Document, Schema } from 'mongoose';

// ============================================================================
// ENUMS
// ============================================================================

export enum TenantType {
  REZ_INTERNAL = 'rez_internal',
  EXTERNAL = 'external',
}

export enum TenantTier {
  // REZ Internal tiers
  REZ_TIER_0 = 'rez_tier_0',

  // External tiers
  EXTERNAL_TIER_0 = 'external_tier_0',
  EXTERNAL_TIER_1 = 'external_tier_1',
  EXTERNAL_TIER_2 = 'external_tier_2',
}

export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

/**
 * API Key schema
 */
export interface IApiKey {
  key: string;
  name: string;
  secretHash?: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

const apiKeySchema = new Schema<IApiKey>({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  secretHash: { type: String },
  permissions: [{ type: String }],
  isActive: { type: Boolean, default: true },
  lastUsedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
});

/**
 * Rate limit schema
 */
export interface IRateLimits {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  campaignsPerMonth: number;
  campaignsActive: number;
  budgetMaxMonthly: number;
  budgetMaxCampaign: number;
}

/**
 * Feature flags schema
 */
export interface IFeatureFlags {
  // Campaign features
  canCreateCampaigns: boolean;
  canUseInternalInventory: boolean;
  canUseCrossPlatformTargeting: boolean;
  canUseAdvancedAnalytics: boolean;
  canUseAIMOptimization: boolean;

  // Attribution features
  canUseMultiTouchAttribution: boolean;
  canUseWalletAttribution: boolean;
  canUseRideAttribution: boolean;
  canUseCommerceAttribution: boolean;
}

/**
 * Pricing config schema
 */
export interface IPricingConfig {
  commissionRate: number;
  minimumBudget: number;
  coinRewardRate: number;
  creditTerms: 'prepaid' | 'postpaid';
}

// ============================================================================
// TENANT DOCUMENT
// ============================================================================

export interface ITenant extends Document {
  // Identity
  tenantId: string;
  tenantType: TenantType;
  tenantTier: TenantTier;
  status: TenantStatus;

  // Company info
  name: string;
  companyName: string;
  email: string;
  phone?: string;
  website?: string;
  logo?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country: string;
  };

  // REZ Internal specific
  rezCompanyId?: string;
  rezProducts?: string[];

  // External specific
  businessType?: string;
  gstin?: string;
  pan?: string;
  verified: boolean;

  // Authentication
  passwordHash?: string;
  apiKeys: IApiKey[];

  // Configuration
  rateLimits: IRateLimits;
  featureFlags: IFeatureFlags;
  pricing: IPricingConfig;

  // Billing
  billingEmail?: string;
  paymentMethod?: 'prepaid' | 'postpaid';
  creditLimit?: number;
  currentSpend: number;

  // Metadata
  metadata: Record<string, unknown>;
  tags: string[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt?: Date;
  verifiedAt?: Date;
}

const tenantSchema = new Schema<ITenant>({
  tenantId: { type: String, required: true, unique: true, index: true },
  tenantType: { type: String, enum: Object.values(TenantType), required: true, index: true },
  tenantTier: { type: String, enum: Object.values(TenantTier), required: true },
  status: { type: String, enum: Object.values(TenantStatus), default: TenantStatus.ACTIVE },

  // Company info
  name: { type: String, required: true },
  companyName: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: String,
  website: String,
  logo: String,
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: 'India' },
  },

  // REZ Internal
  rezCompanyId: String,
  rezProducts: [String],

  // External
  businessType: String,
  gstin: String,
  pan: String,
  verified: { type: Boolean, default: false },

  // Auth
  passwordHash: String,
  apiKeys: [apiKeySchema],

  // Config
  rateLimits: {
    requestsPerMinute: { type: Number, default: 100 },
    requestsPerHour: { type: Number, default: 5000 },
    requestsPerDay: { type: Number, default: 50000 },
    campaignsPerMonth: { type: Number, default: 10 },
    campaignsActive: { type: Number, default: 5 },
    budgetMaxMonthly: { type: Number, default: 100000 },
    budgetMaxCampaign: { type: Number, default: 25000 },
  },
  featureFlags: {
    canCreateCampaigns: { type: Boolean, default: true },
    canUseInternalInventory: { type: Boolean, default: false },
    canUseCrossPlatformTargeting: { type: Boolean, default: false },
    canUseAdvancedAnalytics: { type: Boolean, default: true },
    canUseAIMOptimization: { type: Boolean, default: false },
    canUseMultiTouchAttribution: { type: Boolean, default: false },
    canUseWalletAttribution: { type: Boolean, default: false },
    canUseRideAttribution: { type: Boolean, default: false },
    canUseCommerceAttribution: { type: Boolean, default: true },
  },
  pricing: {
    commissionRate: { type: Number, default: 0.15 },
    minimumBudget: { type: Number, default: 500 },
    coinRewardRate: { type: Number, default: 2 },
    creditTerms: { type: String, enum: ['prepaid', 'postpaid'], default: 'prepaid' },
  },

  // Billing
  billingEmail: String,
  paymentMethod: { type: String, enum: ['prepaid', 'postpaid'], default: 'prepaid' },
  creditLimit: Number,
  currentSpend: { type: Number, default: 0 },

  // Metadata
  metadata: { type: Schema.Types.Mixed, default: {} },
  tags: [String],

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastActivityAt: Date,
  verifiedAt: Date,
});

// Indexes
tenantSchema.index({ email: 1 });
tenantSchema.index({ 'address.city': 1, 'address.state': 1 });
tenantSchema.index({ 'apiKeys.key': 1 });
tenantSchema.index({ status: 1, tenantType: 1 });

// Pre-save hook
tenantSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ============================================================================
// MODEL EXPORTS
// ============================================================================

export const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);
