import mongoose, { Schema, Document } from 'mongoose';

export enum PropertyType {
  APARTMENT = 'apartment',
  VILLA = 'villa',
  PLOT = 'plot',
  COMMERCIAL = 'commercial',
  OFFICE = 'office',
  RETAIL = 'retail',
  WAREHOUSE = 'warehouse',
  PENTHOUSE = 'penthouse',
  TOWNHOUSE = 'townhouse',
  DUPLEX = 'duplex',
  STUDIO = 'studio',
  BUNGALOW = 'bungalow',
  LAND = 'land',
  INDUSTRIAL = 'industrial',
  MIXED_USE = 'mixed_use'
}

export enum PropertyStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  SOLD = 'sold',
  RENTED = 'rented',
  UNDER_OFFER = 'under_offer',
  WITHDRAWN = 'withdrawn',
  EXPIRED = 'expired'
}

export enum ListingType {
  SALE = 'sale',
  RENT = 'rent',
  LEASE = 'lease',
  PG = 'pg',
  CO_LIVING = 'co_living'
}

export enum Country {
  INDIA = 'IN',
  UAE = 'AE'
}

export enum PaymentCurrency {
  INR = 'INR',
  AED = 'AED',
  USD = 'USD'
}

export interface IGeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface IPriceInfo {
  amount: number;
  currency: PaymentCurrency;
  displayPrice?: string;
  pricePerSqFt?: number;
  totalPlotArea?: number;
}

export interface IPropertyMedia {
  type: 'image' | 'video' | 'virtualTour' | 'floorPlan';
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  isPrimary: boolean;
  order: number;
}

export interface IPropertyAddress {
  line1?: string;
  line2?: string;
  landmark?: string;
  pincode?: string;
  emirate?: string;
}

export interface IPropertyFeature {
  category: string;
  items: string[];
}

export interface IPropertyAIScore {
  quality: number;
  demand: number;
  investmentPotential: number;
  lastUpdated: Date;
}

export interface IPropertyIntentSignal {
  type: string;
  count: number;
  lastSeen: Date;
}

export interface IProperty extends Document {
  // Basic Info
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;

  // Classification
  propertyType: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;

  // Location
  country: Country;
  city: string;
  locality: string;
  subLocality?: string;
  address: IPropertyAddress;
  location?: IGeoLocation;

  // Pricing
  price: IPriceInfo;
  negotiable: boolean;

  // Property Details
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  carpetArea?: number;
  carpetAreaUnit?: 'sqft' | 'sqm' | 'sqyd';
  superBuiltUpArea?: number;
  totalFloors?: number;
  propertyFloor?: number;
  facingDirection?: string;
  ageOfProperty?: string;
  furnishedStatus?: 'furnished' | 'semi-furnished' | 'unfurnished';

  // Ownership
  ownershipType?: 'freehold' | 'leasehold' | 'co-operative';
  RERARegistered?: boolean;
  reraId?: string;

  // Amenities
  amenities?: string[];
  features?: IPropertyFeature[];

  // Media
  media?: IPropertyMedia[];
  virtualTourUrl?: string;

  // Broker/Agent
  brokerId?: string;
  agentId?: string;
  ownerId?: string;

  // AI/ML Fields
  aiScore?: IPropertyAIScore;
  intentSignals?: IPropertyIntentSignal[];

  // SEO
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;

  // Stats
  views: number;
  inquiries: number;
  shortlisted: number;

  // Publish Info
  publishedAt?: Date;
  expiresAt?: Date;

  // Soft Delete
  deletedAt?: Date;
}

// Schema definitions
const GeoLocationSchema = new Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], required: true }
}, { _id: false });

const PriceSchema = new Schema({
  amount: { type: Number, required: true },
  currency: { type: String, enum: Object.values(PaymentCurrency), default: PaymentCurrency.INR },
  displayPrice: String,
  pricePerSqFt: Number,
  totalPlotArea: Number
}, { _id: false });

const PropertyMediaSchema = new Schema({
  type: { type: String, enum: ['image', 'video', 'virtualTour', 'floorPlan'], required: true },
  url: { type: String, required: true },
  thumbnailUrl: String,
  caption: String,
  isPrimary: { type: Boolean, default: false },
  order: { type: Number, default: 0 }
}, { _id: true });

const PropertyAddressSchema = new Schema({
  line1: String,
  line2: String,
  landmark: String,
  pincode: String,
  emirate: String
}, { _id: false });

const PropertyFeatureSchema = new Schema({
  category: String,
  items: [String]
}, { _id: false });

const PropertyAIScoreSchema = new Schema({
  quality: { type: Number, min: 0, max: 100 },
  demand: { type: Number, min: 0, max: 100 },
  investmentPotential: { type: Number, min: 0, max: 100 },
  lastUpdated: Date
}, { _id: false });

const PropertyIntentSignalSchema = new Schema({
  type: String,
  count: Number,
  lastSeen: Date
}, { _id: false });

const PropertySchema = new Schema<IProperty>({
  // Basic Info
  title: { type: String, required: true, text: true },
  titleAr: String,
  description: { type: String, required: true },
  descriptionAr: String,

  // Classification
  propertyType: { type: String, enum: Object.values(PropertyType), required: true, index: true },
  listingType: { type: String, enum: Object.values(ListingType), required: true },
  status: { type: String, enum: Object.values(PropertyStatus), default: PropertyStatus.DRAFT },

  // Location
  country: { type: String, enum: Object.values(Country), required: true, index: true },
  city: { type: String, required: true, index: true },
  locality: { type: String, required: true, index: true },
  subLocality: String,
  address: { type: PropertyAddressSchema },
  location: { type: GeoLocationSchema, index: '2dsphere' },

  // Pricing
  price: { type: PriceSchema, required: true },
  negotiable: { type: Boolean, default: true },

  // Property Details
  bedrooms: Number,
  bathrooms: Number,
  balconies: Number,
  carpetArea: Number,
  carpetAreaUnit: { type: String, enum: ['sqft', 'sqm', 'sqyd'], default: 'sqft' },
  superBuiltUpArea: Number,
  totalFloors: Number,
  propertyFloor: Number,
  facingDirection: String,
  ageOfProperty: String,
  furnishedStatus: { type: String, enum: ['furnished', 'semi-furnished', 'unfurnished'] },

  // Ownership
  ownershipType: { type: String, enum: ['freehold', 'leasehold', 'co-operative'] },
  RERARegistered: { type: Boolean, default: false },
  reraId: String,

  // Amenities
  amenities: [String],
  features: [PropertyFeatureSchema],

  // Media
  media: [PropertyMediaSchema],
  virtualTourUrl: String,

  // Broker/Agent
  brokerId: { type: Schema.Types.ObjectId, index: true },
  agentId: { type: Schema.Types.ObjectId },
  ownerId: { type: Schema.Types.ObjectId },

  // AI/ML Fields
  aiScore: { type: PropertyAIScoreSchema },
  intentSignals: [PropertyIntentSignalSchema],

  // SEO
  slug: { type: String, unique: true, sparse: true },
  metaTitle: String,
  metaDescription: String,

  // Stats
  views: { type: Number, default: 0 },
  inquiries: { type: Number, default: 0 },
  shortlisted: { type: Number, default: 0 },

  // Publish Info
  publishedAt: Date,
  expiresAt: Date,

  // Soft Delete
  deletedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
PropertySchema.index({ title: 'text', description: 'text' });
PropertySchema.index({ country: 1, city: 1, propertyType: 1, 'price.amount': 1 });
PropertySchema.index({ brokerId: 1, status: 1 });
PropertySchema.index({ status: 1, publishedAt: 1 });

// Text search index
PropertySchema.index(
  { title: 'text', description: 'text', city: 'text', locality: 'text' },
  { weights: { title: 10, city: 5, locality: 5, description: 1 } }
);

export const Property = mongoose.model<IProperty>('Property', PropertySchema);
