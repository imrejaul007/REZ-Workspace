/**
 * KYC (Know Your Customer) Model for REZ Wallet
 *
 * Implements tiered KYC with transaction limits.
 *
 * KYC Tiers:
 * - Level 0: Unverified (phone only)
 * - Level 1: Basic (ID verification)
 * - Level 2: Enhanced (Address + Document verification)
 * - Level 3: Full (In-person verification)
 */

import mongoose, { Schema, Document } from 'mongoose';

export type KycTier = 'L0' | 'L1' | 'L2' | 'L3';

export type KycStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'expired';

export interface IKycLevel extends Document {
  userId: mongoose.Types.ObjectId;

  // KYC Status
  tier: KycTier;
  status: KycStatus;

  // Identity Information
  fullName: string;
  dateOfBirth: Date;
  gender?: 'M' | 'F' | 'O';

  // Address Information
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  // Document Information
  documents?: {
    type: 'AADHAAR' | 'PAN' | 'PASSPORT' | 'DRIVING_LICENSE' | 'VOTER_ID';
    number: string; // Encrypted
    frontImageUrl?: string;
    backImageUrl?: string;
    verifiedAt?: Date;
    expiryDate?: Date;
  };

  // Verification
  verificationMethod?: 'manual' | 'automated' | 'ekyc';
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  rejectionReason?: string;

  // AML Screening
  amlCheckStatus: 'pending' | 'passed' | 'flagged' | 'failed';
  amlCheckAt?: Date;
  amlRiskScore?: number;

  // Transaction Limits
  dailyLimit: number;    // In paise
  monthlyLimit: number;  // In paise
  maxBalance: number;   // In paise

  // Expiry
  expiresAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const KycLevelSchema = new Schema<IKycLevel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    tier: {
      type: String,
      enum: ['L0', 'L1', 'L2', 'L3'],
      default: 'L0',
    },

    status: {
      type: String,
      enum: ['pending', 'in_review', 'approved', 'rejected', 'expired'],
      default: 'pending',
    },

    fullName: {
      type: String,
      required: true,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      enum: ['M', 'F', 'O'],
    },

    address: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String, default: 'IN' },
    },

    documents: {
      type: {
        type: String,
        enum: ['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID'],
      },
      number: { type: String, required: true },
      frontImageUrl: { type: String },
      backImageUrl: { type: String },
      verifiedAt: { type: Date },
      expiryDate: { type: Date },
    },

    verificationMethod: {
      type: String,
      enum: ['manual', 'automated', 'ekyc'],
    },

    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },

    verifiedAt: {
      type: Date,
    },

    rejectionReason: {
      type: String,
    },

    amlCheckStatus: {
      type: String,
      enum: ['pending', 'passed', 'flagged', 'failed'],
      default: 'pending',
    },

    amlCheckAt: {
      type: Date,
    },

    amlRiskScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    dailyLimit: {
      type: Number,
      default: 0,
    },

    monthlyLimit: {
      type: Number,
      default: 0,
    },

    maxBalance: {
      type: Number,
      default: 0,
    },

    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes
KycLevelSchema.index({ status: 1, tier: 1 });
KycLevelSchema.index({ 'documents.type': 1, 'documents.number': 1 }); // For duplicate detection
KycLevelSchema.index({ amlCheckStatus: 1 });

export const KycLevel = mongoose.model<IKycLevel>('KycLevel', KycLevelSchema);

// ── KYC Tier Configuration ────────────────────────────────────────────────────

export const KYC_TIER_LIMITS: Record<KycTier, { daily: number; monthly: number; maxBalance: number }> = {
  L0: { daily: 10000 * 100, monthly: 50000 * 100, maxBalance: 10000 * 100 },      // ₹10K daily, ₹50K monthly
  L1: { daily: 50000 * 100, monthly: 200000 * 100, maxBalance: 50000 * 100 },     // ₹50K daily, ₹2L monthly
  L2: { daily: 200000 * 100, monthly: 1000000 * 100, maxBalance: 200000 * 100 },  // ₹2L daily, ₹10L monthly
  L3: { daily: 10000000 * 100, monthly: 50000000 * 100, maxBalance: 10000000 * 100 }, // ₹1Cr daily, ₹5Cr monthly
};

// ── Helper Functions ──────────────────────────────────────────────────────────

/**
 * Get the KYC tier for a user
 */
export async function getUserKycTier(userId: string): Promise<KycTier> {
  const kyc = await KycLevel.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean();
  return (kyc?.tier as KycTier) || 'L0';
}

/**
 * Get transaction limits for a KYC tier
 */
export function getLimitsForTier(tier: KycTier): { daily: number; monthly: number; maxBalance: number } {
  return KYC_TIER_LIMITS[tier];
}

/**
 * Check if a transaction is within limits
 */
export async function checkTransactionLimits(
  userId: string,
  amount: number
): Promise<{ allowed: boolean; reason?: string }> {
  const tier = await getUserKycTier(userId);
  const limits = KYC_TIER_LIMITS[tier];

  // Check max balance
  const wallet = await mongoose.connection.collection('wallets').findOne({ userId: new mongoose.Types.ObjectId(userId) });
  if (wallet && wallet.balance.total + amount > limits.maxBalance) {
    return {
      allowed: false,
      reason: `Transaction would exceed maximum balance of ₹${limits.maxBalance / 100}. Please complete higher KYC verification.`,
    };
  }

  // Check daily limit (simplified - would need daily aggregation in production)
  if (amount > limits.daily) {
    return {
      allowed: false,
      reason: `Amount exceeds daily limit of ₹${limits.daily / 100} for KYC ${tier}.`,
    };
  }

  return { allowed: true };
}

/**
 * Upgrade KYC tier
 */
export async function upgradeKycTier(
  userId: string,
  newTier: KycTier,
  verifiedBy?: string
): Promise<IKycLevel> {
  const limits = KYC_TIER_LIMITS[newTier];

  const kyc = await KycLevel.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    {
      $set: {
        tier: newTier,
        status: 'approved',
        verifiedAt: new Date(),
        verifiedBy: verifiedBy ? new mongoose.Types.ObjectId(verifiedBy) : undefined,
        dailyLimit: limits.daily,
        monthlyLimit: limits.monthly,
        maxBalance: limits.maxBalance,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    },
    { upsert: true, new: true }
  );

  return kyc;
}
