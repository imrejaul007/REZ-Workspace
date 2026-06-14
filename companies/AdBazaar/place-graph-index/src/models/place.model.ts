import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  IPlace,
  PlaceType,
  PlaceStatus,
  SizeCategory,
  IncomeLevel,
} from '../types/index.js';

export interface PlaceDocument extends Omit<IPlace, 'placeId'>, Document {
  _id: mongoose.Types.ObjectId;
  placeId: string;
}

const AddressSchema = new Schema(
  {
    street: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  { _id: false }
);

const GeoLocationSchema = new Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const PlaceAttributesSchema = new Schema(
  {
    size: { type: String, enum: ['small', 'medium', 'large'] },
    ratings: { type: Number, min: 0, max: 5 },
    visitorCount: { type: Number },
    operatingHours: { type: String },
    priceRange: { type: String },
  },
  { _id: false }
);

const DemographicsSchema = new Schema(
  {
    ageGroups: { type: Map, of: Number, default: {} },
    genderSplit: { type: Map, of: Number, default: {} },
    incomeLevel: {
      type: String,
      enum: ['low', 'middle', 'upper-middle', 'high'],
      default: 'middle',
    },
  },
  { _id: false }
);

const VisitorPatternsSchema = new Schema(
  {
    peakHours: { type: [String], default: [] },
    busyDays: { type: [String], default: [] },
    seasonalTrends: { type: [String], default: [] },
  },
  { _id: false }
);

const AudienceProfileSchema = new Schema(
  {
    demographics: { type: DemographicsSchema, default: () => ({}) },
    visitorPatterns: { type: VisitorPatternsSchema, default: () => ({}) },
    commonPurposes: { type: [String], default: [] },
  },
  { _id: false }
);

const AdvertisingPricingSchema = new Schema(
  {
    cpm: { type: Number, required: true, min: 0 },
    minBudget: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const AdvertisingSchema = new Schema(
  {
    availableFormats: { type: [String], default: [] },
    pricing: { type: AdvertisingPricingSchema, required: true },
    targetingOptions: { type: [String], default: [] },
  },
  { _id: false }
);

const PlaceSchema = new Schema<PlaceDocument>(
  {
    placeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'mall',
        'airport',
        'hospital',
        'hotel',
        'school',
        'office',
        'restaurant',
        'retail',
        'event_venue',
        'transit',
      ],
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    address: { type: AddressSchema, required: true },
    location: { type: GeoLocationSchema, required: true, index: '2dsphere' },
    attributes: { type: PlaceAttributesSchema, default: () => ({}) },
    audienceProfile: { type: AudienceProfileSchema, default: () => ({}) },
    advertising: {
      type: AdvertisingSchema,
      required: true,
      default: () => ({
        availableFormats: [],
        pricing: { cpm: 0, minBudget: 0 },
        targetingOptions: [],
      }),
    },
    nearbyPlaces: { type: [String], default: [], index: true },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for common queries
PlaceSchema.index({ 'address.city': 1, type: 1 });
PlaceSchema.index({ 'address.state': 1, type: 1 });
PlaceSchema.index({ 'attributes.ratings': -1 });
PlaceSchema.index({ 'attributes.visitorCount': -1 });
PlaceSchema.index({ name: 'text', 'address.city': 'text', category: 'text' });

// Text index for search
PlaceSchema.index(
  { name: 'text', category: 'text', 'address.city': 'text', 'address.area': 'text' },
  { weights: { name: 10, category: 5, 'address.city': 3, 'address.area': 2 } }
);

// Static methods
PlaceSchema.statics.findByPlaceId = function (
  this: Model<PlaceDocument>,
  placeId: string
) {
  return this.findOne({ placeId });
};

PlaceSchema.statics.findNearby = function (
  this: Model<PlaceDocument>,
  lat: number,
  lng: number,
  maxDistance: number,
  query: Record<string, unknown> = {}
) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: maxDistance,
      },
    },
    ...query,
  });
};

PlaceSchema.statics.findByCity = function (
  this: Model<PlaceDocument>,
  city: string,
  filters: Record<string, unknown> = {}
) {
  return this.find({ 'address.city': city, ...filters });
};

PlaceSchema.statics.findByType = function (
  this: Model<PlaceDocument>,
  type: PlaceType,
  filters: Record<string, unknown> = {}
) {
  return this.find({ type, ...filters });
};

export const Place = mongoose.model<PlaceDocument>('Place', PlaceSchema);
export default Place;
