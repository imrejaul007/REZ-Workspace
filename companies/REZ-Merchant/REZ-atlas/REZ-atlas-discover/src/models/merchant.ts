/**
 * REZ Atlas Discover - Merchant Models
 */

import mongoose, { Schema, Document } from 'mongoose';

// Location schema
export interface ILocation {
  address: string;
  city: string;
  state: string;
  country: string;
  pincode?: string;
  lat: number;
  lng: number;
}

// Contact schema
export interface IContact {
  phone?: string;
  email?: string;
  website?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

// Business hours
export interface IBusinessHours {
  day: number;
  open: string;
  close: string;
  isClosed: boolean;
}

// Rating data
export interface IRating {
  overall: number;
  count: number;
  reviews: Array<{
    source: string;
    rating: number;
    count: number;
  }>;
}

// Discovered merchant document
export interface IDiscoveredMerchant extends Document {
  // Identity
  businessId: string;
  name: string;
  category: string;
  subCategory?: string;

  // Location
  location: ILocation;
  area?: string;
  zone?: string;

  // Contact
  contact: IContact;

  // Business details
  businessHours?: IBusinessHours[];
  photos?: string[];
  priceLevel?: number;

  // Ratings
  rating?: IRating;

  // Discovery metadata
  sources: string[];
  discoveredAt: Date;
  lastVerified?: Date;

  // Data quality
  dataQuality: {
    completeness: number;
    verified: boolean;
    stale: boolean;
  };

  // Enrichment
  enriched: boolean;
  enrichmentData?: Record<string, any>;

  // Metadata
  metadata: Record<string, any>;
}

const LocationSchema = new Schema<ILocation>({
  address: String,
  city: String,
  state: String,
  country: String,
  pincode: String,
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
}, { _id: false });

const ContactSchema = new Schema<IContact>({
  phone: String,
  email: String,
  website: String,
  socialLinks: {
    facebook: String,
    instagram: String,
    twitter: String,
    linkedin: String
  }
}, { _id: false });

const BusinessHoursSchema = new Schema<IBusinessHours>({
  day: { type: Number, required: true },
  open: String,
  close: String,
  isClosed: Boolean
}, { _id: false });

const RatingSchema = new Schema<IRating>({
  overall: Number,
  count: Number,
  reviews: [{
    source: String,
    rating: Number,
    count: Number
  }]
}, { _id: false });

const DataQualitySchema = new Schema({
  completeness: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  stale: { type: Boolean, default: false }
}, { _id: false });

const DiscoveredMerchantSchema = new Schema<IDiscoveredMerchant>({
  // Identity
  businessId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  category: { type: String, required: true, index: true },
  subCategory: String,

  // Location
  location: { type: LocationSchema, required: true, index: '2dsphere' },
  area: String,
  zone: String,

  // Contact
  contact: ContactSchema,

  // Business details
  businessHours: [BusinessHoursSchema],
  photos: [String],
  priceLevel: Number,

  // Ratings
  rating: RatingSchema,

  // Discovery metadata
  sources: [String],
  discoveredAt: { type: Date, default: Date.now },
  lastVerified: Date,

  // Data quality
  dataQuality: { type: DataQualitySchema, default: () => ({}) },

  // Enrichment
  enriched: { type: Boolean, default: false },
  enrichmentData: Schema.Types.Mixed,

  // Metadata
  metadata: Schema.Types.Mixed
}, {
  timestamps: true,
  collection: 'discovered_merchants'
});

// Indexes
DiscoveredMerchantSchema.index({ 'location.lat': 1, 'location.lng': 1 });
DiscoveredMerchantSchema.index({ category: 1, 'location.city': 1 });
DiscoveredMerchantSchema.index({ enriched: 1, 'dataQuality.completeness': -1 });

export const DiscoveredMerchantModel = mongoose.model<IDiscoveredMerchant>('DiscoveredMerchant', DiscoveredMerchantSchema);

// Search query schema
export interface ISearchQuery {
  query?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  category?: string;
  subCategory?: string;
  minRating?: number;
  sources?: string[];
  limit?: number;
  offset?: number;
}

export const SearchQuerySchema = {
  query: { type: 'string' },
  lat: { type: 'number' },
  lng: { type: 'number' },
  radius: { type: 'number', default: 5000 },
  category: { type: 'string' },
  subCategory: { type: 'string' },
  minRating: { type: 'number' },
  sources: { type: 'array', items: { type: 'string' } },
  limit: { type: 'number', default: 20, max: 100 },
  offset: { type: 'number', default: 0 }
};