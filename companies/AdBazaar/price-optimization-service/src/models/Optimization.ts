import mongoose, { Document, Schema } from 'mongoose';

export interface IOptimization extends Document {
  optimizationId: string;
  pricingId: string;
  productId: string;
  companyId: string;
  previousPrice: number;
  newPrice: number;
  adjustmentType: 'percentage' | 'fixed';
  adjustmentValue: number;
  reason: string;
  factors: {
    competitorPrice?: number;
    demandScore?: number;
    inventoryLevel?: number;
    timeOfDay?: string;
    dayOfWeek?: number;
  };
  expectedRevenue: number;
  actualRevenue?: number;
  conversionRate: number;
  status: 'pending' | 'applied' | 'reverted' | 'failed';
  appliedAt?: Date;
  revertedAt?: Date;
  createdAt: Date;
}

const OptimizationSchema = new Schema<IOptimization>(
  {
    optimizationId: { type: String, required: true, unique: true, index: true },
    pricingId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    previousPrice: { type: Number, required: true },
    newPrice: { type: Number, required: true },
    adjustmentType: { type: String, enum: ['percentage', 'fixed'], required: true },
    adjustmentValue: { type: Number, required: true },
    reason: { type: String, required: true },
    factors: {
      competitorPrice: { type: Number },
      demandScore: { type: Number },
      inventoryLevel: { type: Number },
      timeOfDay: { type: String },
      dayOfWeek: { type: Number }
    },
    expectedRevenue: { type: Number, required: true },
    actualRevenue: { type: Number },
    conversionRate: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'applied', 'reverted', 'failed'], default: 'pending' },
    appliedAt: { type: Date },
    revertedAt: { type: Date }
  },
  { timestamps: true }
);

OptimizationSchema.index({ pricingId: 1, createdAt: -1 });
OptimizationSchema.index({ productId: 1, status: 1 });
OptimizationSchema.index({ companyId: 1, createdAt: -1 });

export const Optimization = mongoose.model<IOptimization>('Optimization', OptimizationSchema);