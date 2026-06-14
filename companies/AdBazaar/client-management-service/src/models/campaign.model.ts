import mongoose, { Document, Schema } from 'mongoose';

export interface IClientCampaign extends Document {
  _id: mongoose.Types.ObjectId;
  campaignId: string;
  clientId: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'draft' | 'archived';
  budget: {
    allocated: number;
    spent: number;
    remaining: number;
    currency: string;
  };
  dates: {
    start: Date;
    end: Date;
  };
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    roas: number;
  };
  targeting: {
    demographics?: Record<string, any>;
    locations?: string[];
    interests?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const ClientCampaignSchema = new Schema<IClientCampaign>(
  {
    campaignId: { type: String, required: true, unique: true, index: true },
    clientId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'draft', 'archived'],
      default: 'draft',
      index: true,
    },
    budget: {
      allocated: { type: Number, default: 0 },
      spent: { type: Number, default: 0 },
      remaining: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
    },
    dates: {
      start: { type: Date, required: true },
      end: { type: Date },
    },
    performance: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      cpc: { type: Number, default: 0 },
      roas: { type: Number, default: 0 },
    },
    targeting: {
      demographics: { type: Schema.Types.Mixed },
      locations: [{ type: String }],
      interests: [{ type: String }],
    },
  },
  { timestamps: true }
);

// Indexes
ClientCampaignSchema.index({ clientId: 1, status: 1 });
ClientCampaignSchema.index({ 'budget.spent': -1 });
ClientCampaignSchema.index({ 'performance.roas': -1 });

export const ClientCampaign = mongoose.model<IClientCampaign>('ClientCampaign', ClientCampaignSchema);