import mongoose, { Document, Schema } from 'mongoose';

export interface ICreative extends Document {
  name: string;
  type: 'banner' | 'video' | 'native' | 'text' | 'carousel' | 'interactive';
  content: {
    headline?: string;
    body?: string;
    cta?: string;
    imageUrl?: string;
    videoUrl?: string;
    assets?: Array<{
      type: string;
      url: string;
      metadata?: Record<string, any>;
    }>;
    metadata?: Record<string, any>;
  };
  campaignId: string;
  advertiserId: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'active' | 'paused' | 'archived';
  dimensions?: {
    width: number;
    height: number;
  };
  targetAudience?: {
    ageRange?: [number, number];
    gender?: string[];
    interests?: string[];
    locations?: string[];
  };
  metrics?: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    ctr?: number;
    cvr?: number;
    spend?: number;
  };
  tags?: string[];
  createdBy: string;
  updatedBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  reviewNotes?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CreativeSchema = new Schema<ICreative>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    type: {
      type: String,
      required: true,
      enum: ['banner', 'video', 'native', 'text', 'carousel', 'interactive'],
      index: true
    },
    content: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function(v: any) {
          return v && typeof v === 'object';
        },
        message: 'Content must be an object'
      }
    },
    campaignId: { type: String, required: true, index: true },
    advertiserId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'approved', 'rejected', 'active', 'paused', 'archived'],
      default: 'draft',
      index: true
    },
    dimensions: {
      width: { type: Number },
      height: { type: Number }
    },
    targetAudience: {
      ageRange: { type: [Number], default: undefined },
      gender: [{ type: String }],
      interests: [{ type: String }],
      locations: [{ type: String }]
    },
    metrics: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      cvr: { type: Number, default: 0 },
      spend: { type: Number, default: 0 }
    },
    tags: [{ type: String, index: true }],
    createdBy: { type: String, required: true },
    updatedBy: { type: String },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    reviewNotes: { type: String },
    expiresAt: { type: Date }
  },
  {
    timestamps: true,
    collection: 'creatives'
  }
);

// Indexes for performance
CreativeSchema.index({ campaignId: 1, status: 1 });
CreativeSchema.index({ advertiserId: 1, createdAt: -1 });
CreativeSchema.index({ 'metrics.impressions': -1 });
CreativeSchema.index({ createdAt: -1 });

// Virtual for CTR calculation
CreativeSchema.virtual('calculatedCtr').get(function() {
  if (this.metrics?.impressions && this.metrics?.clicks) {
    return (this.metrics.clicks / this.metrics.impressions) * 100;
  }
  return 0;
});

// Virtual for CVR calculation
CreativeSchema.virtual('calculatedCvr').get(function() {
  if (this.metrics?.clicks && this.metrics?.conversions) {
    return (this.metrics.conversions / this.metrics.clicks) * 100;
  }
  return 0;
});

// Ensure virtuals are included in JSON
CreativeSchema.set('toJSON', { virtuals: true });
CreativeSchema.set('toObject', { virtuals: true });

export const Creative = mongoose.model<ICreative>('Creative', CreativeSchema);