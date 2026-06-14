import mongoose, { Document, Schema } from 'mongoose';

export interface IAllocation extends Document {
  poolId: mongoose.Types.ObjectId;
  campaignId: string;
  campaignName?: string;
  amount: number;
  reservedAmount: number;
  spentAmount: number;
  status: 'pending' | 'active' | 'paused' | 'exhausted' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  priority: number;
  settings: {
    dailyLimit?: number;
    pacingStrategy?: 'even' | 'frontload' | 'backload';
    autoPauseThreshold?: number;
  };
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AllocationSchema = new Schema<IAllocation>(
  {
    poolId: {
      type: Schema.Types.ObjectId,
      ref: 'BudgetPool',
      required: true,
      index: true,
    },
    campaignId: {
      type: String,
      required: true,
      index: true,
    },
    campaignName: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reservedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'paused', 'exhausted', 'cancelled'],
      default: 'pending',
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
    settings: {
      dailyLimit: {
        type: Number,
      },
      pacingStrategy: {
        type: String,
        enum: ['even', 'frontload', 'backload'],
        default: 'even',
      },
      autoPauseThreshold: {
        type: Number,
      },
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AllocationSchema.index({ poolId: 1, status: 1 });
AllocationSchema.index({ campaignId: 1, status: 1 });
AllocationSchema.index({ endDate: 1 });
AllocationSchema.index({ startDate: -1 });

// Virtual for available amount
AllocationSchema.virtual('availableAmount').get(function () {
  return Math.max(0, this.amount - this.spentAmount - this.reservedAmount);
});

// Methods
AllocationSchema.methods.canSpend = function (amount: number): boolean {
  const available = this.amount - this.spentAmount - this.reservedAmount;
  return available >= amount && (this.status === 'active' || this.status === 'pending');
};

AllocationSchema.methods.isExpired = function (): boolean {
  if (!this.endDate) return false;
  return new Date() > this.endDate;
};

AllocationSchema.methods.isActive = function (): boolean {
  const now = new Date();
  const afterStart = now >= this.startDate;
  const beforeEnd = !this.endDate || now <= this.endDate;
  return this.status === 'active' && afterStart && beforeEnd;
};

export const Allocation = mongoose.model<IAllocation>('Allocation', AllocationSchema);