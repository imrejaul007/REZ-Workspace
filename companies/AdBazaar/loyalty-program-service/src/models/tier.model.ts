import mongoose, { Document, Schema } from 'mongoose';

export interface ITier extends Document {
  tierId: string;
  programId: string;
  name: string;
  level: number;
  minPoints: number;
  maxPoints?: number;
  benefits: string[];
  multiplier: number;
  requirements?: {
    minPurchases?: number;
    minOrders?: number;
    tenureDays?: number;
  };
  perks: Array<{
    type: 'discount' | 'free_shipping' | 'priority_support' | 'exclusive_access' | 'cashback';
    value?: number;
    description: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const perkSchema = new Schema({
  type: { type: String, required: true },
  value: Number,
  description: { type: String, required: true }
}, { _id: false });

const tierSchema = new Schema<ITier>({
  tierId: { type: String, required: true, unique: true },
  programId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  level: { type: Number, required: true },
  minPoints: { type: Number, required: true },
  maxPoints: Number,
  benefits: [String],
  multiplier: { type: Number, default: 1 },
  requirements: {
    minPurchases: Number,
    minOrders: Number,
    tenureDays: Number
  },
  perks: [perkSchema]
}, { timestamps: true });

tierSchema.index({ tierId: 1 });
tierSchema.index({ programId: 1, level: 1 });

export const Tier = mongoose.model<ITier>('Tier', tierSchema);