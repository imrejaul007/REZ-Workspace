import mongoose, { Schema, Document } from 'mongoose';

export type BudgetType = 'monthly' | 'quarterly' | 'annual' | 'campaign';

export interface IBudget extends Document {
  budgetId: string;
  fundId: string;
  type: BudgetType;
  period: {
    start: Date;
    end: Date;
  };
  allocatedAmount: number;
  spentAmount: number;
  reservedAmount: number;
  availableAmount: number;
  allocations: Array<{
    partnerId: string;
    amount: number;
    reserved: number;
    spent: number;
  }>;
  alerts: {
    threshold50: boolean;
    threshold75: boolean;
    threshold90: boolean;
    threshold100: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    budgetId: { type: String, required: true, unique: true, index: true },
    fundId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual', 'campaign'],
      required: true,
    },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    allocatedAmount: { type: Number, required: true, min: 0 },
    spentAmount: { type: Number, default: 0 },
    reservedAmount: { type: Number, default: 0 },
    availableAmount: { type: Number, required: true, min: 0 },
    allocations: [{
      partnerId: { type: String, required: true },
      amount: { type: Number, required: true },
      reserved: { type: Number, default: 0 },
      spent: { type: Number, default: 0 },
    }],
    alerts: {
      threshold50: { type: Boolean, default: false },
      threshold75: { type: Boolean, default: false },
      threshold90: { type: Boolean, default: false },
      threshold100: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

BudgetSchema.index({ fundId: 1, 'period.start': 1 });

export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);