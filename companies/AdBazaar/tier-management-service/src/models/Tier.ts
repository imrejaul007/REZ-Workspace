import mongoose, { Document, Schema } from 'mongoose';

export interface ITier extends Document {
  tierId: string;
  name: string;
  level: number;
  description: string;
  minPoints: number;
  maxPoints?: number;
  benefits: string[];
  perks: {
    discountPercent: number;
    cashbackPercent: number;
    prioritySupport: boolean;
    exclusiveAccess: boolean;
    freeDelivery: boolean;
    extendedWarranty: boolean;
  };
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TierSchema = new Schema<ITier>(
  {
    tierId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    level: { type: Number, required: true, unique: true },
    description: { type: String, default: '' },
    minPoints: { type: Number, required: true },
    maxPoints: { type: Number },
    benefits: [{ type: String }],
    perks: {
      discountPercent: { type: Number, default: 0 },
      cashbackPercent: { type: Number, default: 0 },
      prioritySupport: { type: Boolean, default: false },
      exclusiveAccess: { type: Boolean, default: false },
      freeDelivery: { type: Boolean, default: false },
      extendedWarranty: { type: Boolean, default: false }
    },
    color: { type: String, default: '#000000' },
    icon: { type: String, default: 'star' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

TierSchema.index({ level: 1 });
TierSchema.index({ minPoints: 1 });

export const Tier = mongoose.model<ITier>('Tier', TierSchema);