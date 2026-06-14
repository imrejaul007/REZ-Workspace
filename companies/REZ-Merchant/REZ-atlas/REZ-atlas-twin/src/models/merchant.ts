/**
 * REZ Atlas Twin - Merchant Digital Twin Models
 */

import mongoose, { Schema, Document } from 'mongoose';

// ============================================================================
// IDENTITY TWIN - Business identity
// ============================================================================

export interface IIdentityTwin extends Document {
  merchantId: string;

  // Basic identity
  name: string;
  legalName?: string;
  category: string;
  subCategory?: string;

  // Registration
  gstin?: string;
  pan?: string;
  CIN?: string;

  // Contact
  email?: string;
  phone?: string;
  website?: string;

  // Location
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    lat?: number;
    lng?: number;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const IdentityTwinSchema = new Schema<IIdentityTwin>({
  merchantId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  legalName: String,
  category: { type: String, required: true, index: true },
  subCategory: String,
  gstin: String,
  pan: String,
  CIN: String,
  email: String,
  phone: String,
  website: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
    lat: Number,
    lng: Number
  }
}, { timestamps: true });

// ============================================================================
// PRESENCE TWIN - Digital presence
// ============================================================================

export interface IPresenceTwin extends Document {
  merchantId: string;

  // Website
  website?: {
    url: string;
    techStack?: string[];
    hasEcommerce?: boolean;
    hasBooking?: boolean;
  };

  // Social media
  social?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };

  // Listings
  listings?: Array<{
    platform: string;
    url: string;
    verified: boolean;
    lastSynced?: Date;
  }>;

  // Online presence score (0-100)
  presenceScore?: number;

  updatedAt: Date;
}

const PresenceTwinSchema = new Schema<IPresenceTwin>({
  merchantId: { type: String, required: true, unique: true, index: true },
  website: {
    url: String,
    techStack: [String],
    hasEcommerce: Boolean,
    hasBooking: Boolean
  },
  social: {
    facebook: String,
    instagram: String,
    twitter: String,
    linkedin: String,
    youtube: String
  },
  listings: [{
    platform: String,
    url: String,
    verified: Boolean,
    lastSynced: Date
  }],
  presenceScore: Number
}, { timestamps: true });

// ============================================================================
// REPUTATION TWIN - Reviews and ratings
// ============================================================================

export interface IReputationTwin extends Document {
  merchantId: string;

  // Overall rating
  rating: {
    overall: number;
    count: number;
    max: number;
  };

  // Reviews by platform
  reviews?: Array<{
    platform: string;
    rating: number;
    count: number;
    lastReview?: Date;
  }>;

  // Sentiment analysis
  sentiment?: {
    positive: number;
    negative: number;
    neutral: number;
    score: number; // -1 to 1
  };

  // Response rate
  responseRate?: number;
  avgResponseTime?: number; // in hours

  updatedAt: Date;
}

const ReputationTwinSchema = new Schema<IReputationTwin>({
  merchantId: { type: String, required: true, unique: true, index: true },
  rating: {
    overall: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    max: { type: Number, default: 5 }
  },
  reviews: [{
    platform: String,
    rating: Number,
    count: Number,
    lastReview: Date
  }],
  sentiment: {
    positive: Number,
    negative: Number,
    neutral: Number,
    score: Number
  },
  responseRate: Number,
  avgResponseTime: Number
}, { timestamps: true });

// ============================================================================
// OPERATIONS TWIN - Business operations
// ============================================================================

export interface IOperationsTwin extends Document {
  merchantId: string;

  // Business hours
  hours?: Array<{
    day: number;
    open: string;
    close: string;
    isClosed: boolean;
  }>;

  // Staff
  staffEstimate?: number;
  staffRange?: string; // e.g., "1-10", "11-50"

  // Technology
  tech?: {
    hasPOS?: boolean;
    posProvider?: string;
    hasQR?: boolean;
    hasOnlineOrdering?: boolean;
    hasTableBooking?: boolean;
    hasInventoryManagement?: boolean;
    paymentMethods?: string[];
  };

  // Size
  size?: {
    sqft?: number;
    branches?: number;
    type: 'standalone' | 'chain' | 'franchise';
  };

  updatedAt: Date;
}

const OperationsTwinSchema = new Schema<IOperationsTwin>({
  merchantId: { type: String, required: true, unique: true, index: true },
  hours: [{
    day: Number,
    open: String,
    close: String,
    isClosed: Boolean
  }],
  staffEstimate: Number,
  staffRange: String,
  tech: {
    hasPOS: Boolean,
    posProvider: String,
    hasQR: Boolean,
    hasOnlineOrdering: Boolean,
    hasTableBooking: Boolean,
    hasInventoryManagement: Boolean,
    paymentMethods: [String]
  },
  size: {
    sqft: Number,
    branches: Number,
    type: String
  }
}, { timestamps: true });

// ============================================================================
// GROWTH SIGNALS TWIN - Growth indicators
// ============================================================================

export interface IGrowthSignalsTwin extends Document {
  merchantId: string;

  // Hiring activity
  hiring?: {
    active: boolean;
    positions: number;
    lastPosted?: Date;
  };

  // Review velocity
  reviewVelocity?: {
    weekly: number;
    monthly: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };

  // Social engagement
  socialEngagement?: {
    followers: number;
    engagementRate: number;
    postsPerWeek: number;
  };

  // Expansion signals
  expansion?: {
    hasNewBranch: boolean;
    newLocations?: string[];
    lastExpansion?: Date;
  };

  // Growth score (0-100)
  growthScore?: number;

  updatedAt: Date;
}

const GrowthSignalsTwinSchema = new Schema<IGrowthSignalsTwin>({
  merchantId: { type: String, required: true, unique: true, index: true },
  hiring: {
    active: Boolean,
    positions: Number,
    lastPosted: Date
  },
  reviewVelocity: {
    weekly: Number,
    monthly: Number,
    trend: String
  },
  socialEngagement: {
    followers: Number,
    engagementRate: Number,
    postsPerWeek: Number
  },
  expansion: {
    hasNewBranch: Boolean,
    newLocations: [String],
    lastExpansion: Date
  },
  growthScore: Number
}, { timestamps: true });

// ============================================================================
// MERCHANT TWIN - Complete merchant twin
// ============================================================================

export interface IMerchantTwin extends Document {
  merchantId: string;

  // Twin components
  identity?: mongoose.Types.ObjectId;
  presence?: mongoose.Types.ObjectId;
  reputation?: mongoose.Types.ObjectId;
  operations?: mongoose.Types.ObjectId;
  growth?: mongoose.Types.ObjectId;

  // Aggregate scores
  twinScore: {
    overall: number;
    identity: number;
    presence: number;
    reputation: number;
    operations: number;
    growth: number;
  };

  // Status
  status: 'active' | 'inactive' | 'archived';
  lastSynced?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const MerchantTwinSchema = new Schema<IMerchantTwin>({
  merchantId: { type: String, required: true, unique: true, index: true },
  identity: { type: Schema.Types.ObjectId, ref: 'IdentityTwin' },
  presence: { type: Schema.Types.ObjectId, ref: 'PresenceTwin' },
  reputation: { type: Schema.Types.ObjectId, ref: 'ReputationTwin' },
  operations: { type: Schema.Types.ObjectId, ref: 'OperationsTwin' },
  growth: { type: Schema.Types.ObjectId, ref: 'GrowthSignalsTwin' },
  twinScore: {
    overall: { type: Number, default: 0 },
    identity: { type: Number, default: 0 },
    presence: { type: Number, default: 0 },
    reputation: { type: Number, default: 0 },
    operations: { type: Number, default: 0 },
    growth: { type: Number, default: 0 }
  },
  status: { type: String, default: 'active', enum: ['active', 'inactive', 'archived'] },
  lastSynced: Date
}, { timestamps: true });

// ============================================================================
// EXPORTS
// ============================================================================

export const IdentityTwinModel = mongoose.model<IIdentityTwin>('IdentityTwin', IdentityTwinSchema);
export const PresenceTwinModel = mongoose.model<IPresenceTwin>('PresenceTwinSchema', PresenceTwinSchema);
export const ReputationTwinModel = mongoose.model<IReputationTwin>('ReputationTwin', ReputationTwinSchema);
export const OperationsTwinModel = mongoose.model<IOperationsTwin>('OperationsTwin', OperationsTwinSchema);
export const GrowthSignalsTwinModel = mongoose.model<IGrowthSignalsTwin>('GrowthSignalsTwin', GrowthSignalsTwinSchema);
export const MerchantTwinModel = mongoose.model<IMerchantTwin>('MerchantTwin', MerchantTwinSchema);