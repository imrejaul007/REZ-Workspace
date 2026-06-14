import mongoose, { Document, Schema } from 'mongoose';

export interface IPricing extends Document {
  pricingId: string;
  name: string;
  productId: string;
  companyId: string;
  basePrice: number;
  currentPrice: number;
  currency: string;
  minPrice: number;
  maxPrice: number;
  status: 'active' | 'paused' | 'archived';
  strategy: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PricingSchema = new Schema<IPricing>(
  {
    pricingId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    productId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    basePrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    minPrice: { type: Number, required: true },
    maxPrice: { type: Number, required: true },
    status: { type: String, enum: ['active', 'paused', 'archived'], default: 'active' },
    strategy: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

PricingSchema.index({ productId: 1, status: 1 });
PricingSchema.index({ companyId: 1, status: 1 });

export const Pricing = mongoose.model<IPricing>('Pricing', PricingSchema);