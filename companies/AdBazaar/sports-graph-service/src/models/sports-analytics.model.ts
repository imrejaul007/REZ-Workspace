import mongoose, { Schema, Document } from 'mongoose';

export interface ISportsAnalytics {
  eventId: mongoose.Types.ObjectId;
  impressions: number;
  ticketSales: number;
  viewership: number;
  adRevenue?: number;
  engagement?: {
    social: number;
    streaming: number;
    tv: number;
  };
  demographics?: {
    ageGroups: Record<string, number>;
    genderSplit: Record<string, number>;
    regions: Record<string, number>;
  };
  peakMoments?: Array<{
    timestamp: Date;
    description: string;
    engagement: number;
  }>;
  merchantImpact?: {
    nearbyRestaurants: number;
    nearbyHotels: number;
    nearbyRetail: number;
    transportUsage: number;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISportsAnalyticsDocument extends ISportsAnalytics, Document {
  _id: mongoose.Types.ObjectId;
}

const SportsAnalyticsSchema = new Schema<ISportsAnalyticsDocument>({
  eventId: { type: Schema.Types.ObjectId, ref: 'SportsEvent', required: true, unique: true, index: true },
  impressions: { type: Number, default: 0 },
  ticketSales: { type: Number, default: 0 },
  viewership: { type: Number, default: 0 },
  adRevenue: { type: Number },
  engagement: {
    social: { type: Number, default: 0 },
    streaming: { type: Number, default: 0 },
    tv: { type: Number, default: 0 }
  },
  demographics: {
    ageGroups: { type: Map, of: Number, default: {} },
    genderSplit: { type: Map, of: Number, default: {} },
    regions: { type: Map, of: Number, default: {} }
  },
  peakMoments: [{
    timestamp: { type: Date },
    description: { type: String },
    engagement: { type: Number }
  }],
  merchantImpact: {
    nearbyRestaurants: { type: Number, default: 0 },
    nearbyHotels: { type: Number, default: 0 },
    nearbyRetail: { type: Number, default: 0 },
    transportUsage: { type: Number, default: 0 }
  },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
SportsAnalyticsSchema.index({ eventId: 1 });
SportsAnalyticsSchema.index({ createdAt: -1 });

export const SportsAnalyticsModel = mongoose.model<ISportsAnalyticsDocument>('SportsAnalytics', SportsAnalyticsSchema);
