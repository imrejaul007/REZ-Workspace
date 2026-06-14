import mongoose, { Schema, Document } from 'mongoose';

export interface IHealthBenefit extends Document {
  benefitId: string;
  name: string;
  description: string;
  coverageType: 'individual' | 'family' | 'corporate';
  coverageAmount: number;
  deductible?: number;
  premium: number;
  provider: string;
  features: string[];
  waitingPeriod?: number;
  exclusions: string[];
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

const HealthBenefitSchema = new Schema<IHealthBenefit>({
  benefitId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  coverageType: {
    type: String,
    enum: ['individual', 'family', 'corporate'],
    required: true,
  },
  coverageAmount: { type: Number, required: true },
  deductible: { type: Number },
  premium: { type: Number, required: true },
  provider: { type: String, required: true },
  features: [{ type: String }],
  waitingPeriod: { type: Number },
  exclusions: [{ type: String }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active',
  },
}, { timestamps: true });

HealthBenefitSchema.index({ coverageType: 1 });
HealthBenefitSchema.index({ status: 1 });
HealthBenefitSchema.index({ coverageAmount: 1 });

export const HealthBenefit = mongoose.model<IHealthBenefit>('HealthBenefit', HealthBenefitSchema);
