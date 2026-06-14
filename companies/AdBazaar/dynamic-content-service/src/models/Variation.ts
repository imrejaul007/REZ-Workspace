import mongoose, { Document, Schema } from 'mongoose';

export interface IVariation extends Document {
  variationId: string;
  contentId: string;
  name: string;
  elements: {
    type: 'text' | 'image' | 'video' | 'button' | 'form';
    content: string;
    style?: Record<string, unknown>;
    targetUrl?: string;
  }[];
  weight: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  isControl: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VariationSchema = new Schema<IVariation>(
  {
    variationId: { type: String, required: true, unique: true, index: true },
    contentId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    elements: [{
      type: { type: String, enum: ['text', 'image', 'video', 'button', 'form'], required: true },
      content: { type: String, required: true },
      style: { type: Schema.Types.Mixed },
      targetUrl: { type: String }
    }],
    weight: { type: Number, default: 1 },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    isControl: { type: Boolean, default: false }
  },
  { timestamps: true }
);

VariationSchema.index({ contentId: 1 });

export const Variation = mongoose.model<IVariation>('Variation', VariationSchema);