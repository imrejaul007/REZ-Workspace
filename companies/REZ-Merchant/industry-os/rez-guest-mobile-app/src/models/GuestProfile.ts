/**
 * Guest Profile Model
 */

import mongoose, { Schema, Document } from 'mongoose';
import { GuestProfile } from '../types';

export interface IGuestProfile extends Omit<GuestProfile, 'id'>, Document {}

const GuestProfileSchema = new Schema<IGuestProfile>(
  {
    guestId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    avatar: { type: String },
    loyaltyTier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    loyaltyPoints: { type: Number, default: 0 },
    preferences: {
      roomPreference: { type: String },
      dietaryRestrictions: [String],
      notifications: {
        push: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        types: [String],
      },
      language: { type: String, default: 'en' },
      currency: { type: String, default: 'INR' },
    },
  },
  {
    timestamps: true,
    collection: 'guest_profiles',
  }
);

export const GuestProfileModel = mongoose.model<IGuestProfile>('GuestProfile', GuestProfileSchema);
