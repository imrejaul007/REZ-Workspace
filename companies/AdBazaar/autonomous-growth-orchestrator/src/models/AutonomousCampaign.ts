import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

// Zod validation schema for campaign creation
export const CampaignObjectiveSchema = z.object({
  type: z.enum(['conversions', 'clicks', 'impressions', 'reach', 'engagement', 'roas']),
  target: z.number().positive(),
  minTarget: z.number().positive().optional()
});

export const CampaignBudgetSchema = z.object({
  total: z.number().positive(),
  daily: z.number().positive().optional(),
  spent: z.number().min(0).default(0),
  currency: z.string().default('INR')
});

export const CampaignConstraintsSchema = z.object({
  minBid: z.number().positive().optional(),
  maxBid: z.number().positive().optional(),
  minBudget: z.number().positive().optional(),
  maxBudget: z.number().positive().optional(),
  excludedAudiences: z.array(z.string()).optional(),
  excludedPlacements: z.array(z.string()).optional(),
  allowedAdFormats: z.array(z.enum(['display', 'video', 'native', 'search'])).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  customConstraints: z.record(z.any()).optional()
});

export interface IAutonomousCampaign extends Document {
  advertiserId: string;
  name: string;
  description?: string;
  objectives: z.infer<typeof CampaignObjectiveSchema>[];
  constraints: z.infer<typeof CampaignConstraintsSchema>;
  budget: z.infer<typeof CampaignBudgetSchema>;
  status: 'draft' | 'pending' | 'active' | 'paused' | 'completed' | 'failed';
  autonomousMode: boolean;
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    roas: number;
    ctr: number;
    cpc: number;
    cpa: number;
  };
  lastOptimization?: Date;
  nextOptimization?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AutonomousCampaignSchema = new Schema<IAutonomousCampaign>(
  {
    advertiserId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    objectives: {
      type: [Schema.Types.Mixed],
      required: true,
      validate: {
        validator: (v: any[]) => v.length > 0 && v.length <= 5,
        message: 'Campaign must have 1-5 objectives'
      }
    },
    constraints: { type: Schema.Types.Mixed, default: {} },
    budget: {
      total: { type: Number, required: true },
      daily: { type: Number },
      spent: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' }
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'active', 'paused', 'completed', 'failed'],
      default: 'draft'
    },
    autonomousMode: { type: Boolean, default: false },
    performance: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      spend: { type: Number, default: 0 },
      roas: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      cpc: { type: Number, default: 0 },
      cpa: { type: Number, default: 0 }
    },
    lastOptimization: { type: Date },
    nextOptimization: { type: Date }
  },
  {
    timestamps: true
  }
);

// Indexes
AutonomousCampaignSchema.index({ advertiserId: 1, status: 1 });
AutonomousCampaignSchema.index({ autonomousMode: 1, status: 1 });
AutonomousCampaignSchema.index({ createdAt: -1 });

export const AutonomousCampaign = mongoose.model<IAutonomousCampaign>(
  'AutonomousCampaign',
  AutonomousCampaignSchema
);

export default AutonomousCampaign;