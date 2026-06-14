/**
 * Salon Model
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ISalon extends Document {
  salonId: string;
  name: string;
  description: string;
  address: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
    coordinates?: { lat: number; lng: number };
  };
  phone: string;
  email: string;
  website?: string;
  images: string[];
  amenities: string[];
  categories: string[];
  rating: number;
  reviewCount: number;
  openingHours: {
    [day: string]: { open: string; close: string; closed?: boolean };
  };
  services: Schema.Types.ObjectId[];
  stylists: Schema.Types.ObjectId[];
  ownerId: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

const SalonSchema = new Schema<ISalon>({
  salonId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  address: {
    line1: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true },
    pincode: { type: String },
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  phone: { type: String, required: true },
  email: { type: String },
  website: String,
  images: [String],
  amenities: [String],
  categories: [String],
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  openingHours: {
    type: Map,
    of: {
      open: String,
      close: String,
      closed: Boolean,
    },
  },
  services: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
  stylists: [{ type: Schema.Types.ObjectId, ref: 'Stylist' }],
  ownerId: { type: String, required: true, index: true },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
}, { timestamps: true });

SalonSchema.index({ 'address.city': 1, status: 1 });
SalonSchema.index({ categories: 1, status: 1 });

export const Salon = mongoose.model<ISalon>('Salon', SalonSchema);
