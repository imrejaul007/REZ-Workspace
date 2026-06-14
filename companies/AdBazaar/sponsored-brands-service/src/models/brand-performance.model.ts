import mongoose, { Document, Schema } from 'mongoose';

export interface IBrandPerformance extends Document {
  performanceId: string;
  campaignId: string;
  date: Date;
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    spend: number;
    cpc: number;
    conversions: number;
    revenue: number;
    roas: number;
    cpa: number;
  };
  keywordMetrics: {
    keywordId: string;
    impressions: number;
    clicks: number;
    spend: number;
  }[];
  adMetrics: {
    adId: string;
    impressions: number;
    clicks: number;
    spend: number;
  }[];
  audienceMetrics: {
    segment: string;
    impressions: number;
    clicks: number;
    conversions: number;
  }[];
  deviceMetrics: {
    device: 'desktop' | 'mobile' | 'tablet';
    impressions: number;
    clicks: number;
    conversions: number;
  }[];
  locationMetrics: {
    location: string;
    impressions: number;
    clicks: number;
    conversions: number;
  }[];
  createdAt: Date;
}

const BrandPerformanceSchema = new Schema<IBrandPerformance>(
  {
    performanceId: { type: String, required: true, unique: true, index: true },
    campaignId: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    metrics: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      spend: { type: Number, default: 0 },
      cpc: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      roas: { type: Number, default: 0 },
      cpa: { type: Number, default: 0 }
    },
    keywordMetrics: [{
      keywordId: { type: String, required: true },
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      spend: { type: Number, default: 0 }
    }],
    adMetrics: [{
      adId: { type: String, required: true },
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      spend: { type: Number, default: 0 }
    }],
    audienceMetrics: [{
      segment: { type: String, required: true },
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 }
    }],
    deviceMetrics: [{
      device: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet'],
        required: true
      },
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 }
    }],
    locationMetrics: [{
      location: { type: String, required: true },
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 }
    }]
  },
  { timestamps: true }
);

BrandPerformanceSchema.index({ campaignId: 1, date: -1 });
BrandPerformanceSchema.index({ date: -1 });

export const BrandPerformance = mongoose.model<IBrandPerformance>('BrandPerformance', BrandPerformanceSchema);