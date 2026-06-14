/**
 * ReZ Rewards - Customer Loyalty Model
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerLoyalty extends Document {
  customerId: string;
  shop: string;
  tenantId: string;
  brandId: string;
  email: string;
  phone?: string;
  points: number;
  lifetimePoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  tierProgress: number;
  totalOrders: number;
  totalSpent: number;
  referralCode: string;
  referredBy?: string;
  referrals: number;
  rewardsRedeemed: number;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
  // Methods
  addPoints(points: number): Promise<this>;
  redeemPoints(points: number): Promise<this>;
  updateTier(): Promise<void>;
}

const CustomerLoyaltySchema = new Schema({
  customerId: { type: String, required: true, index: true },
  shop: { type: String, required: true, lowercase: true, index: true },
  tenantId: { type: String, required: true, index: true },
  brandId: { type: String, required: true, index: true },
  email: { type: String, required: true },
  phone: String,
  points: { type: Number, default: 0 },
  lifetimePoints: { type: Number, default: 0 },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze',
  },
  tierProgress: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  referralCode: { type: String, required: true },
  referredBy: String,
  referrals: { type: Number, default: 0 },
  rewardsRedeemed: { type: Number, default: 0 },
  lastActivity: Date,
}, {
  timestamps: true,
  collection: 'customer_loyalty',
});

CustomerLoyaltySchema.index({ shop: 1, customerId: 1 }, { unique: true });
CustomerLoyaltySchema.index({ tenantId: 1, email: 1 });
CustomerLoyaltySchema.index({ referralCode: 1 }, { unique: true });

CustomerLoyaltySchema.methods.addPoints = async function(points: number) {
  this.points += points;
  this.lifetimePoints += points;
  this.lastActivity = new Date();
  await this.updateTier();
  await this.save();
  return this;
};

CustomerLoyaltySchema.methods.redeemPoints = async function(points: number) {
  if (this.points < points) {
    throw new Error('Insufficient points');
  }
  this.points -= points;
  this.rewardsRedeemed += points;
  await this.save();
  return this;
};

CustomerLoyaltySchema.methods.updateTier = async function() {
  const tiers = {
    bronze: { min: 0, multiplier: 1 },
    silver: { min: 1000, multiplier: 1.25 },
    gold: { min: 5000, multiplier: 1.5 },
    platinum: { min: 15000, multiplier: 2 },
  };

  if (this.lifetimePoints >= tiers.platinum.min) {
    this.tier = 'platinum';
  } else if (this.lifetimePoints >= tiers.gold.min) {
    this.tier = 'gold';
  } else if (this.lifetimePoints >= tiers.silver.min) {
    this.tier = 'silver';
  } else {
    this.tier = 'bronze';
  }

  // Calculate progress to next tier
  const currentTier = tiers[this.tier as keyof typeof tiers];
  const tierKeys = Object.keys(tiers);
  const currentIndex = tierKeys.indexOf(this.tier);
  const nextTier = tiers[tierKeys[currentIndex + 1] as keyof typeof tiers];

  if (nextTier) {
    this.tierProgress = ((this.lifetimePoints - currentTier.min) / (nextTier.min - currentTier.min)) * 100;
  } else {
    this.tierProgress = 100;
  }
};

export const CustomerLoyalty = mongoose.model<ICustomerLoyalty>('CustomerLoyalty', CustomerLoyaltySchema);
