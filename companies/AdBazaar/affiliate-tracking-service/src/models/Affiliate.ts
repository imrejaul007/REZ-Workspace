import mongoose, { Schema, Document } from 'mongoose';

export interface IAffiliate extends Document {
  affiliateId: string;
  userId: string;
  businessName: string;
  email: string;
  phone?: string;
  website?: string;
  niche: string;
  commissionStructure: {
    cpa: number;
    revShare: number;
    cookieDuration: number;
  };
  payoutSettings: {
    minPayoutThreshold: number;
    payoutFrequency: 'weekly' | 'biweekly' | 'monthly';
    autoPayout: boolean;
    paymentMethod: 'bank_transfer' | 'paypal' | 'upi';
  };
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  stats: {
    totalClicks: number;
    totalConversions: number;
    totalCommission: number;
    paidCommission: number;
    pendingCommission: number;
    avgConversionRate: number;
  };
  utmParams: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const AffiliateSchema = new Schema<IAffiliate>(
  {
    affiliateId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    businessName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String },
    website: { type: String },
    niche: { type: String, required: true },
    commissionStructure: {
      cpa: { type: Number, default: 0 },
      revShare: { type: Number, default: 0 },
      cookieDuration: { type: Number, default: 30 },
    },
    payoutSettings: {
      minPayoutThreshold: { type: Number, default: 1000 },
      payoutFrequency: {
        type: String,
        enum: ['weekly', 'biweekly', 'monthly'],
        default: 'monthly',
      },
      autoPayout: { type: Boolean, default: false },
      paymentMethod: {
        type: String,
        enum: ['bank_transfer', 'paypal', 'upi'],
        default: 'bank_transfer',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'inactive'],
      default: 'pending',
      index: true,
    },
    stats: {
      totalClicks: { type: Number, default: 0 },
      totalConversions: { type: Number, default: 0 },
      totalCommission: { type: Number, default: 0 },
      paidCommission: { type: Number, default: 0 },
      pendingCommission: { type: Number, default: 0 },
      avgConversionRate: { type: Number, default: 0 },
    },
    utmParams: { type: Map, of: String, default: {} },
  },
  { timestamps: true }
);

export const Affiliate = mongoose.model<IAffiliate>('Affiliate', AffiliateSchema);