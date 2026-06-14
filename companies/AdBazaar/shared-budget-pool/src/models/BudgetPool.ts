import mongoose, { Document, Schema } from 'mongoose';

export interface IBudgetPool extends Document {
  name: string;
  organizationId: string;
  totalBudget: number;
  currentBalance: number;
  reservedAmount: number;
  currency: string;
  description?: string;
  settings: {
    minBalance: number;
    autoReplenish: boolean;
    replenishThreshold: number;
    maxAllocationPercent: number;
  };
  metadata: Record<string, unknown>;
  status: 'active' | 'inactive' | 'frozen';
  createdAt: Date;
  updatedAt: Date;
}

const BudgetPoolSchema = new Schema<IBudgetPool>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    organizationId: {
      type: String,
      required: true,
      index: true,
    },
    totalBudget: {
      type: Number,
      required: true,
      min: 0,
    },
    currentBalance: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reservedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
      uppercase: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    settings: {
      minBalance: {
        type: Number,
        default: 0,
      },
      autoReplenish: {
        type: Boolean,
        default: false,
      },
      replenishThreshold: {
        type: Number,
        default: 0,
      },
      maxAllocationPercent: {
        type: Number,
        default: 100,
        min: 1,
        max: 100,
      },
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'frozen'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
BudgetPoolSchema.index({ organizationId: 1, status: 1 });
BudgetPoolSchema.index({ createdAt: -1 });

// Virtual for available balance
BudgetPoolSchema.virtual('availableBalance').get(function () {
  return Math.max(0, this.currentBalance - this.reservedAmount);
});

// Methods
BudgetPoolSchema.methods.canAllocate = function (amount: number): boolean {
  const availableBalance = this.currentBalance - this.reservedAmount;
  return availableBalance >= amount && this.status === 'active';
};

BudgetPoolSchema.methods.reservedPercent = function (): number {
  if (this.currentBalance === 0) return 0;
  return (this.reservedAmount / this.currentBalance) * 100;
};

export const BudgetPool = mongoose.model<IBudgetPool>('BudgetPool', BudgetPoolSchema);