/**
 * Stylist Model
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IStylist extends Document {
  stylistId: string;
  salonId: string;
  name: string;
  phone: string;
  email?: string;
  image?: string;
  specialties: string[];
  bio?: string;
  rating: number;
  reviewCount: number;
  experience: number;
  schedule: {
    [day: string]: { start: string; end: string; breakStart?: string; breakEnd?: string };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StylistSchema = new Schema<IStylist>({
  stylistId: { type: String, required: true, unique: true, index: true },
  salonId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  image: String,
  specialties: [String],
  bio: String,
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  experience: { type: Number, default: 0 },
  schedule: {
    type: Map,
    of: {
      start: String,
      end: String,
      breakStart: String,
      breakEnd: String,
    },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

StylistSchema.index({ salonId: 1, isActive: 1 });

export const Stylist = mongoose.model<IStylist>('Stylist', StylistSchema);
