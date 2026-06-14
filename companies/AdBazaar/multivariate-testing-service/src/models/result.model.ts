import mongoose, { Document, Schema } from 'mongoose';

export interface IResult extends Document {
  resultId: string;
  testId: string;
  variantId: string;
  timestamp: Date;
  impressions: number;
  uniqueUsers: number;
  conversions: number;
  revenue: number;
  engagement: number;
  clickThroughRate: number;
  conversionRate: number;
  statisticalSignificance?: number;
  confidenceInterval?: {
    lower: number;
    upper: number;
  };
  metrics: Record<string, number>;
  createdAt: Date;
}

const resultSchema = new Schema<IResult>(
  {
    resultId: { type: String, required: true, unique: true },
    testId: { type: String, required: true },
    variantId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    impressions: { type: Number, default: 0 },
    uniqueUsers: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    clickThroughRate: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    statisticalSignificance: { type: Number },
    confidenceInterval: {
      lower: Number,
      upper: Number
    },
    metrics: { type: Map, of: Number, default: {} }
  },
  { timestamps: true }
);

resultSchema.index({ resultId: 1 });
resultSchema.index({ testId: 1 });
resultSchema.index({ variantId: 1 });
resultSchema.index({ timestamp: -1 });
resultSchema.index({ testId: 1, timestamp: -1 });

export const Result = mongoose.model<IResult>('Result', resultSchema);