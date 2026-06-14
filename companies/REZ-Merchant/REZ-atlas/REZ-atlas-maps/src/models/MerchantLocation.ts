/**
 * Merchant Location Model - Geospatial merchant data
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IHeatPoint {
  lat: number;
  lng: number;
  intensity: number;
  count?: number;
  category?: string;
}

export interface MerchantLocationDocument extends Document {
  merchantId: string;
  businessName: string;
  businessType: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  revenue?: number;
  growthRate?: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantLocationSchema = new Schema<MerchantLocationDocument>(
  {
    merchantId: { type: String, required: true, unique: true, index: true },
    businessName: { type: String, required: true },
    businessType: {
      type: String,
      enum: [
        'restaurant', 'hotel', 'salon', 'gym', 'healthcare',
        'retail', 'grocery', 'education', 'pharmacy', 'automotive',
        'fashion', 'events', 'other',
      ],
      index: true,
    },
    location: {
      type: { type: String, enum: ['Point'], required: true },
      coordinates: { type: [Number], required: true },
    },
    revenue: { type: Number, default: 0 },
    growthRate: { type: Number, default: 0 },
    rating: { type: Number, min: 0, max: 5 },
  },
  {
    timestamps: true,
  }
);

// Create geospatial 2dsphere index for location queries
MerchantLocationSchema.index({ location: '2dsphere' });

// Compound index for common queries
MerchantLocationSchema.index({ businessType: 1, location: '2dsphere' });

export const MerchantLocation = mongoose.model<MerchantLocationDocument>(
  'MerchantLocation',
  MerchantLocationSchema
);

// Type exports for use in routes
export type { HeatPoint } from '../routes/heat.js';