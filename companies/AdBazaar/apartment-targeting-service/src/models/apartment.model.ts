import mongoose, { Schema, Document } from 'mongoose';
import type {
  Apartment,
  ApartmentType,
  Status,
  Address,
  Location,
  Demographics,
  Targeting
} from '../types/index.js';

// Address Subdocument Schema
const AddressSchema = new Schema<Address>(
  {
    street: { type: String, required: true, maxlength: 200 },
    area: { type: String, required: true, maxlength: 100 },
    city: { type: String, required: true, maxlength: 100 },
    state: { type: String, required: true, maxlength: 100 },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
    country: { type: String, required: true, default: 'India', maxlength: 100 },
  },
  { _id: false }
);

// Location Subdocument Schema
const LocationSchema = new Schema<Location>(
  {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
  },
  { _id: false }
);

// Demographics Subdocument Schema
const DemographicsSchema = new Schema<Demographics>(
  {
    totalFlats: { type: Number, required: true, min: 1 },
    occupiedFlats: { type: Number, required: true, min: 0 },
    avgFamilySize: { type: Number, required: true, min: 1, default: 4 },
    estimatedResidents: { type: Number, required: true, min: 0 },
    incomeLevel: {
      type: String,
      required: true,
      enum: ['low', 'middle', 'upper_middle', 'high'],
    },
  },
  { _id: false }
);

// Targeting Subdocument Schema
const TargetingSchema = new Schema<Targeting>(
  {
    enabled: { type: Boolean, default: true },
    minAge: { type: Number, min: 0, max: 120 },
    maxAge: { type: Number, min: 0, max: 120 },
    interests: { type: [String], default: [] },
    incomeBrackets: { type: [String], default: [] },
  },
  { _id: false }
);

// Main Apartment Schema
export interface IApartmentDocument extends Omit<Apartment, 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

const ApartmentSchema = new Schema<IApartmentDocument>(
  {
    apartmentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['apartment', 'gated_community', 'standalone'],
    },
    address: {
      type: AddressSchema,
      required: true,
    },
    location: {
      type: LocationSchema,
      required: true,
    },
    demographics: {
      type: DemographicsSchema,
      required: true,
    },
    amenities: {
      type: [String],
      default: [],
    },
    nearbyPOIs: {
      type: [String],
      default: [],
    },
    targeting: {
      type: TargetingSchema,
      default: () => ({ enabled: true }),
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
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

// Indexes
ApartmentSchema.index({ 'address.city': 1 });
ApartmentSchema.index({ 'address.state': 1 });
ApartmentSchema.index({ 'address.pincode': 1 });
ApartmentSchema.index({ 'location.lat': 1, 'location.lng': 1 });
ApartmentSchema.index({ 'demographics.incomeLevel': 1 });
ApartmentSchema.index({ 'demographics.estimatedResidents': 1 });
ApartmentSchema.index({ status: 1 });
ApartmentSchema.index({ amenities: 1 });
ApartmentSchema.index({ name: 'text', 'address.area': 'text' });

// Pre-save hook to calculate estimated residents
ApartmentSchema.pre('save', function (next) {
  if (this.isModified('demographics')) {
    const { occupiedFlats, avgFamilySize } = this.demographics;
    this.demographics.estimatedResidents = Math.round(occupiedFlats * avgFamilySize);
  }
  next();
});

export const ApartmentModel = mongoose.model<IApartmentDocument>('Apartment', ApartmentSchema);