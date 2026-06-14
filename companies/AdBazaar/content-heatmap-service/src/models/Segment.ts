import mongoose, { Document, Schema } from 'mongoose';

export interface ISegment extends Document {
  _id: mongoose.Types.ObjectId;
  segmentId: string;
  name: string;
  description?: string;
  criteria: {
    contentTypes?: string[];
    dateRange?: { start: Date; end: Date };
    minViews?: number;
    maxViews?: number;
    minEngagement?: number;
    maxEngagement?: number;
    countries?: string[];
    devices?: string[];
    referrers?: string[];
  };
  matchingContentIds: string[];
  contentCount: number;
  avgEngagement: number;
  totalViews: number;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SegmentSchema = new Schema<ISegment>(
  {
    segmentId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    criteria: {
      contentTypes: [String],
      dateRange: {
        start: Date,
        end: Date
      },
      minViews: Number,
      maxViews: Number,
      minEngagement: Number,
      maxEngagement: Number,
      countries: [String],
      devices: [String],
      referrers: [String]
    },
    matchingContentIds: [String],
    contentCount: { type: Number, default: 0 },
    avgEngagement: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    createdBy: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

SegmentSchema.index({ name: 1 });
SegmentSchema.index({ isActive: 1 });

export const Segment = mongoose.model<ISegment>('Segment', SegmentSchema);