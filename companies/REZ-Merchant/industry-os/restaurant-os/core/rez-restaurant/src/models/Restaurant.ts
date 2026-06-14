/**
 * Restaurant Model
 *
 * Represents a restaurant with multi-branch support
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  landmark?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface IOperatingHours {
  day: number; // 0 = Sunday, 6 = Saturday
  open: string; // HH:mm format
  close: string;
  isClosed: boolean;
}

export interface IBranch {
  branchId: string;
  name: string;
  address: IAddress;
  phone: string;
  email?: string;
  operatingHours: IOperatingHours[];
  isActive: boolean;
}

export interface IRestaurant extends Document {
  restaurantId: string;
  name: string;
  slug: string;
  description?: string;
  cuisineTypes: string[];
  priceRange: 1 | 2 | 3 | 4; // 1 = Budget, 4 = Premium
  address: IAddress;
  phone: string;
  email?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  operatingHours: IOperatingHours[];
  amenities: string[];
  images: string[];
  rating?: {
    average: number;
    count: number;
  };
  branches: IBranch[];
  ownerId: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>({
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true, default: 'India' },
  pincode: { type: String, required: true },
  landmark: { type: String },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
}, { _id: false });

const OperatingHoursSchema = new Schema<IOperatingHours>({
  day: { type: Number, required: true, min: 0, max: 6 },
  open: { type: String, required: true },
  close: { type: String, required: true },
  isClosed: { type: Boolean, default: false },
}, { _id: false });

const BranchSchema = new Schema<IBranch>({
  branchId: { type: String, required: true },
  name: { type: String, required: true },
  address: { type: AddressSchema, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  operatingHours: [OperatingHoursSchema],
  isActive: { type: Boolean, default: true },
}, { _id: false });

const RestaurantSchema = new Schema<IRestaurant>({
  restaurantId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  cuisineTypes: [{ type: String }],
  priceRange: { type: Number, enum: [1, 2, 3, 4], required: true },
  address: { type: AddressSchema, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  website: { type: String },
  socialMedia: {
    facebook: { type: String },
    instagram: { type: String },
    twitter: { type: String },
  },
  operatingHours: [OperatingHoursSchema],
  amenities: [{ type: String }],
  images: [{ type: String }],
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  branches: [BranchSchema],
  ownerId: { type: String, required: true, index: true },
  isActive: { type: Boolean, default: true, index: true },
  isVerified: { type: Boolean, default: false },
}, {
  timestamps: true,
  collection: 'restaurants',
});

// Indexes
RestaurantSchema.index({ 'address.city': 1 });
RestaurantSchema.index({ cuisineTypes: 1 });
RestaurantSchema.index({ priceRange: 1 });
RestaurantSchema.index({ 'rating.average': -1 });
RestaurantSchema.index({ name: 'text', description: 'text' });

export const Restaurant = mongoose.model<IRestaurant>('Restaurant', RestaurantSchema);
