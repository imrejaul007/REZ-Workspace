/**
 * Trial Model
 */
import mongoose, { Schema, Document } from 'mongoose';

export interface ITrialDocument extends Document {
  merchantId: string;
  merchantName: string;
  title: string;
  description: string;
  category: string;
  image?: string;
  originalPrice: number;
  coinPrice: number;
  commitmentFee: number;
  slotsRemaining: number;
  totalSlots: number;
  expiresAt: Date;
  location?: {
    address?: string;
    lat?: number;
    lng?: number;
  };
  rating: number;
  ratingCount: number;
  isActive: boolean;
}

const TrialSchema = new Schema(
  {
    merchantId: { type: String, required: true, index: true },
    merchantName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    image: { type: String },
    originalPrice: { type: Number, required: true },
    coinPrice: { type: Number, required: true },
    commitmentFee: { type: Number, required: true },
    slotsRemaining: { type: Number, required: true },
    totalSlots: { type: Number, required: true },
    expiresAt: { type: Date, required: true, index: true },
    location: {
      address: { type: String },
      lat: { type: Number },
      lng: { type: Number },
    },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

TrialSchema.index({ 'location.lat': 1, 'location.lng': 1 });
TrialSchema.index({ title: 'text', description: 'text' });

export const TrialModel = mongoose.model<ITrialDocument>('Trial', TrialSchema);
