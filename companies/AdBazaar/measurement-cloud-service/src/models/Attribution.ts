import mongoose, { Document, Schema } from 'mongoose';

// Attribution model types
export enum AttributionModel {
  FIRST_TOUCH = 'first_touch',
  LAST_TOUCH = 'last_touch',
  LINEAR = 'linear',
  TIME_DECAY = 'time_decay',
  POSITION_BASED = 'position_based',
  DATA_DRIVEN = 'data_driven'
}

// Touchpoint types
export enum TouchpointType {
  IMPRESSION = 'impression',
  CLICK = 'click',
  VIDEO_VIEW = 'video_view',
  ENGAGEMENT = 'engagement',
  CONVERSION = 'conversion'
}

// Touchpoint interface
export interface ITouchpoint {
  touchpointId: string;
  type: TouchpointType;
  channel: string;
  timestamp: Date;
  campaignId?: string;
  placementId?: string;
  creativeId?: string;
  score?: number;
  weight?: number;
}

// Credit allocation interface
export interface ICreditAllocation {
  channel: string;
  credit: number;
  percentage: number;
  conversions: number;
}

// Attribution document interface
export interface IAttribution extends Document {
  campaignId: string;
  model: AttributionModel;
  conversionId: string;
  customerId?: string;
  conversionValue: number;
  conversionTimestamp: Date;
  touchpoints: ITouchpoint[];
  creditAllocation: ICreditAllocation[];
  windowStart: Date;
  windowEnd: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Attribution schema
const attributionSchema = new Schema<IAttribution>(
  {
    campaignId: {
      type: String,
      required: true,
      index: true
    },
    model: {
      type: String,
      enum: Object.values(AttributionModel),
      required: true,
      index: true
    },
    conversionId: {
      type: String,
      required: true,
      unique: true
    },
    customerId: {
      type: String,
      index: true
    },
    conversionValue: {
      type: Number,
      required: true
    },
    conversionTimestamp: {
      type: Date,
      required: true
    },
    touchpoints: [
      {
        touchpointId: {
          type: String,
          required: true
        },
        type: {
          type: String,
          enum: Object.values(TouchpointType),
          required: true
        },
        channel: {
          type: String,
          required: true
        },
        timestamp: {
          type: Date,
          required: true
        },
        campaignId: String,
        placementId: String,
        creativeId: String,
        score: Number,
        weight: Number
      }
    ],
    creditAllocation: [
      {
        channel: {
          type: String,
          required: true
        },
        credit: {
          type: Number,
          required: true
        },
        percentage: {
          type: Number,
          required: true
        },
        conversions: {
          type: Number,
          default: 0
        }
      }
    ],
    windowStart: {
      type: Date,
      required: true
    },
    windowEnd: {
      type: Date,
      required: true
    },
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
attributionSchema.index({ campaignId: 1, model: 1 });
attributionSchema.index({ conversionTimestamp: -1 });
attributionSchema.index({ customerId: 1, conversionTimestamp: -1 });
attributionSchema.index({ 'creditAllocation.channel': 1 });

// Campaign attribution summary interface
export interface ICampaignAttributionSummary extends Document {
  campaignId: string;
  model: AttributionModel;
  date: Date;
  totalConversions: number;
  totalConversionValue: number;
  channelAttribution: {
    channel: string;
    conversions: number;
    conversionValue: number;
    percentage: number;
  }[];
  touchpointStats: {
    avgTouchpoints: number;
    medianTouchpoints: number;
    maxTouchpoints: number;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Campaign attribution summary schema
const campaignAttributionSummarySchema = new Schema<ICampaignAttributionSummary>(
  {
    campaignId: {
      type: String,
      required: true,
      index: true
    },
    model: {
      type: String,
      enum: Object.values(AttributionModel),
      required: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    totalConversions: {
      type: Number,
      default: 0
    },
    totalConversionValue: {
      type: Number,
      default: 0
    },
    channelAttribution: [
      {
        channel: String,
        conversions: Number,
        conversionValue: Number,
        percentage: Number
      }
    ],
    touchpointStats: {
      avgTouchpoints: { type: Number, default: 0 },
      medianTouchpoints: { type: Number, default: 0 },
      maxTouchpoints: { type: Number, default: 0 }
    },
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
);

campaignAttributionSummarySchema.index({ campaignId: 1, date: -1 });

export const Attribution = mongoose.model<IAttribution>('Attribution', attributionSchema);

export const CampaignAttributionSummary = mongoose.model<ICampaignAttributionSummary>(
  'CampaignAttributionSummary',
  campaignAttributionSummarySchema
);