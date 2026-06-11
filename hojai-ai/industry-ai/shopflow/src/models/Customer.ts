import mongoose, { Document, Schema } from 'mongoose';

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  tier: LoyaltyTier;
  totalSpent: number;
  purchaseCount: number;
  preferences?: {
    categories?: string[];
    tags?: string[];
    priceRange?: { min: number; max: number };
  };
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    purchaseCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    preferences: {
      categories: [String],
      tags: [String],
      priceRange: {
        min: Number,
        max: Number,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for next tier info
CustomerSchema.virtual('nextTier').get(function () {
  const tiers: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum'];
  const currentIndex = tiers.indexOf(this.tier);
  if (currentIndex === tiers.length - 1) return null;
  return tiers[currentIndex + 1];
});

// Virtual for points to next tier
CustomerSchema.virtual('pointsToNextTier').get(function () {
  const tierThresholds: Record<LoyaltyTier, number> = {
    bronze: 0,
    silver: 1000,
    gold: 5000,
    platinum: 15000,
  };
  const nextTier = this.nextTier;
  if (!nextTier) return 0;
  return Math.max(0, tierThresholds[nextTier] - this.loyaltyPoints);
});

// Ensure virtuals are included in JSON
CustomerSchema.set('toJSON', { virtuals: true });
CustomerSchema.set('toObject', { virtuals: true });

// Indexes
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ tier: 1 });
CustomerSchema.index({ loyaltyPoints: -1 });

// Pre-save middleware to auto-upgrade tier
CustomerSchema.pre('save', function (next) {
  if (this.isModified('loyaltyPoints')) {
    if (this.loyaltyPoints >= 15000) {
      this.tier = 'platinum';
    } else if (this.loyaltyPoints >= 5000) {
      this.tier = 'gold';
    } else if (this.loyaltyPoints >= 1000) {
      this.tier = 'silver';
    } else {
      this.tier = 'bronze';
    }
  }
  next();
});

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
export default Customer;