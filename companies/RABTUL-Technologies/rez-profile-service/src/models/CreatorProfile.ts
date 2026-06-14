/**
 * CreatorProfile Model - Unified Creator Profile for ReZ Ecosystem
 *
 * This is the SINGLE source of truth for creators across:
 * - Creator QR (selling services)
 * - Prive (creator benefits, badges, engagement)
 * - Wallet (creator earnings, coins)
 * - Auth (single identity)
 *
 * Every creator in the ecosystem uses this profile.
 */

import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// TYPES
// ============================================

export type CreatorStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type CreatorTier = 'starter' | 'bronze' | 'silver' | 'gold' | 'platinum';

export type CreatorCategory =
  | 'fashion'
  | 'beauty'
  | 'lifestyle'
  | 'tech'
  | 'food'
  | 'fitness'
  | 'travel'
  | 'health'
  | 'entertainment'
  | 'education'
  | 'consulting'
  | 'freelance'
  | 'other';

export interface ICreatorStats {
  totalPicks: number;
  totalViews: number;
  totalLikes: number;
  totalFollowers: number;
  totalConversions: number;
  totalEarnings: number;
  engagementRate: number;
  lastUpdated: Date;
}

export interface ICreatorProfile extends Document {
  // Core Identity (linked to UserProfile via userId)
  userId: string;

  // Application
  status: CreatorStatus;
  applicationDate: Date;
  approvedDate?: Date;
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  suspendedBy?: string;
  suspensionReason?: string;

  // Profile Info
  displayName: string;
  bio: string;
  avatar?: string;
  coverImage?: string;
  category: CreatorCategory;
  tags: string[];
  socialLinks: { platform: string; url: string }[];

  // Earnings Config
  commissionRate?: number;
  tier: CreatorTier;

  // Prive Integration (linked to Prive service)
  priveTier?: 'none' | 'entry' | 'signature' | 'elite';
  priveScore?: number;
  priveBadgeColor?: string;

  // Stats (refreshed by background job)
  stats: ICreatorStats;

  // Flags
  isVerified: boolean;
  isFeatured: boolean;
  featuredOrder?: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMA
// ============================================

const CreatorStatsSchema = new Schema<ICreatorStats>(
  {
    totalPicks: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalFollowers: { type: Number, default: 0 },
    totalConversions: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SocialLinkSchema = new Schema(
  {
    platform: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const CreatorProfileSchema = new Schema<ICreatorProfile>(
  {
    // Core Identity
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Application
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    applicationDate: {
      type: Date,
      default: Date.now,
    },
    approvedDate: Date,
    approvedBy: String,
    rejectedBy: String,
    rejectionReason: String,
    suspendedBy: String,
    suspensionReason: String,

    // Profile Info
    displayName: {
      type: String,
      required: true,
      maxlength: 50,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: '',
    },
    avatar: String,
    coverImage: String,
    category: {
      type: String,
      enum: [
        'fashion', 'beauty', 'lifestyle', 'tech', 'food',
        'fitness', 'travel', 'health', 'entertainment',
        'education', 'consulting', 'freelance', 'other'
      ],
      required: true,
    },
    tags: [String],
    socialLinks: [SocialLinkSchema],

    // Earnings Config
    commissionRate: {
      type: Number,
      min: 0,
      max: 1,
    },
    tier: {
      type: String,
      enum: ['starter', 'bronze', 'silver', 'gold', 'platinum'],
      default: 'starter',
    },

    // Prive Integration
    priveTier: {
      type: String,
      enum: ['none', 'entry', 'signature', 'elite'],
    },
    priveScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    priveBadgeColor: String,

    // Stats
    stats: {
      type: CreatorStatsSchema,
      default: () => ({}),
    },

    // Flags
    isVerified: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    featuredOrder: Number,
  },
  { timestamps: true }
);

// ============================================
// INDEXES
// ============================================

CreatorProfileSchema.index({ status: 1 });
CreatorProfileSchema.index({ status: 1, isFeatured: 1, featuredOrder: 1 });
CreatorProfileSchema.index({ 'stats.totalViews': -1 });
CreatorProfileSchema.index({ tier: 1 });
CreatorProfileSchema.index({ category: 1 });
CreatorProfileSchema.index({ status: 1, category: 1 });
CreatorProfileSchema.index({ 'stats.totalFollowers': -1 });
CreatorProfileSchema.index({ priveTier: 1 });
CreatorProfileSchema.index({ priveScore: -1 });
CreatorProfileSchema.index({ displayName: 'text', bio: 'text' });

// ============================================
// METHODS
// ============================================

/**
 * Check if creator can sell (approved status)
 */
CreatorProfileSchema.methods.canSell = function (): boolean {
  return this.status === 'approved';
};

/**
 * Get display tier including Prive
 */
CreatorProfileSchema.methods.getDisplayTier = function (): string {
  if (this.priveTier && this.priveTier !== 'none') {
    return `${this.tier}/${this.priveTier}`;
  }
  return this.tier;
};

/**
 * Get full profile URL
 */
CreatorProfileSchema.methods.getProfileUrl = function (): string {
  return `/creator/${this.userId}`;
};

// ============================================
// STATICS
// ============================================

/**
 * Find creators by tier
 */
CreatorProfileSchema.statics.findByTier = function (tier: CreatorTier, limit: number = 20) {
  return this.find({ tier, status: 'approved' })
    .sort({ 'stats.totalFollowers': -1 })
    .limit(limit);
};

/**
 * Find featured creators
 */
CreatorProfileSchema.statics.findFeatured = function (limit: number = 10) {
  return this.find({ isFeatured: true, status: 'approved' })
    .sort({ featuredOrder: 1 })
    .limit(limit);
};

/**
 * Find creators by category
 */
CreatorProfileSchema.statics.findByCategory = function (category: CreatorCategory, limit: number = 20) {
  return this.find({ category, status: 'approved' })
    .sort({ 'stats.totalFollowers': -1 })
    .limit(limit);
};

/**
 * Find Prive Elite creators
 */
CreatorProfileSchema.statics.findPriveElite = function (limit: number = 20) {
  return this.find({ priveTier: 'elite', status: 'approved' })
    .sort({ priveScore: -1 })
    .limit(limit);
};

/**
 * Search creators by name or bio
 */
CreatorProfileSchema.statics.search = function (query: string, limit: number = 20) {
  return this.find(
    { $text: { $search: query }, status: 'approved' },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit);
};

// ============================================
// EXPORT
// ============================================

export const CreatorProfile = mongoose.model<ICreatorProfile>('CreatorProfile', CreatorProfileSchema);
export default CreatorProfile;
