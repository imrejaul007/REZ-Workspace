import mongoose, { Document, Schema } from 'mongoose';

export interface ICreativeVariation extends Document {
  creativeId: string;
  variations: Array<{
    variantId: string;
    name: string;
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
    };
    weight: number;
    status: 'active' | 'paused' | 'winner';
  }>;
  testName: string;
  testType: 'ab' | 'multivariate' | 'bandit';
  hypothesis?: string;
  startDate: Date;
  endDate?: Date;
  status: 'running' | 'completed' | 'paused' | 'draft';
  results?: {
    controlCTR?: number;
    treatmentCTR?: number;
    statisticalSignificance?: number;
    confidenceLevel?: number;
    winner?: string;
    uplift?: number;
  };
  sampleSize?: number;
  trafficSplit?: Record<string, number>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const CreativeVariationSchema = new Schema<ICreativeVariation>(
  {
    creativeId: { type: String, required: true, index: true },
    variations: [{
      variantId: { type: String, required: true },
      name: { type: String, required: true },
      content: { type: Schema.Types.Mixed, required: true },
      weight: { type: Number, default: 50, min: 0, max: 100 },
      status: {
        type: String,
        enum: ['active', 'paused', 'winner'],
        default: 'active'
      }
    }],
    testName: { type: String, required: true, trim: true },
    testType: {
      type: String,
      enum: ['ab', 'multivariate', 'bandit'],
      required: true
    },
    hypothesis: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ['running', 'completed', 'paused', 'draft'],
      default: 'draft',
      index: true
    },
    results: {
      controlCTR: { type: Number },
      treatmentCTR: { type: Number },
      statisticalSignificance: { type: Number },
      confidenceLevel: { type: Number },
      winner: { type: String },
      uplift: { type: Number }
    },
    sampleSize: { type: Number },
    trafficSplit: { type: Schema.Types.Mixed },
    createdBy: { type: String, required: true }
  },
  {
    timestamps: true,
    collection: 'creative_variations'
  }
);

// Indexes
CreativeVariationSchema.index({ creativeId: 1, status: 1 });
CreativeVariationSchema.index({ testType: 1, status: 1 });
CreativeVariationSchema.index({ startDate: -1 });

export const CreativeVariation = mongoose.model<ICreativeVariation>('CreativeVariation', CreativeVariationSchema);