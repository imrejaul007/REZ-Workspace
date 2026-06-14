import mongoose, { Document, Schema } from 'mongoose';

// Inventory breakdown interface
export interface IInventoryBreakdown {
  inventoryType: string;
  impressions: number;
  revenue: number;
  ecpm: number;
  fillRate: number;
  requests: number;
}

// Demand source breakdown interface
export interface IDemandBreakdown {
  demandSource: string;
  impressions: number;
  revenue: number;
  ecpm: number;
  fillRate: number;
}

// Yield summary document interface
export interface IYieldSummary extends Document {
  date: Date;
  inventory: {
    total: number;
    breakdown: IInventoryBreakdown[];
  };
  revenue: {
    total: number;
    gross: number;
    net: number;
    currency: string;
  };
  ecpm: {
    average: number;
    byInventory: Map<string, number>;
  };
  fillRate: {
    overall: number;
    byInventory: Map<string, number>;
  };
  requests: {
    total: number;
    matched: number;
    passed: number;
  };
  trends: {
    revenueChange: number;
    ecpmChange: number;
    fillRateChange: number;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
  };
}

// Mongoose schema for YieldSummary
const InventoryBreakdownSchema = new Schema({
  inventoryType: { type: String, required: true, index: true },
  impressions: { type: Number, required: true, default: 0 },
  revenue: { type: Number, required: true, default: 0 },
  ecpm: { type: Number, required: true, default: 0 },
  fillRate: { type: Number, required: true, default: 0 },
  requests: { type: Number, required: true, default: 0 }
}, { _id: false });

const DemandBreakdownSchema = new Schema({
  demandSource: { type: String, required: true, index: true },
  impressions: { type: Number, required: true, default: 0 },
  revenue: { type: Number, required: true, default: 0 },
  ecpm: { type: Number, required: true, default: 0 },
  fillRate: { type: Number, required: true, default: 0 }
}, { _id: false });

const YieldSummarySchema = new Schema({
  date: { type: Date, required: true, index: true, unique: true },
  inventory: {
    total: { type: Number, required: true, default: 0 },
    breakdown: [InventoryBreakdownSchema]
  },
  revenue: {
    total: { type: Number, required: true, default: 0 },
    gross: { type: Number, required: true, default: 0 },
    net: { type: Number, required: true, default: 0 },
    currency: { type: String, required: true, default: 'USD' }
  },
  ecpm: {
    average: { type: Number, required: true, default: 0 },
    byInventory: { type: Map, of: Number, default: new Map() }
  },
  fillRate: {
    overall: { type: Number, required: true, default: 0 },
    byInventory: { type: Map, of: Number, default: new Map() }
  },
  requests: {
    total: { type: Number, required: true, default: 0 },
    matched: { type: Number, required: true, default: 0 },
    passed: { type: Number, required: true, default: 0 }
  },
  trends: {
    revenueChange: { type: Number, default: 0 },
    ecpmChange: { type: Number, default: 0 },
    fillRateChange: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  collection: 'yield_summaries'
});

// Indexes
YieldSummarySchema.index({ date: -1 });
YieldSummarySchema.index({ 'revenue.total': -1 });
YieldSummarySchema.index({ 'ecpm.average': -1 });

// Static methods
YieldSummarySchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

YieldSummarySchema.statics.getLatest = function(limit: number = 1) {
  return this.find().sort({ date: -1 }).limit(limit);
};

YieldSummarySchema.statics.calculateTrends = async function(days: number = 7) {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  const summaries = await this.findByDateRange(startDate, endDate);

  if (summaries.length < 2) {
    return { revenueChange: 0, ecpmChange: 0, fillRateChange: 0 };
  }

  const latest = summaries[summaries.length - 1];
  const previous = summaries[0];

  return {
    revenueChange: latest.revenue.total > 0
      ? ((latest.revenue.total - previous.revenue.total) / previous.revenue.total) * 100
      : 0,
    ecpmChange: latest.ecpm.average > 0
      ? ((latest.ecpm.average - previous.ecpm.average) / previous.ecpm.average) * 100
      : 0,
    fillRateChange: latest.fillRate.overall > 0
      ? ((latest.fillRate.overall - previous.fillRate.overall) / previous.fillRate.overall) * 100
      : 0
  };
};

export const YieldSummary = mongoose.model<IYieldSummary>('YieldSummary', YieldSummarySchema);