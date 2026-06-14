import mongoose, { Schema, Document } from 'mongoose';

export interface IFillAnalysis extends Document {
  inventoryId: string;
  inventoryName?: string;
  analysisDate: Date;
  factors: {
    name: string;
    impact: number;
    description: string;
    category: 'demand' | 'supply' | 'technical' | 'pricing';
  }[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    expectedImpact: number;
    implementation: string;
    category: 'inventory' | 'demand' | 'pricing' | 'technical';
  }[];
  metrics: {
    avgFillRate: number;
    minFillRate: number;
    maxFillRate: number;
    totalImpressions: number;
    totalFilled: number;
    fillRateVariance: number;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const FactorSchema = new Schema({
  name: { type: String, required: true },
  impact: { type: Number, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['demand', 'supply', 'technical', 'pricing'],
    required: true
  }
}, { _id: false });

const RecommendationSchema = new Schema({
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    required: true
  },
  action: { type: String, required: true },
  expectedImpact: { type: Number, required: true },
  implementation: { type: String, required: true },
  category: {
    type: String,
    enum: ['inventory', 'demand', 'pricing', 'technical'],
    required: true
  }
}, { _id: false });

const MetricsSchema = new Schema({
  avgFillRate: { type: Number, required: true },
  minFillRate: { type: Number, required: true },
  maxFillRate: { type: Number, required: true },
  totalImpressions: { type: Number, required: true },
  totalFilled: { type: Number, required: true },
  fillRateVariance: { type: Number, required: true }
}, { _id: false });

const FillAnalysisSchema = new Schema<IFillAnalysis>(
  {
    inventoryId: {
      type: String,
      required: true,
      index: true
    },
    inventoryName: {
      type: String,
      required: false
    },
    analysisDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    factors: [FactorSchema],
    recommendations: [RecommendationSchema],
    metrics: {
      type: MetricsSchema,
      required: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false
    }
  },
  {
    timestamps: true,
    collection: 'fill_analyses'
  }
);

// Indexes
FillAnalysisSchema.index({ inventoryId: 1, analysisDate: -1 });
FillAnalysisSchema.index({ 'recommendations.priority': 1 });

export const FillAnalysis = mongoose.model<IFillAnalysis>('FillAnalysis', FillAnalysisSchema);
