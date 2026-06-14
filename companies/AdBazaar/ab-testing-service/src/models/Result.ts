import mongoose, { Document, Schema } from 'mongoose';

export interface IResult extends Document {
  resultId: string;
  testId: string;
  variantId: string;
  sampleSize: number;
  impressions: number;
  conversions: number;
  conversionRate: number;
  confidence: number;
  pValue?: number;
  uplift?: number;
  upliftLower?: number;
  upliftUpper?: number;
  isSignificant: boolean;
  isWinner: boolean;
  statisticalPower?: number;
  runDuration?: number;
  computedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ResultSchema = new Schema<IResult>(
  {
    resultId: { type: String, required: true, unique: true, index: true },
    testId: { type: String, required: true, index: true },
    variantId: { type: String, required: true, index: true },
    sampleSize: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    pValue: { type: Number },
    uplift: { type: Number },
    upliftLower: { type: Number },
    upliftUpper: { type: Number },
    isSignificant: { type: Boolean, default: false },
    isWinner: { type: Boolean, default: false },
    statisticalPower: { type: Number },
    runDuration: { type: Number },
    computedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

ResultSchema.index({ testId: 1, computedAt: -1 });
ResultSchema.index({ testId: 1, isWinner: -1 });

export const Result = mongoose.model<IResult>('Result', ResultSchema);