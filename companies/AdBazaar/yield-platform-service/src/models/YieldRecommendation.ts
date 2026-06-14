import mongoose, { Document, Schema } from 'mongoose';

// Recommendation action interface
export interface IRecommendationAction {
  type: 'adjust_floor' | 'enable_strategy' | 'disable_strategy' | 'reorder_priority' | 'add_demand' | 'modify_pacing';
  target: string;
  value?: any;
  reason?: string;
}

// Recommendation impact interface
export interface IRecommendationImpact {
  estimatedRevenue: number;
  estimatedEcpm: number;
  estimatedFillRate: number;
  confidence: number;
  timeframe: string;
}

// Yield recommendation document interface
export interface IYieldRecommendation extends Document {
  type: 'floor_optimization' | 'strategy_adjustment' | 'demand_forecast' | 'inventory_mix' | 'pacing_adjustment';
  category: 'revenue' | 'fill_rate' | 'ecpm' | 'efficiency' | 'risk';
  title: string;
  description: string;
  action: IRecommendationAction;
  impact: IRecommendationImpact;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'applied' | 'dismissed' | 'expired';
  inventoryTypes: string[];
  demandSources: string[];
  conditions: {
    currentValue?: number;
    threshold?: number;
    trend?: 'increasing' | 'decreasing' | 'stable';
  };
  expiresAt?: Date;
  appliedAt?: Date;
  appliedBy?: string;
  metadata: {
    model: string;
    features: string[];
    reasoning?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema for YieldRecommendation
const RecommendationActionSchema = new Schema({
  type: {
    type: String,
    enum: ['adjust_floor', 'enable_strategy', 'disable_strategy', 'reorder_priority', 'add_demand', 'modify_pacing'],
    required: true
  },
  target: { type: String, required: true },
  value: { type: Schema.Types.Mixed },
  reason: { type: String }
}, { _id: false });

const RecommendationImpactSchema = new Schema({
  estimatedRevenue: { type: Number, required: true },
  estimatedEcpm: { type: Number, required: true },
  estimatedFillRate: { type: Number, required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  timeframe: { type: String, required: true }
}, { _id: false });

const YieldRecommendationSchema = new Schema({
  type: {
    type: String,
    enum: ['floor_optimization', 'strategy_adjustment', 'demand_forecast', 'inventory_mix', 'pacing_adjustment'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['revenue', 'fill_rate', 'ecpm', 'efficiency', 'risk'],
    required: true,
    index: true
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  action: { type: RecommendationActionSchema, required: true },
  impact: { type: RecommendationImpactSchema, required: true },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'applied', 'dismissed', 'expired'],
    default: 'pending',
    index: true
  },
  inventoryTypes: [{ type: String, index: true }],
  demandSources: [{ type: String, index: true }],
  conditions: {
    currentValue: { type: Number },
    threshold: { type: Number },
    trend: {
      type: String,
      enum: ['increasing', 'decreasing', 'stable']
    }
  },
  expiresAt: { type: Date, index: true },
  appliedAt: { type: Date },
  appliedBy: { type: String },
  metadata: {
    model: { type: String, required: true },
    features: [String],
    reasoning: { type: String }
  }
}, {
  timestamps: true,
  collection: 'yield_recommendations'
});

// Indexes
YieldRecommendationSchema.index({ status: 1, priority: -1 });
YieldRecommendationSchema.index({ type: 1, status: 1 });
YieldRecommendationSchema.index({ inventoryTypes: 1, status: 1 });
YieldRecommendationSchema.index({ createdAt: -1 });

// Pre-save hook to set expiration
YieldRecommendationSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    // Default expiration: 7 days for low priority, 3 days for high priority
    const days = this.priority === 'critical' || this.priority === 'high' ? 3 : 7;
    this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
  next();
});

// Static methods
YieldRecommendationSchema.statics.findPending = function(options?: {
  priority?: string;
  inventoryType?: string;
  limit?: number;
}) {
  const query: any = {
    status: 'pending',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gte: new Date() } }
    ]
  };

  if (options?.priority) {
    query.priority = options.priority;
  }
  if (options?.inventoryType) {
    query.inventoryTypes = options.inventoryType;
  }

  return this.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .limit(options?.limit || 50);
};

YieldRecommendationSchema.statics.findByInventory = function(inventoryType: string) {
  return this.find({
    inventoryTypes: inventoryType,
    status: 'pending',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gte: new Date() } }
    ]
  }).sort({ priority: -1, createdAt: -1 });
};

YieldRecommendationSchema.statics.markAsApplied = async function(
  recommendationId: string,
  appliedBy: string
) {
  return this.findByIdAndUpdate(recommendationId, {
    $set: {
      status: 'applied',
      appliedAt: new Date(),
      appliedBy
    }
  }, { new: true });
};

YieldRecommendationSchema.statics.dismiss = async function(
  recommendationId: string,
  reason?: string
) {
  return this.findByIdAndUpdate(recommendationId, {
    $set: {
      status: 'dismissed',
      'metadata.reasoning': reason
    }
  }, { new: true });
};

YieldRecommendationSchema.statics.expireOld = async function() {
  return this.updateMany(
    {
      status: 'pending',
      expiresAt: { $lt: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );
};

export const YieldRecommendation = mongoose.model<IYieldRecommendation>('YieldRecommendation', YieldRecommendationSchema);