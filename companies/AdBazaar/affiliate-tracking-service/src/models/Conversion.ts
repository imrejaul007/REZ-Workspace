import mongoose, { Schema, Document } from 'mongoose';

export type ConversionStatus = 'pending' | 'approved' | 'rejected' | 'paid';
export type ConversionType = 'cpa' | 'rev_share' | 'hybrid';

export interface IConversion extends Document {
  conversionId: string;
  affiliateId: string;
  campaignId: string;
  clickId: string;
  type: ConversionType;
  status: ConversionStatus;
  revenue: number;
  commission: number;
  currency: string;
  customerData: {
    customerId?: string;
    email?: string;
    phone?: string;
  };
  conversionData: {
    productId?: string;
    orderValue?: number;
    quantity?: number;
  };
  attribution: {
    source: string;
    medium: string;
    campaign: string;
    landingUrl: string;
  };
  timestamps: {
    click: Date;
    conversion: Date;
    approval: Date;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversionSchema = new Schema<IConversion>(
  {
    conversionId: { type: String, required: true, unique: true, index: true },
    affiliateId: { type: String, required: true, index: true },
    campaignId: { type: String, required: true, index: true },
    clickId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['cpa', 'rev_share', 'hybrid'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paid'],
      default: 'pending',
      index: true,
    },
    revenue: { type: Number, required: true, min: 0 },
    commission: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    customerData: {
      customerId: { type: String },
      email: { type: String },
      phone: { type: String },
    },
    conversionData: {
      productId: { type: String },
      orderValue: { type: Number },
      quantity: { type: Number },
    },
    attribution: {
      source: { type: String, required: true },
      medium: { type: String, required: true },
      campaign: { type: String },
      landingUrl: { type: String },
    },
    timestamps: {
      click: { type: Date, required: true },
      conversion: { type: Date, required: true },
      approval: { type: Date },
    },
    notes: { type: String },
  },
  { timestamps: true }
);

// Indexes for common queries
ConversionSchema.index({ affiliateId: 1, status: 1 });
ConversionSchema.index({ campaignId: 1, status: 1 });
ConversionSchema.index({ 'timestamps.conversion': -1 });

export const Conversion = mongoose.model<IConversion>('Conversion', ConversionSchema);