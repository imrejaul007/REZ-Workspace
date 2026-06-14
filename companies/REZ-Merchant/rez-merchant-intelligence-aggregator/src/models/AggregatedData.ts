/**
 * Aggregated Merchant Data Model
 * Stores anonymized, aggregated merchant metrics
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IAggregatedMetrics extends Document {
  locality: string;                    // "Koramangala, Bangalore"
  pincode: string;                    // "560034"
  city: string;                       // "Bangalore"
  state: string;                      // "Karnataka"
  country: string;                     // "India"
  industry: 'restaurant' | 'hotel' | 'salon' | 'fitness' | 'healthcare';
  category: string;                   // "biryani" | "pizza" | "cafe"

  // Aggregated metrics (anonymized)
  merchantCount: number;              // Total merchants in locality
  avgOrderValue: number;              // Average order value in INR
  avgOrdersPerDay: number;           // Average daily orders
  avgOrdersPerMerchant: number;      // Average per merchant
  totalOrders30d: number;             // Orders in last 30 days
  totalRevenue30d: number;           // Revenue in last 30 days

  // Peak times (anonymized)
  peakHours: number[];               // [12, 13, 19, 20, 21]
  peakDays: number[];                // [0, 6] (Sunday, Saturday)

  // Category distribution
  topCategories: { category: string; percentage: number }[];

  // Retention metrics
  avgRetentionRate: number;          // 30-day retention %
  avgRepeatRate: number;            // Repeat customer rate

  // Growth metrics
  orderGrowth30d: number;           // % growth vs previous 30 days
  revenueGrowth30d: number;          // % revenue growth
  merchantGrowth30d: number;        // % merchant growth

  // Customer metrics
  avgCustomerAge: number;           // Days since first order
  avgOrdersPerCustomer: number;     // Orders per unique customer

  // Timestamps
  periodStart: Date;
  periodEnd: Date;
  updatedAt: Date;
}

const aggregatedMetricsSchema = new Schema<IAggregatedMetrics>({
  locality: { type: String, required: true, index: true },
  pincode: { type: String, required: true, index: true },
  city: { type: String, required: true, index: true },
  state: { type: String, required: true, index: true },
  country: { type: String, default: 'India', index: true },

  industry: {
    type: String,
    enum: ['restaurant', 'hotel', 'salon', 'fitness', 'healthcare'],
    required: true,
    index: true
  },

  category: { type: String, required: true, index: true },

  merchantCount: { type: Number, default: 0 },
  avgOrderValue: { type: Number, default: 0 },
  avgOrdersPerDay: { type: Number, default: 0 },
  avgOrdersPerMerchant: { type: Number, default: 0 },
  totalOrders30d: { type: Number, default: 0 },
  totalRevenue30d: { type: Number, default: 0 },

  peakHours: { type: [Number], default: [] },
  peakDays: { type: [Number], default: [] },

  topCategories: [{
    category: String,
    percentage: Number
  }],

  avgRetentionRate: { type: Number, default: 0 },
  avgRepeatRate: { type: Number, default: 0 },

  orderGrowth30d: { type: Number, default: 0 },
  revenueGrowth30d: { type: Number, default: 0 },
  merchantGrowth30d: { type: Number, default: 0 },

  avgCustomerAge: { type: Number, default: 0 },
  avgOrdersPerCustomer: { type: Number, default: 0 },

  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  updatedAt: { type: Date, default: Date.now }
});

// Compound indexes for efficient queries
aggregatedMetricsSchema.index({ locality: 1, industry: 1, category: 1 });
aggregatedMetricsSchema.index({ pincode: 1, industry: 1 });
aggregatedMetricsSchema.index({ city: 1, industry: 1 });

export const AggregatedMetrics = mongoose.model<IAggregatedMetrics>('AggregatedMetrics', aggregatedMetricsSchema);
