import mongoose, { Document, Schema } from 'mongoose';

// Strategy rule interface
export interface IStrategyRule {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains';
  value: any;
  weight?: number;
}

// Strategy condition group interface
export interface IStrategyCondition {
  operator: 'and' | 'or';
  conditions: IStrategyRule[];
}

// Strategy performance metrics
export interface IStrategyPerformance {
  impressions: number;
  revenue: number;
  ecpm: number;
  fillRate: number;
  ctr: number;
  conversionRate: number;
  startDate: Date;
  endDate?: Date;
}

// Yield strategy document interface
export interface IYieldStrategy extends Document {
  name: string;
  description?: string;
  type: 'floor' | 'priority' | 'waterfall' | 'header_bidding' | 'dynamic';
  status: 'active' | 'paused' | 'archived';
  priority: number;
  rules: IStrategyCondition[];
  settings: {
    floorPrice?: number;
    maxBids?: number;
    timeout?: number;
    targeting?: Record<string, any>;
    pacing?: {
      enabled: boolean;
      dailyLimit?: number;
      hourlyLimit?: number;
    };
  };
  inventoryTypes: string[];
  demandSources: string[];
  performance: IStrategyPerformance;
  metadata: {
    createdBy: string;
    updatedBy: string;
    tags?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema for YieldStrategy
const StrategyRuleSchema = new Schema({
  field: { type: String, required: true },
  operator: {
    type: String,
    enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains'],
    required: true
  },
  value: { type: Schema.Types.Mixed, required: true },
  weight: { type: Number, default: 1 }
}, { _id: false });

const StrategyConditionSchema = new Schema({
  operator: { type: String, enum: ['and', 'or'], required: true },
  conditions: [StrategyRuleSchema]
}, { _id: false });

const StrategyPerformanceSchema = new Schema({
  impressions: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  ecpm: { type: Number, default: 0 },
  fillRate: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date }
}, { _id: false });

const YieldStrategySchema = new Schema({
  name: { type: String, required: true, unique: true, index: true },
  description: { type: String },
  type: {
    type: String,
    enum: ['floor', 'priority', 'waterfall', 'header_bidding', 'dynamic'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'archived'],
    default: 'paused',
    index: true
  },
  priority: { type: Number, required: true, default: 0 },
  rules: [StrategyConditionSchema],
  settings: {
    floorPrice: { type: Number },
    maxBids: { type: Number, default: 10 },
    timeout: { type: Number, default: 100 },
    targeting: { type: Schema.Types.Mixed },
    pacing: {
      enabled: { type: Boolean, default: false },
      dailyLimit: { type: Number },
      hourlyLimit: { type: Number }
    }
  },
  inventoryTypes: [{ type: String, index: true }],
  demandSources: [{ type: String, index: true }],
  performance: { type: StrategyPerformanceSchema, default: () => ({}) },
  metadata: {
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true },
    tags: [String]
  }
}, {
  timestamps: true,
  collection: 'yield_strategies'
});

// Indexes
YieldStrategySchema.index({ status: 1, priority: -1 });
YieldStrategySchema.index({ inventoryTypes: 1, status: 1 });
YieldStrategySchema.index({ type: 1, status: 1 });

// Pre-save hook to update performance dates
YieldStrategySchema.pre('save', function(next) {
  if (this.isNew) {
    this.performance.startDate = new Date();
  }
  next();
});

// Static methods
YieldStrategySchema.statics.findActive = function() {
  return this.find({ status: 'active' }).sort({ priority: -1 });
};

YieldStrategySchema.statics.findByInventoryType = function(inventoryType: string) {
  return this.find({
    inventoryTypes: inventoryType,
    status: 'active'
  }).sort({ priority: -1 });
};

YieldStrategySchema.statics.findByDemandSource = function(demandSource: string) {
  return this.find({
    demandSources: demandSource,
    status: 'active'
  }).sort({ priority: -1 });
};

YieldStrategySchema.statics.updatePerformance = async function(
  strategyId: string,
  performance: Partial<IStrategyPerformance>
) {
  return this.findByIdAndUpdate(strategyId, {
    $set: { performance }
  }, { new: true });
};

export const YieldStrategy = mongoose.model<IYieldStrategy>('YieldStrategy', YieldStrategySchema);