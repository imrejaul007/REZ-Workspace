import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const OptimizationTypeSchema = z.enum([
  'budget_reallocation',
  'bid_optimization',
  'audience_refinement',
  'creative_testing',
  'placement_optimization',
  'keyword_optimization',
  'frequency_optimization',
  'schedule_optimization',
  'targeting_refresh',
  'seasonal_adjustment',
  'competitive_responsive',
  'performance_boost'
]);

export interface IOptimization extends Document {
  campaignId: mongoose.Types.ObjectId;
  type: z.infer<typeof OptimizationTypeSchema>;
  changes: {
    before: Record<string, any>;
    after: Record<string, any>;
    parameters: string[];
  };
  impact: {
    metrics: {
      impressions?: number;
      clicks?: number;
      conversions?: number;
      roas?: number;
      ctr?: number;
      cpc?: number;
      cpa?: number;
    };
    score: number;
    confidence: number;
  };
  decisionId?: mongoose.Types.ObjectId;
  automated: boolean;
  createdAt: Date;
}

const OptimizationSchema = new Schema<IOptimization>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'AutonomousCampaign', required: true, index: true },
    type: {
      type: String,
      enum: OptimizationTypeSchema.options,
      required: true
    },
    changes: {
      before: { type: Schema.Types.Mixed, required: true },
      after: { type: Schema.Types.Mixed, required: true },
      parameters: { type: [String], default: [] }
    },
    impact: {
      metrics: {
        impressions: { type: Number },
        clicks: { type: Number },
        conversions: { type: Number },
        roas: { type: Number },
        ctr: { type: Number },
        cpc: { type: Number },
        cpa: { type: Number }
      },
      score: { type: Number, default: 0 },
      confidence: { type: Number, min: 0, max: 1, default: 0.5 }
    },
    decisionId: { type: Schema.Types.ObjectId, ref: 'Decision' },
    automated: { type: Boolean, default: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Indexes
OptimizationSchema.index({ campaignId: 1, createdAt: -1 });
OptimizationSchema.index({ campaignId: 1, type: 1, createdAt: -1 });

export const Optimization = mongoose.model<IOptimization>('Optimization', OptimizationSchema);

export default Optimization;