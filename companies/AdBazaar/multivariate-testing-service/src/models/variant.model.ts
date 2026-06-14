import mongoose, { Document, Schema } from 'mongoose';

export interface IVariant extends Document {
  variantId: string;
  testId: string;
  name: string;
  description?: string;
  isControl: boolean;
  trafficWeight: number; // Percentage, must sum to 100 with other variants
  configuration: {
    creative?: {
      headline?: string;
      body?: string;
      imageUrl?: string;
      ctaText?: string;
    };
    targeting?: {
      minAge?: number;
      maxAge?: number;
      interests?: string[];
    };
    pricing?: {
      discount?: number;
      originalPrice?: number;
    };
    custom?: Record<string, unknown>;
  };
  impressions: number;
  conversions: number;
  revenue: number;
  engagement: number;
  status: 'active' | 'paused' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema<IVariant>(
  {
    variantId: { type: String, required: true, unique: true },
    testId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    isControl: { type: Boolean, default: false },
    trafficWeight: { type: Number, default: 50, min: 0, max: 100 },
    configuration: {
      type: Schema.Types.Mixed,
      default: {}
    },
    impressions: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'paused', 'archived'],
      default: 'active'
    }
  },
  { timestamps: true }
);

variantSchema.index({ variantId: 1 });
variantSchema.index({ testId: 1 });

export const Variant = mongoose.model<IVariant>('Variant', variantSchema);