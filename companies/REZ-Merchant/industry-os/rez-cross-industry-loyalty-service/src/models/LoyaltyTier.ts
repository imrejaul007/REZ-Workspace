import mongoose, { Document, Schema } from 'mongoose';
import { LoyaltyTierName } from '../types';

export interface ILoyaltyTier extends Document {
  name: LoyaltyTierName;
  minPoints: number;
  maxPoints: number;
  multiplier: number;
  benefits: string[];
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const LoyaltyTierSchema = new Schema<ILoyaltyTier>({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    index: true
  },
  minPoints: {
    type: Number,
    required: true
  },
  maxPoints: {
    type: Number,
    required: false,
    default: -1
  },
  multiplier: {
    type: Number,
    required: true,
    default: 1.0
  },
  benefits: [{
    type: String
  }],
  color: {
    type: String,
    required: true,
    default: '#CD7F32' // Bronze color default
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'loyalty_tiers'
});

// Static method to get tier by points
LoyaltyTierSchema.statics.getTierByPoints = async function(points: number): Promise<ILoyaltyTier | null> {
  return this.findOne({
    minPoints: { $lte: points },
    $or: [
      { maxPoints: { $gte: points } },
      { maxPoints: -1 }
    ]
  }).sort({ minPoints: -1 });
};

// Static method to seed default tiers
LoyaltyTierSchema.statics.seedDefaultTiers = async function(): Promise<void> {
  const defaultTiers = [
    {
      name: 'bronze',
      minPoints: 0,
      maxPoints: 999,
      multiplier: 1.0,
      benefits: [
        'Basic loyalty points earning',
        'Access to standard promotions',
        'Email support'
      ],
      color: '#CD7F32'
    },
    {
      name: 'silver',
      minPoints: 1000,
      maxPoints: 4999,
      multiplier: 1.25,
      benefits: [
        '25% bonus on all point earnings',
        'Early access to sales and promotions',
        'Priority email support',
        'Birthday bonus points'
      ],
      color: '#C0C0C0'
    },
    {
      name: 'gold',
      minPoints: 5000,
      maxPoints: 9999,
      multiplier: 1.5,
      benefits: [
        '50% bonus on all point earnings',
        'Free shipping on orders',
        'Priority customer support',
        'Exclusive member events access',
        'Birthday bonus points doubled'
      ],
      color: '#FFD700'
    },
    {
      name: 'platinum',
      minPoints: 10000,
      maxPoints: 24999,
      multiplier: 1.75,
      benefits: [
        '75% bonus on all point earnings',
        'Free expedited shipping',
        'Dedicated support line',
        'VIP event invitations',
        'Personal concierge service',
        'Extended return policy'
      ],
      color: '#E5E4E2'
    },
    {
      name: 'diamond',
      minPoints: 25000,
      maxPoints: -1,
      multiplier: 2.0,
      benefits: [
        'Double points on all purchases',
        'Premium delivery services',
        '24/7 VIP concierge',
        'First access to new products',
        'Complimentary upgrades',
        'Exclusive travel benefits',
        'Personal account manager',
        'Luxury gift rewards'
      ],
      color: '#B9F2FF'
    }
  ];

  for (const tier of defaultTiers) {
    await this.findOneAndUpdate(
      { name: tier.name },
      tier,
      { upsert: true, new: true }
    );
  }

  console.log('Default loyalty tiers seeded successfully');
};

export const LoyaltyTierModel = mongoose.model<ILoyaltyTier>('LoyaltyTier', LoyaltyTierSchema);

export default LoyaltyTierModel;