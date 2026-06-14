import mongoose, { Document, Schema } from 'mongoose';

export interface IResultDocument extends Document {
  experimentId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  date: Date;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  cost: number;
  lift?: number;
  confidence?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ResultSchema = new Schema<IResultDocument>(
  {
    experimentId: {
      type: Schema.Types.ObjectId,
      ref: 'Experiment',
      required: true,
      index: true
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'TestGroup',
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    impressions: {
      type: Number,
      default: 0,
      min: 0
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0
    },
    conversions: {
      type: Number,
      default: 0,
      min: 0
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0
    },
    cost: {
      type: Number,
      default: 0,
      min: 0
    },
    lift: {
      type: Number
    },
    confidence: {
      type: Number
    }
  },
  {
    timestamps: true,
    collection: 'results'
  }
);

// Compound indexes for efficient queries
ResultSchema.index({ experimentId: 1, groupId: 1, date: -1 });
ResultSchema.index({ experimentId: 1, date: -1 });

// Virtual for CTR
ResultSchema.virtual('ctr').get(function() {
  if (this.impressions > 0) {
    return (this.clicks / this.impressions) * 100;
  }
  return 0;
});

// Virtual for CVR
ResultSchema.virtual('cvr').get(function() {
  if (this.clicks > 0) {
    return (this.conversions / this.clicks) * 100;
  }
  return 0;
});

// Virtual for CPA
ResultSchema.virtual('cpa').get(function() {
  if (this.conversions > 0) {
    return this.cost / this.conversions;
  }
  return 0;
});

// Virtual for ROAS
ResultSchema.virtual('roas').get(function() {
  if (this.cost > 0) {
    return this.revenue / this.cost;
  }
  return 0;
});

// Static methods
ResultSchema.statics.getAggregatedResults = async function(
  experimentId: mongoose.Types.ObjectId,
  groupId?: mongoose.Types.ObjectId
) {
  const matchStage: Record<string, unknown> = { experimentId };
  if (groupId) {
    matchStage.groupId = groupId;
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: groupId ? '$groupId' : null,
        totalImpressions: { $sum: '$impressions' },
        totalClicks: { $sum: '$clicks' },
        totalConversions: { $sum: '$conversions' },
        totalRevenue: { $sum: '$revenue' },
        totalCost: { $sum: '$cost' },
        avgLift: { $avg: '$lift' },
        avgConfidence: { $avg: '$confidence' },
        days: { $sum: 1 }
      }
    }
  ]);
};

ResultSchema.statics.getDailyResults = async function(
  experimentId: mongoose.Types.ObjectId,
  startDate?: Date,
  endDate?: Date
) {
  const matchStage: Record<string, unknown> = { experimentId };

  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) {
      (matchStage.date as Record<string, Date>).$gte = startDate;
    }
    if (endDate) {
      (matchStage.date as Record<string, Date>).$lte = endDate;
    }
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          groupId: '$groupId'
        },
        impressions: { $sum: '$impressions' },
        clicks: { $sum: '$clicks' },
        conversions: { $sum: '$conversions' },
        revenue: { $sum: '$revenue' },
        cost: { $sum: '$cost' }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);
};

export const Result = mongoose.model<IResultDocument>('Result', ResultSchema);