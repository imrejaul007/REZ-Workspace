/**
 * Guest Model
 *
 * Represents a hotel guest with loyalty information
 */

import mongoose, { Schema, Document } from 'mongoose';
import { IGuest } from '../types';

export interface IGuestDocument extends IGuest, Document {}

const AddressSchema = new Schema({
  line1: { type: String },
  line2: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String, default: 'India' },
  pincode: { type: String },
  landmark: { type: String },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
}, { _id: false });

const PreferencesSchema = new Schema({
  roomType: { type: String },
  floor: { type: String },
  smoking: { type: Boolean },
  pillowType: { type: String },
  amenities: [{ type: String }],
}, { _id: false });

const GuestSchema = new Schema<IGuestDocument>({
  guestId: { type: String, required: true, unique: true, index: true },
  hotelId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  idType: {
    type: String,
    enum: ['passport', 'driving_license', 'aadhaar', 'voter_id', 'other'],
    required: true,
  },
  idNumber: { type: String, required: true },
  address: AddressSchema,
  dateOfBirth: { type: Date },
  nationality: { type: String, default: 'Indian' },
  preferences: PreferencesSchema,
  loyaltyTier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze',
  },
  loyaltyPoints: { type: Number, default: 0 },
  totalStays: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastStay: { type: Date },
  notes: { type: String },
  isBlacklisted: { type: Boolean, default: false, index: true },
}, {
  timestamps: true,
  collection: 'hotel_guests',
});

// Indexes
GuestSchema.index({ hotelId: 1, email: 1 }, { unique: true });
GuestSchema.index({ hotelId: 1, phone: 1 });
GuestSchema.index({ email: 1 });
GuestSchema.index({ phone: 1 });
GuestSchema.index({ loyaltyTier: 1 });
GuestSchema.index({ name: 'text', email: 'text', phone: 'text' });

export const Guest = mongoose.model<IGuestDocument>('Guest', GuestSchema);
