/**
 * Merchant Intelligence Data Model
 * Stores merchant data for aggregation (with consent)
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IMerchantData extends Document {
  merchantId: string;               // Reference to merchant
  businessName: string;             // For internal reference only

  // Location (for aggregation)
  locality: string;
  pincode: string;
  city: string;
  state: string;

  // Industry
  industry: 'restaurant' | 'hotel' | 'salon' | 'fitness' | 'healthcare';
  category: string;                 // "biryani" | "pizza" | etc.

  // Metrics (anonymized before aggregation)
  dailyMetrics: [{
    date: Date;
    orders: number;
    revenue: number;
    customers: number;
    avgOrderValue: number;
    repeatCustomers: number;
    newCustomers: number;
    peakHours: number[];          // Store peak hours locally
  }];

  // Consent
  dataSharingConsent: boolean;     // GDPR compliant
  consentGivenAt?: Date;
  consentRevokedAt?: Date;

  // Aggregation status
  lastAggregatedAt?: Date;
  aggregationVersion: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const merchantDataSchema = new Schema<IMerchantData>({
  merchantId: { type: String, required: true, unique: true, index: true },
  businessName: { type: String, required: true },

  locality: { type: String, required: true, index: true },
  pincode: { type: String, required: true, index: true },
  city: { type: String, required: true, index: true },
  state: { type: String, required: true, index: true },

  industry: {
    type: String,
    enum: ['restaurant', 'hotel', 'salon', 'fitness', 'healthcare'],
    required: true,
    index: true
  },

  category: { type: String, required: true, index: true },

  dailyMetrics: [{
    date: { type: Date, required: true },
    orders: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    customers: { type: Number, default: 0 },
    avgOrderValue: { type: Number, default: 0 },
    repeatCustomers: { type: Number, default: 0 },
    newCustomers: { type: Number, default: 0 },
    peakHours: { type: [Number], default: [] }
  }],

  dataSharingConsent: { type: Boolean, default: false },
  consentGivenAt: { type: Date },
  consentRevokedAt: { type: Date },

  lastAggregatedAt: { type: Date },
  aggregationVersion: { type: Number, default: 1 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
merchantDataSchema.index({ industry: 1, category: 1 });
merchantDataSchema.index({ city: 1, industry: 1 });
merchantDataSchema.index({ dataSharingConsent: 1, lastAggregatedAt: 1 });

export const MerchantData = mongoose.model<IMerchantData>('MerchantData', merchantDataSchema);
