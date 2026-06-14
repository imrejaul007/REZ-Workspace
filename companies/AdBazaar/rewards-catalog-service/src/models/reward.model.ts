import mongoose, { Document, Schema } from 'mongoose';

export interface IReward extends Document {
  rewardId: string;
  name: string;
  description?: string;
  type: 'discount' | 'gift_card' | 'product' | 'voucher' | 'experience' | 'charity';
  category: string;
  imageUrl?: string;
  pointsCost: number;
  actualValue?: number;
  currency?: string;
  status: 'active' | 'inactive' | 'out_of_stock' | 'archived';
  inventory?: number;
  inventoryUsed: number;
  minTier?: string;
  maxRedemptionsPerUser?: number;
  validFrom?: Date;
  validUntil?: Date;
  terms?: string;
  redemptionInstructions?: string;
  metadata?: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const rewardSchema = new Schema<IReward>({
  rewardId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  type: {
    type: String,
    enum: ['discount', 'gift_card', 'product', 'voucher', 'experience', 'charity'],
    required: true
  },
  category: { type: String, required: true },
  imageUrl: String,
  pointsCost: { type: Number, required: true, min: 0 },
  actualValue: Number,
  currency: { type: String, default: 'points' },
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock', 'archived'],
    default: 'active'
  },
  inventory: Number,
  inventoryUsed: { type: Number, default: 0 },
  minTier: String,
  maxRedemptionsPerUser: { type: Number, default: 1 },
  validFrom: Date,
  validUntil: Date,
  terms: String,
  redemptionInstructions: String,
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
  createdBy: { type: String, required: true }
}, { timestamps: true });

rewardSchema.index({ rewardId: 1 });
rewardSchema.index({ category: 1, status: 1 });
rewardSchema.index({ pointsCost: 1 });
rewardSchema.index({ status: 1, validUntil: 1 });
rewardSchema.index({ createdBy: 1 });

export const Reward = mongoose.model<IReward>('Reward', rewardSchema);