import mongoose, { Document, Schema } from 'mongoose';

// Usage period type
export enum UsagePeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

// Feature usage tracking
export interface IFeatureUsage {
  feature: string;
  count: number;
  lastUsedAt: Date;
}

// Seat usage document interface
export interface ISeatUsage extends Document {
  _id: mongoose.Types.ObjectId;
  seatId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  period: UsagePeriod;
  periodStart: Date;
  periodEnd: Date;
  apiCalls: number;
  apiCallsLimit: number;
  dataProcessed: number; // in bytes
  dataProcessedLimit: number;
  features: IFeatureUsage[];
  activeDays: number;
  totalSessions: number;
  avgSessionDuration: number; // in seconds
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Feature usage sub-schema
const featureUsageSchema = new Schema<IFeatureUsage>(
  {
    feature: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      default: 0
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

// Seat usage schema
const seatUsageSchema = new Schema<ISeatUsage>(
  {
    seatId: {
      type: Schema.Types.ObjectId,
      ref: 'Seat',
      required: true,
      index: true
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    period: {
      type: String,
      enum: Object.values(UsagePeriod),
      required: true
    },
    periodStart: {
      type: Date,
      required: true,
      index: true
    },
    periodEnd: {
      type: Date,
      required: true
    },
    apiCalls: {
      type: Number,
      default: 0
    },
    apiCallsLimit: {
      type: Number,
      default: 10000
    },
    dataProcessed: {
      type: Number,
      default: 0
    },
    dataProcessedLimit: {
      type: Number,
      default: 1073741824 // 1GB in bytes
    },
    features: [featureUsageSchema],
    activeDays: {
      type: Number,
      default: 0
    },
    totalSessions: {
      type: Number,
      default: 0
    },
    avgSessionDuration: {
      type: Number,
      default: 0
    },
    lastActivityAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes
seatUsageSchema.index({ seatId: 1, period: 1, periodStart: 1 }, { unique: true });
seatUsageSchema.index({ organizationId: 1, period: 1, periodStart: 1 });
seatUsageSchema.index({ periodStart: 1, periodEnd: 1 });

// Instance method to get usage percentage
seatUsageSchema.methods.getApiCallsPercentage = function(): number {
  if (this.apiCallsLimit === 0) return 0;
  return (this.apiCalls / this.apiCallsLimit) * 100;
};

// Instance method to get data usage percentage
seatUsageSchema.methods.getDataProcessedPercentage = function(): number {
  if (this.dataProcessedLimit === 0) return 0;
  return (this.dataProcessed / this.dataProcessedLimit) * 100;
};

// Instance method to check if limits exceeded
seatUsageSchema.methods.isOverLimit = function(): boolean {
  return this.apiCalls > this.apiCallsLimit || this.dataProcessed > this.dataProcessedLimit;
};

// Instance method to increment usage
seatUsageSchema.methods.incrementUsage = function(
  apiCalls: number = 0,
  dataProcessed: number = 0,
  feature?: string
): void {
  this.apiCalls += apiCalls;
  this.dataProcessed += dataProcessed;
  this.lastActivityAt = new Date();

  if (feature) {
    const existingFeature = this.features.find(f => f.feature === feature);
    if (existingFeature) {
      existingFeature.count += 1;
      existingFeature.lastUsedAt = new Date();
    } else {
      this.features.push({
        feature,
        count: 1,
        lastUsedAt: new Date()
      });
    }
  }
};

// Static method to get current period usage
seatUsageSchema.statics.getCurrentUsage = async function(seatId: string, period: UsagePeriod = UsagePeriod.DAILY) {
  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date;

  switch (period) {
    case UsagePeriod.DAILY:
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case UsagePeriod.WEEKLY:
      const dayOfWeek = now.getDay();
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - dayOfWeek));
      break;
    case UsagePeriod.MONTHLY:
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
  }

  return this.findOne({ seatId, period, periodStart });
};

// Static method to get usage history
seatUsageSchema.statics.getUsageHistory = function(seatId: string, limit: number = 30) {
  return this.find({ seatId })
    .sort({ periodStart: -1 })
    .limit(limit);
};

// Static method to aggregate organization usage
seatUsageSchema.statics.aggregateOrganizationUsage = function(organizationId: string, period: UsagePeriod) {
  return this.aggregate([
    { $match: { organizationId, period } },
    {
      $group: {
        _id: null,
        totalApiCalls: { $sum: '$apiCalls' },
        totalDataProcessed: { $sum: '$dataProcessed' },
        totalActiveDays: { $sum: '$activeDays' },
        totalSessions: { $sum: '$totalSessions' },
        avgSessionDuration: { $avg: '$avgSessionDuration' },
        seatCount: { $addToSet: '$seatId' }
      }
    },
    {
      $project: {
        _id: 0,
        totalApiCalls: 1,
        totalDataProcessed: 1,
        totalActiveDays: 1,
        totalSessions: 1,
        avgSessionDuration: 1,
        uniqueSeats: { $size: '$seatCount' }
      }
    }
  ]);
};

// Export the model
export const SeatUsage = mongoose.model<ISeatUsage>('SeatUsage', seatUsageSchema);