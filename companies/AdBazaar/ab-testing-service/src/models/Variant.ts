import mongoose, { Document, Schema } from 'mongoose';

export interface IVariant extends Document {
  variantId: string;
  testId: string;
  name: string;
  description?: string;
  isControl: boolean;
  weight: number;
  config: Record<string, unknown>;
  impressions: number;
  conversions: number;
  conversionRate: number;
  revenue?: number;
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IVariant>(
  {
    variantId: { type: String, required: true, unique: true, index: true },
    testId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    isControl: { type: Boolean, default: false },
    weight: { type: Number, required: true },
    config: { type: Schema.Types.Mixed, required: true },
    impressions: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  },
  { timestamps: true }
);

VariantSchema.index({ testId: 1 });
VariantSchema.index({ testId: 1, isControl: 1 });

export const Variant = mongoose.model<IVariant>('Variant', VariantSchema);