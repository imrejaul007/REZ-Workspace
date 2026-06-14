import mongoose, { Document, Schema, Types } from 'mongoose';

export type PerformancePeriod = 'daily' | 'weekly' | 'monthly';

export interface IPerformance extends Document {
  _id: Types.ObjectId;
  staffId: Types.ObjectId;
  period: PerformancePeriod;
  date: Date;
  ordersServed: number;
  avgTicketTime: number;
  customerRating?: number;
  tips: number;
  deductions: number;
  bonus: number;
  createdAt: Date;
  updatedAt: Date;
}

const PerformanceSchema = new Schema<IPerformance>(
  {
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
      index: true,
    },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    ordersServed: {
      type: Number,
      default: 0,
      min: 0,
    },
    avgTicketTime: {
      type: Number,
      default: 0, // in minutes
      min: 0,
    },
    customerRating: {
      type: Number,
      min: 0,
      max: 5,
    },
    tips: {
      type: Number,
      default: 0,
      min: 0,
    },
    deductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonus: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient performance queries
PerformanceSchema.index({ staffId: 1, period: 1, date: -1 });
PerformanceSchema.index({ date: 1, period: 1 });

// Virtual to calculate total earnings
PerformanceSchema.virtual('totalEarnings').get(function () {
  return this.tips + this.bonus - this.deductions;
});

// Virtual to calculate efficiency score (higher orders, lower ticket time = better)
PerformanceSchema.virtual('efficiencyScore').get(function () {
  if (this.avgTicketTime === 0) return 0;
  // Simple efficiency metric: orders per minute, normalized
  const baseScore = (this.ordersServed / this.avgTicketTime) * 10;
  return Math.round(baseScore * 100) / 100;
});

// Virtual to get performance rating
PerformanceSchema.virtual('performanceRating').get(function () {
  if (!this.customerRating) return null;

  if (this.customerRating >= 4.5) return 'excellent';
  if (this.customerRating >= 3.5) return 'good';
  if (this.customerRating >= 2.5) return 'average';
  return 'needs_improvement';
});

// Ensure virtuals are included in JSON
PerformanceSchema.set('toJSON', { virtuals: true });
PerformanceSchema.set('toObject', { virtuals: true });

export const Performance = mongoose.model<IPerformance>('Performance', PerformanceSchema);
