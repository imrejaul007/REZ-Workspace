import mongoose, { Schema, Document } from 'mongoose';

export type BenefitType = 'meal' | 'travel' | 'wellness' | 'learning' | 'gift';
export type BenefitPeriodType = 'monthly' | 'quarterly' | 'yearly' | 'onetime';

export interface ICorporateBenefit extends Document {
  benefitId: string;
  companyId: string;
  name: string;
  type: BenefitType;
  description: string;
  amount: number;
  currency: string;
  period: BenefitPeriodType;
  validFrom: Date;
  validUntil?: Date;
  maxUsage?: number;
  usageCount: number;
  status: 'active' | 'inactive' | 'expired';
  categories: string[];
  eligibleLevels: string[];
  exclusions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CorporateBenefitSchema = new Schema<ICorporateBenefit>({
  benefitId: { type: String, required: true, unique: true },
  companyId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['meal', 'travel', 'wellness', 'learning', 'gift'], required: true },
  description: { type: String, default: '' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  period: { type: String, enum: ['monthly', 'quarterly', 'yearly', 'onetime'], default: 'monthly' },
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date },
  maxUsage: { type: Number },
  usageCount: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'active' },
  categories: [{ type: String }],
  eligibleLevels: [{ type: String }],
  exclusions: [{ type: String }],
}, { timestamps: true });

CorporateBenefitSchema.index({ companyId: 1, status: 1 });

export const CorporateBenefit = mongoose.model<ICorporateBenefit>('CorporateBenefit', CorporateBenefitSchema);
