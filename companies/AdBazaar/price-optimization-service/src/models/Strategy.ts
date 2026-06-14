import mongoose, { Document, Schema } from 'mongoose';

export interface IStrategy extends Document {
  strategyId: string;
  name: string;
  companyId: string;
  type: 'dynamic' | 'competitor' | 'demand' | 'time_based' | 'segment';
  rules: {
    condition: { field: string; operator: string; value: unknown };
    adjustment: { type: 'percentage' | 'fixed'; value: number };
    priority: number;
  }[];
  minPricePercent: number;
  maxPricePercent: number;
  updateFrequency: number;
  competitors?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StrategySchema = new Schema<IStrategy>(
  {
    strategyId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    companyId: { type: String, required: true, index: true },
    type: { type: String, enum: ['dynamic', 'competitor', 'demand', 'time_based', 'segment'], required: true },
    rules: [{
      condition: { field: { type: String }, operator: { type: String }, value: { type: Schema.Types.Mixed } },
      adjustment: { type: { type: String, enum: ['percentage', 'fixed'] }, value: { type: Number } },
      priority: { type: Number }
    }],
    minPricePercent: { type: Number, default: 80 },
    maxPricePercent: { type: Number, default: 120 },
    updateFrequency: { type: Number, default: 3600 },
    competitors: [{ type: String }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

StrategySchema.index({ companyId: 1, isActive: 1 });
StrategySchema.index({ type: 1, isActive: 1 });

export const Strategy = mongoose.model<IStrategy>('Strategy', StrategySchema);