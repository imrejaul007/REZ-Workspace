import mongoose, { Document, Schema } from 'mongoose';

export interface IHeatmap extends Document {
  _id: mongoose.Types.ObjectId;
  heatmapId: string;
  contentId: string;
  contentType: string;
  date: Date;
  views: number;
  uniqueViews: number;
  avgTimeOnPage: number;
  bounceRate: number;
  scrollDepth: {
    quarter1: number;
    quarter2: number;
    quarter3: number;
    quarter4: number;
  };
  clickMap: Array<{
    element: string;
    clicks: number;
    position: { x: number; y: number };
  }>;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  locationBreakdown: Array<{
    country: string;
    region?: string;
    views: number;
  }>;
  referrerBreakdown: Array<{
    source: string;
    medium?: string;
    views: number;
  }>;
  engagementScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const ClickMapSchema = new Schema({
  element: { type: String, required: true },
  clicks: { type: Number, default: 0 },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  }
}, { _id: false });

const LocationBreakdownSchema = new Schema({
  country: { type: String, required: true },
  region: { type: String },
  views: { type: Number, default: 0 }
}, { _id: false });

const ReferrerBreakdownSchema = new Schema({
  source: { type: String, required: true },
  medium: { type: String },
  views: { type: Number, default: 0 }
}, { _id: false });

const HeatmapSchema = new Schema<IHeatmap>(
  {
    heatmapId: { type: String, required: true, unique: true, index: true },
    contentId: { type: String, required: true, index: true },
    contentType: { type: String, required: true },
    date: { type: Date, required: true, index: true },
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    avgTimeOnPage: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0 },
    scrollDepth: {
      quarter1: { type: Number, default: 0 },
      quarter2: { type: Number, default: 0 },
      quarter3: { type: Number, default: 0 },
      quarter4: { type: Number, default: 0 }
    },
    clickMap: [ClickMapSchema],
    deviceBreakdown: {
      desktop: { type: Number, default: 0 },
      mobile: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 }
    },
    locationBreakdown: [LocationBreakdownSchema],
    referrerBreakdown: [ReferrerBreakdownSchema],
    engagementScore: { type: Number, default: 0 }
  },
  { timestamps: true }
);

HeatmapSchema.index({ contentId: 1, date: -1 });
HeatmapSchema.index({ contentType: 1, date: -1 });

export const Heatmap = mongoose.model<IHeatmap>('Heatmap', HeatmapSchema);