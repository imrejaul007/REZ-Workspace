import mongoose, { Document, Schema } from 'mongoose';

export interface IBenefit extends Document {
  benefitId: string;
  tierId: string;
  name: string;
  description: string;
  type: 'discount' | 'cashback' | 'access' | 'service' | 'product';
  value: number;
  unit?: string;
  maxUsage?: number;
  currentUsage: number;
  validFrom?: Date;
  validUntil?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BenefitSchema = new Schema<IBenefit>(
  {
    benefitId: { type: String, required: true, unique: true, index: true },
    tierId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['discount', 'cashback', 'access', 'service', 'product'], required: true },
    value: { type: Number, required: true },
    unit: { type: String },
    maxUsage: { type: Number },
    currentUsage: { type: Number, default: 0 },
    validFrom: { type: Date },
    validUntil: { type: Date },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

BenefitSchema.index({ tierId: 1, type: 1 });

export const Benefit = mongoose.model<IBenefit>('Benefit', BenefitSchema);