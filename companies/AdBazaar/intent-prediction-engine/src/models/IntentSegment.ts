import mongoose, { Schema, Document } from 'mongoose';
import { IntentCategory, SegmentStatus } from '../types.js';

export interface IIntentSegment extends Document {
  segmentId: string;
  name: string;
  description: string;
  category: IntentCategory;
  criteria: {
    minConfidence: number;
    maxDaysDormant?: number;
    sources?: string[];
    geoFilters?: string[];
  };
  userCount: number;
  avgConfidence: number;
  qualityScore: number;
  status: SegmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const IntentSegmentSchema = new Schema<IIntentSegment>(
  {
    segmentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['DINING', 'TRAVEL', 'RETAIL', 'HEALTHCARE', 'GENERAL'],
      index: true,
    },
    criteria: {
      minConfidence: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
      maxDaysDormant: {
        type: Number,
        required: false,
      },
      sources: {
        type: [String],
        required: false,
        default: [],
      },
      geoFilters: {
        type: [String],
        required: false,
        default: [],
      },
    },
    userCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    avgConfidence: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 1,
    },
    qualityScore: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
      max: 10,
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'paused', 'archived'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
IntentSegmentSchema.index({ category: 1, status: 1 });
IntentSegmentSchema.index({ 'criteria.minConfidence': 1, status: 1 });
IntentSegmentSchema.index({ qualityScore: -1 });
IntentSegmentSchema.index({ updatedAt: -1 });

// Virtual for segment age
IntentSegmentSchema.virtual('ageInDays').get(function () {
  const now = new Date();
  const created = this.createdAt;
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
});

// Method to check if segment meets threshold
IntentSegmentSchema.methods.meetsThreshold = function (minQuality: number): boolean {
  return this.qualityScore >= minQuality;
};

// Static method to find active segments by category
IntentSegmentSchema.statics.findByCategory = function (category: string) {
  return this.find({ category, status: 'active' }).sort({ qualityScore: -1 });
};

// Static method to get segment statistics
IntentSegmentSchema.statics.getStatistics = async function () {
  const stats = await this.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalUsers: { $sum: '$userCount' },
        avgQuality: { $avg: '$qualityScore' },
        avgConfidence: { $avg: '$avgConfidence' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return stats;
};

export const IntentSegment = mongoose.model<IIntentSegment>('IntentSegment', IntentSegmentSchema);
