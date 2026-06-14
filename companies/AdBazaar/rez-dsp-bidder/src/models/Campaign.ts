import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICampaignDocument extends Document {
  name: string;
  exchange?: 'google_adx' | 'amazon_tam';
  budget: number;
  dailyLimit?: number;
  bidStrategy: 'fixed' | 'dynamic' | 'optimized';
  maxBidPrice?: number;
  targeting?: {
    geo?: string[];
    screenTypes?: string[];
    locations?: string[];
    demographics?: Record<string, unknown>;
    screenIds?: string[];
  };
  status: 'active' | 'paused' | 'ended';
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TargetingSchema = new Schema({
  geo: [String],
  screenTypes: [String],
  locations: [String],
  demographics: { type: Schema.Types.Mixed },
  screenIds: [String],
}, { _id: false });

const CampaignSchema = new Schema<ICampaignDocument>({
  name: { type: String, required: true },
  exchange: {
    type: String,
    enum: ['google_adx', 'amazon_tam'],
  },
  budget: { type: Number, required: true },
  dailyLimit: { type: Number },
  bidStrategy: {
    type: String,
    enum: ['fixed', 'dynamic', 'optimized'],
    default: 'dynamic',
  },
  maxBidPrice: { type: Number },
  targeting: TargetingSchema,
  status: {
    type: String,
    enum: ['active', 'paused', 'ended'],
    default: 'active',
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
}, { timestamps: true });

CampaignSchema.index({ status: 1, exchange: 1 });
CampaignSchema.index({ 'targeting.geo': 1 });
CampaignSchema.index({ 'targeting.screenTypes': 1 });

export const CampaignModel = mongoose.model<ICampaignDocument>('Campaign', CampaignSchema);
