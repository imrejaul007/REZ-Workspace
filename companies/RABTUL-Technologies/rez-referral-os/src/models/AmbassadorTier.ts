import mongoose, { Schema } from 'mongoose';
import { IAmbassadorTier, AmbassadorTier } from '../types/referral';

export interface AmbassadorTierDocument extends Omit<IAmbassadorTier, '_id'>, mongoose.Document {}

interface AmbassadorTierModel extends mongoose.Model<AmbassadorTierDocument> {
  seedDefaults(): Promise<void>;
  getTierForReferrals(count: number): AmbassadorTier;
  getTierBenefits(tier: AmbassadorTier): Promise<AmbassadorTierDocument | null>;
}

const ambassadorTierSchema = new Schema<AmbassadorTierDocument>(
  {
    tier: {
      type: String,
      required: true,
      unique: true,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    },
    minReferrals: {
      type: Number,
      required: true,
      min: 0,
    },
    maxReferrals: {
      type: Number,
      min: 0,
    },
    benefits: {
      type: [String],
      default: [],
    },
    bonusMultiplier: {
      type: Number,
      default: 1.0,
      min: 1.0,
      max: 3.0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Default tier configurations
ambassadorTierSchema.statics.seedDefaults = async function (): Promise<void> {
  const tiers = [
    {
      tier: 'bronze',
      minReferrals: 0,
      maxReferrals: 25,
      benefits: ['Basic referral tracking', 'Standard rewards'],
      bonusMultiplier: 1.0,
    },
    {
      tier: 'silver',
      minReferrals: 26,
      maxReferrals: 100,
      benefits: [
        'Enhanced referral tracking',
        'Priority support',
        '5% bonus on rewards',
      ],
      bonusMultiplier: 1.05,
    },
    {
      tier: 'gold',
      minReferrals: 101,
      maxReferrals: 500,
      benefits: [
        'Advanced analytics',
        'Priority support',
        '10% bonus on rewards',
        'Early access to campaigns',
      ],
      bonusMultiplier: 1.1,
    },
    {
      tier: 'platinum',
      minReferrals: 501,
      maxReferrals: 5000,
      benefits: [
        'Dedicated account manager',
        '15% bonus on rewards',
        'Early access to campaigns',
        'Exclusive merchant partnerships',
        'Custom referral links',
      ],
      bonusMultiplier: 1.15,
    },
    {
      tier: 'diamond',
      minReferrals: 5001,
      maxReferrals: null,
      benefits: [
        'VIP support',
        '20% bonus on rewards',
        'Priority campaign access',
        'Premium merchant partnerships',
        'Custom referral links',
        'Annual bonus payout',
        'Exclusive events',
      ],
      bonusMultiplier: 1.2,
    },
  ];

  for (const tier of tiers) {
    await this.findOneAndUpdate({ tier: tier.tier }, tier, { upsert: true, new: true });
  }
};

// Static method to get tier for referral count
ambassadorTierSchema.statics.getTierForReferrals = function (count: number): AmbassadorTier {
  if (count >= 5001) return 'diamond';
  if (count >= 501) return 'platinum';
  if (count >= 101) return 'gold';
  if (count >= 26) return 'silver';
  return 'bronze';
};

// Static method to get tier benefits
ambassadorTierSchema.statics.getTierBenefits = async function (
  tier: AmbassadorTier
): Promise<AmbassadorTierDocument | null> {
  return this.findOne({ tier, isActive: true });
};

export const AmbassadorTierModel = mongoose.model<AmbassadorTierDocument, AmbassadorTierModel>('AmbassadorTier', ambassadorTierSchema);
