import mongoose, { Document, Schema } from 'mongoose';

export interface IKeyword extends Document {
  keywordId: string;
  campaignId: string;
  term: string;
  matchType: 'broad' | 'phrase' | 'exact';
  bid: {
    current: number;
    suggested: number;
    lastUpdated: Date;
  };
  performance: {
    impressions: number;
    clicks: number;
    ctr: number;
    spend: number;
    conversions: number;
    cpc: number;
    roas: number;
  };
  status: 'active' | 'paused' | 'negative';
  qualityScore: number;
  competition: 'low' | 'medium' | 'high';
  searchVolume: number;
  createdAt: Date;
  updatedAt: Date;
}

const KeywordSchema = new Schema<IKeyword>(
  {
    keywordId: { type: String, required: true, unique: true, index: true },
    campaignId: { type: String, required: true, index: true },
    term: { type: String, required: true },
    matchType: {
      type: String,
      enum: ['broad', 'phrase', 'exact'],
      default: 'broad'
    },
    bid: {
      current: { type: Number, default: 0.5 },
      suggested: { type: Number, default: 0.5 },
      lastUpdated: { type: Date, default: Date.now }
    },
    performance: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      spend: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      cpc: { type: Number, default: 0 },
      roas: { type: Number, default: 0 }
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'negative'],
      default: 'active'
    },
    qualityScore: { type: Number, default: 5, min: 1, max: 10 },
    competition: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    searchVolume: { type: Number, default: 0 }
  },
  { timestamps: true }
);

KeywordSchema.index({ campaignId: 1, status: 1 });
KeywordSchema.index({ campaignId: 1, matchType: 1 });
KeywordSchema.index({ term: 'text' });

export const Keyword = mongoose.model<IKeyword>('Keyword', KeywordSchema);