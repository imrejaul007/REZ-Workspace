import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { RewardType, RewardStatus } from '../types';

export interface IReward {
  id: string;
  name: string;
  description?: string;
  type: RewardType;
  value: number;
  pointsCost: number;
  minPurchaseAmount: number;
  maxDiscountAmount?: number;
  applicableCategories: string[];
  applicableProducts: string[];
  usageLimit?: number;
  usageCount: number;
  validFrom?: Date;
  validUntil?: Date;
  isActive: boolean;
  image?: string;
  status: RewardStatus;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRewardDocument extends Omit<IReward, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const RewardSchema = new Schema<IRewardDocument>({
  id: { type: String, default: () => uuidv4(), unique: true, index: true },
  name: { type: String, required: true, maxlength: 200 },
  description: { type: String, maxlength: 500 },
  type: {
    type: String,
    enum: Object.values(RewardType),
    required: true,
  },
  value: { type: Number, required: true, min: 0 },
  pointsCost: { type: Number, required: true, min: 0 },
  minPurchaseAmount: { type: Number, default: 0, min: 0 },
  maxDiscountAmount: { type: Number, min: 0 },
  applicableCategories: [{ type: String }],
  applicableProducts: [{ type: String }],
  usageLimit: { type: Number, min: 1 },
  usageCount: { type: Number, default: 0, min: 0 },
  validFrom: { type: Date },
  validUntil: { type: Date },
  isActive: { type: Boolean, default: true, index: true },
  image: { type: String },
  status: {
    type: String,
    enum: Object.values(RewardStatus),
    default: RewardStatus.ACTIVE,
  },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
}, {
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes
RewardSchema.index({ type: 1, isActive: 1 });
RewardSchema.index({ pointsCost: 1 });
RewardSchema.index({ validFrom: 1, validUntil: 1 });

// Pre-save to check validity
RewardSchema.pre('save', function (next) {
  const now = new Date();

  if (this.validUntil && this.validUntil < now) {
    this.status = RewardStatus.EXPIRED;
    this.isActive = false;
  }

  if (this.usageLimit && this.usageCount >= this.usageLimit) {
    this.status = RewardStatus.REDEEMED;
  }

  next();
});

export const Reward = mongoose.model<IRewardDocument>('Reward', RewardSchema);

export default Reward;
