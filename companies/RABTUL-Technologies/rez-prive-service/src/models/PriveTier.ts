/**
 * PriveTier Model
 * Stores tier configurations and thresholds
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPriveTierDoc extends Document {
  tierId: string;

  // Thresholds
  minScore: number;
  maxScore: number;

  // Rewards
  coinMultiplier: number;
  monthlyBonusCoins: number;

  // Benefits
  benefits: string[];
  features: string[];

  // Access
  isActive: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const PriveTierSchema = new Schema<IPriveTierDoc>({
  tierId: {
    type: String,
    required: true,
    unique: true,
    enum: ['none', 'entry', 'signature', 'elite'],
  },

  minScore: {
    type: Number,
    required: true,
    default: 0,
  },

  maxScore: {
    type: Number,
    required: true,
    default: 100,
  },

  coinMultiplier: {
    type: Number,
    required: true,
    default: 1.0,
  },

  monthlyBonusCoins: {
    type: Number,
    default: 0,
  },

  benefits: [{
    type: String,
  }],

  features: [{
    type: String,
  }],

  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Initialize default tiers on startup
PriveTierSchema.statics.initializeDefaults = async function() {
  const defaults = [
    {
      tierId: 'none',
      minScore: 0,
      maxScore: 49,
      coinMultiplier: 0,
      monthlyBonusCoins: 0,
      benefits: ['Basic access'],
      features: [],
    },
    {
      tierId: 'entry',
      minScore: 50,
      maxScore: 69,
      coinMultiplier: 1.0,
      monthlyBonusCoins: 0,
      benefits: ['Standard offers', 'Basic rewards', 'Check-in bonuses'],
      features: ['Daily check-in', 'Basic offers'],
    },
    {
      tierId: 'signature',
      minScore: 70,
      maxScore: 84,
      coinMultiplier: 1.25,
      monthlyBonusCoins: 500,
      benefits: ['Priority support', '25% bonus coins', 'Exclusive offers', 'Early access'],
      features: ['Priority support', 'Exclusive campaigns', 'Enhanced rewards'],
    },
    {
      tierId: 'elite',
      minScore: 85,
      maxScore: 100,
      coinMultiplier: 1.5,
      monthlyBonusCoins: 1000,
      benefits: ['VIP support', '50% bonus coins', 'Exclusive access', 'Concierge', 'VIP events'],
      features: ['VIP concierge', 'Exclusive experiences', 'Maximum rewards', 'Direct brand access'],
    },
  ];

  for (const tier of defaults) {
    await this.findOneAndUpdate(
      { tierId: tier.tierId },
      tier,
      { upsert: true, new: true }
    );
  }
};

export const PriveTier: Model<IPriveTierDoc> =
  mongoose.models.PriveTier || mongoose.model<IPriveTierDoc>('PriveTier', PriveTierSchema);
