import mongoose, { Schema, Document } from 'mongoose';
import { LoyaltyTwinDocument, LoyaltyTier, TIER_THRESHOLDS, TIER_BENEFITS } from '../schemas/loyalty-twin.schema';

export interface ILoyaltyTwinModel extends Omit<LoyaltyTwinDocument, 'twinId'>, Document {
  _id: mongoose.Types.ObjectId;
}

const LoyaltyTwinSchema = new Schema<ILoyaltyTwinModel>({
  twinId: { type: String, required: true, unique: true, index: true },
  loyaltyId: { type: String, required: true, unique: true, index: true },
  merchantId: { type: String, required: true, index: true },
  customerId: { type: String, required: true, index: true },
  currentTier: { type: String, enum: Object.values(LoyaltyTier), default: LoyaltyTier.BRONZE },
  pointsBalance: { type: Number, default: 0 },
  lifetimePoints: { type: Number, default: 0 },
  tierProgress: { type: Number, default: 0 },
  transactions: [{
    transactionId: { type: String, required: true },
    customerId: { type: String, required: true },
    type: { type: String, required: true },
    points: { type: Number, required: true },
    orderId: { type: String },
    description: { type: String, required: true },
    timestamp: { type: String, required: true }
  }],
  rewards: [{
    rewardId: { type: String, required: true },
    name: { type: String, required: true },
    pointsCost: { type: Number, required: true },
    description: { type: String },
    category: { type: String },
    isActive: { type: Boolean, default: true }
  }],
  tierBenefits: [{
    tier: { type: String },
    name: { type: String },
    earnMultiplier: { type: Number },
    redeemMultiplier: { type: Number },
    benefits: [{ type: String }],
    minPoints: { type: Number },
    maxPoints: { type: Number }
  }]
}, { timestamps: true, versionKey: false });

LoyaltyTwinSchema.methods.toTwinOsEntityId = function(): string {
  return `twin.restaurant.loyalty.${this.loyaltyId}`;
};

LoyaltyTwinSchema.methods.calculateTier = function(): LoyaltyTier {
  const points = this.lifetimePoints;
  if (points >= TIER_THRESHOLDS[LoyaltyTier.PLATINUM]) return LoyaltyTier.PLATINUM;
  if (points >= TIER_THRESHOLDS[LoyaltyTier.GOLD]) return LoyaltyTier.GOLD;
  if (points >= TIER_THRESHOLDS[LoyaltyTier.SILVER]) return LoyaltyTier.SILVER;
  return LoyaltyTier.BRONZE;
};

LoyaltyTwinSchema.methods.calculateTierProgress = function(): number {
  const currentTier = this.currentTier;
  const points = this.lifetimePoints;
  const tierOrder = [LoyaltyTier.BRONZE, LoyaltyTier.SILVER, LoyaltyTier.GOLD, LoyaltyTier.PLATINUM];
  const currentIndex = tierOrder.indexOf(currentTier);

  if (currentIndex === tierOrder.length - 1) return 100;

  const currentThreshold = TIER_THRESHOLDS[currentTier];
  const nextThreshold = TIER_THRESHOLDS[tierOrder[currentIndex + 1]];
  const range = nextThreshold - currentThreshold;
  const progress = ((points - currentThreshold) / range) * 100;

  return Math.min(100, Math.max(0, progress));
};

LoyaltyTwinSchema.methods.toJSON = function(): object {
  const obj = this.toObject();
  return {
    twinId: obj.twinId,
    loyaltyId: obj.loyaltyId,
    merchantId: obj.merchantId,
    customerId: obj.customerId,
    currentTier: obj.currentTier,
    pointsBalance: obj.pointsBalance,
    lifetimePoints: obj.lifetimePoints,
    tierProgress: obj.tierProgress,
    transactions: obj.transactions,
    rewards: obj.rewards,
    tierBenefits: obj.tierBenefits,
    twinOsEntityId: this.toTwinOsEntityId(),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

LoyaltyTwinSchema.statics.findByLoyaltyId = function(loyaltyId: string) {
  return this.findOne({ loyaltyId });
};

LoyaltyTwinSchema.statics.findByCustomerId = function(customerId: string) {
  return this.findOne({ customerId });
};

LoyaltyTwinSchema.statics.findByMerchantId = function(merchantId: string) {
  return this.find({ merchantId });
};

export const LoyaltyTwin = mongoose.model<ILoyaltyTwinModel>('LoyaltyTwin', LoyaltyTwinSchema);