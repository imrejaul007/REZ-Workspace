import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const DecisionTypeSchema = z.enum([
  'budget_reallocation',
  'bid_adjustment',
  'audience_expansion',
  'audience_restriction',
  'creative_rotation',
  'placement_optimization',
  'keyword_bidding',
  'frequency_capping',
  'ad_format_switch',
  'campaign_pause',
  'campaign_resume',
  'targeting_adjustment',
  'schedule_optimization'
]);

export const DecisionActionSchema = z.object({
  type: z.string(),
  target: z.string(),
  currentValue: z.any(),
  proposedValue: z.any(),
  priority: z.enum(['low', 'medium', 'high', 'critical'])
});

export interface IDecision extends Document {
  campaignId: mongoose.Types.ObjectId;
  type: z.infer<typeof DecisionTypeSchema>;
  action: z.infer<typeof DecisionActionSchema>;
  reasoning: {
    analysis: string;
    data: Record<string, any>;
    confidence: number;
    alternatives: string[];
  };
  impact: {
    expectedChange: number;
    riskLevel: 'low' | 'medium' | 'high';
    estimatedTimeToImpact: string;
  };
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  autoApproved: boolean;
  executed: boolean;
  executedAt?: Date;
  results?: {
    actualChange: number;
    success: boolean;
    notes: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DecisionSchema = new Schema<IDecision>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'AutonomousCampaign', required: true, index: true },
    type: {
      type: String,
      enum: DecisionTypeSchema.options,
      required: true
    },
    action: {
      type: { type: String, required: true },
      target: { type: String, required: true },
      currentValue: { type: Schema.Types.Mixed },
      proposedValue: { type: Schema.Types.Mixed },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
      }
    },
    reasoning: {
      analysis: { type: String, required: true },
      data: { type: Schema.Types.Mixed, default: {} },
      confidence: { type: Number, min: 0, max: 1, default: 0.5 },
      alternatives: { type: [String], default: [] }
    },
    impact: {
      expectedChange: { type: Number, default: 0 },
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
      },
      estimatedTimeToImpact: { type: String, default: '24h' }
    },
    approved: { type: Boolean, default: false },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    autoApproved: { type: Boolean, default: false },
    executed: { type: Boolean, default: false },
    executedAt: { type: Date },
    results: {
      actualChange: { type: Number },
      success: { type: Boolean },
      notes: { type: String }
    }
  },
  {
    timestamps: true
  }
);

// Indexes
DecisionSchema.index({ campaignId: 1, createdAt: -1 });
DecisionSchema.index({ campaignId: 1, approved: 1, executed: 1 });
DecisionSchema.index({ type: 1, createdAt: -1 });

export const Decision = mongoose.model<IDecision>('Decision', DecisionSchema);

export default Decision;