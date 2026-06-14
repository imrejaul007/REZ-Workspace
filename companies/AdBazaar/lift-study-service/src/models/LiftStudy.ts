import mongoose, { Document, Schema } from 'mongoose';

export interface ILiftStudy extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  type: 'brand_lift' | 'conversion_lift' | 'both';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  description?: string;
  methodology: 'randomized_control' | 'geo_targeting' | 'matched_market' | 'holdout';
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  targetSampleSize?: number;
  confidenceLevel: number;
  minimumDetectableEffect?: number;
  targetAudience?: {
    demographics?: {
      age?: number[];
      gender?: string[];
      location?: string[];
      income?: 'low' | 'medium' | 'high' | 'all';
    };
    interests?: string[];
    behaviors?: string[];
  };
  controlGroupSize: number;
  treatmentGroupSize: number;
  metrics: string[];
  campaignIds: string[];
  platform?: string;
  tags: string[];
  metadata: Record<string, any>;
  results?: {
    lift: number;
    confidence: number;
    pValue: number;
    sampleSize: number;
    statisticalSignificance: boolean;
    computedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

const LiftStudySchema = new Schema<ILiftStudy>(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ['brand_lift', 'conversion_lift', 'both'],
      index: true
    },
    status: {
      type: String,
      required: true,
      enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
      default: 'draft',
      index: true
    },
    description: { type: String },
    methodology: {
      type: String,
      required: true,
      enum: ['randomized_control', 'geo_targeting', 'matched_market', 'holdout']
    },
    startDate: { type: Date, index: true },
    endDate: { type: Date, index: true },
    budget: { type: Number },
    targetSampleSize: { type: Number },
    confidenceLevel: { type: Number, default: 0.95, min: 0.8, max: 0.99 },
    minimumDetectableEffect: { type: Number },
    targetAudience: {
      demographics: {
        age: [Number],
        gender: [String],
        location: [String],
        income: String
      },
      interests: [String],
      behaviors: [String]
    },
    controlGroupSize: { type: Number, default: 0.1 },
    treatmentGroupSize: { type: Number, default: 0.9 },
    metrics: [{ type: String }],
    campaignIds: [{ type: String }],
    platform: { type: String },
    tags: [{ type: String }],
    metadata: { type: Schema.Types.Mixed, default: {} },
    results: {
      lift: Number,
      confidence: Number,
      pValue: Number,
      sampleSize: Number,
      statisticalSignificance: Boolean,
      computedAt: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes
LiftStudySchema.index({ createdBy: 1 });
LiftStudySchema.index({ tags: 1 });
LiftStudySchema.index({ 'metadata.advertiserId': 1 });
LiftStudySchema.index({ status: 1, startDate: 1, endDate: 1 });

export const LiftStudy = mongoose.model<ILiftStudy>('LiftStudy', LiftStudySchema);
export default LiftStudy;