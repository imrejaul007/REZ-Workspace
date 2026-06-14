/**
 * ReZ Rewards - Reward Model
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IReward extends Document {
  shop: string;
  tenantId: string;
  brandId: string;
  name: string;
  description: string;
  type: 'discount' | 'free_product' | 'free_shipping' | 'cashback';
  pointsCost: number;
  value: number;
  valueType: 'fixed' | 'percentage';
  minOrderValue?: number;
  maxUses?: number;
  usedCount: number;
  active: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RewardSchema = new Schema({
  shop: { type: String, required: true, lowercase: true, index: true },
  tenantId: { type: String, required: true, index: true },
  brandId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: String,
  type: {
    type: String,
    enum: ['discount', 'free_product', 'free_shipping', 'cashback'],
    required: true,
  },
  pointsCost: { type: Number, required: true },
  value: { type: Number, required: true },
  valueType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
  minOrderValue: Number,
  maxUses: Number,
  usedCount: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  startDate: Date,
  endDate: Date,
}, {
  timestamps: true,
  collection: 'rewards',
});

RewardSchema.index({ shop: 1, active: 1 });
RewardSchema.index({ tenantId: 1, brandId: 1 });

export const Reward = mongoose.model<IReward>('Reward', RewardSchema);
